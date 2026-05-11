import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, LogIn } from "lucide-react";
import Link from "next/link";
import { JoinExamForm } from "@/components/runner/JoinExamForm";

export default function Home() {

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] font-sans relative overflow-hidden flex flex-col">

      {/* 🎨 AUTHENTIC BACKGROUND SHAPES ANIMATION FROM SOURCE AUTHPage.css */}
      <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-[#3eb7b3]/20 rounded-full blur-[80px] animate-pulse pointer-events-none z-0" />
      <div className="absolute bottom-[-50px] right-[-50px] w-[300px] h-[300px] bg-[#2dd4bf]/15 rounded-full blur-[80px] animate-pulse pointer-events-none z-0" />

      {/* Modern Light Header */}
      <header className="w-full relative z-20 px-6 md:px-12 h-20 flex items-center justify-between border-b border-black/[0.03] bg-white/50 backdrop-blur-[10px]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-white rounded-[10px] flex items-center justify-center shadow-[0_4px_10px_rgba(62,183,179,0.15)] border overflow-hidden">
            <span className="text-[#3eb7b3] font-extrabold text-base">U</span>
          </div>
          <h1 className="font-extrabold tracking-tight text-[#1e293b] text-lg uppercase">.Ujian</h1>
        </div>

        <Button asChild variant="ghost" size="sm" className="font-bold text-[#64748b] hover:text-[#3eb7b3] rounded-[10px] hover:bg-[#e7f6fb] gap-2">
          <Link href="/login">
            <LogIn className="h-4 w-4" />
            Admin Portal
          </Link>
        </Button>
      </header>

      {/* Main Viewport Content */}
      <main className="flex-1 relative z-10 container mx-auto px-4 flex flex-col items-center justify-center py-12">

        <div className="w-full max-w-[1000px] grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* Left Description Column */}
          <div className="lg:col-span-6 flex flex-col space-y-6 text-center lg:text-left animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e7f6fb] text-[#3eb7b3] text-sm font-bold w-fit mx-auto lg:mx-0 shadow-sm border border-[#3eb7b3]/10">
              <GraduationCap className="h-4 w-4" />
              Portal Ujian Kompetensi
            </div>
            <h2 className="text-4xl md:text-5xl font-[800] tracking-[-0.03em] leading-[1.1] text-[#1e293b]">
              Selamat Datang di <br />
              <span className="text-[#3eb7b3]">.Ujian</span>
            </h2>
            <p className="text-base text-[#64748b] font-medium max-w-md mx-auto lg:mx-0 leading-relaxed">
              Silakan persiapkan diri Anda. Masukkan data yang diberikan oleh tim pengawas untuk memulai sesi asesmen resmi RSIA Annisa.
            </p>

            <div className="hidden lg:block relative w-full aspect-[16/9] max-w-[400px] mt-4 overflow-hidden rounded-[24px] shadow-[0_20px_40px_rgba(0,0,0,0.05)] border">
              <img src="/login-illustration.png" alt="Exam Background" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#3eb7b3]/80 via-transparent to-transparent" />
            </div>
          </div>

          {/* Right Form Card Column */}
          <div className="lg:col-span-6 flex justify-center animate-in fade-in slide-in-from-right-8 duration-700 delay-150">
            <div className="w-full max-w-[440px] bg-white rounded-[28px] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.06)] border border-black/[0.02] p-8 md:p-10 relative overflow-hidden">

              {/* Authentic Card Glow */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#3eb7b3]/10 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 mb-8">
                <h3 className="text-2xl font-[800] text-[#1e293b] tracking-tight">Mulai Sesi Ujian</h3>
                <p className="text-sm text-[#94a3b8] font-medium mt-1">Verifikasi identitas dan PIN untuk mengakses materi.</p>
              </div>

              <JoinExamForm />

              <div className="relative z-10 text-center bg-[#f1f5f9]/50 p-3 rounded-[12px] border border-[#f1f5f9] mt-6">
                <p className="text-[11px] text-[#64748b] font-medium leading-relaxed">
                  🔒 Sistem pengawasan anti-cheat aktif. Pastikan Anda tidak berpindah tab selama durasi ujian berlangsung.
                </p>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Authentic Footer Copy */}
      <footer className="py-6 relative z-10 border-t border-black/[0.02] bg-white/40">
        <div className="container mx-auto px-6 flex justify-center items-center">
          <p className="text-sm font-medium text-[#94a3b8]">
            © {new Date().getFullYear()} Rumah Sakit Annisa. Sistem Manajemen Penilaian Terpadu.
          </p>
        </div>
      </footer>
    </div>
  );
}
