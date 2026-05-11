"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeySquare, UserCircle, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { joinExam } from "@/app/actions";

export function JoinExamForm() {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        // Memanggil Server Action secara eksplisit agar bisa ditangkap error-nya
        await joinExam(formData);
      } catch (err: any) {
        // Tangkap error NEXT_REDIRECT yang secara teknis dilempar sebagai error internal, 
        // Tapi kita abaikan agar Next.js menghandle redirect naturalnya.
        if (err.message?.includes("NEXT_REDIRECT") || err.digest?.startsWith("NEXT_REDIRECT")) {
          // Biarkan sistem mengalihkan secara internal.
          return;
        }
        
        console.error("Action failed:", err);
        setErrorMessage(err.message || "Terjadi kesalahan koneksi database. Silakan coba lagi.");
      }
    });
  }

  return (
    <div className="relative z-10 w-full">
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-[12px] text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-1">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="pin" className="text-[0.85rem] font-[800] text-[#334155] flex items-center gap-2">
            <KeySquare className="h-3.5 w-3.5 text-[#3eb7b3]" />
            PIN Ujian
          </Label>
          <Input 
            id="pin" 
            name="pin"
            required
            autoComplete="off"
            placeholder="Cth: ABCD12" 
            disabled={isPending}
            className="h-[54px] text-lg font-mono tracking-[0.2em] placeholder:font-sans placeholder:tracking-normal text-center uppercase font-[800] rounded-[16px] border-[#e2e8f0] bg-[#f8fafc] focus:bg-white focus:border-[#3eb7b3] focus:ring-[#3eb7b3]/15 transition-all duration-200" 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="name" className="text-[0.85rem] font-[800] text-[#334155] flex items-center gap-2">
            <UserCircle className="h-3.5 w-3.5 text-[#3eb7b3]" />
            Nama Lengkap
          </Label>
          <Input 
            id="name" 
            name="name"
            required
            disabled={isPending}
            placeholder="Masukkan nama lengkap" 
            className="h-[54px] text-base font-[600] rounded-[16px] border-[#e2e8f0] bg-[#f8fafc] focus:bg-white focus:border-[#3eb7b3] focus:ring-[#3eb7b3]/15 transition-all px-4"
          />
        </div>

        <div className="pt-2">
          <Button 
            type="submit" 
            disabled={isPending}
            className="w-full h-[56px] text-base font-[800] bg-[linear-gradient(135deg,#3eb7b3_0%,#2fa29e_100%)] text-white rounded-[16px] shadow-[0_10px_25px_-5px_rgba(62,183,179,0.4)] border-none transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
          >
            {isPending ? (
               <>
                 <Loader2 className="h-5 w-5 animate-spin" />
                 Memproses...
               </>
            ) : (
               <>
                 Masuk Ruang Ujian
                 <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
               </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
