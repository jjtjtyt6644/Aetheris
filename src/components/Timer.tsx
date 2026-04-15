"use client";

import { useState, useEffect } from "react";
import { Play, Pause, SkipForward, RotateCcw } from "lucide-react";
import { useTimer, SessionType } from "@/hooks/useTimer";
import { motion, AnimatePresence } from "framer-motion";

export default function Timer() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const {
    formattedTime,
    isActive,
    currentSession,
    settings,
    toggleTimer,
    resetTimer,
    skipSession,
  } = useTimer();

  if (!isMounted) {
    return <div className="h-[400px] w-[500px] opacity-0" />;
  }

  // Animation variants
  const buttonVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
  };

  return (
    <div className="flex flex-col items-center justify-center pt-10">
      
      {/* Session Toggles - StudyWithMe Style */}
      <div className="flex items-center gap-2 p-1.5 glass-panel rounded-full mb-8 shadow-xl bg-black/40 backdrop-blur-xl border border-white/10">
        <SessionTab 
          label="Pomodoro" 
          active={currentSession === "focus"} 
          onClick={() => resetTimer("focus")} 
        />
        <SessionTab 
          label="Short Break" 
          active={currentSession === "shortBreak"} 
          onClick={() => resetTimer("shortBreak")} 
        />
        <SessionTab 
          label="Long Break" 
          active={currentSession === "longBreak"} 
          onClick={() => resetTimer("longBreak")} 
        />
      </div>

      {/* Massive Timer */}
      <div className="flex justify-center items-center h-[160px] overflow-hidden">
        {formattedTime.split("").map((char, index) => (
          <div 
            key={index} 
            className="relative flex justify-center items-center"
            style={{ width: char === ':' ? '40px' : '82px' }}
          >
            <AnimatePresence mode="popLayout">
              <motion.span
                key={char}
                initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -30, filter: "blur(8px)", position: "absolute", left: 'auto', right: 'auto' }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="timer-text block text-[140px] leading-none font-bold tracking-tighter text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.4)]"
              >
                {char}
              </motion.span>
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Huge Main Controls */}
      <div className="flex items-center gap-8 mt-12">
        <motion.button
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
          onClick={() => resetTimer()}
          className="p-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-sm shadow-lg border border-white/10"
          aria-label="Reset Timer"
        >
          <RotateCcw className="w-8 h-8" strokeWidth={1.5} />
        </motion.button>

        <motion.button
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
          onClick={toggleTimer}
          className="w-24 h-24 flex items-center justify-center bg-white text-black rounded-full shadow-[0_0_50px_rgba(255,255,255,0.3)] hover:shadow-[0_0_80px_rgba(255,255,255,0.5)] transition-shadow"
          aria-label={isActive ? "Pause" : "Play"}
        >
          {isActive ? (
            <Pause className="w-10 h-10 fill-black" />
          ) : (
            <Play className="w-10 h-10 fill-black ml-1" />
          )}
        </motion.button>

        <motion.button
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
          onClick={skipSession}
          className="p-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-sm shadow-lg border border-white/10"
          aria-label="Skip Session"
        >
          <SkipForward className="w-8 h-8 fill-current" strokeWidth={1.5} />
        </motion.button>
      </div>

    </div>
  );
}

function SessionTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative px-6 py-2.5 rounded-full text-sm font-medium transition-colors z-10 ${
        active ? "text-black" : "text-white/70 hover:text-white hover:bg-white/10"
      }`}
    >
      {active && (
        <motion.div
          layoutId="active-pill"
          className="absolute inset-0 bg-white rounded-full -z-10 shadow-[0_0_15px_rgba(255,255,255,0.5)]"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      {label}
    </button>
  );
}
