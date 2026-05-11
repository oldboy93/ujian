"use server";

import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function joinExam(formData: FormData) {
  const rawPin = formData.get("pin") as string;
  const name = formData.get("name") as string;

  if (!rawPin || !name) {
    throw new Error("PIN dan Nama harus diisi.");
  }

  const pin = rawPin.trim().toUpperCase();

  // 1. Cari exam dengan PIN yang aktif
  const exam = await prisma.exam.findFirst({
    where: {
      pin: pin,
      isActive: true
    }
  });

  if (!exam) {
    throw new Error("PIN tidak ditemukan atau sesi ujian belum diaktifkan panitia.");
  }

  // 2. Daftarkan partisipan baru
  const participant = await prisma.participant.create({
    data: {
      examId: exam.id,
      name: name.trim(),
      status: "ONGOING",
    }
  });

  // 3. Redirect ke halaman tes khusus peserta
  // Kita akan membangun route ini di /exam/[participantId]
  redirect(`/exam/${participant.id}`);
}
