"use client";

import { useState } from "react";
import Wallpaper, { BACKGROUNDS } from "@/components/Wallpaper";
import Timer from "@/components/Timer";
import TaskList from "@/components/TaskList";
import SettingsModal from "@/components/SettingsModal";
import AboutModal from "@/components/AboutModal";
import { Settings, Image as ImageIcon, Music, CheckSquare, Info, User } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useAuth } from "@/contexts/AuthContext";
import { useFirestoreSync } from "@/hooks/useFirestoreSync";
import { Task } from "@/components/TaskList";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

const DEFAULT_SETTINGS = {
  focusDuration: 25 * 60,
  shortBreakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  sessionsUntilLongBreak: 4,
};

export default function Home() {
  const { user } = useAuth();
  const [bgId, setBgId] = useLocalStorage("aetheris_bg_id", BACKGROUNDS[0].id);
  const [tasks, setTasks] = useLocalStorage<Task[]>("aetheris_tasks", []);
  const [settings, setSettings] = useLocalStorage("aetheris_timer_settings", DEFAULT_SETTINGS);

  const { isSyncing, saveData, loadData } = useFirestoreSync(user);

  // --- 1. Automatic Load on Login ---
  useEffect(() => {
    if (user) {
      loadData().then((cloudData) => {
        if (cloudData) {
          if (cloudData.bgId) setBgId(cloudData.bgId);
          if (cloudData.tasks) setTasks(cloudData.tasks);
          if (cloudData.timerSettings) setSettings(cloudData.timerSettings);
        }
      });
    }
  }, [user, loadData, setBgId, setTasks, setSettings]);

  // --- 2. Automatic Save on Change ---
  useEffect(() => {
    if (user) {
      saveData({ tasks, timerSettings: settings, bgId });
    }
  }, [tasks, settings, bgId, user, saveData]);

  const [showTasks, setShowTasks] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<"general" | "scenes" | "mixer" | "account">("general");
  const [imgFailed, setImgFailed] = useState(false);

  const openSettings = (tab: "general" | "scenes" | "mixer" | "account") => {
    setActiveSettingsTab(tab);
    setShowSettings(true);
  };

  return (
    <main className="relative w-full h-screen overflow-hidden text-white font-sans">
      {/* Background Engine */}
      <Wallpaper currentBgId={bgId} />

      {/* Modals */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        initialTab={activeSettingsTab}
        currentBgId={bgId}
        onBgChange={setBgId}
      />
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />

      {/* Top Left Logo */}
      <div className="absolute top-8 left-8 z-20 flex items-center h-10">
        {imgFailed ? (
          <h1 className="text-white/70 text-sm tracking-[0.4em] uppercase font-medium drop-shadow-md cursor-default">
            AETHERIS
          </h1>
        ) : (
          <img
            src="/logo.png"
            alt="Aetheris"
            className="h-10 w-auto opacity-70 hover:opacity-100 transition-opacity"
            onError={() => setImgFailed(true)}
          />
        )}
      </div>

      {/* Top Right Controls */}
      <div className="absolute top-8 right-8 z-20 flex items-center gap-3">
        <IconButton icon={<CheckSquare strokeWidth={1.5} />} label="Tasks" active={showTasks} onClick={() => setShowTasks(!showTasks)} />
        <IconButton icon={<ImageIcon strokeWidth={1.5} />} label="Scenes" onClick={() => openSettings("scenes")} />
        <IconButton icon={<Music strokeWidth={1.5} />} label="Mixer" onClick={() => openSettings("mixer")} />
        <IconButton icon={<User strokeWidth={1.5} />} label="Account" onClick={() => openSettings("account")} />
        <IconButton icon={<Settings strokeWidth={1.5} />} label="Settings" onClick={() => openSettings("general")} />
      </div>

      {/* Dead Center Timer */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <div className="pointer-events-auto">
          <Timer />
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
          ></iframe>
        </div>
      </div>

      {/* Bottom Right: GitHub + About */}
      <div className="absolute bottom-6 right-6 z-20 flex items-center gap-3">
        <a
          href="https://github.com/jjtjtyt6644"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative p-3 rounded-full bg-black/20 hover:bg-white/20 border border-white/10 backdrop-blur-md transition-all text-white/60 hover:text-white"
          aria-label="GitHub"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
          <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/90 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10">
            GitHub
          </span>
        </a>
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
      className={`group relative p-3 rounded-full border backdrop-blur-md transition-all ${
        active
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
