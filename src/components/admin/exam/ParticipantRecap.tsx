"use client";

import { Participant, ParticipantAnswer, Question } from "@prisma/client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  User, 
  ShieldAlert, 
  Clock, 
  CheckCircle, 
  Eye, 
  FileText,
  Save,
  ArrowRight
} from "lucide-react";
import { updateEssayScore } from "@/app/exam/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type ParticipantWithAnswers = Participant & {
  answers: ParticipantAnswer[];
};

interface ParticipantRecapProps {
  participants: ParticipantWithAnswers[];
  maxViolations: number;
  questions: Question[];
}

export function ParticipantRecap({ participants, maxViolations, questions }: ParticipantRecapProps) {
  const [open, setOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantWithAnswers | null>(null);
  const [gradingStates, setGradingStates] = useState<Record<string, { loading: boolean, val: number }>>({});

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

  return (
    <div className="bg-white border border-slate-100 rounded-[24px] shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                        {p.totalScore.toFixed(1)}
                     </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                     <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-9 gap-2 rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-[#3eb7b3] hover:text-white hover:border-[#3eb7b3] transition-all"
                        onClick={() => {
                            setSelectedParticipant(p);
                            setOpen(true);
                        }}
                     >
                        <Eye className="h-3.5 w-3.5" />
                        Beri Nilai
                     </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* DIALOG MODAL DETAIL EVALUASI PESERTA */}
      <Dialog open={open} onOpenChange={setOpen}>
         <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col rounded-[32px] border-none shadow-2xl bg-white overflow-hidden p-0">
            {selectedParticipant && (
               <>
                  <div className="px-8 pt-8 pb-6 bg-slate-50/80 border-b border-slate-100 sticky top-0 z-10">
                     <DialogHeader className="mb-0">
                        <div className="flex items-center gap-4">
                           <div className="h-14 w-14 bg-white rounded-[20px] shadow-sm border border-slate-100 flex items-center justify-center">
                              <User className="h-7 w-7 text-[#3eb7b3]" />
                           </div>
                           <div>
                              <DialogTitle className="text-2xl font-black text-[#1e293b]">{selectedParticipant.name}</DialogTitle>
                              <DialogDescription className="font-bold text-slate-400 flex items-center gap-4 mt-1">
                                 <span>Status: {selectedParticipant.status}</span>
                                 <span>•</span>
                                 <span className="text-[#3eb7b3]">Skor Akumulatif: {selectedParticipant.totalScore.toFixed(1)} Poin</span>
                              </DialogDescription>
                           </div>
                        </div>
                     </DialogHeader>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 bg-[#f8fafc]/50">
                     <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Evaluasi Jawaban Butir Soal</h4>
                     
                     {questions.map((q, idx) => {
                        const ans = selectedParticipant.answers.find(a => a.questionId === q.id);
                        const isEssay = q.type === "ESSAY";
                        
                        // Local internal value handle for textfields
                        const key = `${selectedParticipant.id}_${q.id}`;
                        const currentVal = gradingStates[key]?.val ?? (ans?.scoreEarned || 0);
                        const isLoading = gradingStates[key]?.loading || false;

                        return (
                           <Card key={q.id} className="border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] rounded-[24px] overflow-hidden bg-white">
                              <div className="p-6 flex flex-col gap-4">
                                 <div className="flex justify-between items-start gap-4">
                                    <div className="flex items-center gap-3">
                                       <span className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center font-black text-slate-600 text-sm">{idx + 1}</span>
                                       <Badge className={isEssay ? "bg-blue-50 text-blue-600 border-blue-100 shadow-none" : "bg-indigo-50 text-indigo-600 border-indigo-100 shadow-none"}>
                                          {isEssay ? "ESSAY" : "PG"}
                                       </Badge>
                                    </div>
                                    <div className="text-xs font-bold text-slate-400 uppercase">Bobot: {q.pointCorrect} Poin</div>
                                 </div>

                                 <div className="font-bold text-[#1e293b] text-sm leading-relaxed">
                                    {q.content}
                                 </div>

                                 {/* USER'S SUBMITTED ANSWER */}
                                 <div className="bg-slate-50 rounded-[16px] p-4 border border-slate-100">
                                    <div className="text-[10px] uppercase font-black text-slate-400 mb-1 flex items-center gap-1.5">
                                       <FileText className="h-3 w-3" /> Jawaban Peserta:
                                    </div>
                                    {ans?.answerText ? (
                                       <div className="text-sm font-medium text-[#1e293b] whitespace-pre-wrap break-words">
                                          {isEssay ? ans.answerText : `Pilihan: ${ans.answerText}`}
                                       </div>
                                    ) : (
                                       <div className="text-sm font-bold text-slate-400 italic">Kosong / Tidak Menjawab</div>
                                    )}
                                 </div>

                                 {/* GRADING CONTROLS */}
                                 <div className="pt-2 flex items-center justify-between border-t border-slate-50 mt-2">
                                    {!isEssay ? (
                                       <div className="flex items-center gap-2 text-sm font-bold">
                                          <span className="text-slate-400">Skor PG Otomatis:</span>
                                          <span className={ans?.isCorrect ? "text-emerald-600" : "text-rose-500"}>
                                             {ans?.scoreEarned || 0} Poin
                                          </span>
                                       </div>
                                    ) : (
                                       <div className="flex items-center gap-4 w-full">
                                          <div className="flex-1">
                                             <div className="text-[11px] font-bold text-slate-500 mb-1">Beri Nilai Essay (Maks {q.pointCorrect})</div>
                                             <div className="flex gap-2">
                                                <Input 
                                                   type="number" 
                                                   min="0" 
                                                   max={q.pointCorrect}
                                                   className="h-10 max-w-[120px] rounded-xl font-black text-center" 
                                                   value={currentVal}
                                                   onChange={(e) => setGradingStates(prev => ({ 
                                                       ...prev, 
                                                       [key]: { loading: false, val: Number(e.target.value) } 
                                                   }))}
                                                   disabled={isLoading}
                                                />
                                                <Button 
                                                   size="sm"
                                                   className="h-10 px-4 gap-2 bg-[#1e293b] hover:bg-black text-white font-bold rounded-xl shadow-md transition-all border-none"
                                                   onClick={() => handleGrading(q.id, q.pointCorrect)}
                                                   disabled={isLoading}
                                                >
                                                   <Save className="h-3.5 w-3.5" />
                                                   {isLoading ? "Menyimpan..." : "Simpan"}
                                                </Button>
                                             </div>
                                          </div>
                                          
                                          <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100 font-black text-sm flex flex-col items-center justify-center">
                                             <span className="text-[9px] uppercase text-emerald-600/70 font-black mb-0.5">Tercatat</span>
                                             {ans?.scoreEarned || 0}
                                          </div>
                                       </div>
                                    )}
                                 </div>

                              </div>
                           </Card>
                        );
                     })}
                  </div>
               </>
            )}
         </DialogContent>
      </Dialog>
    </div>
  );
}
