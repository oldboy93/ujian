import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { QuizRunner } from "@/components/runner/QuizRunner";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ParticipantExamPage({ params }: PageProps) {
  const { id } = await params;

  // 1. Ambil Data Peserta + Detail Ujian terkait
  const participant = await prisma.participant.findUnique({
    where: { id },
    include: {
      answers: true, // Ambil riwayat jawaban tersimpan
      exam: {
        include: {
          questions: {
            orderBy: { createdAt: "asc" }
          }
        }
      }
    }
  });

  if (!participant) return notFound();

  // 2. Cek Status Ujian
  if (participant.status === "SUBMITTED") {
    return (
      <div className="min-h-screen bg-[#f0f9fa] flex items-center justify-center p-4">
        <Card className="max-w-lg w-full p-10 text-center rounded-[32px] shadow-[0_30px_70px_rgba(62,183,179,0.2)] bg-white border-none overflow-hidden relative">
           <div className="absolute top-0 inset-x-0 h-2 bg-emerald-500" />
           
           <div className="h-20 w-20 bg-emerald-50 text-emerald-500 rounded-[24px] flex items-center justify-center mx-auto mb-8 transform rotate-12">
             <CheckCircle2 className="h-10 w-10 -rotate-12" />
           </div>
           
           <h2 className="text-2xl font-[900] text-[#1e293b] mb-2">Selesai & Dikumpulkan</h2>
           <p className="text-slate-500 text-sm font-medium mb-8">Jawaban Anda telah terkunci aman di server kami.</p>
           
           <div className="p-6 md:p-8 bg-emerald-50/50 border border-emerald-100 rounded-[24px] mb-8 text-left relative">
              <div className="font-serif text-right text-2xl font-bold text-[#1e293b] mb-4 leading-loose" dir="rtl">
                 فَإِذَا عَزَمْتَ فَتَوَكَّلْ عَلَى اللَّهِ ۚ إِنَّ اللَّهَ يُحِبُّ الْمُتَوَكِّلِينَ
              </div>
              <p className="text-[#065f46] font-bold text-sm leading-relaxed">
                 "Apabila engkau telah membulatkan tekad, maka bertawakkallah kepada Allah. Sesungguhnya Allah mencintai orang yang bertawakkal."
              </p>
              <cite className="block mt-2 text-[11px] font-bold text-emerald-700/50 uppercase tracking-wider not-italic">— QS. Ali 'Imran: 159</cite>
           </div>

           <a href="/">
             <Button className="w-full bg-[#1e293b] hover:bg-black rounded-[16px] h-14 font-black text-white shadow-lg transition-all">Kembali ke Beranda</Button>
           </a>
        </Card>
      </div>
    );
  }

  // 3. Pastikan ada soal sebelum merender runner
  if (!participant.exam.questions || participant.exam.questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-slate-500">
        Belum ada butir soal dalam ujian ini. Hubungi panitia.
      </div>
    );
  }

  // 4. Kirim ke Runner Client Component
  return (
    <QuizRunner 
      questions={participant.exam.questions as any} 
      participantId={participant.id}
      participantName={participant.name}
      examTitle={participant.exam.title}
      maxViolations={participant.exam.maxViolations}
      currentViolations={participant.violations}
      initialAnswers={participant.answers as any}
    />
  );
}
