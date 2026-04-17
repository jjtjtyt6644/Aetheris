"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flame, Target, Trophy, Download } from "lucide-react";
import { useFocusHistory, DayRecord } from "@/hooks/useFocusHistory";

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function getColor(sessions: number): string {
  if (sessions === 0) return "bg-white/[0.05]";
  if (sessions <= 2)  return "bg-emerald-900/70";
  if (sessions <= 4)  return "bg-emerald-700/80";
  if (sessions <= 7)  return "bg-emerald-500/90";
  return "bg-emerald-400";
}

function buildGrid(): { date: Date; key: string }[][] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Roll back to start of the week 52 weeks ago
  const start = new Date(today);
  start.setDate(today.getDate() - 363);
  start.setDate(start.getDate() - start.getDay()); // align to Sunday

  const weeks: { date: Date; key: string }[][] = [];
  let cur = new Date(start);

  while (cur <= today) {
    const week: { date: Date; key: string }[] = [];
    for (let d = 0; d < 7; d++) {
      week.push({
        date: new Date(cur),
        key: cur.toISOString().split("T")[0],
      });
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function StatsModal({ isOpen, onClose }: StatsModalProps) {
  const { history, totalSessions, streak, bestDay } = useFocusHistory();

  const weeks = useMemo(() => buildGrid(), []);

  // Index history by date key for O(1) lookup
  const histMap = useMemo(() => {
    const m: Record<string, number> = {};
    history.forEach((r) => { m[r.date] = r.sessions; });
    return m;
  }, [history]);

  // Month label positions: first week index where month changes
  const monthMarkers = useMemo(() => {
    const seen = new Set<number>();
    return weeks.reduce<{ label: string; col: number }[]>((acc, week, col) => {
      const month = week[0].date.getMonth();
      if (!seen.has(month)) {
        seen.add(month);
        acc.push({ label: MONTH_LABELS[month], col });
      }
      return acc;
    }, []);
  }, [weeks]);

  const handleExport = () => {
    const data = {
      tasks: JSON.parse(localStorage.getItem("aetheris_tasks") ?? "[]"),
      settings: JSON.parse(localStorage.getItem("aetheris_timer_settings") ?? "{}"),
      bgId: localStorage.getItem("aetheris_bg_id"),
      focusHistory: JSON.parse(localStorage.getItem("aetheris_focus_history") ?? "[]"),
      completedSessions: Number(localStorage.getItem("aetheris_completed_sessions") ?? 0),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aetheris-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-3xl bg-black/60 border border-white/10 rounded-2xl backdrop-blur-2xl shadow-[0_0_60px_rgba(0,0,0,0.6)] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-lg font-semibold">Focus Statistics</h2>
                <p className="text-xs text-white/40 mt-0.5">Your productivity over the last 12 months</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export JSON
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/50 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-3 gap-4 p-6 pb-4">
              <StatCard
                icon={<Target className="w-5 h-5 text-emerald-400" />}
                label="Total Sessions"
                value={String(totalSessions)}
              />
              <StatCard
                icon={<Flame className="w-5 h-5 text-orange-400" />}
                label="Current Streak"
                value={`${streak} day${streak !== 1 ? "s" : ""}`}
              />
              <StatCard
                icon={<Trophy className="w-5 h-5 text-yellow-400" />}
                label="Best Day"
                value={bestDay ? `${bestDay.sessions} sessions` : "—"}
                sub={bestDay?.date ?? ""}
              />
            </div>

            {/* Heatmap */}
            <div className="px-6 pb-6 overflow-x-auto">
              <div className="min-w-[600px]">
                {/* Month labels */}
                <div className="relative h-5 mb-1" style={{ display: "grid", gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}>
                  {monthMarkers.map(({ label, col }) => (
                    <div
                      key={label}
                      className="absolute text-[10px] text-white/30"
                      style={{ left: `${(col / weeks.length) * 100}%` }}
                    >
                      {label}
                    </div>
                  ))}
                </div>

                {/* Day labels + Grid */}
                <div className="flex gap-1">
                  {/* Day of week labels */}
                  <div className="flex flex-col gap-[3px] mr-1">
                    {["S","M","T","W","T","F","S"].map((d, i) => (
                      <div key={i} className="h-[11px] text-[9px] text-white/20 leading-none flex items-center">
                        {i % 2 === 1 ? d : ""}
                      </div>
                    ))}
                  </div>

                  {/* Weeks */}
                  {weeks.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-[3px]">
                      {week.map(({ key }) => {
                        const sessions = histMap[key] ?? 0;
                        const today = new Date().toISOString().split("T")[0];
                        const isFuture = key > today;
                        return (
                          <div
                            key={key}
                            title={sessions > 0 ? `${key}: ${sessions} session${sessions !== 1 ? "s" : ""}` : key}
                            className={`w-[11px] h-[11px] rounded-sm transition-all ${
                              isFuture ? "opacity-0" : getColor(sessions)
                            }`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-2 mt-3 justify-end">
                  <span className="text-[10px] text-white/30">Less</span>
                  {[0, 2, 4, 6, 9].map((v) => (
                    <div key={v} className={`w-[11px] h-[11px] rounded-sm ${getColor(v)}`} />
                  ))}
                  <span className="text-[10px] text-white/30">More</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
      <div className="flex items-center gap-2 text-white/50">
        {icon}
        <span className="text-xs font-medium uppercase tracking-widest">{label}</span>
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        {sub && <p className="text-xs text-white/30 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
