import { useState, useEffect, useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";

export type SessionType = "focus" | "shortBreak" | "longBreak";

interface TimerSettings {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
}

const DEFAULT_SETTINGS: TimerSettings = {
  focusDuration: 25 * 60,
  shortBreakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  sessionsUntilLongBreak: 4,
};

export function useTimer() {
  const [settings, setSettings] = useLocalStorage<TimerSettings>("aetheris_timer_settings", DEFAULT_SETTINGS);
  const [currentSession, setCurrentSession] = useState<SessionType>("focus");
  const [timeLeft, setTimeLeft] = useState<number>(settings.focusDuration);
  const [isActive, setIsActive] = useState<boolean>(false);
  
  // Track completed focus sessions for the streak dots and long break logic
  const [completedFocusSessions, setCompletedFocusSessions] = useLocalStorage<number>("aetheris_completed_sessions", 0);

  // Sound effects reference (to be linked later with Howler)
  const [shouldPlayChime, setShouldPlayChime] = useState<boolean>(false);

  const resetTimer = useCallback((session: SessionType = currentSession) => {
    setIsActive(false);
    setCurrentSession(session);
    switch (session) {
      case "focus":
        setTimeLeft(settings.focusDuration);
        break;
      case "shortBreak":
        setTimeLeft(settings.shortBreakDuration);
        break;
      case "longBreak":
        setTimeLeft(settings.longBreakDuration);
        break;
    }
  }, [currentSession, settings]);

  const advanceSession = useCallback(() => {
    setShouldPlayChime(true);
    setTimeout(() => setShouldPlayChime(false), 1000);

    if (currentSession === "focus") {
      const newCompleted = completedFocusSessions + 1;
      setCompletedFocusSessions(newCompleted);

      if (newCompleted % settings.sessionsUntilLongBreak === 0) {
        resetTimer("longBreak");
      } else {
        resetTimer("shortBreak");
      }
    } else {
      // If we finish a break, go back to focus
      resetTimer("focus");
    }
  }, [currentSession, completedFocusSessions, settings.sessionsUntilLongBreak, resetTimer, setCompletedFocusSessions]);

  const toggleTimer = useCallback(() => setIsActive((prev) => !prev), []);
  const skipSession = useCallback(() => advanceSession(), [advanceSession]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      advanceSession();
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, advanceSession]);

  useEffect(() => {
    // If settings change while idle, update the timer
    if (!isActive) resetTimer();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.focusDuration, settings.shortBreakDuration, settings.longBreakDuration]);

  // Format time (MM:SS) for the aesthetic UI
  const formattedTime = `${Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, "0")}:${(timeLeft % 60).toString().padStart(2, "0")}`;

  return {
    timeLeft,
    formattedTime,
    isActive,
    currentSession,
    completedFocusSessions,
    settings,
    shouldPlayChime,
    toggleTimer,
    resetTimer,
    skipSession,
    setSettings,
  };
}
