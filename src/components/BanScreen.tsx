"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Ban, Mail, Send } from "lucide-react";
import { User } from "firebase/auth";

interface BanScreenProps {
  banExpiresAt: number;
  user: User;
}

function useCountdown(targetMs: number) {
  const [remaining, setRemaining] = useState(Math.max(0, targetMs - Date.now()));
  useEffect(() => {
    const id = setInterval(() => {
      const left = Math.max(0, targetMs - Date.now());
      setRemaining(left);
      if (left <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [targetMs]);
  return remaining;
}

export default function BanScreen({ banExpiresAt, user }: BanScreenProps) {
  const remaining = useCountdown(banExpiresAt);
  const [appealReason, setAppealReason] = useState("");
  const [sent, setSent] = useState(false);

  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);

  // Block keyboard shortcuts
  useEffect(() => {
    const block = (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === "Escape" || (e.key === "w" && e.ctrlKey)) e.preventDefault();
    };
    window.addEventListener("keydown", block, true);
    return () => window.removeEventListener("keydown", block, true);
  }, []);

  const handleSendAppeal = () => {
    const subject = encodeURIComponent(`Aetheris Ban Appeal — ${user.email}`);
    const body = encodeURIComponent(
      `User ID: ${user.uid}\n` +
      `Email: ${user.email}\n` +
      `Display Name: ${user.displayName ?? "N/A"}\n` +
      `Ban Expires: ${new Date(banExpiresAt).toUTCString()}\n\n` +
      `Reason for appeal:\n${appealReason}`
    );
    window.open(`mailto:yaoprox0@gmail.com?subject=${subject}&body=${body}`, "_blank");
    setSent(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black pointer-events-auto select-none overflow-y-auto py-12"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Dark red radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_40%,rgba(127,29,29,0.3),transparent)] pointer-events-none" />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: 0.15, type: "spring", damping: 22 }}
        className="relative z-10 w-full max-w-md px-8 flex flex-col items-center gap-7 text-center"
      >
        {/* Icon */}
        <div className="w-24 h-24 rounded-full bg-red-950/60 border-2 border-red-700/40 flex items-center justify-center">
          <Ban className="w-12 h-12 text-red-500" strokeWidth={1.5} />
        </div>

        {/* Heading */}
        <div>
          <div className="inline-block px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold tracking-widest uppercase mb-3">
            Account Suspended
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-3">
            You've been banned.
          </h1>
          <p className="text-sm text-white/50 leading-relaxed">
            Your account was flagged for repeated abusive write activity. This ban is tied to your user ID and will lift automatically.
          </p>
        </div>

        {/* Countdown */}
        <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-xs text-white/40 uppercase tracking-widest mb-3">Ban lifts in</p>
          <div className="flex items-center justify-center gap-4">
            {[{ val: hours, label: "Hours" }, { val: minutes, label: "Min" }, { val: seconds, label: "Sec" }].map(({ val, label }) => (
              <div key={label} className="flex flex-col items-center">
                <span className="text-4xl font-bold tabular-nums text-white">{String(val).padStart(2, "0")}</span>
                <span className="text-xs text-white/30 mt-1">{label}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-white/30 mt-3">
            Expires {new Date(banExpiresAt).toLocaleString()}
          </p>
        </div>

        {/* Divider */}
        <div className="w-full flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-white/30">Appeal this ban</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Appeal form */}
        {sent ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-3"
          >
            <Mail className="w-5 h-5 flex-shrink-0" />
            Appeal sent to yaoprox0@gmail.com. We'll review it as soon as possible.
          </motion.div>
        ) : (
          <div className="w-full space-y-3">
            <div className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white/40 text-left">
              <span className="text-white/60">Account:</span> {user.email}
              <br />
              <span className="text-white/60">UID:</span> {user.uid}
            </div>

            <textarea
              value={appealReason}
              onChange={(e) => setAppealReason(e.target.value)}
              placeholder="Explain why you believe this ban was issued in error..."
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/30 resize-none transition-colors"
            />

            <button
              onClick={handleSendAppeal}
              disabled={appealReason.trim().length < 10}
              className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/15 text-sm font-medium py-3 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              Send Appeal to Support
            </button>

            <p className="text-xs text-white/25">
              Appeals are reviewed within 24 hours. You will receive a reply at {user.email}.
            </p>
          </div>
        )}

        <p className="text-xs text-red-900/80 select-none">
          This screen cannot be bypassed. The ban is enforced server-side via your user ID.
        </p>
      </motion.div>

      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,#fff,#fff 1px,transparent 1px,transparent 3px)" }}
      />
    </motion.div>
  );
}
