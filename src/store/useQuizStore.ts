import { create } from "zustand";
import { persist } from "zustand/middleware";

export type QuestionStatus = "SELESAI" | "RAGU" | "KOSONG";

export interface QuizState {
  participantId: string | null;
  examId: string | null;
  activeQuestionId: string | null;
  
  // Mapping question ID -> remaining seconds
  timerMap: Record<string, number>;
  
  // Mapping question ID -> answer data
  answerMap: Record<
    string,
    {
      answerText: string;
      status: QuestionStatus;
    }
  >;

  // Actions
  startQuiz: (participantId: string, examId: string, initialTimerMap: Record<string, number>) => void;
  setActiveQuestion: (questionId: string) => void;
  
  // Tick current active question timer by -1 second
  tickActiveTimer: () => void;
  
  // Update answer for a question
  updateAnswer: (questionId: string, text: string) => void;
  
  // Update flag status for a question (Ragu, Selesai, etc.)
  updateStatus: (questionId: string, status: QuestionStatus) => void;
  
  resetStore: () => void;
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      participantId: null,
      examId: null,
      activeQuestionId: null,
      timerMap: {},
      answerMap: {},

      startQuiz: (participantId, examId, initialTimerMap) => {
        const existingState = get();
        // ONLY initialize if it's a completely new exam/participant
        if (existingState.participantId !== participantId || existingState.examId !== examId) {
          set({
            participantId,
            examId,
            activeQuestionId: Object.keys(initialTimerMap)[0] || null,
            timerMap: initialTimerMap,
            answerMap: Object.keys(initialTimerMap).reduce((acc, qId) => {
              acc[qId] = { answerText: "", status: "KOSONG" };
              return acc;
            }, {} as Record<string, { answerText: string; status: QuestionStatus }>),
          });
        }
      },

      setActiveQuestion: (questionId) => {
        set({ activeQuestionId: questionId });
      },

      tickActiveTimer: () => {
        const { activeQuestionId, timerMap } = get();
        if (!activeQuestionId) return;

        const currentRemaining = timerMap[activeQuestionId] ?? 0;
        
        // Don't go below 0
        if (currentRemaining <= 0) return;

        set((state) => ({
          timerMap: {
            ...state.timerMap,
            [activeQuestionId]: currentRemaining - 1,
          },
        }));
      },

      updateAnswer: (questionId, text) => {
        set((state) => {
          const prev = state.answerMap[questionId] || { status: "KOSONG" };
          return {
            answerMap: {
              ...state.answerMap,
              [questionId]: {
                ...prev,
                answerText: text,
                // Auto switch to RAGU/SELESAI only if we decide so, 
                // but standard behavior lets user toggle status manually
                status: text.trim() === "" ? "KOSONG" : prev.status === "KOSONG" ? "SELESAI" : prev.status,
              },
            },
          };
        });
      },

      updateStatus: (questionId, status) => {
        set((state) => {
          const prev = state.answerMap[questionId] || { answerText: "" };
          return {
            answerMap: {
              ...state.answerMap,
              [questionId]: {
                ...prev,
                status,
              },
            },
          };
        });
      },

      resetStore: () => {
        set({
          participantId: null,
          examId: null,
          activeQuestionId: null,
          timerMap: {},
          answerMap: {},
        });
      },
    }),
    {
      name: "quiz-runtime-storage", // Key in LocalStorage
    }
  )
);
