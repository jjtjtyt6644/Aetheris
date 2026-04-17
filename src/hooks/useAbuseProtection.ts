"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User } from "firebase/auth";

/** Writes allowed per sliding window before timeout is triggered */
const MAX_WRITES_PER_WINDOW = 20;
/** Sliding window duration in ms (20 writes in 10 s = clearly automated) */
const WINDOW_MS = 10_000;
/** How long a timeout lasts in seconds */
const TIMEOUT_SECS = 60;
/** Violations before a 24 h ban */
const MAX_VIOLATIONS = 5;
/** Ban length in ms */
const BAN_MS = 24 * 60 * 60 * 1000;

export type AbuseStatus = "ok" | "timeout" | "banned";

export interface AbuseState {
  status: AbuseStatus;
  timeoutSecsLeft: number;
  violations: number;
  banExpiresAt: number | null;
}

export function useAbuseProtection(user: User | null) {
  const [state, setState] = useState<AbuseState>({
    status: "ok",
    timeoutSecsLeft: 0,
    violations: 0,
    banExpiresAt: null,
  });

  // Refs so closures always see the latest values
  const writeLogRef = useRef<number[]>([]);
  const violationsRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const applyingRef = useRef(false);

  // ── Start the client-side countdown timer ────────────────────────────────
  const startTimer = useCallback((secs: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    let remaining = secs;

    setState((prev) => ({ ...prev, status: "timeout", timeoutSecsLeft: remaining }));

    timerRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        setState((prev) => ({ ...prev, status: "ok", timeoutSecsLeft: 0 }));
      } else {
        setState((prev) => ({ ...prev, timeoutSecsLeft: remaining }));
      }
    }, 1000);
  }, []);

  // ── Load existing ban/violation state on login ───────────────────────────
  useEffect(() => {
    if (!user) {
      if (timerRef.current) clearInterval(timerRef.current);
      setState({ status: "ok", timeoutSecsLeft: 0, violations: 0, banExpiresAt: null });
      violationsRef.current = 0;
      return;
    }

    getDoc(doc(db, "users", user.uid))
      .then((snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        const now = Date.now();
        const v = data._violations ?? 0;
        const timeoutUntil: number = data._timeoutUntil ?? 0;
        const banUntil: number = data._banUntil ?? 0;

        violationsRef.current = v;

        if (banUntil > now) {
          setState({ status: "banned", timeoutSecsLeft: 0, violations: v, banExpiresAt: banUntil });
        } else if (timeoutUntil > now) {
          const secsLeft = Math.ceil((timeoutUntil - now) / 1000);
          setState({ status: "timeout", timeoutSecsLeft: secsLeft, violations: v, banExpiresAt: null });
          startTimer(secsLeft);
        } else {
          setState({ status: "ok", timeoutSecsLeft: 0, violations: v, banExpiresAt: null });
        }
      })
      .catch(() => {/* offline — silently skip */});

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [user, startTimer]);

  // ── Persist violation to Firestore and apply UI state ───────────────────
  const applyViolation = useCallback(async () => {
    if (!user || applyingRef.current) return;
    applyingRef.current = true;

    const now = Date.now();
    const newViolations = violationsRef.current + 1;
    violationsRef.current = newViolations;

    const timeoutUntil = now + TIMEOUT_SECS * 1000;
    const isBan = newViolations >= MAX_VIOLATIONS;
    const banUntil = isBan ? now + BAN_MS : 0;

    try {
      await setDoc(
        doc(db, "users", user.uid),
        { _violations: newViolations, _timeoutUntil: timeoutUntil, _banUntil: banUntil },
        { merge: true }
      );
    } catch {
      // Will sync when back online
    }

    if (isBan) {
      if (timerRef.current) clearInterval(timerRef.current);
      setState({ status: "banned", timeoutSecsLeft: 0, violations: newViolations, banExpiresAt: banUntil });
    } else {
      setState((prev) => ({ ...prev, violations: newViolations }));
      startTimer(TIMEOUT_SECS);
    }

    applyingRef.current = false;
  }, [user, startTimer]);

  /**
   * Call this before every Firestore write.
   * Returns `true` if the write is allowed, `false` if rate-limited/banned.
   */
  const checkWrite = useCallback((): boolean => {
    if (!user) return true; // Don't track if not logged in
    
    if (state.status !== "ok") {
      console.log(`[AbuseProtection] Write blocked: current status is ${state.status}`);
      return false;
    }

    const now = Date.now();
    // Remove entries outside the sliding window
    writeLogRef.current = writeLogRef.current.filter((t) => now - t < WINDOW_MS);
    writeLogRef.current.push(now);

    console.log(`[AbuseProtection] Write detected. Count in window: ${writeLogRef.current.length}/${MAX_WRITES_PER_WINDOW}`);

    if (writeLogRef.current.length > MAX_WRITES_PER_WINDOW) {
      console.warn("[AbuseProtection] Threshold reached! Applying violation...");
      writeLogRef.current = [];
      applyViolation();
      return false;
    }

    return true;
  }, [user, state.status, applyViolation]);

  return { ...state, checkWrite };
}
