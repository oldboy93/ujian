"use client";

import React from "react";
import { Award, Star } from "lucide-react";

interface CertificateProps {
  participantName: string;
  examTitle: string;
  completionDate: string;
  score: string | number;
  examId: string;
  ceoSignatureUrl?: string;
  directorSignatureUrl?: string;
}

export default function CertificateTemplate({
  participantName,
  examTitle,
  completionDate,
  score,
  examId,
  ceoSignatureUrl,
  directorSignatureUrl
}: CertificateProps) {
  return (
    <div className="bg-slate-100 min-h-screen flex items-center justify-center py-8">
      <style jsx global>{`
        @media print {
          @page {
            size: 297mm 210mm !important;
            margin: 0 !important;
          }

          /* Hancurkan semua layout padding/height dari bawaan NextJS agar tidak makan space */
          html, body, #__next, main, div {
            min-height: 0 !important;
          }

          header, footer {
            display: none !important;
          }

          /* Kunci ukuran dan posisi cetak dengan ukuran statis */
          #print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 297mm !important;
            height: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Paksa konten di dalam box sertifikat agar muat sempurna secara internal */
          .cert-content {
             transform: scale(0.95);
             transform-origin: center center;
          }

          
        }
      `}</style>

      {/* TAMPILAN LAYAR: Diberi border dan bayangan */}
      <div id="print-area" className="w-[297mm] h-[210mm] bg-white relative overflow-hidden shadow-2xl border-[24px] border-[#1e293b] flex-shrink-0 mx-auto print:border-[16px]">
        {/* BORDER ORNAMEN LUAR */}
        <div className="absolute inset-3 border-[2px] border-[#3eb7b3] border-dashed opacity-60" />

        {/* BG GRAPHICS */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#3eb7b3]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#1e293b]/10 rounded-full blur-3xl" />

        {/* KONTEN UTAMA */}
        <div className="cert-content absolute inset-6 border-2 border-[#1e293b]/10 flex flex-col items-center justify-center px-16 py-8 text-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] overflow-hidden">

          {/* TANGGAL DITERBITKAN (KANAN ATAS) */}
          <div className="absolute top-2 right-3 text-right z-5">
            <span className="text-slate-400 font-bold text-[9px] tracking-[0.2em] uppercase block mb-1">Tanggal Diterbitkan</span>
            <span className="text-[#1e293b] font-black text-sm tracking-wider">{completionDate}</span>
          </div>

          <div className="flex items-center justify-center mb-6 mt-4 relative">
            <div className="absolute w-24 h-24 bg-[#3eb7b3]/20 rounded-full animate-pulse" />
            <div className="relative bg-[#1e293b] p-5 rounded-full shadow-xl border-[5px] border-[#3eb7b3]">
              <Award className="w-10 h-10 text-[#3eb7b3]" />
            </div>
          </div>

          <h4 className="text-[#3eb7b3] font-black tracking-[0.4em] uppercase text-sm mb-3"></h4>
          <h1 className="text-6xl font-serif italic text-[#1e293b] font-extrabold mb-6 tracking-tight leading-tight">SERTIFIKAT PENGHARGAAN</h1>

          <div className="w-40 h-1.5 bg-[#3eb7b3] mb-8" />

          <p className="text-slate-500 text-xl mb-3 font-medium">Diberikan dengan rasa hormat kepada:</p>
          <h2 className="text-5xl font-black text-[#1e293b] underline decoration-[#3eb7b3]/30 underline-offset-8 mb-8 tracking-wide">
            {participantName}
          </h2>

          <p className="text-slate-600 text-lg max-w-3xl leading-relaxed font-medium px-8">
            Atas partisipasi dan pencapaian luar biasa dalam menyelesaikan ujian kompetensi daring pada mata uji
          </p>
          <p className="text-slate-600 text-lg max-w-3xl leading-relaxed font-medium mb-8 px-8">
            <span className="text-[#1e293b] font-bold italic"> "{examTitle}"</span>.
          </p>

          <div className="bg-[#f8fafc] border border-slate-200 rounded-2xl px-10 py-4 flex items-center gap-8 mb-4 shadow-sm z-10">
            <div id="box-score" className="flex flex-col items-center border-slate-200">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Skor Ujian</span>
              <span className="text-3xl font-black text-[#1e293b]">{Number(score).toFixed(1)}</span>
            </div>
            {/* <div className="flex gap-1.5 text-[#fbbf24]">
              <Star className="fill-current w-6 h-6" />
              <Star className="fill-current w-6 h-6" />
              <Star className="fill-current w-6 h-6" />
              <Star className="fill-current w-6 h-6" />
              <Star className="fill-current w-6 h-6" />
              <Star className="fill-current w-6 h-6" />
              <Star className="fill-current w-6 h-6" />
              <Star className="fill-current w-6 h-6" />
              <Star className="fill-current w-6 h-6" />
            </div> */}
          </div>

          {/* KOLOM TANDA TANGAN (KIRI & KANAN BAWAH) */}
          <div className="flex justify-between w-full px-20 mt-auto pt-2 relative z-10">
            {/* Kiri: CEO */}
            <div className="flex flex-col items-center w-56 relative">
              <span className="text-slate-500 text-[11px] font-bold tracking-[0.15em] mb-2 relative z-20">CEO PT. KBB</span>
              <div className="h-24 flex items-center justify-center mb-1 w-full">
                {ceoSignatureUrl && (
                  <img src={ceoSignatureUrl} alt="Signature CEO" className="absolute h-32 scale-[1.3] object-contain mix-blend-multiply opacity-90 pointer-events-none" />
                )}
              </div>
              <div className="w-full border-b-[2px] border-[#1e293b] mb-2 relative z-20" />
              <span className="text-[#1e293b] font-black text-sm tracking-widest relative z-20">Salman Alfarisyi</span>
            </div>

            {/* Kanan: Direktur */}
            <div className="flex flex-col items-center w-56 relative">
              <span className="text-slate-500 text-[11px] font-bold tracking-[0.15em] mb-2 relative z-20">Direktur RSIA Annisa</span>
              <div className="h-24 flex items-center justify-center mb-1 w-full">
                {directorSignatureUrl && (
                  <img src={directorSignatureUrl} alt="Signature Direktur" className="absolute h-32 scale-[1.3] object-contain mix-blend-multiply opacity-90 pointer-events-none" />
                )}
              </div>
              <div className="w-full border-b-[2px] border-[#1e293b] mb-2 relative z-20" />
              <span className="text-[#1e293b] font-black text-sm tracking-widest relative z-20">dr. Wilmi, MARS</span>
            </div>
          </div>

        </div>
        {/* VERIFIKASI SISTEM (KANAN BAWAH KECIL) */}
        <div className="absolute bottom-5 right-8 text-right z-20">
          <span className="text-[9px] text-slate-400 font-medium uppercase tracking-widest opacity-50">
            System Verification ID: <span className="font-mono font-bold text-slate-500">{examId.substring(0, 8)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
