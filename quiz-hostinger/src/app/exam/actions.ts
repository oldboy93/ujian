"use server";

import prisma from "@/lib/prisma";
import { AnswerStatus, ParticipantStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Memproses jawaban peserta untuk satu soal
 */
export async function saveParticipantAnswer({
  participantId,
  questionId,
  answerText,
  timeRemainingSeconds,
  isFlagged,
  onlyUpdateTime
}: {
  participantId: string;
  questionId: string;
  answerText: string | null;
  timeRemainingSeconds: number;
  isFlagged?: boolean;
  onlyUpdateTime?: boolean;
}) {
  // 0. Short circuit IF we only want to update TIME (Background periodic sync)
  if (onlyUpdateTime) {
    await prisma.participantAnswer.upsert({
      where: { participantId_questionId: { participantId, questionId } },
      update: { timeRemainingSeconds },
      create: {
        participantId,
        questionId,
        timeRemainingSeconds,
        statusFlag: "KOSONG",
      }
    });
    return { success: true };
  }
  // 1. Ambil data kunci soal untuk validasi server-side
  const question = await prisma.question.findUnique({
    where: { id: questionId }
  });

  if (!question) throw new Error("Pertanyaan tidak valid");

  let isCorrect = false;
  let scoreEarned = 0;

  // 2. Kalkulasi poin jika Pilihan Ganda (PG)
  if (question.type === "PG" && answerText) {
    isCorrect = answerText.trim().toUpperCase() === (question.correctAnswer || "").trim().toUpperCase();
    
    if (isCorrect) {
      const basePoint = Number(question.pointCorrect) || 0;
      const bonusFactor = Number(question.bonusPerSecond) || 0;
      const secondsLeft = Number(timeRemainingSeconds) || 0;
      const bonusPoint = bonusFactor * secondsLeft;
      
      scoreEarned = basePoint + bonusPoint;
    } else {
      scoreEarned = Number(question.pointWrong) || 0;
    }
  } 
  
  // Anti-NaN insurance
  if (isNaN(scoreEarned)) scoreEarned = 0;
  // 3. Upsert jawaban partisipan
  await prisma.participantAnswer.upsert({
    where: {
      participantId_questionId: {
        participantId,
        questionId
      }
    },
    update: {
      answerText,
      statusFlag: answerText ? "SELESAI" : "KOSONG",
      timeRemainingSeconds,
      isFlagged: isFlagged ?? false,
      isCorrect: question.type === "PG" ? isCorrect : null,
      scoreEarned: question.type === "PG" ? scoreEarned : 0,
    },
    create: {
      participantId,
      questionId,
      answerText,
      statusFlag: answerText ? "SELESAI" : "KOSONG",
      timeRemainingSeconds,
      isFlagged: isFlagged ?? false,
      isCorrect: question.type === "PG" ? isCorrect : null,
      scoreEarned: question.type === "PG" ? scoreEarned : 0,
    }
  });

  return { success: true, earned: scoreEarned };
}

/**
 * Toggle flag status
 */
export async function toggleFlag(participantId: string, questionId: string, newState: boolean) {
  await prisma.participantAnswer.upsert({
    where: { participantId_questionId: { participantId, questionId } },
    update: { isFlagged: newState },
    create: {
      participantId,
      questionId,
      isFlagged: newState,
      statusFlag: "KOSONG",
      timeRemainingSeconds: 0
    }
  });
  return { success: true };
}

/**
 * Mencatat pelanggaran (anti-cheat tab switch)
 * Jika melebihi batas toleransi exam, otomatis gagalkan/selesaikan ujian.
 */
export async function logViolation(participantId: string) {
  // 1. Ambil info maxViolations dari relasi exam
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    include: { exam: { select: { maxViolations: true } } }
  });

  if (!participant) return { success: false };

  const currentViolations = participant.violations + 1;
  
  // 2. Update increment violation
  const updated = await prisma.participant.update({
    where: { id: participantId },
    data: { violations: currentViolations }
  });

  // 3. PENALTI: Jika melewati batas, paksa submit saat itu juga!
  const isForceFail = currentViolations > participant.exam.maxViolations;
  
  if (isForceFail) {
    // Finalize logic inline
    const aggregations = await prisma.participantAnswer.aggregate({
      where: { participantId },
      _sum: { scoreEarned: true }
    });
    await prisma.participant.update({
      where: { id: participantId },
      data: { 
        status: "SUBMITTED", 
        totalScore: (aggregations._sum.scoreEarned || 0) // Bisa dikurangi penalti jika user minta
      }
    });
    revalidatePath(`/exam/${participantId}`);
    return { success: true, violations: currentViolations, forceStopped: true };
  }

  return { success: true, violations: currentViolations, forceStopped: false };
}

/**
 * Mengakhiri sesi ujian dan mengkalkulasi skor total akhir
 */
export async function finalizeExam(participantId: string) {
  const aggregations = await prisma.participantAnswer.aggregate({
    where: { participantId },
    _sum: { scoreEarned: true }
  });

  const totalScore = aggregations._sum.scoreEarned || 0;

  await prisma.participant.update({
    where: { id: participantId },
    data: {
      status: "SUBMITTED",
      totalScore: totalScore
    }
  });

  revalidatePath(`/exam/${participantId}`);
  return { success: true };
}

/**
 * Memberi nilai manual untuk soal essay oleh Admin
 */
export async function updateEssayScore(participantId: string, questionId: string, newScore: number) {
  // 1. Update skor item jawaban
  await prisma.participantAnswer.update({
    where: {
      participantId_questionId: {
        participantId,
        questionId
      }
    },
    data: {
      scoreEarned: Number(newScore) || 0,
      isCorrect: newScore > 0 // Tandai benar jika skor > 0
    }
  });

  // 2. Hitung ulang total skor partisipan
  const aggregations = await prisma.participantAnswer.aggregate({
    where: { participantId },
    _sum: { scoreEarned: true }
  });

  await prisma.participant.update({
    where: { id: participantId },
    data: {
      totalScore: aggregations._sum.scoreEarned || 0
    }
  });

  revalidatePath("/admin/exams"); 
  return { success: true };
}
