"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, ShieldCheck, Loader2 } from "lucide-react";
import { ChatMessage } from "@/hooks/useStudyRoom";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: ChatMessage | null;
  onReport: (reason: string) => Promise<boolean>;
}

const REPORT_REASONS = [
  "Spam / Advertising",
  "Harassment / Bullying",
  "Inappropriate Language",
  "Hate Speech",
  "Nudity or Sexual Content",
  "Self-Harm",
  "Other",
];

export default function ReportModal({ isOpen, onClose, message, onReport }: ReportModalProps) {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!message) return;
    setIsSubmitting(true);
    const success = await onReport(reason);
    setIsSubmitting(false);
    
    if (success) {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-[#1a1c23] border border-white/10 rounded-3xl z-[101] overflow-hidden shadow-2xl"
          >
            {isSuccess ? (
              <div className="p-10 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Report Submitted</h3>
                <p className="text-sm text-white/50">Thank you for helping keep Aetheris safe. We will review this snapshot shortly.</p>
              </div>
            ) : (
              <>
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Report Content</h3>
                      <p className="text-[10px] uppercase tracking-wider text-white/30">Evidence Snapshot</p>
                    </div>
                  </div>
                  <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-white/40">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Message Preview */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-white/40 ml-1">Reporting Message:</label>
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-sm text-white/80 italic leading-relaxed">
                      "{message?.text}"
                      <div className="mt-2 pt-2 border-t border-white/5 flex justify-between items-center not-italic">
                        <span className="text-[10px] text-white/20">Sent by: {message?.name}</span>
                        <span className="text-[10px] text-white/20 font-mono">ID: {message?.id.substring(0,8)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Reason Select */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-white/40 ml-1">Reason for Report</label>
                    <div className="grid grid-cols-1 gap-2">
                      {REPORT_REASONS.map((r) => (
                        <button
                          key={r}
                          onClick={() => setReason(r)}
                          className={`text-left px-4 py-3 rounded-xl text-sm transition-all border ${
                            reason === r 
                              ? "bg-indigo-500/20 border-indigo-500 text-white" 
                              : "bg-white/5 border-white/5 text-white/50 hover:bg-white/10"
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Submit Report"
                    )}
                  </button>
                  <p className="text-[10px] text-center text-white/30 leading-relaxed px-4">
                    Snapshots include message content, sender ID, and room metadata. Reports are checked by community moderators.
                  </p>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
