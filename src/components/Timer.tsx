"use client";

import { useState, useEffect } from "react";
import { Play, Pause, SkipForward, RotateCcw, Bell, BellOff, Monitor } from "lucide-react";
import { useTimer } from "@/hooks/useTimer";
import { useWakeLock } from "@/hooks/useWakeLock";
import { useNotifications } from "@/hooks/useNotifications";
import { useFocusHistory } from "@/hooks/useFocusHistory";
import { motion, AnimatePresence } from "framer-motion";
import { useStudyRoom } from "@/hooks/useStudyRoom";
import { useAuth } from "@/contexts/AuthContext";

interface TimerProps {
  studyRoom?: ReturnType<typeof useStudyRoom>;
}

export default function Timer({ studyRoom }: TimerProps) {
  const { user } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const { formattedTime, isActive, currentSession, justCompleted, toggleTimer, resetTimer, skipSession } = useTimer();
  const { isHeld: wakeLockHeld, request: requestWakeLock, release: releaseWakeLock } = useWakeLock();
  const { requestPermission, notify } = useNotifications();
  const { recordSession } = useFocusHistory();

  const [notifEnabled, setNotifEnabled] = useState(false);

  // Check initial notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifEnabled(Notification.permission === "granted");
    }
  }, []);

  // Acquire/release wake lock based on timer state
  useEffect(() => {
    if (isActive) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
  }, [isActive, requestWakeLock, releaseWakeLock]);



  // Sync to Study Room Status (Independent)
  const { completedFocusSessions } = useTimer(); // get raw hook values
  useEffect(() => {
    if (!studyRoom?.roomId) return;
    studyRoom.syncTimerStatus(isActive, currentSession, completedFocusSessions, user?.displayName || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, currentSession, completedFocusSessions, studyRoom?.roomId, user?.displayName]);

  // Fire notification + record history on session complete
  useEffect(() => {
    if (!justCompleted) return;
    if (justCompleted === "focus") {
      recordSession();
    }
    if (notifEnabled) {
      // Notify with the NEXT session type (what's coming up)
      const nextSession =
        justCompleted === "focus"
          ? currentSession // already advanced by useTimer
          : "focus";
      notify(nextSession);
    }
  }, [justCompleted, notifEnabled, currentSession, notify, recordSession]);

  const handleToggleNotifications = async () => {
    if (notifEnabled) {
      setNotifEnabled(false);
    } else {
      const granted = await requestPermission();
      setNotifEnabled(granted);
    }
  };

  if (!isMounted) return <div className="h-[400px] w-[500px] opacity-0" />;

  const buttonVariants = { hover: { scale: 1.05 }, tap: { scale: 0.95 } };

  return (
    <div className="flex flex-col items-center justify-center pt-10">
      {/* Session Toggles */}
      <div className="flex items-center gap-2 p-1.5 glass-panel rounded-full mb-8 shadow-xl bg-black/40 backdrop-blur-xl border border-white/10">
        <SessionTab label="Pomodoro"    active={currentSession === "focus"}      onClick={() => resetTimer("focus")} />
        <SessionTab label="Short Break" active={currentSession === "shortBreak"} onClick={() => resetTimer("shortBreak")} />
        <SessionTab label="Long Break"  active={currentSession === "longBreak"}  onClick={() => resetTimer("longBreak")} />
      </div>

      {/* Massive Timer */}
      <div className="flex justify-center items-center h-[160px] overflow-hidden">
        {formattedTime.split("").map((char, index) => (
          <div
            key={index}
            className="relative flex justify-center items-center"
            style={{ width: char === ":" ? "40px" : "82px" }}
          >
            <AnimatePresence mode="popLayout">
              <motion.span
                key={char}
                initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -30, filter: "blur(8px)", position: "absolute" }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="timer-text block text-[140px] leading-none font-bold tracking-tighter text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.4)]"
              >
                {char}
              </motion.span>
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Main Controls */}
      <div className="flex items-center gap-8 mt-12">
        <motion.button variants={buttonVariants} whileHover="hover" whileTap="tap"
          onClick={() => resetTimer()}
          className="p-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-sm shadow-lg border border-white/10"
          aria-label="Reset Timer"
        >
          <RotateCcw className="w-8 h-8" strokeWidth={1.5} />
        </motion.button>

        <motion.button variants={buttonVariants} whileHover="hover" whileTap="tap"
          onClick={toggleTimer}
          className="w-24 h-24 flex items-center justify-center bg-white text-black rounded-full shadow-[0_0_50px_rgba(255,255,255,0.3)] hover:shadow-[0_0_80px_rgba(255,255,255,0.5)] transition-shadow"
          aria-label={isActive ? "Pause" : "Play"}
        >
          {isActive ? <Pause className="w-10 h-10 fill-black" /> : <Play className="w-10 h-10 fill-black ml-1" />}
        </motion.button>

        <motion.button variants={buttonVariants} whileHover="hover" whileTap="tap"
          onClick={skipSession}
          className="p-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-sm shadow-lg border border-white/10"
          aria-label="Skip Session"
        >
          <SkipForward className="w-8 h-8 fill-current" strokeWidth={1.5} />
        </motion.button>
      </div>

      {/* Status row: Notification toggle + Wake Lock indicator */}
      <div className="flex items-center gap-4 mt-8">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleToggleNotifications}
          title={notifEnabled ? "Disable notifications" : "Enable notifications"}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all border ${
            notifEnabled
              ? "bg-white/10 border-white/20 text-white"
              : "bg-transparent border-white/10 text-white/40 hover:text-white/70"
          }`}
        >
          {notifEnabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
          {notifEnabled ? "Notifications on" : "Notifications off"}
        </motion.button>

        {wakeLockHeld && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-white/5 border border-white/10 text-white/40"
          >
            <Monitor className="w-3.5 h-3.5" />
            Screen awake
          </motion.div>
        )}
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
