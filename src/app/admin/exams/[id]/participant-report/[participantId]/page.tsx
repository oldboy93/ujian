import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import ParticipantReportTemplate from "@/components/print/ParticipantReportTemplate";

interface PageProps {
  params: Promise<{ 
    id: string;
    participantId: string;
  }>;
}

export default async function IndividualParticipantReportPage({ params }: PageProps) {
  const { id, participantId } = await params;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Secure check ensuring this exam belongs to current admin user
  const exam = await prisma.exam.findFirst({
    where: {
      id: id,
      createdBy: user.id,
    },
    include: {
      questions: { orderBy: { createdAt: "asc" } },
      participants: {
         where: { id: participantId },
         include: { answers: true }
      }
    }
  });

  if (!exam || exam.participants.length === 0) {
     notFound();
  }

  const participant = exam.participants[0];

  return (
    <>
      <ParticipantReportTemplate 
         examTitle={exam.title}
         examPin={exam.pin}
         participantName={participant.name}
         totalScore={Number(participant.totalScore) || 0}
         questions={exam.questions.map(q => ({
            id: q.id,
            content: q.content,
            type: q.type,
            pointCorrect: q.pointCorrect
         }))}
         answers={participant.answers.map(a => ({
            questionId: a.questionId,
            answerText: a.answerText,
            scoreEarned: Number(a.scoreEarned) || 0,
            isCorrect: !!a.isCorrect
         }))}
      />
      <script dangerouslySetInnerHTML={{ __html: `window.onload = () => { setTimeout(() => { window.print(); }, 500); }` }} />
    </>
  );
}
