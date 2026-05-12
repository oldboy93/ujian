import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import CertificateTemplate from "@/components/print/CertificateTemplate";

interface PageProps {
  params: Promise<{ id: string; participantId: string }>;
}

export default async function CertificatePage({ params }: PageProps) {
  const { id, participantId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const exam = await prisma.exam.findFirst({
    where: { id: id, createdBy: user.id }
  });

  if (!exam) notFound();

  const participant = await prisma.participant.findUnique({
    where: { id: participantId }
  });

  if (!participant || participant.examId !== exam.id) notFound();

  return (
    <>
      <CertificateTemplate
        participantName={participant.name}
        examTitle={exam.title}
        completionDate={participant.status === "SUBMITTED" ? new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "DALAM PROSES"}
        score={Number(participant.totalScore) || 0}
        examId={exam.id}
        ceoSignatureUrl=""
        directorSignatureUrl=""
      />
      <script dangerouslySetInnerHTML={{ __html: `window.onload = () => { setTimeout(() => { window.print(); }, 500); }` }} />
    </>
  );
}
