import { useState, useEffect, useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";

export type SessionType = "focus" | "shortBreak" | "longBreak";

interface TimerSettings {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
  autoStartTimer?: boolean;
}

const DEFAULT_SETTINGS: TimerSettings = {
  focusDuration: 25 * 60,
  shortBreakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  sessionsUntilLongBreak: 4,
  autoStartTimer: false,
};

export function useTimer() {
  const [settings] = useLocalStorage<TimerSettings>("aetheris_timer_settings", DEFAULT_SETTINGS);
  const [currentSession, setCurrentSession] = useState<SessionType>("focus");
  const [timeLeft, setTimeLeft] = useState<number>(settings.focusDuration);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [completedFocusSessions, setCompletedFocusSessions] = useLocalStorage<number>("aetheris_completed_sessions", 0);
  
  // Fires for one render cycle when a session completes — used by Timer.tsx for notifications
  const [justCompleted, setJustCompleted] = useState<SessionType | null>(null);

  const resetTimer = useCallback((session: SessionType = currentSession) => {
    setIsActive(false);
    setCurrentSession(session);
    switch (session) {
      case "focus":       setTimeLeft(settings.focusDuration); break;
      case "shortBreak":  setTimeLeft(settings.shortBreakDuration); break;
      case "longBreak":   setTimeLeft(settings.longBreakDuration); break;
    }
  }, [currentSession, settings]);

  const advanceSession = useCallback(() => {
    if (currentSession === "focus") {
      const newCompleted = completedFocusSessions + 1;
      setCompletedFocusSessions(newCompleted);
      setJustCompleted("focus");
      if (newCompleted % settings.sessionsUntilLongBreak === 0) {
        resetTimer("longBreak");
      } else {
        resetTimer("shortBreak");
      }
    } else {
      setJustCompleted(currentSession);
      resetTimer("focus");
    }
    
    if (settings.autoStartTimer) {
      setTimeout(() => setIsActive(true), 100);
    }
  }, [currentSession, completedFocusSessions, settings.sessionsUntilLongBreak, settings.autoStartTimer, resetTimer, setCompletedFocusSessions]);

  const toggleTimer = useCallback(() => setIsActive((prev) => !prev), []);
  const skipSession  = useCallback(() => advanceSession(), [advanceSession]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (isActive && timeLeft === 0) {
      advanceSession();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, advanceSession]);

  // Clear justCompleted after one tick so callers only see it once
  useEffect(() => {
    if (justCompleted !== null) {
      const t = setTimeout(() => setJustCompleted(null), 100);
      return () => clearTimeout(t);
    }
  }, [justCompleted]);

  useEffect(() => {
    if (!isActive) resetTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.focusDuration, settings.shortBreakDuration, settings.longBreakDuration]);

  const formattedTime = `${Math.floor(timeLeft / 60).toString().padStart(2, "0")}:${(timeLeft % 60).toString().padStart(2, "0")}`;

  return {
    timeLeft,
    formattedTime,
    isActive,
    currentSession,
    completedFocusSessions,
    settings,
    justCompleted,
    toggleTimer,
    resetTimer,
    skipSession,
  };
}
