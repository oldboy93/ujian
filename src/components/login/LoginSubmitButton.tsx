"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function LoginSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button 
      type="submit" 
      disabled={pending}
      className="w-full h-[52px] rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-base tracking-wide mt-4 shadow-md shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
    >
      {pending ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Memvalidasi...
        </>
      ) : (
        "Masuk"
      )}
    </Button>
  );
}
