import { useEffect } from "react";
import { useQuizStore } from "@/store/useQuizStore";

export function useQuizTicker(isEnabled: boolean = true) {
  const activeQuestionId = useQuizStore((s) => s.activeQuestionId);
  const tickActiveTimer = useQuizStore((s) => s.tickActiveTimer);

  useEffect(() => {
    if (!isEnabled || !activeQuestionId) return;

    const interval = setInterval(() => {
      // Optional: Check document.visibilityState here later for anti-cheat
      if (document.visibilityState === "visible") {
        tickActiveTimer();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeQuestionId, isEnabled, tickActiveTimer]);
}
