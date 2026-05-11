"use client";

import { useTransition } from "react";
import { Question } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, Clock, Trophy, ListOrdered, Type, CheckCircle2 } from "lucide-react";
import { deleteQuestion } from "@/app/admin/exams/[id]/actions";
import { EditQuestionDialog } from "./EditQuestionDialog";

import { toast } from "sonner";

interface QuestionListProps {
  questions: Question[];
  examId: string;
}

export function QuestionList({ questions, examId }: QuestionListProps) {
  const [isPending, startTransition] = useTransition();

  async function handleDelete(qId: string) {
    toast("Konfirmasi Hapus", {
      description: "Apakah Anda yakin ingin menghapus butir soal ini?",
      action: {
        label: "Ya, Hapus",
        onClick: () => {
          startTransition(async () => {
            try {
              await deleteQuestion(qId, examId);
              toast.success("Soal berhasil dihapus");
            } catch (err) {
              console.error(err);
              toast.error("Gagal menghapus soal");
            }
          });
        }
      },
      cancel: {
        label: "Batal",
        onClick: () => {}
      }
    });
  }

  if (questions.length === 0) {
    return (
      <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-[24px] p-12 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-[20px] bg-slate-100 text-slate-400 mb-4">
          <ListOrdered className="h-8 w-8" />
        </div>
        <h4 className="text-lg font-bold text-[#1e293b]">Belum ada soal</h4>
        <p className="text-slate-400 text-sm mt-1 mb-4">Klik tombol 'Tambah Soal' untuk menyusun materi evaluasi.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {questions.map((q, index) => {
        // Parsing options safely whether it arrives as object (native Prisma) or string (legacy)
        let parsedOptions: any[] = [];
        try {
          if (q.options) {
            if (typeof q.options === 'string') {
              parsedOptions = JSON.parse(q.options);
            } else {
              parsedOptions = q.options as any[];
            }
          }
        } catch (e) {
          parsedOptions = [];
        }

        return (
          <Card key={q.id} className="bg-white rounded-[20px] border border-black/[0.04] shadow-sm overflow-hidden relative">
            <div className="p-6 md:p-8">
              {/* Header Row */}
              <div className="flex justify-between items-start gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className="h-8 w-8 min-w-8 rounded-lg bg-[#e7f6fb] text-[#3eb7b3] font-[800] text-sm flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-md tracking-wide flex items-center gap-1.5 ${q.type === 'PG' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                      {q.type === 'PG' ? <ListOrdered className="h-3 w-3" /> : <Type className="h-3 w-3" />}
                      {q.type === 'PG' ? 'Pilihan Ganda' : 'Essay'}
                    </span>
                    <span className="text-[11px] font-bold bg-orange-50 text-orange-600 px-2 py-0.5 rounded-md flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {q.timeLimitSeconds} Detik
                    </span>
                    <span className="text-[11px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md flex items-center gap-1.5">
                      <Trophy className="h-3 w-3" />
                      {q.pointCorrect} Poin
                    </span>
                    {(q as any).bonusPerSecond > 0 && (
                      <span className="text-[11px] font-bold bg-teal-50 text-teal-600 px-2 py-0.5 rounded-md flex items-center gap-1.5">
                        <span className="h-3 w-3 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-[7px]">⚡</span>
                        +{(q as any).bonusPerSecond}/dtk
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <EditQuestionDialog examId={examId} question={q} />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDelete(q.id)}
                    disabled={isPending}
                    className="text-slate-300 hover:text-red-500 h-8 w-8 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Visual Image Preview for Admin */}
              {(q as any).imageUrl && (
                <div className="mb-4 inline-block max-w-[200px] relative group">
                   <div className="rounded-xl border border-slate-200 p-1 bg-slate-50 shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-[#3eb7b3]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                         src={(q as any).imageUrl} 
                         alt="Preview Soal" 
                         className="w-full aspect-video object-cover rounded-lg"
                      />
                   </div>
                </div>
              )}

              {/* Question Content */}
              <div className="text-[#1e293b] font-[600] leading-relaxed text-lg mb-6 whitespace-pre-wrap">
                {q.content}
              </div>

              {/* Options List if PG */}
              {q.type === 'PG' && parsedOptions.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {parsedOptions.map((opt: any) => {
                    const isCorrect = opt.label === q.correctAnswer;
                    return (
                      <div 
                        key={opt.label} 
                        className={`p-3.5 rounded-[12px] border flex items-center gap-3 transition-all ${isCorrect ? 'border-[#3eb7b3] bg-[#e7f6fb]/40 shadow-sm' : 'bg-slate-50/50 border-slate-100'}`}
                      >
                        <span className={`h-7 w-7 min-w-7 rounded-full flex items-center justify-center text-xs font-[800] ${isCorrect ? 'bg-[#3eb7b3] text-white' : 'bg-slate-200 text-slate-500'}`}>
                          {opt.label}
                        </span>
                        <span className={`text-sm ${isCorrect ? 'font-[700] text-[#1e293b]' : 'text-slate-600 font-medium'}`}>
                          {opt.text}
                        </span>
                        {isCorrect && <CheckCircle2 className="h-4 w-4 text-[#3eb7b3] ml-auto flex-shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </Card>
        );
      })}
    </div>
  );
}
