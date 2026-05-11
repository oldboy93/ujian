"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { QuestionType } from "@prisma/client";

/**
 * Memperbarui status aktif/nonaktif ujian
 */
export async function toggleExamStatus(examId: string, currentState: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await prisma.exam.update({
    where: { id: examId, createdBy: user.id },
    data: { isActive: !currentState },
  });

  revalidatePath(`/admin/exams/${examId}`);
  revalidatePath("/admin");
}

/**
 * Menghapus sesi ujian sepenuhnya
 */
export async function deleteExam(examId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await prisma.exam.delete({
    where: { id: examId, createdBy: user.id },
  });

  revalidatePath("/admin");
}

export async function updateExamSettings(examId: string, data: { title: string, pin: string, maxViolations: number }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const existingPin = await prisma.exam.findFirst({
    where: { 
      pin: data.pin,
      id: { not: examId }
    }
  });
  
  if (existingPin) throw new Error("PIN ini sudah digunakan.");

  await prisma.exam.update({
    where: { id: examId, createdBy: user.id },
    data: {
      title: data.title,
      pin: data.pin,
      maxViolations: Number(data.maxViolations) || 3
    }
  });

  revalidatePath(`/admin/exams/${examId}`);
  revalidatePath("/admin");
}

/**
 * Menambahkan butir soal baru
 */
export async function addQuestion(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const examId = formData.get("examId") as string;
  const type = formData.get("type") as QuestionType;
  const content = formData.get("content") as string;
  const timeLimitSeconds = parseInt(formData.get("timeLimitSeconds") as string || "60");
  const pointCorrect = parseFloat((formData.get("pointCorrect") as string || "1").replace(",", "."));
  const bonusPerSecond = parseFloat((formData.get("bonusPerSecond") as string || "0").replace(",", "."));
  const imageUrl = formData.get("imageUrl") as string || null;
  
  // Parsing Options if PG
  let options: any = null;
  let correctAnswer: string | null = null;

  if (type === "PG") {
    const optionA = formData.get("optionA") as string;
    const optionB = formData.get("optionB") as string;
    const optionC = formData.get("optionC") as string;
    const optionD = formData.get("optionD") as string;
    
    options = [
      { label: "A", text: optionA },
      { label: "B", text: optionB },
      { label: "C", text: optionC },
      { label: "D", text: optionD },
    ];

    correctAnswer = formData.get("correctAnswer") as string; // 'A', 'B', 'C', 'D'
  }

  // Auth check before inserting
  const exam = await prisma.exam.findFirst({
    where: { id: examId, createdBy: user.id }
  });

  if (!exam) throw new Error("Exam not found or unauthorized");

  await prisma.question.create({
    data: {
      examId,
      type,
      content,
      imageUrl,
      options: options as any,
      correctAnswer,
      pointCorrect,
      bonusPerSecond,
      timeLimitSeconds,
    }
  });

  revalidatePath(`/admin/exams/${examId}`);
}

/**
 * Memperbarui butir soal yang sudah ada
 */
export async function updateQuestion(questionId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const examId = formData.get("examId") as string;
  const type = formData.get("type") as QuestionType;
  const content = formData.get("content") as string;
  const timeLimitSeconds = parseInt(formData.get("timeLimitSeconds") as string || "60");
  const pointCorrect = parseFloat((formData.get("pointCorrect") as string || "1").replace(",", "."));
  const bonusPerSecond = parseFloat((formData.get("bonusPerSecond") as string || "0").replace(",", "."));
  const imageUrl = formData.get("imageUrl") as string || null;
  
  // Parsing Options if PG
  let options: any = null;
  let correctAnswer: string | null = null;

  if (type === "PG") {
    const optionA = formData.get("optionA") as string;
    const optionB = formData.get("optionB") as string;
    const optionC = formData.get("optionC") as string;
    const optionD = formData.get("optionD") as string;
    
    options = [
      { label: "A", text: optionA },
      { label: "B", text: optionB },
      { label: "C", text: optionC },
      { label: "D", text: optionD },
    ];

    correctAnswer = formData.get("correctAnswer") as string;
  }

  // Update with composite key check via nested exam.createdBy
  await prisma.question.update({
    where: { 
      id: questionId,
      exam: { createdBy: user.id }
    },
    data: {
      type,
      content,
      imageUrl,
      options: options as any,
      correctAnswer,
      pointCorrect,
      bonusPerSecond,
      timeLimitSeconds,
    }
  });

  revalidatePath(`/admin/exams/${examId}`);
}

/**
 * Menghapus butir soal tunggal
 */
export async function deleteQuestion(questionId: string, examId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Verifikasi hak akses melalui relasi Exam
  await prisma.question.deleteMany({
    where: {
      id: questionId,
      exam: { createdBy: user.id }
    }
  });

  revalidatePath(`/admin/exams/${examId}`);
}

export async function getParticipantAnswers(participantId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  return await prisma.participantAnswer.findMany({
    where: { participantId },
    orderBy: { question: { createdAt: "asc" } }
  });
}
