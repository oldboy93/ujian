"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Question, ParticipantAnswer } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock, ArrowRight, CheckCircle2, AlertCircle, Bookmark, ArrowLeft, ListChecks, ShieldAlert, Heart } from "lucide-react";
import { saveParticipantAnswer, finalizeExam, logViolation, toggleFlag } from "@/app/exam/actions";
import { cn } from "@/lib/utils";

interface QuizRunnerProps {
   questions: Question[];
   participantId: string;
   participantName: string;
   examTitle: string;
   maxViolations: number;
   currentViolations: number;
   initialAnswers: ParticipantAnswer[];
}

export function QuizRunner({
   questions,
   participantId,
   participantName,
   examTitle,
   maxViolations,
   currentViolations,
   initialAnswers
}: QuizRunnerProps) {

   // ================= STATE HYDRATION =================
   // ================= STATE HYDRATION =================
   const [currentIndex, setCurrentIndex] = useState(() => {
      if (typeof window !== "undefined") {
         const stored = localStorage.getItem(`current_q_${participantId}`);
         if (stored) return Math.min(questions.length - 1, parseInt(stored, 10));
      }
      return 0;
   });

   // Menampung jawaban real-time & status ragu secara lokal
   const [localAnswers, setLocalAnswers] = useState<Record<string, { answerText: string, isFlagged: boolean }>>(() => {
      const map: any = {};
      questions.forEach(q => {
         const ans = initialAnswers.find(a => a.questionId === q.id);
         map[q.id] = {
            answerText: ans?.answerText || "",
            isFlagged: ans?.isFlagged || false
         };
      });
      return map;
   });

   // Melacak waktu tersisa PER PERTANYAAN secara lokal
   const [timers, setTimers] = useState<Record<string, number>>(() => {
      const map: any = {};
      questions.forEach(q => {
         const ans = initialAnswers.find(a => a.questionId === q.id);
         map[q.id] = ans?.timeRemainingSeconds !== null && ans?.timeRemainingSeconds !== undefined
            ? ans.timeRemainingSeconds
            : q.timeLimitSeconds;
      });
      return map;
   });

   const [violations, setViolations] = useState(currentViolations);
   const [showCheatOverlay, setShowCheatOverlay] = useState(false);
   const [forceStop, setForceStop] = useState(false);

   const [isSaving, setIsSaving] = useState(false);
   const [isFinalizing, setIsFinalizing] = useState(false);
   const [isSummaryView, setIsSummaryView] = useState(false);
   const [isCompleted, setIsCompleted] = useState(false);
   const [showConfirmDialog, setShowConfirmDialog] = useState(false);

   // 🤲 PRAYER / COUNTDOWN PHASE - Cek apakah sudah pernah dilewati (via initialAnswers atau localStorage)
   const [isPraying, setIsPraying] = useState(() => {
      // Jika sudah ada jawaban yang masuk sedikitpun, abaikan Doa.
      if (initialAnswers.length > 0) return false;
      if (typeof window !== "undefined") {
         return localStorage.getItem(`is_prayed_${participantId}`) !== "true";
      }
      return true;
   });
   const [prayerTime, setPrayerTime] = useState(10);
   const [showRules, setShowRules] = useState(false);

   // Sinkronisasi Question Index ke localStorage
   useEffect(() => {
      localStorage.setItem(`current_q_${participantId}`, currentIndex.toString());
   }, [currentIndex, participantId]);

   useEffect(() => {
      if (!isPraying || prayerTime <= 0) return;
      const prayerInt = setInterval(() => {
         setPrayerTime(prev => prev - 1);
      }, 1000);
      return () => clearInterval(prayerInt);
   }, [isPraying, prayerTime]);

   const currentQuestion = questions[currentIndex];
   const currentAnswer = localAnswers[currentQuestion.id];
   const timerRef = useRef<NodeJS.Timeout | null>(null);

   // ================= 🚨 ANTI-CHEAT ACTIVE BLOCK =================
   useEffect(() => {
      const handleBlur = async () => {
         setShowCheatOverlay(true);
         try {
            const res = await logViolation(participantId);
            if (res.success) {
               setViolations(res.violations as number);
               if (res.forceStopped) {
                  setForceStop(true);
               }
            }
         } catch (e) { console.error(e); }
      };

      window.addEventListener("blur", handleBlur);
      return () => window.removeEventListener("blur", handleBlur);
   }, []);

   // ================= ⏱ TIMER PER-QUESTION LOGIC =================
   const autoSaveRef = useRef<() => Promise<void>>(undefined as any);

   useEffect(() => {
      // Jangan jalankan timer jika di layar ringkasan, saat berdoa, atau sudah selesai
      if (!currentQuestion || isPraying || isSummaryView || isCompleted || forceStop) return;

      // Hentikan timer jika waktu sudah habis sebelumnya
      if (timers[currentQuestion.id] <= 0) return;

      if (timerRef.current) clearInterval(timerRef.current);

      let timeLeft = timers[currentQuestion.id];

      timerRef.current = setInterval(() => {
         timeLeft -= 1;

         // Safe pure state update
         setTimers(prev => ({ ...prev, [currentQuestion.id]: Math.max(0, timeLeft) }));

         // 🔄 PERIODIC BACKGROUND SYNC (Setiap 5 detik kirim waktu ke DB tanpa ganggu UI)
         if (timeLeft > 0 && timeLeft % 5 === 0) {
            // Gunakan localAnswers terbaru untuk menjaga data jawaban sinkron
            saveParticipantAnswer({
               participantId,
               questionId: currentQuestion.id,
               answerText: null, // Biarkan server action handle ini (jangan timpa jawaban essay besar di sini, khusus Waktu)
               timeRemainingSeconds: timeLeft,
               isFlagged: undefined,
               onlyUpdateTime: true // Kita tambahkan param baru agar server hanya update kolom waktu!
            } as any).catch(() => {}); 
         }

         if (timeLeft <= 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            // Triggers side-effect SAFELY outside the state reducer stack using the latest captured ref
            if (autoSaveRef.current) {
               autoSaveRef.current();
            }
         }
      }, 1000);

      return () => { if (timerRef.current) clearInterval(timerRef.current); };
   }, [currentIndex, isPraying, isSummaryView, isCompleted, forceStop]);

   // Fungsi save otomatis ketika timer habis
   async function autoSaveCurrent() {
      const data = localAnswers[currentQuestion.id];
      await saveParticipantAnswer({
         participantId,
         questionId: currentQuestion.id,
         answerText: data.answerText || null,
         timeRemainingSeconds: 0,
         isFlagged: data.isFlagged
      });
   }
   // Sync reference value for closure capture in effects
   autoSaveRef.current = autoSaveCurrent;

   // ================= HANDLERS =================
   const setAnswer = (val: string) => {
      setLocalAnswers(prev => ({
         ...prev,
         [currentQuestion.id]: { ...prev[currentQuestion.id], answerText: val }
      }));
   };

   const toggleFlagLocally = async () => {
      const newFlag = !currentAnswer.isFlagged;
      setLocalAnswers(prev => ({
         ...prev,
         [currentQuestion.id]: { ...prev[currentQuestion.id], isFlagged: newFlag }
      }));
      // Simpan state bendera ke server di background
      await toggleFlag(participantId, currentQuestion.id, newFlag);
   };

   const handleNext = async () => {
      setIsSaving(true);
      try {
         // Persist ke DB sebelum pindah
         await saveParticipantAnswer({
            participantId,
            questionId: currentQuestion.id,
            answerText: currentAnswer.answerText || null,
            timeRemainingSeconds: timers[currentQuestion.id] ?? 0,
            isFlagged: currentAnswer.isFlagged
         });

         if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
         } else {
            setIsSummaryView(true); // Pindah ke ringkasan jika terakhir
         }
      } catch (e) {
         console.error(e);
      } finally { setIsSaving(false); }
   };

   const navigateTo = async (idx: number) => {
      if (isSaving) return;
      // Simpan progres saat ini dulu
      setIsSaving(true);
      await saveParticipantAnswer({
         participantId,
         questionId: currentQuestion.id,
         answerText: currentAnswer.answerText || null,
         timeRemainingSeconds: timers[currentQuestion.id] ?? 0,
         isFlagged: currentAnswer.isFlagged
      });
      setIsSaving(false);
      setIsSummaryView(false);
      setCurrentIndex(idx);
   };

   const handleFinalSubmit = async () => {
      setIsSaving(true);
      setIsFinalizing(true);
      try {
         await finalizeExam(participantId);
         setIsCompleted(true);
         setShowConfirmDialog(false);
      } catch (e) { 
         console.error(e); 
         setIsFinalizing(false);
         setIsSaving(false);
      }
   };

   // ================= RENDER HELPERS =================
   const currentTime = timers[currentQuestion?.id] || 0;
   let parsedOptions: any[] = [];
   try {
      if (currentQuestion?.options) {
         if (typeof currentQuestion.options === 'string') {
            parsedOptions = JSON.parse(currentQuestion.options);
         } else {
            parsedOptions = currentQuestion.options as any[];
         }
      }
   } catch (e) { }

   // 🚨 -1. RENDER: FINALIZING OVERLAY (Anti-Freeze Block)
   if (isFinalizing) {
      return (
         <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 fixed inset-0 z-[9999]">
            <div className="max-w-md w-full text-center animate-pulse">
               <div className="relative flex items-center justify-center mb-8">
                  <div className="h-24 w-24 border-4 border-[#3eb7b3]/30 border-t-[#3eb7b3] rounded-full animate-spin" />
                  <ShieldAlert className="absolute h-8 w-8 text-[#3eb7b3]" />
               </div>
               <h2 className="text-2xl font-black text-white mb-3 tracking-wide uppercase">MENGUNCI JAWABAN</h2>
               <p className="text-slate-400 text-sm font-medium">Harap Tunggu. Sedang mengkalkulasi skor akhir dan menutup sesi ujian secara permanen...</p>
               <div className="mt-6 flex justify-center gap-1">
                   <div className="w-2 h-2 bg-[#3eb7b3] rounded-full animate-bounce [animation-delay:-0.3s]" />
                   <div className="w-2 h-2 bg-[#3eb7b3] rounded-full animate-bounce [animation-delay:-0.15s]" />
                   <div className="w-2 h-2 bg-[#3eb7b3] rounded-full animate-bounce" />
               </div>
            </div>
         </div>
      );
   }

   // 0. RENDER: PRE-START (Prayer & Rules Sequence)
   if (isPraying) {
      if (showRules) {
         // PHASE 2: SHOW RULES
         return (
            <div className="min-h-screen bg-[#f0f9fa] flex items-center justify-center p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <Card className="max-w-2xl w-full p-8 md:p-12 text-center rounded-[32px] shadow-[0_30px_60px_-15px_rgba(62,183,179,0.25)] bg-white border-none relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-2 bg-[#3eb7b3]" />

                  <div className="mb-8 inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-[#e7f6fb] text-[#3eb7b3]">
                     <ListChecks className="h-10 w-10" />
                  </div>

                  <h3 className="text-sm uppercase tracking-[0.2em] font-black text-[#3eb7b3] mb-4">Tata Cara & Aturan Ujian</h3>
                  <h2 className="text-2xl font-black text-[#1e293b] mb-8">Harap Diperhatikan!</h2>

                  <div className="space-y-4 text-left mb-10">
                     <div className="flex gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-[#3eb7b3]/30 transition-all">
                        <div className="h-10 w-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center shrink-0 font-black">1</div>
                        <div>
                           <h4 className="font-bold text-[#1e293b]">Dilarang Berpindah Tab</h4>
                           <p className="text-slate-500 text-sm leading-relaxed">Jangan membuka tab browser lain selain halaman ujian ini. Sistem otomatis mencatat setiap perpindahan.</p>
                        </div>
                     </div>
                     
                     <div className="flex gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-[#3eb7b3]/30 transition-all">
                        <div className="h-10 w-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0 font-black">2</div>
                        <div>
                           <h4 className="font-bold text-[#1e293b]">Jangan Menutup Aplikasi</h4>
                           <p className="text-slate-500 text-sm leading-relaxed">Tetaplah di halaman ini sampai tombol 'Selesai & Review' ditekan. Menutup paksa browser dapat membekukan progres Anda.</p>
                        </div>
                     </div>

                     <div className="flex gap-4 p-5 bg-emerald-50 rounded-2xl border border-emerald-100 hover:border-[#3eb7b3]/30 transition-all">
                        <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 font-black">3</div>
                        <div>
                           <h4 className="font-bold text-[#1e293b]">Jujur dan Tawakkal</h4>
                           <p className="text-slate-500 text-sm leading-relaxed">Kejujuran adalah cerminan karakter mulia. Kerjakan semampu Anda, dan serahkan hasilnya hanya pada Allah Ta'ala.</p>
                        </div>
                     </div>
                  </div>

                  <Button
                     className="w-full h-16 rounded-2xl font-black text-lg shadow-lg transition-all duration-300 bg-[#3eb7b3] hover:bg-[#2e9b97] text-white hover:scale-[1.02] flex items-center justify-center gap-3 border-none"
                     onClick={() => {
                        localStorage.setItem(`is_prayed_${participantId}`, "true");
                        setIsPraying(false);
                     }}
                  >
                     SAYA MENGERTI, MULAI UJIAN SEKARANG <ArrowRight className="h-5 w-5" />
                  </Button>
               </Card>
            </div>
         );
      }

      // PHASE 1: PRAYER
      return (
         <div className="min-h-screen bg-[#f0f9fa] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
            <Card className="max-w-2xl w-full p-8 md:p-12 text-center rounded-[32px] shadow-[0_30px_60px_-15px_rgba(62,183,179,0.25)] bg-white border-none relative overflow-hidden">
               <div className="absolute top-0 left-0 right-0 h-2 bg-[#3eb7b3]" />

               <div className="mb-8 inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-[#e7f6fb] text-[#3eb7b3]">
                  <Heart className="h-10 w-10 fill-[#3eb7b3]/20" />
               </div>

               <h3 className="text-sm uppercase tracking-[0.2em] font-black text-[#3eb7b3] mb-4">Mari Sejenak Berdoa</h3>

               <blockquote className="mb-10 px-4">
                  <p className="text-xl md:text-2xl font-bold text-[#1e293b] italic leading-relaxed">
                     "Tidak ada sesuatu yang lebih mulia di sisi Allah Ta'ala daripada Doa."
                  </p>
                  <cite className="block mt-4 text-sm font-bold text-slate-400 not-italic">— Hadits Riwayat At-Tirmidzi</cite>
               </blockquote>

               <div className="p-6 bg-slate-50 rounded-[24px] border border-slate-100 mb-10">
                  <p className="text-slate-600 text-sm font-medium mb-2">Gunakan waktu ini untuk memohon kelancaran.</p>
                  {prayerTime > 0 ? (
                     <div className="text-3xl font-black text-[#1e293b] flex items-center justify-center gap-2 animate-pulse">
                        <Clock className="h-6 w-6 text-[#3eb7b3]" /> {prayerTime}s
                     </div>
                  ) : (
                     <div className="text-lg font-black text-emerald-600 flex items-center justify-center gap-2">
                        <CheckCircle2 className="h-5 w-5" /> Waktu Berdoa Selesai
                     </div>
                  )}
               </div>

               <Button
                  className={cn(
                     "w-full h-14 rounded-2xl font-black text-lg shadow-lg transition-all duration-500 border-none",
                     prayerTime > 0
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                        : "bg-[#3eb7b3] hover:bg-[#2e9b97] text-white hover:scale-[1.02]"
                  )}
                  disabled={prayerTime > 0}
                  onClick={() => setShowRules(true)}
               >
                  {prayerTime > 0 ? `Menyiapkan Sistem (${prayerTime}s)` : "LANJUT KE ATURAN UJIAN"}
               </Button>
            </Card>
         </div>
      );
   }

   // 1. RENDER: FORCE BLOCKED (Violations Exceeded)
   if (forceStop) {
      return (
         <div className="min-h-screen bg-red-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <Card className="max-w-md w-full p-10 text-center rounded-[28px] shadow-2xl border-none bg-white">
               <ShieldAlert className="h-20 w-20 text-red-600 mx-auto mb-6" />
               <h2 className="text-2xl font-[900] text-red-600 uppercase mb-2">Ujian Dihentikan Otomatis</h2>
               <p className="text-[#1e293b] font-medium text-sm mb-8 leading-relaxed">
                  Anda telah melampaui batas maksimal pelanggaran tab ({maxViolations}). Akses ujian telah dikunci dan sistem telah mengirimkan notifikasi pelanggaran berat ke pengawas.
               </p>
               <Button className="w-full bg-red-600 text-white rounded-xl h-12 font-bold" onClick={() => window.location.href = "/"}>Keluar</Button>
            </Card>
         </div>
      );
   }

   // 2. RENDER: SUCCESS COMPLETED (Include Quran Ayat)
   if (isCompleted) {
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

               <Button className="w-full bg-[#1e293b] hover:bg-black rounded-[16px] h-14 font-black text-white shadow-lg transition-all" onClick={() => window.location.href = "/"}>Keluar Halaman</Button>
            </Card>
         </div>
      );
   }

   // 3. RENDER: SUMMARY REVIEW PAGE
   if (isSummaryView) {
      const totalAnswered = Object.values(localAnswers).filter(a => a.answerText !== "").length;
      const totalFlagged = Object.values(localAnswers).filter(a => a.isFlagged).length;

      return (
         <div className="min-h-screen bg-[#f8fafc] p-4 md:p-12 animate-in fade-in slide-in-from-bottom-4">
            <div className="max-w-3xl mx-auto">
               <div className="mb-8 flex items-center justify-between">
                  <h1 className="text-3xl font-[800] text-[#1e293b] flex items-center gap-3">
                     <ListChecks className="h-8 w-8 text-[#3eb7b3]" />
                     Ringkasan Jawaban
                  </h1>
                  <Button variant="ghost" className="font-bold rounded-xl text-slate-500 hover:bg-slate-100 gap-2" onClick={() => setIsSummaryView(false)}>
                     <ArrowLeft className="h-4 w-4" /> Kembali
                  </Button>
               </div>

               <div className="grid grid-cols-3 gap-4 mb-8">
                  <Card className="p-5 bg-white border-none shadow-sm text-center rounded-2xl">
                     <div className="text-sm font-bold text-slate-400 mb-1">Terjawab</div>
                     <div className="text-3xl font-black text-[#3eb7b3]">{totalAnswered}/{questions.length}</div>
                  </Card>
                  <Card className="p-5 bg-white border-none shadow-sm text-center rounded-2xl">
                     <div className="text-sm font-bold text-slate-400 mb-1">Ragu-ragu</div>
                     <div className="text-3xl font-black text-amber-500">{totalFlagged}</div>
                  </Card>
                  <Card className="p-5 bg-white border-none shadow-sm text-center rounded-2xl">
                     <div className="text-sm font-bold text-slate-400 mb-1">Belum Diisi</div>
                     <div className="text-3xl font-black text-red-400">{questions.length - totalAnswered}</div>
                  </Card>
               </div>

               <Card className="bg-white rounded-[24px] shadow-lg border-none p-6 md:p-8 overflow-hidden">
                  <h3 className="font-bold text-[#1e293b] mb-6">Peta Soal:</h3>
                  <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-10 gap-3 mb-10">
                     {questions.map((q, idx) => {
                        const ans = localAnswers[q.id];
                        const isFilled = ans.answerText !== "";
                        const isMarked = ans.isFlagged;
                        return (
                           <button
                              key={q.id}
                              onClick={() => navigateTo(idx)}
                              className={cn(
                                 "h-12 rounded-xl font-bold flex items-center justify-center border-2 transition-all duration-200 relative",
                                 isMarked ? "bg-amber-50 border-amber-400 text-amber-700 shadow-sm" :
                                    isFilled ? "bg-[#3eb7b3] border-[#3eb7b3] text-white" :
                                       "bg-white border-slate-200 text-slate-400 hover:border-[#3eb7b3]"
                              )}
                           >
                              {idx + 1}
                              {isMarked && <span className="absolute -top-1.5 -right-1.5 bg-amber-500 h-3 w-3 rounded-full border-2 border-white" />}
                           </button>
                        )
                     })}
                  </div>

                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 mb-6">
                     <p className="text-slate-600 text-sm font-medium leading-relaxed">
                        🔔 <strong>Perhatian:</strong> Pastikan seluruh butir soal telah terisi dan tidak ada tanda Ragu-ragu tersisa. Tekan tombol di bawah untuk mengunci seluruh jawaban secara permanen.
                     </p>
                  </div>

                  <Button
                     className="bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-[16px] h-14 px-8 flex gap-2 items-center shadow-[0_10px_30px_rgba(5,150,105,0.2)] hover:scale-[1.02] transition-all border-none text-lg"
                     onClick={() => setShowConfirmDialog(true)}
                     disabled={isSaving}
                  >
                     <CheckCircle2 className="h-5 w-5" />
                     Submit Sekarang
                  </Button>

                  {/* MODAL MODERN UNTUK KONFIRMASI SUBMIT FINAL (DALAM SUMMARY VIEW) */}
                  {showConfirmDialog && (
                     <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowConfirmDialog(false)} />
                        <Card className="relative w-full max-w-md bg-white rounded-[32px] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.25)] border-none overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-300">
                           <div className="h-2 bg-[#e11d48]" />
                           <div className="p-8 text-center">
                              <div className="h-16 w-16 rounded-2xl bg-rose-50 text-[#e11d48] flex items-center justify-center mx-auto mb-6">
                                 <ShieldAlert className="h-8 w-8" />
                              </div>

                              <h3 className="text-xl font-[900] text-slate-900 mb-2">Konfirmasi Akhiri Ujian</h3>
                              <p className="text-slate-500 text-sm leading-relaxed mb-8">
                                 Apakah Anda YAKIN ingin mengumpulkan seluruh jawaban sekarang?
                                 <br /><strong className="text-slate-700">Tindakan ini bersifat final dan tidak dapat dibatalkan kembali.</strong>
                              </p>

                              <div className="grid grid-cols-2 gap-4">
                                 <Button
                                    variant="ghost"
                                    className="h-14 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-base transition-all"
                                    onClick={() => setShowConfirmDialog(false)}
                                    disabled={isSaving}
                                 >
                                    Batal
                                 </Button>
                                 <Button
                                    className="h-14 rounded-2xl bg-[#e11d48] hover:bg-rose-700 text-white font-black text-base shadow-lg shadow-rose-200 transition-all hover:scale-[1.02] border-none flex gap-2 items-center justify-center"
                                    onClick={handleFinalSubmit}
                                    disabled={isSaving}
                                 >
                                    {isSaving ? "Memproses..." : "Ya, Kumpulkan"}
                                 </Button>
                              </div>
                           </div>
                        </Card>
                     </div>
                  )}

               </Card>
            </div>
         </div>
      );
   }

   // ================= 4. MAIN RENDERING =================
   return (
      <div className="min-h-screen bg-[#f8fafc] font-sans pb-12 relative flex flex-col md:flex-row">

         {/* CHEAT OVERLAY SYSTEM WARNING */}
         {showCheatOverlay && !forceStop && (
            <div className="fixed inset-0 z-[9999] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-6">
               <Card className="max-w-lg w-full bg-white rounded-[28px] p-8 text-center shadow-2xl border-[5px] border-amber-500">
                  <AlertCircle className="h-16 w-16 text-amber-500 mx-auto mb-4 animate-pulse" />
                  <h3 className="text-2xl font-[900] text-[#1e293b] uppercase mb-2">Peringatan Ketat!</h3>
                  <p className="text-[#475569] font-medium mb-4 leading-relaxed">
                     Terdeteksi upaya meninggalkan layar ujian. Pelanggaran ini telah dicatat otomatis.
                  </p>
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 mb-8 text-center">
                     <span className="text-xs uppercase font-bold text-slate-400 tracking-wider block">Jumlah Pelanggaran</span>
                     <span className="text-4xl font-black text-red-600">{violations} <span className="text-lg text-slate-400">/ {maxViolations}</span></span>
                  </div>
                  <Button
                     className="bg-[#1e293b] hover:bg-black text-white rounded-2xl h-14 font-bold w-full border-none shadow-lg"
                     onClick={() => setShowCheatOverlay(false)}
                  >
                     SAYA MENGERTI, LANJUTKAN
                  </Button>
               </Card>
            </div>
         )}

         {/* LEFT SIDE: QUESTION NAVIGATOR LIST (STICKY ON DESKTOP) */}
         <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-6 md:sticky md:top-0 md:h-screen flex flex-col gap-6 overflow-y-auto z-30 order-2 md:order-1 mt-4 md:mt-0">
            <div>
               <h3 className="font-black text-[#1e293b] text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-[#3eb7b3]" />
                  Peta Materi
               </h3>
               <div className="grid grid-cols-5 md:grid-cols-4 gap-2">
                  {questions.map((q, idx) => {
                     const ans = localAnswers[q.id];
                     const isCurrent = idx === currentIndex;
                     const isFilled = ans?.answerText !== "";
                     const isMarked = ans?.isFlagged;
                     return (
                        <button
                           key={q.id}
                           onClick={() => navigateTo(idx)}
                           disabled={isSaving}
                           className={cn(
                              "h-10 w-full rounded-xl text-xs font-bold border-2 transition-all flex items-center justify-center relative",
                              isCurrent ? "border-[#3eb7b3] bg-[#3eb7b3] text-white shadow-md" :
                                 isMarked ? "border-amber-400 bg-amber-50 text-amber-700" :
                                    isFilled ? "border-[#e7f6fb] bg-[#e7f6fb] text-[#3eb7b3]" :
                                       "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"
                           )}
                        >
                           {idx + 1}
                           {isMarked && !isCurrent && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-500 border border-white" />}
                        </button>
                     );
                  })}
               </div>
            </div>

            <div className="mt-auto pt-6 border-t border-slate-100">
               <div className="text-[11px] font-bold text-slate-400 uppercase mb-2">Batas Toleransi Tab</div>
               <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-1">
                  <div
                     className={cn("h-full transition-all duration-500", violations >= maxViolations ? "bg-red-500" : "bg-amber-400")}
                     style={{ width: `${(violations / maxViolations) * 100}%` }}
                  />
               </div>
               <div className="flex justify-between text-xs font-bold text-slate-500">
                  <span>Pelanggaran:</span>
                  <span className={violations > 0 ? "text-red-500" : ""}>{violations} / {maxViolations}</span>
               </div>
            </div>
         </aside>

         {/* RIGHT SIDE: MAIN QUESTION AREA */}
         <main className="flex-1 flex flex-col relative order-1 md:order-2">
            {/* TOP SYSTEM NAV */}
            <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 flex items-center justify-between px-6 md:px-12">
               <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-[#3eb7b3] text-white flex items-center justify-center font-black rounded-lg text-xs">U</div>
                  <span className="font-black text-[#1e293b] text-sm truncate max-w-[200px] md:max-w-md">{examTitle}</span>
               </div>
               <Button variant="outline" className="rounded-xl h-9 text-xs font-bold border-slate-200 text-slate-600 gap-2 shadow-none hover:bg-slate-50" onClick={() => setIsSummaryView(true)}>
                  Ringkasan Sesi
               </Button>
            </header>

            {/* CONTENT WRAPPER */}
            <div className="p-4 md:p-8 flex-1 flex flex-col max-w-3xl mx-auto w-full">

               <div className="flex items-center justify-between mb-4 text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
                  <span>Nomor {currentIndex + 1} dari {questions.length}</span>
                  {currentQuestion.type === "PG" ? (
                     <span className="text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md">Pilihan Ganda</span>
                  ) : (
                     <span className="text-blue-500 bg-blue-50 px-2 py-1 rounded-md">Essay</span>
                  )}
               </div>

               {/* 💡 THE CORE QUESTION CARD WITH TIMER INSIDE */}
               <Card className="border-none shadow-[0_15px_40px_rgba(0,0,0,0.03)] rounded-[28px] bg-white overflow-hidden flex flex-col flex-1 animate-in slide-in-from-bottom-4">

                  {/* Card Top Info Bar (Moves Timer Here per request) */}
                  <div className="px-8 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                     {/* RAGU-RAGU BUTTON IN CARD HEADER */}
                     <button
                        onClick={toggleFlagLocally}
                        className={cn(
                           "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                           currentAnswer.isFlagged
                              ? "bg-amber-100 border-amber-200 text-amber-700 shadow-sm"
                              : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                        )}
                     >
                        <Bookmark className={cn("h-3.5 w-3.5", currentAnswer.isFlagged ? "fill-amber-600" : "")} />
                        {currentAnswer.isFlagged ? "Ditandai Ragu" : "Ragu-ragu"}
                     </button>

                     {/* ⏱ REALTIMER INSIDE CARD */}
                     <div className={cn(
                        "flex items-center gap-2 px-4 py-1.5 rounded-xl border font-black text-sm shadow-sm",
                        currentTime <= 10 && currentTime > 0 ? "bg-red-50 border-red-200 text-red-600 animate-pulse" :
                           currentTime === 0 ? "bg-slate-100 border-slate-200 text-slate-400" :
                              "bg-white border-[#3eb7b3]/30 text-[#3eb7b3]"
                     )}>
                        <Clock className="h-4 w-4" />
                        <span className="font-mono tracking-wider">
                           {Math.floor(currentTime / 60)}:{String(currentTime % 60).padStart(2, '0')}
                        </span>
                     </div>
                  </div>

                  <div className="p-8 md:p-10 flex-1 overflow-y-auto">
                     {/* TAMPILAN GAMBAR SOAL JIKA ADA */}
                     {(currentQuestion as any).imageUrl && (
                        <div className="mb-6 max-w-full flex justify-center">
                           <div className="relative bg-slate-50 border border-slate-100 p-2 rounded-[24px] shadow-sm inline-block">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                 src={(currentQuestion as any).imageUrl}
                                 alt="Soal Pendukung"
                                 className="rounded-[18px] max-h-[300px] w-auto object-contain shadow-inner"
                              />
                           </div>
                        </div>
                     )}

                     <div className="text-lg md:text-xl font-bold text-[#1e293b] leading-relaxed mb-8 whitespace-pre-wrap">
                        {currentQuestion.content}
                     </div>

                     {/* INTERACTION ZONE */}
                     {currentQuestion.type === "PG" ? (
                        <div className="grid gap-3">
                           {parsedOptions.map((opt: any) => {
                              const isSel = currentAnswer.answerText === opt.label;
                              return (
                                 <label key={opt.label} className={cn(
                                    "flex items-center gap-4 p-5 rounded-[16px] border-2 cursor-pointer transition-all duration-200 relative overflow-hidden group",
                                    isSel ? "border-[#3eb7b3] bg-[#e7f6fb]/40 shadow-sm" : "border-slate-100 hover:border-slate-200 hover:bg-slate-50",
                                    currentTime === 0 && "opacity-70 cursor-not-allowed"
                                 )}>
                                    <input
                                       type="radio" name="opt" className="hidden" value={opt.label}
                                       checked={isSel} onChange={e => currentTime > 0 && setAnswer(e.target.value)}
                                       disabled={currentTime === 0}
                                    />
                                    <div className={cn(
                                       "h-10 w-10 min-w-[40px] rounded-xl flex items-center justify-center font-black text-base transition-colors",
                                       isSel ? "bg-[#3eb7b3] text-white" : "bg-white border border-slate-200 text-slate-400 group-hover:border-slate-300"
                                    )}>
                                       {opt.label}
                                    </div>
                                    <span className={cn("text-[1rem] font-semibold", isSel ? "text-[#1e293b]" : "text-slate-600")}>
                                       {opt.text}
                                    </span>
                                 </label>
                              )
                           })}
                        </div>
                     ) : (
                        <textarea
                           className="w-full min-h-[200px] p-5 rounded-2xl border-2 border-slate-100 focus:border-[#3eb7b3] outline-none focus:ring-4 focus:ring-[#3eb7b3]/5 transition-all font-medium text-[#1e293b]"
                           placeholder="Tulis jawaban essay di sini..."
                           value={currentAnswer.answerText}
                           onChange={e => currentTime > 0 && setAnswer(e.target.value)}
                           disabled={currentTime === 0}
                        />
                     )}

                     {currentTime === 0 && (
                        <div className="mt-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold flex items-center gap-2">
                           <AlertCircle className="h-4 w-4" /> Waktu pengerjaan untuk butir soal ini telah habis. Jawaban terkunci.
                        </div>
                     )}
                  </div>

                  {/* NAVIGATION ACTIONS (BOTTOM BAR) */}
                  <div className="px-8 py-6 border-t border-slate-100 bg-white flex justify-between items-center mt-auto">
                     <Button
                        variant="ghost"
                        className="rounded-xl h-12 px-6 font-bold text-slate-500 gap-2 hover:bg-slate-100"
                        disabled={currentIndex === 0 || isSaving}
                        onClick={() => navigateTo(currentIndex - 1)}
                     >
                        <ArrowLeft className="h-4 w-4" /> Sebelumnya
                     </Button>

                     <Button
                        className="h-12 px-8 rounded-xl bg-[#1e293b] hover:bg-black text-white font-bold shadow-lg flex items-center gap-2 border-none"
                        onClick={handleNext}
                        disabled={isSaving}
                     >
                        {isSaving ? "Menyimpan..." : (currentIndex === questions.length - 1 ? "Selesai & Review" : "Selanjutnya")}
                        {!isSaving && <ArrowRight className="h-4 w-4" />}
                     </Button>
                  </div>

               </Card>
            </div>
         </main>

         {/* MODAL MODERN UNTUK KONFIRMASI SUBMIT FINAL */}
         {showConfirmDialog && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200">
               <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowConfirmDialog(false)} />
               <Card className="relative w-full max-w-md bg-white rounded-[32px] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.25)] border-none overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-300">
                  <div className="h-2 bg-[#e11d48]" />
                  <div className="p-8 text-center">
                     <div className="h-16 w-16 rounded-2xl bg-rose-50 text-[#e11d48] flex items-center justify-center mx-auto mb-6">
                        <ShieldAlert className="h-8 w-8" />
                     </div>

                     <h3 className="text-xl font-[900] text-slate-900 mb-2">Konfirmasi Akhiri Ujian</h3>
                     <p className="text-slate-500 text-sm leading-relaxed mb-8">
                        Apakah Anda YAKIN ingin mengumpulkan seluruh jawaban sekarang?
                        <br /><strong className="text-slate-700">Tindakan ini bersifat final dan tidak dapat dibatalkan kembali.</strong>
                     </p>

                     <div className="grid grid-cols-2 gap-4">
                        <Button
                           variant="ghost"
                           className="h-14 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-base transition-all"
                           onClick={() => setShowConfirmDialog(false)}
                           disabled={isSaving}
                        >
                           Batal
                        </Button>
                        <Button
                           className="h-14 rounded-2xl bg-[#e11d48] hover:bg-rose-700 text-white font-black text-base shadow-lg shadow-rose-200 transition-all hover:scale-[1.02] border-none flex gap-2 items-center justify-center"
                           onClick={handleFinalSubmit}
                           disabled={isSaving}
                        >
                           {isSaving ? (
                              <>
                                 <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                 Memproses...
                              </>
                           ) : "Ya, Kumpulkan"}
                        </Button>
                     </div>
                  </div>
               </Card>
            </div>
         )}
      </div>
   );
}
