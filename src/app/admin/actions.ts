"use server";

import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Simple random alphanumeric generator for PIN
function generatePIN(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function createExam(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const title = formData.get("title") as string;
  const maxViolationsRaw = formData.get("maxViolations") as string;
  const maxViolations = parseInt(maxViolationsRaw) || 3;
  
  if (!title || title.trim() === "") {
    return { error: "Title is required" };
  }

  let pin = generatePIN();
  
  let isDuplicate = true;
  let attempts = 0;
  while (isDuplicate && attempts < 5) {
    const existing = await prisma.exam.findUnique({ where: { pin } });
    if (!existing) {
      isDuplicate = false;
    } else {
      pin = generatePIN();
      attempts++;
    }
  }

  const exam = await prisma.exam.create({
    data: {
      title: title.trim(),
      pin: pin,
      maxViolations: maxViolations,
      createdBy: user.id,
    },
  });

  revalidatePath("/admin");
  redirect(`/admin/exams/${exam.id}`); // Take them to editor
}

export async function toggleExamStatus(examId: string, currentStatus: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  await prisma.exam.update({
    where: { 
      id: examId,
      createdBy: user.id // Critical: ensures data isolation
    },
    data: {
      isActive: !currentStatus
    }
  });

  revalidatePath("/admin");
}
