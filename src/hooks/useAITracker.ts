import { useState, useEffect, useCallback } from "react";
import { auth } from "@/lib/firebase";

export interface AIUsageStats {
  generations: number;
  maxGenerations: number;
  tokensUsed: number;
}

export function useAITracker() {
  const [stats, setStats] = useState<AIUsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      if (!auth.currentUser) {
        setStats(null);
        setLoading(false);
        return;
      }
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/aetheris", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error("Failed to fetch AI stats:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only attempt to fetch if user is logged in natively
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchStats();
      } else {
        setStats(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [fetchStats]);

  return { stats, loading, refreshStats: fetchStats };
}
