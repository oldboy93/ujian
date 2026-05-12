"use client";

import React from "react";
import { FileText, Calendar, Users, AlertCircle } from "lucide-react";

interface ReportParticipant {
  name: string;
  status: string;
  violations: number;
  totalScore: number;
}

interface ReportProps {
  examTitle: string;
  examPin: string;
  createdAt: string;
  participants: ReportParticipant[];
  maxViolations: number;
}

export default function ReportTemplate({ 
  examTitle, 
  examPin, 
  createdAt, 
  participants,
  maxViolations
}: ReportProps) {
  const sortedParticipants = [...participants].sort((a, b) => b.totalScore - a.totalScore);
  const averageScore = participants.length > 0 
    ? participants.reduce((acc, curr) => acc + Number(curr.totalScore), 0) / participants.length
    : 0;

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
             min-height: 297mm;
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
        {/* HEADER LAPORAN */}
        <div className="flex items-center justify-between border-b-4 border-[#1e293b] pb-6 mb-8">
           <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-[#1e293b] text-white rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                 <FileText className="w-8 h-8" />
              </div>
              <div>
                 <h1 className="text-2xl font-black text-[#1e293b] tracking-tight leading-none mb-1">LAPORAN REKAPITULASI HASIL UJIAN</h1>
                 <p className="text-slate-500 font-bold text-sm tracking-wide uppercase">
                    Sistem Ujian Daring Mandiri
                 </p>
              </div>
           </div>
           <div className="text-right">
              <div className="bg-[#e7f6fb] text-[#3eb7b3] px-4 py-2 rounded-lg font-black border border-[#3eb7b3]/30 text-sm">
                 PIN: {examPin}
              </div>
           </div>
        </div>

        {/* INFORMASI UMUM */}
        <div className="grid grid-cols-3 gap-4 mb-10">
           <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="text-slate-400 text-[10px] font-black uppercase mb-1 flex items-center gap-1">
                 <Calendar className="w-3 h-3" /> Mata Ujian
              </div>
              <div className="text-slate-900 font-bold text-base truncate">{examTitle}</div>
           </div>
           <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="text-slate-400 text-[10px] font-black uppercase mb-1 flex items-center gap-1">
                 <Users className="w-3 h-3" /> Total Peserta
              </div>
              <div className="text-slate-900 font-bold text-base">{participants.length} Orang</div>
           </div>
           <div className="bg-[#1e293b] p-4 rounded-xl shadow-md text-center">
              <div className="text-white/60 text-[10px] font-black uppercase mb-0.5">
                 Rata-Rata Skor
              </div>
              <div className="text-white font-black text-xl leading-none">{averageScore.toFixed(1)}</div>
           </div>
        </div>

        {/* TABEL DATA */}
        <div className="mb-10">
           <h3 className="text-xs font-black text-[#1e293b] uppercase tracking-[0.15em] mb-4 pb-2 border-b-2 border-slate-100 flex items-center gap-2">
              Daftar Peringkat Kelulusan Peserta
           </h3>
           <table className="w-full border-collapse text-xs">
              <thead>
                 <tr className="bg-slate-100 text-left">
                    <th className="border border-slate-200 px-3 py-2 font-black text-slate-600 uppercase w-10 text-center">No</th>
                    <th className="border border-slate-200 px-3 py-2 font-black text-slate-600 uppercase">Nama Lengkap</th>
                    <th className="border border-slate-200 px-3 py-2 font-black text-slate-600 uppercase text-center">Status</th>
                    <th className="border border-slate-200 px-3 py-2 font-black text-slate-600 uppercase text-center">Pelanggaran</th>
                    <th className="border border-slate-200 px-3 py-2 font-black text-slate-600 uppercase text-right bg-slate-200/50 w-24">Skor Akhir</th>
                 </tr>
              </thead>
              <tbody>
                 {sortedParticipants.map((p, i) => {
                    const isFailed = p.violations >= maxViolations;
                    return (
                       <tr key={i} className="hover:bg-slate-50">
                          <td className="border border-slate-200 px-3 py-2.5 text-center font-bold text-slate-500">{i + 1}</td>
                          <td className="border border-slate-200 px-3 py-2.5 font-bold text-slate-900 uppercase">{p.name}</td>
                          <td className="border border-slate-200 px-3 py-2.5 text-center">
                             <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${p.status === "SUBMITTED" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
                                {p.status === "SUBMITTED" ? "SELESAI" : "PROSES"}
                             </span>
                          </td>
                          <td className="border border-slate-200 px-3 py-2.5 text-center">
                             <span className={`font-bold ${isFailed ? "text-rose-600" : "text-slate-500"}`}>
                                {p.violations}
                             </span>
                          </td>
                          <td className="border border-slate-200 px-3 py-2.5 text-right font-black text-[#1e293b] bg-slate-50/50">
                             {Number(p.totalScore).toFixed(1)}
                          </td>
                       </tr>
                    )
                 })}
              </tbody>
           </table>
        </div>

        {/* SIGNATURE / TIMESTAMP FOOTER */}
        <div className="mt-auto flex justify-between items-end pt-20">
           <div>
              <p className="text-slate-400 italic text-[10px]">Dicetak secara otomatis oleh sistem.</p>
              <p className="text-slate-500 font-bold text-[10px]">{new Date().toLocaleString("id-ID")}</p>
           </div>
           <div className="text-center flex flex-col items-center">
              <p className="text-slate-900 font-bold text-xs mb-14">Penanggung Jawab / Admin</p>
              <div className="w-32 border-b border-[#1e293b]" />
              <p className="text-slate-500 font-medium text-[9px] mt-1">( Tanda Tangan )</p>
           </div>
        </div>
      </div>
    </div>
  );
}
