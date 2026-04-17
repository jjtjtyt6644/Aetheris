"use client";

import { useCallback } from "react";
import { SessionType } from "./useTimer";

const MESSAGES: Record<SessionType, { title: string; body: string }> = {
  focus: {
    title: "🧠 Focus Time!",
    body: "Time to get to work. Stay locked in.",
  },
  shortBreak: {
    title: "☕ Short Break",
    body: "Great session! Take a 5-minute breather.",
  },
  longBreak: {
    title: "🌿 Long Break",
    body: "Excellent work! Enjoy a longer rest — you earned it.",
  },
};

export function useNotifications() {
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;
    const result = await Notification.requestPermission();
    return result === "granted";
  }, []);

  const notify = useCallback(async (session: SessionType) => {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const { title, body } = MESSAGES[session];

    const n = new Notification(title, {
      body,
      icon: "/logo.png",
      badge: "/logo.png",
      tag: "aetheris-timer", // replaces previous notification instead of stacking
      silent: false,
    });

    // Auto-close after 8 seconds
    setTimeout(() => n.close(), 8000);
  }, []);

  return { requestPermission, notify };
}
