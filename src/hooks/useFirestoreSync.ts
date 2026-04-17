"use client";

import { useRef, useCallback, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User } from "firebase/auth";
import { Task } from "@/components/TaskList";

export interface UserData {
  tasks: Task[];
  timerSettings: {
    focusDuration: number;
    shortBreakDuration: number;
    longBreakDuration: number;
    sessionsUntilLongBreak: number;
  };
  bgId: string;
  /** Unix ms timestamp of the last write — used for conflict resolution. */
  updatedAt: number;
}

export function useFirestoreSync(user: User | null) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Always holds the most recent data snapshot so flushNow() can use it
  const latestDataRef = useRef<Partial<Omit<UserData, "updatedAt">> | null>(null);

  /** Internal: write to Firestore immediately, no debounce */
  const flush = useCallback(
    async (data: Partial<Omit<UserData, "updatedAt">>) => {
      if (!user) return;
      setIsSyncing(true);
      try {
        const payload: Partial<UserData> = { ...data, updatedAt: Date.now() };
        await setDoc(doc(db, "users", user.uid), payload, { merge: true });
        localStorage.setItem("aetheris_updatedAt", String(payload.updatedAt));
        setHasUnsavedChanges(false);
        setLastSyncedAt(Date.now());
      } catch (err) {
        console.warn("[Firestore] save failed:", err);
      } finally {
        setTimeout(() => setIsSyncing(false), 800);
      }
    },
    [user]
  );

  /**
   * Queue a save. Marks unsaved changes immediately.
   * @param immediate  Skip debounce — write right now.
   */
  const saveData = useCallback(
    async (
      data: Partial<Omit<UserData, "updatedAt">>,
      immediate = false
    ): Promise<void> => {
      if (!user) return;
      latestDataRef.current = data;
      setHasUnsavedChanges(true);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (immediate) {
        await flush(data);
      } else {
        debounceRef.current = setTimeout(() => flush(data), 1500);
      }
    },
    [user, flush]
  );

  /**
   * Cancel the pending debounce and write the latest snapshot immediately.
   * Call this on beforeunload / visibilitychange so no data is lost.
   */
  const flushNow = useCallback(async (): Promise<void> => {
    if (!user || !latestDataRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    await flush(latestDataRef.current);
  }, [user, flush]);

  /**
   * Read the user's Firestore document.
   * Re-throws so callers can handle the offline case themselves.
   */
  const loadData = useCallback(async (): Promise<Partial<UserData> | null> => {
    if (!user) return null;
    setIsSyncing(true);
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      return snap.exists() ? (snap.data() as Partial<UserData>) : null;
    } catch (err) {
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, [user]);

  return {
    saveData,
    loadData,
    flushNow,
    isSyncing,
    hasUnsavedChanges,
    lastSyncedAt,
  };
}
