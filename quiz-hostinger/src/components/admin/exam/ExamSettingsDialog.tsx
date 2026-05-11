"use client";

import { useState, useTransition } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings2, Loader2, Save, Trash2, AlertTriangle } from "lucide-react";
import { updateExamSettings, deleteExam } from "@/app/admin/exams/[id]/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ExamSettingsDialogProps {
  examId: string;
  initialTitle: string;
  initialPin: string;
  initialMaxViolations: number;
}

export function ExamSettingsDialog({ 
  examId, 
  initialTitle, 
  initialPin, 
  initialMaxViolations 
}: ExamSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Form state
  const [title, setTitle] = useState(initialTitle);
  const [pin, setPin] = useState(initialPin);
  const [maxViolations, setMaxViolations] = useState(initialMaxViolations);

  const handleSave = () => {
    if (!title || !pin) return;

    startTransition(async () => {
      try {
        await updateExamSettings(examId, { title, pin, maxViolations });
        toast.success("Pengaturan ujian berhasil disimpan!");
        setOpen(false);
      } catch (error: any) {
        toast.error("Gagal menyimpan", { description: error.message || "Gagal menyimpan pengaturan." });
      }
    });
  };

  const handleDelete = () => {
    toast("Peringatan: Hapus Permanen", {
      description: "Apakah Anda YAKIN ingin menghapus sesi ujian ini secara permanen? Seluruh soal dan jawaban tidak dapat dikembalikan.",
      action: {
        label: "Ya, Hapus",
        onClick: () => {
          startTransition(async () => {
            try {
              await deleteExam(examId);
              toast.success("Ujian berhasil dihapus");
              router.push("/admin"); 
            } catch (error) {
              toast.error("Gagal menghapus ujian", { description: "Terjadi kesalahan saat menghapus ujian." });
            }
          });
        }
      },
      cancel: {
        label: "Batal",
        onClick: () => {}
      }
    });
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        render={
          <button className="h-10 w-10 rounded-[12px] border bg-white flex items-center justify-center text-slate-400 hover:text-[#3eb7b3] hover:border-[#3eb7b3] shadow-sm transition-all">
             <Settings2 className="h-4 w-4" />
          </button>
        } 
      />
      
      <DialogContent className="sm:max-w-[480px] rounded-[32px] overflow-hidden border-none shadow-2xl">
        <DialogHeader className="pb-4 border-b border-slate-100 px-2">
          <div className="flex items-center gap-3 mb-1">
             <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                <Settings2 className="h-5 w-5" />
             </div>
             <div>
                <DialogTitle className="text-xl font-black text-[#1e293b]">Konfigurasi Ujian</DialogTitle>
                <DialogDescription className="text-slate-400 font-medium">Kelola metadata dan batasan sesi</DialogDescription>
             </div>
          </div>
        </DialogHeader>

        <div className="py-6 space-y-6 px-2">
           
           <div className="space-y-2">
              <Label htmlFor="set-title" className="text-sm font-bold text-[#1e293b]">Judul Ujian</Label>
              <Input 
                id="set-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Ujian Tengah Semester..."
                className="rounded-xl border-slate-200 font-medium"
                disabled={isPending}
              />
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <Label htmlFor="set-pin" className="text-sm font-bold text-[#1e293b]">PIN Masuk (Wajib Unik)</Label>
                 <Input 
                   id="set-pin"
                   value={pin}
                   onChange={(e) => setPin(e.target.value)}
                   maxLength={10}
                   className="rounded-xl border-slate-200 font-black text-center tracking-widest text-[#3eb7b3]"
                   disabled={isPending}
                 />
              </div>
              <div className="space-y-2">
                 <Label htmlFor="set-violations" className="text-sm font-bold text-[#1e293b]">Batas Pelanggaran</Label>
                 <Input 
                   id="set-violations"
                   type="number"
                   min={1}
                   value={maxViolations}
                   onChange={(e) => setMaxViolations(Number(e.target.value))}
                   className="rounded-xl border-slate-200 font-bold text-center"
                   disabled={isPending}
                 />
              </div>
           </div>

           {/* DANGER ZONE */}
           <div className="mt-6 pt-6 border-t border-dashed border-slate-200">
              <div className="bg-rose-50/50 border border-rose-100 rounded-[20px] p-4 flex flex-col gap-3">
                 <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                       <h4 className="font-black text-rose-700 text-sm">Zona Bahaya</h4>
                       <p className="text-[11px] text-rose-600/80 font-medium leading-relaxed">
                          Menghapus sesi ini akan melenyapkan semua butir soal dan seluruh rekaman jawaban peserta secara permanen.
                       </p>
                    </div>
                 </div>
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   className="w-full justify-center gap-2 bg-white hover:bg-rose-500 hover:text-white text-rose-600 border border-rose-200 rounded-xl font-bold transition-all"
                   onClick={handleDelete}
                   disabled={isPending}
                 >
                    <Trash2 className="h-3.5 w-3.5" />
                    Hapus Sesi Ujian
                 </Button>
              </div>
           </div>

        </div>

        <DialogFooter className="bg-slate-50/80 p-6 mt-0 border-t border-slate-100 gap-3">
           <Button 
             variant="ghost" 
             onClick={() => setOpen(false)} 
             className="rounded-xl font-bold text-slate-500"
             disabled={isPending}
           >
              Batal
           </Button>
           <Button 
             className="bg-[#1e293b] hover:bg-black text-white rounded-xl font-bold px-6 gap-2 shadow-md"
             onClick={handleSave}
             disabled={isPending}
           >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Simpan Perubahan
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
