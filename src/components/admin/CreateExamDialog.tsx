"use client";

import { useState } from "react";
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
import { PlusCircle, Loader2 } from "lucide-react";
import { createExam } from "@/app/admin/actions";

export function CreateExamDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      await createExam(formData);
      setOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="h-11 px-6 bg-[#3eb7b3] hover:bg-[#2fa29e] text-white font-[700] rounded-[12px] shadow-[0_4px_12px_rgba(62,183,179,0.2)] border-none transition-all duration-300 hover:scale-[1.05] active:scale-95 flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Tambah Sesi Baru
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Buat Sesi Ujian</DialogTitle>
          <DialogDescription>
            Masukkan judul ujian. Sistem akan menghasilkan PIN unik secara otomatis.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="title">Judul Ujian</Label>
            <Input
              id="title"
              name="title"
              placeholder="Contoh: Ujian Matematika Semester Genap"
              required
              autoFocus
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxViolations">Batas Toleransi Tab Switch (Anti-Cheat)</Label>
            <Input
              id="maxViolations"
              name="maxViolations"
              type="number"
              min={0}
              defaultValue={3}
              placeholder="Jumlah pelanggaran sebelum otomatis ditolak"
              required
              disabled={loading}
            />
            <p className="text-[11px] text-muted-foreground">Set ke 0 untuk langsung blokir pada pelanggaran pertama.</p>
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Membuat..." : "Buat Sesi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
