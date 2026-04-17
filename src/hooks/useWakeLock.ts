"use client";

import { useEffect, useRef, useCallback, useState } from "react";

/** Prevents the screen from sleeping while a focus session is active. */
export function useWakeLock() {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const [isHeld, setIsHeld] = useState(false);

  const request = useCallback(async () => {
    if (!("wakeLock" in navigator)) return; // Browser doesn't support it
    try {
      wakeLockRef.current = await navigator.wakeLock.request("screen");
      setIsHeld(true);
      wakeLockRef.current.addEventListener("release", () => {
        setIsHeld(false);
      });
    } catch {
      // Silently fail (document hidden, low battery, etc.)
    }
  }, []);

  const release = useCallback(async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
      setIsHeld(false);
    }
  }, []);

  // Re-acquire when tab becomes visible again (browser releases it on hide)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && !wakeLockRef.current && isHeld) {
        request();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [isHeld, request]);

  return { isHeld, request, release };
}
