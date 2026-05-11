import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { ParticipantRecap } from "@/components/admin/exam/ParticipantRecap";
import { Activity, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface MonitorPageProps {
  params: Promise<{ id: string }>;
}

export default async function MonitorPage({ params }: MonitorPageProps) {
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
      questions: true,
      participants: {
        include: { answers: true },
        orderBy: { joinedAt: "desc" }
      }
    }
  });

  if (!exam) notFound();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
         <div className="flex items-center gap-4">
            <Link 
              href={`/admin/exams/${exam.id}`}
              className="h-10 w-10 flex items-center justify-center bg-slate-50 hover:bg-[#3eb7b3]/10 rounded-xl text-slate-400 hover:text-[#3eb7b3] transition-all border shadow-sm"
            >
               <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
               <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-50 gap-1 px-2 rounded-lg text-[10px] font-black uppercase">
                     <Activity className="h-3 w-3 animate-pulse" /> Monitoring Live
                  </Badge>
               </div>
               <h1 className="text-2xl font-black text-[#1e293b]">{exam.title}</h1>
               <p className="text-slate-400 text-sm font-medium">Memantau aktivitas riil {exam.participants.length} peserta</p>
            </div>
         </div>
         
         <div className="flex items-center gap-3 text-sm">
            <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 font-bold text-slate-500">
               PIN: {exam.pin}
            </div>
            <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 font-bold text-slate-500">
               Toleransi: {exam.maxViolations}x
            </div>
         </div>
      </div>

      <div className="bg-slate-50/50 rounded-[24px] border border-slate-100 p-1">
         <ParticipantRecap 
           participants={exam.participants as any} 
           maxViolations={exam.maxViolations} 
           questions={exam.questions as any}
         />
      </div>
    </div>
  );
}
