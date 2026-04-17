"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Code2, Star, Sparkles } from "lucide-react";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="glass-panel relative z-10 w-full max-w-lg overflow-hidden border-white/10 bg-black/50 shadow-[0_0_60px_rgba(0,0,0,0.6)]"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-white/10 transition-colors text-white/50 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="p-8 pb-0">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-5 h-5 text-white/70" />
                <span className="text-xs tracking-[0.35em] uppercase font-medium text-white/50">About This Project</span>
              </div>
              <h2 className="text-4xl font-bold tracking-tight mb-1">Aetheris</h2>
              <p className="text-white/50 text-sm">Aesthetic Pomodoro & Workspace</p>
            </div>

            {/* Divider */}
            <div className="mx-8 my-6 h-px bg-white/10" />

            {/* Creator Card */}
            <div className="px-8 pb-8">
              <div className="flex items-start gap-5 p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                {/* Avatar from GitHub */}
                <img
                  src="https://avatars.githubusercontent.com/jjtjtyt6644"
                  alt="Creator"
                  className="w-16 h-16 rounded-full border-2 border-white/20 flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=A&background=1a1a2e&color=fff&size=64`;
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">Lead Developer & Creator</h3>
                    <span className="text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded-full border border-white/10">Owner</span>
                  </div>
                  <p className="text-sm text-white/50 mb-4 leading-relaxed">
                    Envisioned, designed, and built Aetheris from the ground up — crafting a distraction-free, aesthetically driven productivity workspace for students and creators.
                  </p>
                  <a
                    href="https://github.com/jjtjtyt6644"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors border border-white/10"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
                    @jjtjtyt6644 on GitHub
                    <ExternalLink className="w-3 h-3 opacity-50" />
                  </a>
                </div>
              </div>

              {/* App info */}
              <div className="mt-6 grid grid-cols-3 gap-3">
                <InfoPill icon={<Code2 className="w-4 h-4" />} label="Built with" value="Next.js 16" />
                <InfoPill icon={<Sparkles className="w-4 h-4" />} label="Design" value="Glassmorphism" />
                <InfoPill icon={<Star className="w-4 h-4" />} label="Version" value="v1.0.0" />
              </div>

              {/* Bottom links */}
              <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-white/30">© 2026 Aetheris. All rights reserved.</span>
                <a
                  href="https://github.com/jjtjtyt6644"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-white/40 hover:text-white transition-colors flex items-center gap-1"
                >
                  <svg viewBox="0 0 24 24" className="w-3 h-3" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
                  View on GitHub
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function InfoPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/5 border border-white/10 text-center">
      <span className="text-white/40">{icon}</span>
      <span className="text-[10px] text-white/40 uppercase tracking-wider">{label}</span>
      <span className="text-xs font-medium">{value}</span>
    </div>
  );
}
