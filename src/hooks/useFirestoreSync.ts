"use client";

import { useEffect, useRef, useCallback } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User } from "firebase/auth";
import { Task } from "@/components/TaskList";

interface UserData {
  tasks: Task[];
  timerSettings: {
    focusDuration: number;
    shortBreakDuration: number;
    longBreakDuration: number;
    sessionsUntilLongBreak: number;
  };
  bgId: string;
}

/** Saves user data to Firestore (debounced) */
export function useFirestoreSync(user: User | null) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveData = useCallback(async (data: Partial<UserData>) => {
    if (!user) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      try {
        await setDoc(doc(db, "users", user.uid), data, { merge: true });
      } catch (e) {
        console.warn("Firestore sync failed:", e);
      }
    }, 1500);
  }, [user]);

  /** Loads user data from Firestore on login */
  const loadData = useCallback(async (): Promise<Partial<UserData> | null> => {
    if (!user) return null;
    try {
      const snapshot = await getDoc(doc(db, "users", user.uid));
      if (snapshot.exists()) return snapshot.data() as Partial<UserData>;
    } catch (e) {
      console.warn("Firestore load failed:", e);
    }
    return null;
  }, [user]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { saveData, loadData };
}
