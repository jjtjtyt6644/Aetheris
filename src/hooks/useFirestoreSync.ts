"use client";

import { useEffect, useRef, useCallback, useState } from "react";
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

export function useFirestoreSync(user: User | null) {
  const [isSyncing, setIsSyncing] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveData = useCallback(async (data: Partial<UserData>, immediate = false) => {
    if (!user) return;
    
    const performSync = async () => {
      setIsSyncing(true);
      try {
        await setDoc(doc(db, "users", user.uid), data, { merge: true });
      } catch (e) {
        console.warn("Firestore sync failed:", e);
      } finally {
        setTimeout(() => setIsSyncing(false), 1000); // Keep indicator briefly for UX
      }
    };

    if (immediate) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      await performSync();
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(performSync, 1500);
  }, [user]);

  /** Loads user data from Firestore on login */
  const loadData = useCallback(async (): Promise<Partial<UserData> | null> => {
    if (!user) return null;
    setIsSyncing(true);
    try {
      const snapshot = await getDoc(doc(db, "users", user.uid));
      if (snapshot.exists()) return snapshot.data() as Partial<UserData>;
    } catch (e) {
      console.warn("Firestore load failed:", e);
    } finally {
      setIsSyncing(false);
    }
    return null;
  }, [user]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { saveData, loadData, isSyncing };
}
