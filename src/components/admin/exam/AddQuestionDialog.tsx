"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PlusCircle, Loader2, Type, ListOrdered, Clock, Trophy, Image as ImageIcon } from "lucide-react";
import { addQuestion } from "@/app/admin/exams/[id]/actions";

export function AddQuestionDialog({ examId }: { examId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<"PG" | "ESSAY">("PG");

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await addQuestion(formData);
        setOpen(false);
      } catch (err) {
        console.error(err);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="h-11 px-6 bg-[#3eb7b3] hover:bg-[#2fa29e] text-white font-[700] rounded-[12px] shadow-[0_4px_12px_rgba(62,183,179,0.2)] border-none transition-all duration-300 hover:scale-[1.05] flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Tambah Soal
          </Button>
        }
      />
      
      <DialogContent className="sm:max-w-[600px] rounded-[24px] overflow-hidden">
        <DialogHeader className="pb-4 border-b border-[#f1f5f9]">
          <DialogTitle className="text-[1.4rem] font-[800] text-[#1e293b] tracking-tight">Buat Butir Soal</DialogTitle>
          <DialogDescription>
            Tentukan isi materi, tipe respons, dan alokasi durasi pengerjaan.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-6 py-4 max-h-[70vh] overflow-y-auto px-1">
          <input type="hidden" name="examId" value={examId} />

          {/* Tipe Soal Selector */}
          <div className="space-y-3">
            <Label className="text-[0.9rem] font-[700] text-[#1e293b]">Tipe Soal</Label>
            <input type="hidden" name="type" value={type} />
            <div className="grid grid-cols-2 gap-3">
               <div 
                 onClick={() => setType("PG")} 
                 className={`cursor-pointer p-4 border rounded-[16px] flex items-center gap-3 transition-all ${type === "PG" ? "border-[#3eb7b3] bg-[#e7f6fb]/40 ring-1 ring-[#3eb7b3]" : "hover:bg-[#f8fafc]"}`}
               >
                 <div className={`p-2 rounded-xl ${type === "PG" ? "bg-[#3eb7b3] text-white" : "bg-slate-100 text-slate-500"}`}>
                    <ListOrdered className="h-5 w-5" />
                 </div>
                 <div>
                    <p className="font-[700] text-[#1e293b] text-sm">Pilihan Ganda</p>
                    <p className="text-[11px] text-slate-400">A, B, C, D mandiri</p>
                 </div>
               </div>
               <div 
                 onClick={() => setType("ESSAY")} 
                 className={`cursor-pointer p-4 border rounded-[16px] flex items-center gap-3 transition-all ${type === "ESSAY" ? "border-[#3eb7b3] bg-[#e7f6fb]/40 ring-1 ring-[#3eb7b3]" : "hover:bg-[#f8fafc]"}`}
               >
                 <div className={`p-2 rounded-xl ${type === "ESSAY" ? "bg-[#3eb7b3] text-white" : "bg-slate-100 text-slate-500"}`}>
                    <Type className="h-5 w-5" />
                 </div>
                 <div>
                    <p className="font-[700] text-[#1e293b] text-sm">Esai Terbuka</p>
                    <p className="text-[11px] text-slate-400">Jawaban teks bebas</p>
                 </div>
               </div>
            </div>
          </div>

          {/* Gambar Pendukung Soal */}
          <div className="space-y-2 bg-slate-50/50 border border-dashed border-slate-200 p-4 rounded-[16px]">
            <Label htmlFor="imageUrl" className="flex items-center gap-2 text-[0.85rem] font-[700] text-[#1e293b]">
              <ImageIcon className="h-4 w-4 text-[#3eb7b3]" />
              Link Gambar Pendukung (Opsional)
            </Label>
            <Input 
              id="imageUrl" 
              name="imageUrl" 
              placeholder="https://link-gambar-anda.com/foto.jpg" 
              className="rounded-[12px] text-sm bg-white" 
            />
            <p className="text-[10px] text-slate-400">Masukkan link/URL gambar (misal dari Supabase, GDrive direct link, dll.) jika ada.</p>
          </div>

          {/* Konten Soal */}
          <div className="space-y-3">
            <Label htmlFor="content" className="text-[0.9rem] font-[700] text-[#1e293b]">Pertanyaan / Instruksi</Label>
            <textarea
              id="content"
              name="content"
              className="flex min-h-[100px] w-full rounded-[12px] border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3eb7b3]/40 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Tuliskan teks soal di sini..."
              required
            />
          </div>

          {/* Config (Durasi & Poin) Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="timeLimitSeconds" className="flex items-center gap-1.5 text-[0.85rem] font-[700] text-[#1e293b]">
                <Clock className="h-3.5 w-3.5 text-[#3eb7b3]" />
                Waktu (Dtk)
              </Label>
              <Input 
                id="timeLimitSeconds" 
                name="timeLimitSeconds" 
                type="number" 
                defaultValue={60} 
                className="rounded-[12px] text-sm" 
                min={5}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pointCorrect" className="flex items-center gap-1.5 text-[0.85rem] font-[700] text-[#1e293b]">
                <Trophy className="h-3.5 w-3.5 text-[#3eb7b3]" />
                Poin Benar
              </Label>
              <Input 
                id="pointCorrect" 
                name="pointCorrect" 
                type="number" 
                step="any"
                defaultValue={1} 
                className="rounded-[12px] text-sm" 
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bonusPerSecond" className="flex items-center gap-1.5 text-[0.85rem] font-[700] text-[#1e293b]">
                <span className="h-3.5 w-3.5 rounded-full bg-[#3eb7b3]/20 text-[#3eb7b3] flex items-center justify-center text-[8px] font-black">+</span>
                Poin/Detik
              </Label>
              <Input 
                id="bonusPerSecond" 
                name="bonusPerSecond" 
                type="number" 
                step="any"
                defaultValue={0} 
                className="rounded-[12px] text-sm" 
                min={0}
              />
            </div>
          </div>

          {/* Opsi Jawaban if Type is PG */}
          {type === "PG" && (
            <div className="space-y-4 p-4 bg-slate-50 rounded-[16px] border border-slate-100 mt-2 animate-in slide-in-from-top-2">
               <Label className="text-[0.9rem] font-[800] text-[#1e293b]">Daftar Pilihan & Kunci Jawaban</Label>
               
               <div className="grid gap-4 mt-2">
                  {['A', 'B', 'C', 'D'].map((opt) => (
                     <div key={opt} className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                           <input 
                             type="radio" 
                             name="correctAnswer" 
                             value={opt} 
                             id={`ans-${opt}`} 
                             required
                             className="accent-[#3eb7b3] h-4 w-4"
                           />
                           <Label htmlFor={`ans-${opt}`} className="font-bold text-[#1e293b] w-6">{opt}</Label>
                        </div>
                        <Input 
                          name={`option${opt}`} 
                          placeholder={`Isi jawaban untuk ${opt}`} 
                          required={type === "PG"}
                          className="rounded-[12px] flex-1 bg-white"
                        />
                     </div>
                  ))}
               </div>
               <p className="text-[11px] text-slate-400 italic mt-1">* Pilih salah satu tombol radio di kiri untuk menetapkan kunci jawaban benar.</p>
            </div>
          )}

          <DialogFooter className="pt-6 border-t border-[#f1f5f9]">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setOpen(false)} 
              disabled={isPending}
              className="rounded-[12px]"
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={isPending}
              className="h-11 px-8 bg-[#3eb7b3] hover:bg-[#2fa29e] text-white font-[700] rounded-[12px] shadow-[0_4px_12px_rgba(62,183,179,0.2)]"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Simpan Soal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
