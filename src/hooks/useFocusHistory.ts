import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";

export interface DayRecord {
  date: string;   // "YYYY-MM-DD"
  sessions: number;
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

/** Tracks daily completed focus sessions for the heatmap. */
export function useFocusHistory() {
  const [history, setHistory] = useLocalStorage<DayRecord[]>("aetheris_focus_history", []);

  /** Call once every time a focus session completes. */
  const recordSession = useCallback(() => {
    const today = todayStr();
    setHistory((prev) => {
      const existing = prev.find((d) => d.date === today);
      if (existing) {
        return prev.map((d) => d.date === today ? { ...d, sessions: d.sessions + 1 } : d);
      }
      return [...prev, { date: today, sessions: 1 }];
    });
  }, [setHistory]);

  const totalSessions = history.reduce((sum, d) => sum + d.sessions, 0);

  // Streak: count consecutive days (from today backwards) that have >= 1 session
  const streak = (() => {
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split("T")[0];
      if (history.find((r) => r.date === key && r.sessions > 0)) {
        count++;
      } else {
        break;
      }
    }
    return count;
  })();

  const bestDay = history.reduce<DayRecord | null>((best, d) => {
    if (!best || d.sessions > best.sessions) return d;
    return best;
  }, null);

  return { history, recordSession, totalSessions, streak, bestDay };
}
