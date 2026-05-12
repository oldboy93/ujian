import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import ReportTemplate from "@/components/print/ReportTemplate";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ExamReportPage({ params }: PageProps) {
  const { id } = await params;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const exam = await prisma.exam.findFirst({
    where: {
      id: id,
      createdBy: user.id,
    },
    include: {
      participants: {
        orderBy: { totalScore: "desc" }
      }
    }
  });

  if (!exam) notFound();

  return (
    <>
      <ReportTemplate 
         examTitle={exam.title}
         examPin={exam.pin}
         createdAt={exam.createdAt.toLocaleDateString("id-ID")}
         participants={exam.participants.map(p => ({
            name: p.name,
            status: p.status,
            violations: p.violations,
            totalScore: Number(p.totalScore) || 0
         }))}
         maxViolations={exam.maxViolations}
      />
      <script dangerouslySetInnerHTML={{ __html: `window.onload = () => { setTimeout(() => { window.print(); }, 500); }` }} />
    </>
  );
}
