import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { CreateExamDialog } from "@/components/admin/CreateExamDialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Presentation, PlusCircle, History, FileCheck, LayoutDashboard } from "lucide-react";
import Link from "next/link";

export const revalidate = 0;

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const exams = await prisma.exam.findMany({
    where: { createdBy: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { questions: true, participants: true } }
    }
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 w-full space-y-10">
      
      {/* Exact .section-header-modern from Source CSS */}
      <div className="relative flex items-center gap-6 mb-12 px-5 py-5 bg-white/40 backdrop-blur-[10px] rounded-[24px] border border-white/60 shadow-sm overflow-hidden">
         {/* Radial ambient highlight background */}
         <div className="absolute -top-[50%] -left-[10%] w-[150px] h-[150px] rounded-full bg-[radial-gradient(circle,_rgba(62,183,179,0.15)_0%,_transparent_70%)] pointer-events-none"></div>
         
         {/* .section-icon-box .icon-toska */}
         <div className="w-16 h-16 rounded-[20px] flex items-center justify-center text-white relative z-10 bg-[linear-gradient(135deg,#3eb7b3_0%,#258f8b_100%)] shadow-[0_12px_24px_-6px_rgba(0,0,0,0.12)]">
            <LayoutDashboard className="h-8 w-8" />
         </div>
         
         {/* .section-text */}
         <div className="text-left z-10 flex-1">
            <h2 className="text-[1.6rem] font-[800] tracking-[-0.03em] leading-[1.2] bg-[linear-gradient(90deg,#1e293b_0%,#475569_100%)] bg-clip-text text-transparent">
              Dasbor Utama
            </h2>
            <p className="text-[0.95rem] text-[#64748b] mt-1 font-medium opacity-80">
              Kelola sesi asesmen dan evaluasi pegawai secara komprehensif.
            </p>
         </div>
         
         {/* The dekor line that fills space in source */}
         <div className="hidden md:block flex-1 h-[1px] bg-[linear-gradient(90deg,#cbd5e1_0%,transparent_100%)] ml-2 opacity-50"></div>

         {/* Action Slot inside header */}
         <div className="z-10">
           <CreateExamDialog />
         </div>
      </div>

      {exams.length === 0 ? (
        <div className="bg-white rounded-[24px] border border-black/[0.04] shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-16 flex flex-col items-center justify-center text-center max-w-3xl mx-auto">
          <div className="h-20 w-20 rounded-[24px] bg-[#e7f6fb] flex items-center justify-center mb-6">
             <Presentation className="h-10 w-10 text-[#3eb7b3]" />
          </div>
          <h2 className="text-xl font-[800] text-[#1e293b] tracking-tight">Belum Ada Sesi Ujian</h2>
          <p className="text-[#64748b] font-medium mt-2 max-w-md mb-8 text-[15px]">Silakan buat sesi ujian baru dengan menekan tombol "Tambah Sesi Baru" di atas.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-[1.2rem] w-full">
          {exams.map((exam) => (
            <Card key={exam.id} className="bg-white rounded-[24px] border border-black/[0.04] shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden transition-all duration-400 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] hover:-translate-y-[2px] border-l-4 border-l-[#3eb7b3]">
              
              {/* Flex Row for Horizontal Module Look consistent with HomePage.css item-row */}
              <div className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                 
                 {/* Left Info Block mirroring header-info from source */}
                 <div className="flex items-center gap-5 flex-1">
                    {/* .header-icon-box.bg-toska equivalent */}
                    <div className="w-14 h-14 min-w-14 rounded-[14px] bg-[#3eb7b3] text-white flex items-center justify-center font-bold shadow-sm">
                       <Presentation className="h-7 w-7" />
                    </div>
                    
                    <div className="flex flex-col items-start gap-1.5 text-left">
                       <h3 className="text-[1.15rem] font-[800] text-[#1e293b] leading-[1.2] m-0">{exam.title}</h3>
                       <div className="flex flex-wrap items-center gap-2">
                          {/* Exact header-subtitle definition from Source Line 503 */}
                          <span className="inline-flex items-center text-[0.75rem] font-[700] text-[#0f766e] bg-[#ccfbf1] px-3 py-1 rounded-[8px] border border-[#99f6e4] shadow-[0_2px_4px_rgba(20,184,166,0.08)]">
                             PIN: {exam.pin}
                          </span>
                          <Badge className={`rounded-full font-bold text-[10px] uppercase px-2.5 py-0.5 ${exam.isActive ? 'bg-[#10b981] text-white hover:bg-[#10b981]' : 'bg-slate-200 text-slate-600 hover:bg-slate-200'}`}>
                             {exam.isActive ? 'Aktif' : 'Draft'}
                          </Badge>
                       </div>
                    </div>
                 </div>

                 {/* Mid Summary Block */}
                 <div className="flex items-center gap-3 w-full md:w-auto md:min-w-[280px]">
                    {/* Accurate row-value-badge style */}
                    <div className="flex-1 bg-white border border-[#e2e8f0] rounded-[12px] p-3 flex flex-col shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
                       <span className="text-[0.7rem] uppercase font-[700] text-[#94a3b8] mb-1">Soal</span>
                       <div className="flex items-center gap-2">
                         <FileCheck className="h-4 w-4 text-[#3eb7b3]" />
                         <span className="text-[1.1rem] font-[800] text-[#3eb7b3]">{exam._count.questions}</span>
                       </div>
                    </div>
                    <div className="flex-1 bg-white border border-[#e2e8f0] rounded-[12px] p-3 flex flex-col shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
                       <span className="text-[0.7rem] uppercase font-[700] text-[#94a3b8] mb-1">Peserta</span>
                       <div className="flex items-center gap-2">
                         <History className="h-4 w-4 text-[#3eb7b3]" />
                         <span className="text-[1.1rem] font-[800] text-[#3eb7b3]">{exam._count.participants}</span>
                       </div>
                    </div>
                 </div>

                 {/* Right Actions Block */}
                 <div className="flex gap-3 w-full md:w-auto">
                    {/* Real action button styling, matching transition and shadow formulas */}
                    <Button asChild className="h-11 flex-1 md:flex-initial px-6 bg-[#3eb7b3] hover:bg-[#2fa29e] text-white font-[700] rounded-[12px] shadow-[0_4px_12px_rgba(62,183,179,0.2)] border-none transition-all duration-300 hover:scale-[1.05] hover:rotate-[1deg]">
                       <Link href={`/admin/exams/${exam.id}`} className="flex items-center gap-2">
                          Kelola Soal
                       </Link>
                    </Button>
                    <Button asChild variant="ghost" className="h-11 flex-1 md:flex-initial px-5 bg-[#f1f5f9] text-[#475569] font-[600] rounded-[12px] transition-all duration-300 hover:scale-[1.05] hover:rotate-[1deg] hover:bg-[#e2e8f0]">
                       <Link href={`/admin/exams/${exam.id}/monitor`} className="flex items-center gap-2">
                          Monitor
                       </Link>
                    </Button>
                 </div>

              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
