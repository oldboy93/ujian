"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toggleExamStatus } from "@/app/admin/exams/[id]/actions";
import { Loader2 } from "lucide-react";

interface ExamStatusToggleProps {
  examId: string;
  initialActive: boolean;
}

export function ExamStatusToggle({ examId, initialActive }: ExamStatusToggleProps) {
  const [isPending, startTransition] = useTransition();
  const [active, setActive] = useState(initialActive);

  function handleToggle() {
    startTransition(async () => {
      try {
        await toggleExamStatus(examId, active);
        setActive(!active);
      } catch (err) {
        console.error("Failed to toggle status", err);
      }
    });
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-white border rounded-[12px] shadow-sm">
      <div className="flex items-center space-x-2">
        <Switch 
          id="exam-status" 
          checked={active} 
          onCheckedChange={handleToggle} 
          disabled={isPending}
        />
        <Label htmlFor="exam-status" className="cursor-pointer font-bold text-sm text-[#1e293b]">
          {active ? "Sesi Aktif" : "Sesi Draft"}
        </Label>
      </div>
      {isPending && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
    </div>
  );
}
