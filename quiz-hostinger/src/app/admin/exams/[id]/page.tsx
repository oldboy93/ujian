import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Presentation, Clipboard, Settings2 } from "lucide-react";
import { ExamStatusToggle } from "@/components/admin/exam/ExamStatusToggle";
import { AddQuestionDialog } from "@/components/admin/exam/AddQuestionDialog";
import { QuestionList } from "@/components/admin/exam/QuestionList";
import { ExamTabsContainer } from "@/components/admin/exam/ExamTabsContainer";
import { ParticipantRecap } from "@/components/admin/exam/ParticipantRecap";
import { ExamSettingsDialog } from "@/components/admin/exam/ExamSettingsDialog";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ExamPage({ params }: PageProps) {
  const { id } = await params;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect("/login");

  const exam = await prisma.exam.findFirst({
    where: {
      id: id,
      createdBy: user.id, // Auth gate
    },
    include: {
      questions: {
        orderBy: { createdAt: "asc" }
      },
      participants: {
        include: { answers: true },
        orderBy: { joinedAt: "desc" }
      }
    }
  });

  if (!exam) notFound();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Breadcrumb / Navigation Back */}
      <div className="mb-6">
        <Link 
          href="/admin" 
          className="inline-flex items-center gap-2 text-slate-500 hover:text-[#3eb7b3] transition-colors text-sm font-bold"
        >
          <ChevronLeft className="h-4 w-4" />
          Kembali ke Dasbor
        </Link>
      </div>

      {/* Contextual Header Layout */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
         
         <div className="flex items-start gap-5">
            <div className="w-16 h-16 min-w-[64px] rounded-[20px] bg-[#3eb7b3] flex items-center justify-center text-white shadow-[0_12px_24px_-8px_rgba(62,183,179,0.6)]">
               <Presentation className="h-8 w-8" />
            </div>
            <div>
               <div className="flex items-center gap-3 mb-1">
                 <h1 className="text-2xl font-[800] text-[#1e293b] tracking-tight leading-tight">{exam.title}</h1>
               </div>
               <div className="flex flex-wrap items-center gap-4 mt-2">
                 <div className="flex items-center gap-2 text-[0.85rem] font-[700] text-[#3eb7b3] bg-[#e7f6fb] px-3 py-1 rounded-[8px]">
                    <Clipboard className="h-3.5 w-3.5" />
                    PIN Masuk: {exam.pin}
                 </div>
                 <div className="flex items-center gap-2 text-[0.85rem] text-slate-400 font-bold bg-slate-50 border border-slate-100 px-3 py-1 rounded-[8px]">
                    Batas Toleransi: {exam.maxViolations} Pelanggaran
                 </div>
               </div>
            </div>
         </div>

         <div className="flex items-center gap-3 flex-wrap">
            <ExamStatusToggle examId={exam.id} initialActive={exam.isActive} />
            <ExamSettingsDialog 
               examId={exam.id}
               initialTitle={exam.title}
               initialPin={exam.pin}
               initialMaxViolations={exam.maxViolations}
            />
         </div>

      </div>

      {/* Tabs System encapsulating Question Management and Recap View */}
      <ExamTabsContainer
         questionCount={exam.questions.length}
         participantCount={exam.participants.length}
         questionsContent={
            <div className="flex flex-col gap-6 animate-in fade-in duration-300">
               <div className="flex items-center justify-between py-2 px-1">
                  <h2 className="text-[1.1rem] font-[800] text-[#1e293b] flex items-center gap-2">
                     Daftar Butir Soal
                     <span className="h-1.5 w-1.5 rounded-full bg-[#3eb7b3]"></span>
                  </h2>
                  <AddQuestionDialog examId={exam.id} />
               </div>
               <QuestionList questions={exam.questions as any} examId={exam.id} />
            </div>
         }
         participantsContent={
            <ParticipantRecap 
               participants={exam.participants as any} 
               maxViolations={exam.maxViolations} 
               questions={exam.questions as any}
            />
         }
      />

    </div>
  );
}
