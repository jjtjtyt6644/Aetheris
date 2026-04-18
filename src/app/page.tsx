"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Wallpaper, { BACKGROUNDS } from "@/components/Wallpaper";
import Timer from "@/components/Timer";
import TaskList from "@/components/TaskList";
import SettingsModal from "@/components/SettingsModal";
import AboutModal from "@/components/AboutModal";
import {
  Settings,
  Image as ImageIcon,
  Music,
  CheckSquare,
  Info,
  User,
  Cloud,
  Loader2,
  Check,
  BarChart2,
  Users,
  BookOpen,
  Moon,
  Circle,
} from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useAuth } from "@/contexts/AuthContext";
import { useFirestoreSync } from "@/hooks/useFirestoreSync";
import { useAbuseProtection } from "@/hooks/useAbuseProtection";
import { useStudyRoom } from "@/hooks/useStudyRoom";
import { Task } from "@/components/TaskList";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import TimeoutScreen from "@/components/TimeoutScreen";
import BanScreen from "@/components/BanScreen";
import StatsModal from "@/components/StatsModal";
import AetherisModal from "@/components/AetherisModal";
import StudyRoomDrawer from "@/components/StudyRoomDrawer";
import { Sparkles } from "lucide-react";

const DEFAULT_SETTINGS = {
  focusDuration: 25 * 60,
  shortBreakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  sessionsUntilLongBreak: 4,
};

type SyncState = "idle" | "loading" | "ready";

