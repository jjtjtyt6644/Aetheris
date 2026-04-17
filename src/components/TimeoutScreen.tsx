"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ShieldAlert } from "lucide-react";

interface TimeoutScreenProps {
  secsLeft: number;
  violations: number;
}

export default function TimeoutScreen({ secsLeft, violations }: TimeoutScreenProps) {
  const offensesLeft = Math.max(0, 5 - violations);
  const mins = Math.floor(secsLeft / 60);
  const secs = secsLeft % 60;
  const progress = secsLeft / 60; // 1 → 0

  // Block ALL keyboard shortcuts
  useEffect(() => {
    const block = (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === "Escape" || (e.key === "w" && e.ctrlKey) || (e.key === "F4" && e.altKey)) {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", block, true);
    return () => window.removeEventListener("keydown", block, true);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black pointer-events-auto select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(239,68,68,0.12),transparent)] pointer-events-none" />

      {/* Content */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: "spring", damping: 20 }}
        className="relative z-10 flex flex-col items-center gap-6 max-w-sm w-full px-8 text-center"
      >
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
          <ShieldAlert className="w-10 h-10 text-red-400" strokeWidth={1.5} />
        </div>

        {/* Heading */}
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Slow Down</h1>
          <p className="text-sm text-white/50 leading-relaxed">
            We detected unusually rapid activity on your account. For the security of our servers, you have been temporarily restricted.
          </p>
        </div>

        {/* Countdown ring */}
        <div className="relative w-40 h-40">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            {/* Track */}
            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
            {/* Progress */}
            <motion.circle
              cx="60" cy="60" r="52"
              fill="none"
              stroke="rgba(239,68,68,0.8)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 52}`}
              strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress)}`}
              transition={{ duration: 0.9, ease: "linear" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold tabular-nums text-white">
              {mins > 0 ? `${mins}:${String(secs).padStart(2, "0")}` : secs}
            </span>
            <span className="text-xs text-white/40 mt-1">seconds</span>
          </div>
        </div>

        {/* Violation notice */}
        <div className={`w-full p-3 rounded-xl border text-sm ${
          offensesLeft <= 1
            ? "bg-red-900/20 border-red-500/30 text-red-300"
            : "bg-white/5 border-white/10 text-white/50"
        }`}>
          {offensesLeft <= 0 ? (
            <span className="text-red-300 font-medium">⚠️ Next offence will result in a 24-hour ban.</span>
          ) : (
            <span>
              Violation <strong className="text-white">{violations}</strong> of <strong className="text-white">5</strong> — {offensesLeft} more before a 24-hour ban.
            </span>
          )}
        </div>

        <p className="text-xs text-white/30">
          This screen cannot be closed. Please wait for the timer to expire.
        </p>
      </motion.div>

      {/* Scan-line overlay for drama */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,#fff,#fff 1px,transparent 1px,transparent 3px)" }}
      />
    </motion.div>
  );
}
