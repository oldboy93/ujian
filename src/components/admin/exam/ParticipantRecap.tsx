"use client";

import { Participant, ParticipantAnswer, Question } from "@prisma/client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  User, 
  ShieldAlert, 
  Clock, 
  CheckCircle, 
  Eye, 
  FileText,
  Save,
  ArrowRight,
  ArrowLeft,
  ListFilter,
  Printer,
  Award
} from "lucide-react";
import { updateEssayScore } from "@/app/exam/actions";
import { getParticipantAnswers } from "@/app/admin/exams/[id]/actions";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

type ParticipantWithAnswers = Participant & {
  answers?: ParticipantAnswer[];
};

interface ParticipantRecapProps {
  participants: ParticipantWithAnswers[];
  maxViolations: number;
  questions: Question[];
}

export function ParticipantRecap({ participants, maxViolations, questions }: ParticipantRecapProps) {
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantWithAnswers | null>(null);
  const [currentAnswers, setCurrentAnswers] = useState<ParticipantAnswer[]>([]);
  const [isLoadingAnswers, setIsLoadingAnswers] = useState(false);
  const [gradingStates, setGradingStates] = useState<Record<string, { loading: boolean, val: number }>>({});
  const [filterType, setFilterType] = useState<"ALL" | "PG" | "ESSAY">("ALL");

  if (!participants || participants.length === 0) {
    return (
      <Card className="border-dashed border-2 border-slate-200 bg-slate-50/30 p-12 text-center rounded-[24px]">
         <div className="mx-auto h-12 w-12 text-slate-300 mb-4 flex items-center justify-center bg-white rounded-full border shadow-sm">
            <User className="h-6 w-6" />
         </div>
         <h3 className="text-[#1e293b] font-bold">Belum Ada Peserta</h3>
         <p className="text-slate-400 text-sm mt-1">Berikan PIN ujian ini agar peserta dapat bergabung.</p>
      </Card>
    );
  }

   const router = useRouter();

    const handleOpenEvaluation = async (participant: ParticipantWithAnswers) => {
       setSelectedParticipant(participant);
       setIsLoadingAnswers(true);
       setCurrentAnswers([]);
       
       try {
           const answers = await getParticipantAnswers(participant.id);
           setCurrentAnswers(answers);
       } catch (e) {
           console.error(e);
           toast.error("Gagal memuat jawaban peserta.");
       } finally {
           setIsLoadingAnswers(false);
       }
    };

    const handleGrading = async (qId: string, maxPts: number) => {
       if (!selectedParticipant) return;
       
       const stateVal = gradingStates[`${selectedParticipant.id}_${qId}`]?.val;
       const finalScore = stateVal === undefined ? 0 : Number(stateVal);

       if (finalScore < 0 || finalScore > maxPts) {
           toast.error(`Skor tidak valid`, {
              description: `Skor tidak boleh kurang dari 0 atau melebihi batas maksimal soal (${maxPts} Poin).`
           });
           return;
       }

       setGradingStates(prev => ({ 
           ...prev, 
           [`${selectedParticipant.id}_${qId}`]: { loading: true, val: finalScore } 
       }));

       try {
           await updateEssayScore(selectedParticipant.id, qId, finalScore);
           toast.success("Berhasil", { description: "Nilai essay berhasil diperbarui!" });
           
           setCurrentAnswers(prev => prev.map(ans => 
               ans.questionId === qId ? { ...ans, scoreEarned: finalScore, isCorrect: finalScore > 0 } : ans
           ));

           router.refresh(); 
       } catch (e) {
           console.error(e);
           toast.error("Gagal", { description: "Gagal memperbarui nilai essay." });
       } finally {
           setGradingStates(prev => ({ 
               ...prev, 
               [`${selectedParticipant.id}_${qId}`]: { loading: false, val: finalScore } 
           }));
       }
    };

  // ==========================================================================
  // VIEW 2: DETAIL PENILAIAN (FULL-VIEW PAGE EMBEDDED)
  // ==========================================================================
  if (selectedParticipant) {
    return (
      <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
         {/* HEADER EVALUASI */}
         <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
               <div className="h-20 w-20 bg-slate-50 rounded-[28px] shadow-sm border border-slate-100 flex items-center justify-center shrink-0 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[#3eb7b3]/5" />
                  <User className="h-10 w-10 text-[#3eb7b3] relative z-10" />
               </div>
               <div>
                  <div className="text-xs font-black text-[#3eb7b3] uppercase tracking-[0.15em] mb-1.5">Penilaian Detail Peserta</div>
                  <h2 className="text-3xl md:text-4xl font-black text-[#1e293b] tracking-tight leading-tight">{selectedParticipant.name}</h2>
                  <div className="flex flex-wrap items-center gap-3 md:gap-5 mt-3">
                     <Badge className={`font-black shadow-none rounded-xl px-3 py-1.5 tracking-wide text-xs border-2 ${selectedParticipant.status === "SUBMITTED" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"}`}>
                        {selectedParticipant.status === "SUBMITTED" ? "SELESAI UJIAN" : "SEDANG MENGERJAKAN"}
                     </Badge>
                     <div className="hidden md:block h-1.5 w-1.5 rounded-full bg-slate-200" />
                     <div className="flex items-center gap-2 bg-[#1e293b] text-white px-4 py-1.5 rounded-xl text-sm font-bold shadow-md shadow-slate-200">
                        <span className="opacity-70 text-[11px] uppercase tracking-wider">Skor Saat Ini:</span>
                        <span className="text-base font-black">{(Number(selectedParticipant.totalScore) || 0).toFixed(1)}</span>
                     </div>
                  </div>
               </div>
            </div>
            
            <Button 
               variant="outline" 
               className="h-14 px-8 rounded-2xl gap-3 font-black text-slate-700 border-slate-200 hover:bg-[#1e293b] hover:text-white hover:border-[#1e293b] transition-all duration-300 shadow-sm shrink-0 text-base"
               onClick={() => {
                  setSelectedParticipant(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
               }}
            >
               <ArrowLeft className="h-5 w-5" />
               Kembali ke Tabel
            </Button>
         </div>

         {/* DAFTAR JAWABAN DENGAN UKURAN PENUH (NATIVE SCROLL) */}
         <div className="flex flex-col gap-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
               <div className="flex items-center gap-3">
                  <div className="h-8 w-1.5 bg-[#3eb7b3] rounded-full" />
                  <h3 className="font-black text-2xl text-[#1e293b] tracking-tight">Evaluasi Butir Soal</h3>
               </div>

               {/* FILTER CONTROLS */}
               <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-[20px] border border-slate-200/50 shadow-inner w-fit">
                  {[
                     { id: "ALL", label: "Semua", icon: ListFilter },
                     { id: "PG", label: "Pilihan Ganda", icon: CheckCircle },
                     { id: "ESSAY", label: "Essay", icon: FileText }
                  ].map((btn) => {
                     const Icon = btn.icon;
                     const isActive = filterType === btn.id;
                     return (
                        <button
                           key={btn.id}
                           onClick={() => setFilterType(btn.id as any)}
                           className={`flex items-center gap-2 px-5 py-2.5 rounded-[14px] text-sm font-bold transition-all duration-300 ${
                              isActive 
                                 ? "bg-white text-[#1e293b] shadow-md shadow-slate-200/50 ring-1 ring-slate-200" 
                                 : "text-slate-500 hover:text-[#1e293b] hover:bg-white/50"
                           }`}
                        >
                           <Icon className={`h-4 w-4 ${isActive ? "text-[#3eb7b3]" : "opacity-60"}`} />
                           {btn.label}
                        </button>
                     );
                  })}
               </div>
            </div>

            {isLoadingAnswers ? (
               <div className="p-32 border-2 border-dashed border-slate-200 rounded-[40px] flex flex-col items-center justify-center text-slate-400 bg-white/50">
                  <Clock className="h-14 w-14 animate-spin mb-6 text-[#3eb7b3]" />
                  <p className="text-2xl font-black text-[#1e293b]">Sedang Memuat Jawaban</p>
                  <p className="text-base font-medium text-slate-500 mt-2">Mohon tunggu beberapa detik...</p>
               </div>
            ) : (
               <div className="grid gap-8">
                  {questions.map((q, origIdx) => ({ q, origIdx }))
                   .filter(({ q }) => filterType === "ALL" || q.type === filterType)
                   .map(({ q, origIdx }) => {
                     const ans = currentAnswers.find(a => a.questionId === q.id);
                     const isEssay = q.type === "ESSAY";
                     
                     const key = `${selectedParticipant.id}_${q.id}`;
                     const currentVal = gradingStates[key]?.val ?? (ans?.scoreEarned || 0);
                     const isLoading = gradingStates[key]?.loading || false;

                     return (
                        <div key={q.id} className="border-2 border-slate-100 shadow-[0_8px_40px_rgba(0,0,0,0.03)] rounded-[40px] overflow-hidden bg-white group transition-all duration-500 hover:shadow-[0_15px_50px_rgba(0,0,0,0.06)] hover:border-[#3eb7b3]/10">
                           <div className="p-8 md:p-12 flex flex-col gap-8">
                              {/* HEADER SOAL */}
                              <div className="flex flex-wrap justify-between items-center gap-4 border-b-2 border-slate-50 pb-6">
                                 <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 bg-[#1e293b] text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-slate-300 group-hover:scale-110 transition-transform">
                                       {origIdx + 1}
                                    </div>
                                    <Badge className={`text-xs font-black tracking-widest px-4 py-1.5 rounded-xl border-2 ${isEssay ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-indigo-50 text-indigo-600 border-indigo-100"}`}>
                                       {isEssay ? "ESSAY" : "PILIHAN GANDA"}
                                    </Badge>
                                 </div>
                                 <div className="bg-slate-50 px-5 py-2 rounded-2xl text-sm font-black text-slate-600 border border-slate-100 shadow-inner tracking-wider flex items-center gap-2">
                                    BOBOT SOAL: <span className="text-[#1e293b] text-base">{q.pointCorrect}</span> POIN
                                 </div>
                              </div>

                              {/* KONTEN PERTANYAAN */}
                              <div className="font-bold text-[#1e293b] text-xl md:text-2xl leading-relaxed py-2 px-2 max-w-4xl">
                                 {q.content}
                              </div>

                              {/* BLOK JAWABAN PESERTA - UKURAN PENUH & SCROLL NATIVE */}
                              <div className="bg-slate-50 rounded-[32px] p-8 md:p-10 border border-slate-100">
                                 <div className="text-[12px] uppercase font-black text-[#3eb7b3] mb-5 flex items-center gap-2.5 tracking-[0.2em]">
                                    <FileText className="h-5 w-5" /> JAWABAN TERTULIS PESERTA:
                                 </div>
                                 {ans?.answerText ? (
                                    <div className="text-lg font-medium text-[#334155] whitespace-pre-wrap break-words leading-loose bg-white p-8 rounded-2xl shadow-sm border border-slate-200/60">
                                       {isEssay ? ans.answerText : <span className="font-black text-[#1e293b] text-2xl tracking-tight">{ans.answerText}</span>}
                                    </div>
                                 ) : (
                                    <div className="text-lg font-black text-slate-400 italic bg-white/50 py-12 rounded-3xl border-4 border-dashed border-slate-100 text-center">
                                       KOSONG / TIDAK MENJAWAB
                                    </div>
                                 )}
                              </div>

                              {/* PANEL INPUT NILAI */}
                              <div className="pt-6 border-t-2 border-slate-50">
                                 {!isEssay ? (
                                    <div className="flex items-center gap-4 bg-slate-50 px-8 py-5 rounded-[24px] w-fit border border-slate-100 shadow-sm">
                                       <span className="text-base font-bold text-slate-500">Skor Otomatis Sistem:</span>
                                       <span className={`text-2xl font-black ${ans?.isCorrect ? "text-emerald-600" : "text-rose-600"}`}>
                                          {ans?.scoreEarned || 0} Poin
                                       </span>
                                       {ans?.isCorrect ? (
                                          <CheckCircle className="h-7 w-7 text-emerald-500 fill-emerald-50" />
                                       ) : (
                                          <div className="h-7 w-7 rounded-full border-4 border-rose-200 bg-rose-50 flex items-center justify-center font-black text-xs text-rose-600">X</div>
                                       )}
                                    </div>
                                 ) : (
                                    <div className="flex flex-col lg:flex-row lg:items-center gap-6 w-full bg-white border-2 border-slate-100 p-6 md:p-8 rounded-[32px] shadow-sm group-hover:border-[#3eb7b3]/30 transition-colors">
                                       <div className="flex-1 flex flex-col md:flex-row md:items-center gap-5">
                                          <div className="w-full md:w-auto">
                                             <div className="text-sm font-black text-[#1e293b] mb-2">Input Nilai Akhir (Batas: {q.pointCorrect})</div>
                                             <div className="flex flex-wrap md:flex-nowrap gap-4 items-center">
                                                <Input 
                                                   type="number" 
                                                   min="0" 
                                                   step="any"
                                                   max={q.pointCorrect}
                                                   className="h-16 w-full md:w-40 rounded-2xl font-black text-center text-2xl border-2 border-slate-200 focus:border-[#3eb7b3] focus:ring-8 focus:ring-[#3eb7b3]/10 transition-all bg-slate-50 focus:bg-white" 
                                                   placeholder="0.0"
                                                   value={currentVal}
                                                   onChange={(e) => setGradingStates(prev => ({ 
                                                       ...prev, 
                                                       [key]: { loading: false, val: Number(e.target.value) } 
                                                   }))}
                                                   disabled={isLoading}
                                                />
                                                <Button 
                                                   size="lg"
                                                   className="h-16 w-full md:w-auto px-10 gap-3 bg-[#1e293b] hover:bg-black text-white font-black text-lg rounded-2xl shadow-xl shadow-slate-200 hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all duration-300"
                                                   onClick={() => handleGrading(q.id, q.pointCorrect)}
                                                   disabled={isLoading}
                                                >
                                                   {isLoading ? (
                                                      <Clock className="h-6 w-6 animate-spin" />
                                                   ) : (
                                                      <Save className="h-6 w-6" />
                                                   )}
                                                   {isLoading ? "Menyimpan..." : "Simpan Nilai"}
                                                </Button>
                                             </div>
                                          </div>
                                       </div>
                                       
                                       <div className="hidden lg:block shrink-0 h-20 w-0.5 bg-slate-100 my-2" />

                                       <div className="shrink-0 bg-[#ecfdf5] text-[#047857] px-10 py-5 rounded-[24px] border-2 border-[#bbf7d0] font-black text-center flex flex-col items-center min-w-[160px] shadow-inner">
                                          <span className="text-[12px] uppercase text-[#059669]/80 font-black mb-1 tracking-widest">Ter-Simpan</span>
                                          <span className="text-4xl tracking-tight">{(ans?.scoreEarned || 0)}</span>
                                       </div>
                                    </div>
                                 )}
                              </div>
                           </div>
                        </div>
                     );
                  })}
               </div>
            )}

            <div className="flex justify-center pt-10 pb-20">
               <Button 
                  variant="outline" 
                  size="lg"
                  className="h-16 px-12 rounded-[24px] gap-4 font-black text-xl text-slate-700 border-2 border-slate-200 hover:bg-[#1e293b] hover:text-white hover:border-[#1e293b] shadow-lg transition-all duration-300 active:scale-95"
                  onClick={() => {
                     setSelectedParticipant(null);
                     window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
               >
                  <ArrowLeft className="h-6 w-6" />
                  Selesai & Kembali
               </Button>
            </div>
         </div>
      </div>
    );
  }

  const params = useParams();
  const examId = params?.id as string;

  // ==========================================================================
  // VIEW 1: TABEL DAFTAR PESERTA (HALAMAN UTAMA)
  // ==========================================================================
  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500">
      {/* GLOBAL REPORT ACTIONS */}
      <div className="flex justify-end items-center px-1">
         <Button 
            asChild
            variant="outline"
            className="h-11 rounded-xl gap-2.5 font-black text-sm text-white bg-[#1e293b] hover:bg-black border-0 shadow-md hover:shadow-lg transition-all"
         >
            <Link href={`/admin/exams/${examId}/report`} target="_blank">
               <Printer className="h-4 w-4 text-[#3eb7b3]" />
               Cetak Laporan Rekapitulasi
            </Link>
         </Button>
      </div>

      <div className="bg-white border border-slate-100 rounded-[24px] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Peserta</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Pelanggaran</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Skor Total</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {participants.map((p) => {
              const isSuspicious = p.violations > 0;
              const isViolatedLimit = p.violations >= maxViolations;
              
              return (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                       <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm ${
                          isViolatedLimit ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-[#e7f6fb] text-[#3eb7b3]"
                       }`}>
                          {p.name.substring(0, 2).toUpperCase()}
                       </div>
                       <div>
                          <div className="font-bold text-[#1e293b]">{p.name}</div>
                          <div className="text-[11px] text-slate-400 font-medium">ID: {p.id.substring(0,6)}</div>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                     {p.status === "SUBMITTED" ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50 rounded-lg px-2 py-1 flex items-center gap-1.5 w-fit font-bold text-xs shadow-none">
                           <CheckCircle className="h-3 w-3" /> Selesai
                        </Badge>
                     ) : (
                        <Badge className="bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-50 rounded-lg px-2 py-1 flex items-center gap-1.5 w-fit font-bold text-xs shadow-none">
                           <Clock className="h-3 w-3 animate-pulse" /> Mengerjakan
                        </Badge>
                     )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                     {isSuspicious ? (
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border ${
                           isViolatedLimit 
                              ? "bg-rose-50 border-rose-200 text-rose-600" 
                              : "bg-amber-50 border-amber-200 text-amber-700"
                        }`}>
                           <ShieldAlert className="h-3.5 w-3.5" />
                           <span>{p.violations} Pelanggaran</span>
                        </div>
                     ) : (
                        <span className="text-slate-300 text-xs font-bold flex items-center gap-1.5">
                           <CheckCircle className="h-3 w-3 text-emerald-400" /> Bersih
                        </span>
                     )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                     <span className={`text-lg font-black ${
                        p.status === "SUBMITTED" ? "text-[#1e293b]" : "text-slate-300"
                     }`}>
                        {(Number(p.totalScore) || 0).toFixed(1)}
                     </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                     <div className="flex items-center justify-center gap-2">
                        <Button 
                           variant="outline" 
                           size="sm" 
                           className="h-9 gap-2 rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-[#3eb7b3] hover:text-white hover:border-[#3eb7b3] transition-all"
                           onClick={() => handleOpenEvaluation(p)}
                        >
                           <Eye className="h-3.5 w-3.5" />
                           Beri Nilai
                        </Button>
                        {p.status === "SUBMITTED" && (
                           <>
                              <Button 
                                 asChild
                                 variant="outline" 
                                 size="sm" 
                                 className="h-9 gap-2 rounded-xl border-dashed border-slate-300 font-bold text-[#1e293b] hover:bg-[#1e293b] hover:text-white hover:border-[#1e293b] transition-all shadow-sm"
                              >
                                 <Link href={`/admin/exams/${examId}/certificate/${p.id}`} target="_blank">
                                    <Award className="h-3.5 w-3.5 text-[#3eb7b3]" />
                                    Sertifikat
                                 </Link>
                              </Button>
                              <Button 
                                 asChild
                                 variant="outline" 
                                 size="sm" 
                                 className="h-9 gap-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm"
                              >
                                 <Link href={`/admin/exams/${examId}/participant-report/${p.id}`} target="_blank">
                                    <FileText className="h-3.5 w-3.5 text-[#3eb7b3]" />
                                    Report
                                 </Link>
                              </Button>
                           </>
                        )}
                     </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}