export default function Home() {
  const { user } = useAuth();

  const [bgId, setBgId] = useLocalStorage("aetheris_bg_id", BACKGROUNDS[0].id);
  const [tasks, setTasks] = useLocalStorage<Task[]>("aetheris_tasks", []);
  const [settings, setSettings] = useLocalStorage(
    "aetheris_timer_settings",
    DEFAULT_SETTINGS
  );

  const {
    isSyncing,
    saveData,
    loadData,
    flushNow,
    hasUnsavedChanges,
    lastSyncedAt,
  } = useFirestoreSync(user);
  const [syncState, setSyncState] = useState<SyncState>("idle");

  // Abuse / rate-limit protection
  const { status: abuseStatus, timeoutSecsLeft, violations, banExpiresAt, checkWrite } = useAbuseProtection(user);

  // Stable refs so effects can read latest state without re-running
  const tasksRef = useRef(tasks);
  const settingsRef = useRef(settings);
  const bgIdRef = useRef(bgId);
  useEffect(() => { tasksRef.current = tasks; }, [tasks]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { bgIdRef.current = bgId; }, [bgId]);

  // ─── 1. Initial sync on login ────────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setSyncState("idle");
      return;
    }

    setSyncState("loading");

    (async () => {
      try {
        const cloudData = await loadData();

        if (!cloudData) {
          await saveData(
            { tasks: tasksRef.current, timerSettings: settingsRef.current, bgId: bgIdRef.current },
            true
          );
        } else {
          const cloudTs = cloudData.updatedAt ?? 0;
          const localTs = Number(localStorage.getItem("aetheris_updatedAt") ?? "0");

          if (cloudTs > localTs) {
            if (cloudData.bgId) setBgId(cloudData.bgId);
            if (cloudData.tasks) setTasks(cloudData.tasks);
            if (cloudData.timerSettings) setSettings(cloudData.timerSettings);
            localStorage.setItem("aetheris_updatedAt", String(cloudTs));
          } else {
            await saveData(
              { tasks: tasksRef.current, timerSettings: settingsRef.current, bgId: bgIdRef.current },
              true
            );
          }
        }
      } catch (err: any) {
        if (err?.code === "unavailable") {
          console.log("[Sync] Firestore offline — continuing with local data.");
        } else {
          console.warn("[Sync] Initial sync error:", err);
        }
      } finally {
        setSyncState("ready");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ─── 2. Auto-save on data change ─────────────────────────────────────────
  useEffect(() => {
    if (!user || syncState !== "ready") return;
    if (!checkWrite()) return; // rate-limit / ban gate
    localStorage.setItem("aetheris_updatedAt", String(Date.now()));
    saveData({ tasks, timerSettings: settings, bgId }, true); // instant upload
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, settings, bgId]);

  // ─── 3. Flush on page close / tab hide ───────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const handleBeforeUnload = () => {
      // flushNow is async but beforeunload is synchronous —  we fire and forget.
      // The browser gives a brief grace period for fetch/XHR initiated here.
      flushNow();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushNow();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user, flushNow]);

  // ─── 4. Manual sync from Account panel ───────────────────────────────────
  const handleManualSync = useCallback(async () => {
    await flushNow();
  }, [flushNow]);

  // ─── UI state ─────────────────────────────────────────────────────────────
  const [showTasks, setShowTasks] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showAetheris, setShowAetheris] = useState(false);
  const [showStudyRoom, setShowStudyRoom] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  // ─── Study Room ───────────────────────────────────────────────────────────
  const studyRoom = useStudyRoom(user?.uid);
  const [activeSettingsTab, setActiveSettingsTab] = useState<
    "general" | "scenes" | "mixer" | "account"
  >("general");

  const openSettings = (tab: "general" | "scenes" | "mixer" | "account") => {
    setActiveSettingsTab(tab);
    setShowSettings(true);
  };

  return (
    <main className="relative w-full h-screen overflow-hidden text-white font-sans">
      {/* Abuse protection overlays — rendered above everything */}
      {abuseStatus === "timeout" && (
        <TimeoutScreen secsLeft={timeoutSecsLeft} violations={violations} />
      )}
      {abuseStatus === "banned" && user && banExpiresAt && (
        <BanScreen banExpiresAt={banExpiresAt} user={user} />
      )}
      <Wallpaper currentBgId={bgId} />

      <AetherisModal isOpen={showAetheris} onClose={() => setShowAetheris(false)} />
      <StatsModal isOpen={showStats} onClose={() => setShowStats(false)} />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        initialTab={activeSettingsTab}
        currentBgId={bgId}
        onBgChange={setBgId}
        onManualSync={handleManualSync}
        isSyncing={isSyncing}
      />
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />

      {/* Top Left: Logo + sync badge */}
      {/* Top Left: Logo & Command Hub */}
      <div className="absolute top-8 left-8 z-20 flex items-center gap-4">
        <div className="flex items-center gap-3 p-1.5 pr-4 rounded-full bg-black/20 border border-white/10 backdrop-blur-md group cursor-default transition-all hover:bg-black/30">
          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-lg overflow-hidden relative">
            {imgFailed ? (
              <Circle className="w-5 h-5 text-white/20" />
            ) : (
              <img
                src="/logo.png"
                alt="Aetheris"
                className="w-full h-full object-cover scale-110"
                onError={() => setImgFailed(true)}
              />
            )}
            <div className="absolute inset-0 rounded-full border border-white/20" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-white text-xs tracking-[0.4em] uppercase font-light leading-none mb-1">
              AETH<span className="font-bold">ERIS</span>
            </h1>
            {user && (
              <SyncStatusBadge
                isSyncing={isSyncing}
                hasUnsavedChanges={hasUnsavedChanges}
                lastSyncedAt={lastSyncedAt}
                syncState={syncState}
              />
            )}
          </div>
        </div>
      </div>

      {/* Top Right Controls */}
      <div className="absolute top-8 right-8 z-20 flex items-center gap-4">
        {/* Productivity Capsule */}
        <div className="flex items-center gap-1 p-1.5 rounded-full bg-black/20 border border-white/10 backdrop-blur-md">
          <IconButton
            icon={<Users strokeWidth={1.5} />}
            label="Study Room"
            active={studyRoom.roomId !== null || showStudyRoom}
            onClick={() => setShowStudyRoom(!showStudyRoom)}
          />
          <IconButton
            icon={<Sparkles strokeWidth={1.5} />}
            label="AI Coach"
            onClick={() => setShowAetheris(true)}
          />
          <IconButton
            icon={<BarChart2 strokeWidth={1.5} />}
            label="Stats"
            onClick={() => setShowStats(true)}
          />
          <IconButton
            icon={<CheckSquare strokeWidth={1.5} />}
            label="Tasks"
            active={showTasks}
            onClick={() => setShowTasks(!showTasks)}
          />
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-3">
          <IconButton
            icon={<User strokeWidth={1.5} />}
            label="Account"
            onClick={() => openSettings("account")}
          />
          <IconButton
            icon={<Settings strokeWidth={1.5} />}
            label="Settings"
            onClick={() => openSettings("general")}
          />
        </div>
      </div>

      {/* Left-side Panels */}
      <AnimatePresence>
        <StudyRoomDrawer
          isOpen={showStudyRoom}
          onClose={() => setShowStudyRoom(false)}
          userId={user?.uid}
          studyRoom={studyRoom}
        />
      </AnimatePresence>

      {/* Dead Center Timer */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <div className="pointer-events-auto">
          <Timer studyRoom={studyRoom} />
        </div>
      </div>

      {/* Bottom Left: Spotify */}
      <div className="absolute bottom-6 left-6 z-20 w-[300px] hover:scale-[1.02] transition-transform origin-bottom-left group">
        <div className="opacity-40 group-hover:opacity-100 transition-opacity duration-300">
          <iframe
            style={{ borderRadius: "14px" }}
            src="https://open.spotify.com/embed/playlist/6zCID88oNjNv9zx6puDHKj?utm_source=generator&theme=0"
            width="100%"
            height="152"
            allowFullScreen={false}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        </div>
      </div>

      {/* Bottom Right: GitHub + About */}
      <div className="absolute bottom-6 right-6 z-20 flex items-center gap-3">
        <a
          href="https://github.com/jjtjtyt6644/Aetheris"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative p-3 rounded-full bg-black/20 hover:bg-white/20 border border-white/10 backdrop-blur-md transition-all text-white/60 hover:text-white"
          aria-label="GitHub"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/90 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10">
            GitHub
          </span>
        </a>

        <Link
          href="/docs"
          className="group relative p-3 rounded-full bg-black/20 hover:bg-white/20 border border-white/10 backdrop-blur-md transition-all text-white/60 hover:text-white"
          aria-label="Documentation"
        >
          <BookOpen className="w-5 h-5" strokeWidth={1.5} />
          <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/90 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10">
            Docs
          </span>
        </Link>

        <button
          onClick={() => setShowAbout(true)}
          className="group relative p-3 rounded-full bg-black/20 hover:bg-white/20 border border-white/10 backdrop-blur-md transition-all text-white/60 hover:text-white"
          aria-label="About"
        >
          <Info className="w-5 h-5" strokeWidth={1.5} />
          <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/90 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10">
            About
          </span>
        </button>
      </div>

      {/* Sliding Task Drawer */}
      <AnimatePresence>
        {showTasks && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 h-full w-[400px] z-30 p-8 pt-20 flex flex-col justify-start overflow-y-auto"
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-2xl border-l border-white/10 -z-10" />
            <div className="w-full">
              <TaskList onClose={() => setShowTasks(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

// ─── Sync Status Badge ────────────────────────────────────────────────────────

function SyncStatusBadge({
  isSyncing,
  hasUnsavedChanges,
  lastSyncedAt,
  syncState,
}: {
  isSyncing: boolean;
  hasUnsavedChanges: boolean;
  lastSyncedAt: number | null;
  syncState: "idle" | "loading" | "ready";
}) {
  const [showSaved, setShowSaved] = useState(false);
  const prevSyncedAt = useRef<number | null>(null);

  // Briefly show "Saved" after each successful sync
  useEffect(() => {
    if (lastSyncedAt && lastSyncedAt !== prevSyncedAt.current) {
      prevSyncedAt.current = lastSyncedAt;
      setShowSaved(true);
      const t = setTimeout(() => setShowSaved(false), 2500);
      return () => clearTimeout(t);
    }
  }, [lastSyncedAt]);

  // Determine what to show
  let content: { icon: React.ReactNode; text: string; color: string } | null = null;

  if (syncState === "loading") {
    content = {
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
      text: "Syncing…",
      color: "text-white/60",
    };
  } else if (isSyncing) {
    content = {
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
      text: "Saving…",
      color: "text-white/60",
    };
  } else if (showSaved) {
    content = {
      icon: <Check className="w-3 h-3" />,
      text: "Saved",
      color: "text-emerald-400",
    };
  } else if (hasUnsavedChanges) {
    content = {
      icon: <Cloud className="w-3 h-3" />,
      text: "Unsaved changes",
      color: "text-amber-400/80",
    };
  }

  return (
    <AnimatePresence>
      {content && (
        <motion.div
          key={content.text}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className={`flex items-center gap-1.5 text-[11px] font-medium tracking-wide ${content.color}`}
        >
          {content.icon}
          <span>{content.text}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Icon Button ──────────────────────────────────────────────────────────────

function IconButton({
  icon,
  label,
  onClick,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative p-3 rounded-full border backdrop-blur-md transition-all ${active
          ? "bg-white/25 border-white/30 text-white"
          : "bg-black/20 hover:bg-white/20 border-white/10 text-white/70 hover:text-white"
        }`}
    >
      {icon}
      <span className="absolute -bottom-9 left-1/2 -translate-x-1/2 bg-black/90 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10">
        {label}
      </span>
    </button>
  );
}
