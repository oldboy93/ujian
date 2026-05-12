"use client";

import React from "react";
import { FileText, Calendar, User, CheckCircle, XCircle, Clipboard } from "lucide-react";

interface ReportAnswer {
  questionId: string;
  answerText: string | null;
  scoreEarned: number;
  isCorrect: boolean;
}

interface ReportQuestion {
  id: string;
  content: string;
  type: string;
  pointCorrect: number;
}

interface ParticipantReportProps {
  examTitle: string;
  examPin: string;
  participantName: string;
  totalScore: number;
  questions: ReportQuestion[];
  answers: ReportAnswer[];
}

export default function ParticipantReportTemplate({ 
  examTitle, 
  examPin, 
  participantName,
  totalScore,
  questions,
  answers
}: ParticipantReportProps) {
  return (
    <div className="report-print-wrapper bg-slate-50 min-h-screen p-0 font-sans">
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
             margin: 0;
             padding: 0;
             background: white !important;
             -webkit-print-color-adjust: exact !important;
             print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden;
          }
          .report-print-wrapper, .report-print-wrapper * {
            visibility: visible;
          }
          .report-print-wrapper {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          .print-page-node {
             width: 210mm;
             padding: 20mm !important;
             margin: 0 auto !important;
             background: white !important;
             box-sizing: border-box;
             border: none !important;
             box-shadow: none !important;
          }
        }
        .web-page-node {
           width: 210mm;
           min-height: 297mm;
           margin: 40px auto;
           background: white;
           box-shadow: 0 10px 30px rgba(0,0,0,0.05);
           padding: 20mm;
           border: 1px solid #e2e8f0;
           border-radius: 12px;
           box-sizing: border-box;
        }
      `}</style>

      <div className="web-page-node print-page-node">
         {/* HEADER */}
         <div className="flex items-center justify-between border-b-4 border-[#1e293b] pb-6 mb-8">
           <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-[#1e293b] text-white rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                 <Clipboard className="w-8 h-8" />
              </div>
              <div>
                 <h1 className="text-2xl font-black text-[#1e293b] tracking-tight leading-none mb-1">LAPORAN HASIL INDIVIDU</h1>
                 <p className="text-slate-500 font-bold text-sm tracking-wide uppercase">
                    {examTitle}
                 </p>
              </div>
           </div>
           <div className="text-right">
              <div className="bg-[#e7f6fb] text-[#3eb7b3] px-4 py-2 rounded-lg font-black border border-[#3eb7b3]/30 text-sm">
                 PIN: {examPin}
              </div>
           </div>
        </div>

         {/* SUMMARY CARD PESERTA */}
         <div className="bg-slate-50 border border-slate-200 rounded-[24px] p-6 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="h-14 w-14 bg-[#1e293b] text-white rounded-2xl flex items-center justify-center border-4 border-white shadow-md">
                  <User className="w-6 h-6" />
               </div>
               <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Peserta</div>
                  <h2 className="text-2xl font-black text-[#1e293b] uppercase tracking-tight">{participantName}</h2>
               </div>
            </div>
            <div className="bg-[#ecfdf5] text-[#047857] border-2 border-[#bbf7d0] rounded-2xl px-8 py-3 text-center flex flex-col">
               <span className="text-[10px] font-black uppercase tracking-wider opacity-80">Skor Akhir</span>
               <span className="text-3xl font-black leading-none mt-1">{Number(totalScore).toFixed(1)}</span>
            </div>
         </div>

         {/* DAFTAR JAWABAN - TABEL PADAT */}
         <div>
            <h3 className="text-sm font-black text-[#1e293b] uppercase tracking-[0.15em] mb-4 pb-2 border-b-2 border-slate-100 flex items-center gap-2">
               Daftar Perolehan Skor Jawaban
            </h3>
            
            <table className="w-full border-collapse">
               <thead>
                  <tr className="bg-slate-100 text-left text-[10px] font-black text-slate-500 uppercase">
                     <th className="border border-slate-200 px-3 py-2 text-center w-12">No</th>
                     <th className="border border-slate-200 px-3 py-2">Jenis Soal</th>
                     <th className="border border-slate-200 px-3 py-2 text-center">Status</th>
                     <th className="border border-slate-200 px-3 py-2 text-right">Nilai Perolehan</th>
                     <th className="border border-slate-200 px-3 py-2 text-right">Nilai Maks</th>
                  </tr>
               </thead>
               <tbody className="text-xs font-medium text-[#1e293b]">
                  {questions.map((q, qIdx) => {
                     const ans = answers.find(a => a.questionId === q.id);
                     
                     return (
                        <tr key={q.id} className="even:bg-slate-50/50 hover:bg-slate-50">
                           <td className="border border-slate-200 px-3 py-2 text-center text-slate-400 font-black">{qIdx + 1}</td>
                           <td className="border border-slate-200 px-3 py-2 font-bold">
                              {q.type === "ESSAY" ? "Essay / Isian" : "Pilihan Ganda"}
                           </td>
                           <td className="border border-slate-200 px-3 py-2 text-center">
                              {ans?.isCorrect ? (
                                 <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600">
                                    <CheckCircle className="w-3 h-3" /> BENAR
                                 </span>
                              ) : (
                                 <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-500">
                                    <XCircle className="w-3 h-3" /> SALAH
                                 </span>
                              )}
                           </td>
                           <td className="border border-slate-200 px-3 py-2 text-right font-black">
                              {Number(ans?.scoreEarned || 0).toFixed(1)}
                           </td>
                           <td className="border border-slate-200 px-3 py-2 text-right text-slate-500">
                              {q.pointCorrect.toFixed(1)}
                           </td>
                        </tr>
                     );
                  })}
               </tbody>
            </table>
         </div>

         {/* FOOTER */}
         <div className="mt-12 border-t border-slate-200 pt-6 flex justify-between items-center text-[10px] text-slate-400">
            <div>Dicetak: {new Date().toLocaleString("id-ID")}</div>
            <div className="font-mono tracking-tighter">Sistem Ujian Mandiri Online</div>
         </div>
      </div>

    </div>
  );
}
