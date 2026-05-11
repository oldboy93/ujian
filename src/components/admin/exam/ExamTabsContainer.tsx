"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ListChecks, UsersRound } from "lucide-react";

interface ExamTabsContainerProps {
  questionsContent: React.ReactNode;
  participantsContent: React.ReactNode;
  participantCount: number;
  questionCount: number;
}

export function ExamTabsContainer({ 
  questionsContent, 
  participantsContent,
  participantCount,
  questionCount
}: ExamTabsContainerProps) {
  return (
    <Tabs defaultValue="questions" className="w-full">
      <div className="border-b border-slate-100 mb-8">
        <TabsList className="h-12 bg-transparent p-0 gap-6 flex justify-start">
          <TabsTrigger 
            value="questions" 
            className="h-12 rounded-none bg-transparent border-b-2 border-transparent px-2 pb-3 pt-2 font-bold text-slate-400 data-[state=active]:border-[#3eb7b3] data-[state=active]:text-[#3eb7b3] data-[state=active]:shadow-none transition-all hover:text-slate-600 flex items-center gap-2"
          >
            <ListChecks className="h-4 w-4" />
            Daftar Soal
            <span className="ml-1 bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0.5 rounded-md font-bold data-[state=active]:bg-[#e7f6fb]">
               {questionCount}
            </span>
          </TabsTrigger>
          <TabsTrigger 
            value="participants" 
            className="h-12 rounded-none bg-transparent border-b-2 border-transparent px-2 pb-3 pt-2 font-bold text-slate-400 data-[state=active]:border-[#3eb7b3] data-[state=active]:text-[#3eb7b3] data-[state=active]:shadow-none transition-all hover:text-slate-600 flex items-center gap-2"
          >
            <UsersRound className="h-4 w-4" />
            Hasil Peserta
            <span className="ml-1 bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0.5 rounded-md font-bold">
               {participantCount}
            </span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="questions" className="mt-0 border-none p-0 bg-transparent focus-visible:ring-0">
         {questionsContent}
      </TabsContent>

      <TabsContent value="participants" className="mt-0 border-none p-0 bg-transparent focus-visible:ring-0">
         {participantsContent}
      </TabsContent>
    </Tabs>
  );
}
