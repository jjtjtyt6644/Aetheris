"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Settings, Image as ImageIcon, Music, LogIn, UserPlus, User, LogOut, Loader2, Mail, Lock, AlertCircle, Check, RefreshCw } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { BACKGROUNDS } from "@/components/Wallpaper";
import AudioMixer from "@/components/AudioMixer";
import { useAuth } from "@/contexts/AuthContext";
import { useFirestoreSync } from "@/hooks/useFirestoreSync";

interface TimerSettings {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
}

const DEFAULT_SETTINGS: TimerSettings = {
  focusDuration: 25 * 60,
  shortBreakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  sessionsUntilLongBreak: 4,
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab: "general" | "scenes" | "mixer" | "account";
  currentBgId: string;
  onBgChange: (id: string) => void;
}

export default function SettingsModal({ isOpen, onClose, initialTab, currentBgId, onBgChange }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"general" | "scenes" | "mixer" | "account">(initialTab);
  const [settings, setSettings] = useLocalStorage<TimerSettings>("aetheris_timer_settings", DEFAULT_SETTINGS);

  const updateSetting = (key: keyof TimerSettings, val: number) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
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
            className="glass-panel relative z-10 w-full max-w-2xl flex flex-col md:flex-row overflow-hidden bg-black/50 border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] max-h-[90vh]"
          >
            {/* Left Sidebar Tabs */}
            <div className="w-full md:w-[200px] flex-shrink-0 p-5 border-b md:border-b-0 md:border-r border-white/10 bg-white/5 flex flex-col gap-1.5">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-lg">Personalize</h2>
                <button onClick={onClose} className="md:hidden p-2 bg-white/10 rounded-full">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <TabButton active={activeTab === "general"} onClick={() => setActiveTab("general")} icon={<Clock className="w-4 h-4" />} label="Timer" />
              <TabButton active={activeTab === "scenes"} onClick={() => setActiveTab("scenes")} icon={<ImageIcon className="w-4 h-4" />} label="Scenes" />
              <TabButton active={activeTab === "mixer"} onClick={() => setActiveTab("mixer")} icon={<Music className="w-4 h-4" />} label="Soundscapes" />
              <TabButton active={activeTab === "account"} onClick={() => setActiveTab("account")} icon={<User className="w-4 h-4" />} label="Account" />
            </div>

            {/* Right Content */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex justify-end p-4 pb-0">
                <button onClick={onClose} className="hidden md:flex p-2 rounded-full hover:bg-white/10 transition-colors text-white/50 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 pt-2">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activeTab === "general" && (
                      <div className="space-y-5">
                        <SectionHeader label="Timer Settings" />
                        <NumberControl label="Focus Duration" unit="min" val={settings.focusDuration / 60} min={1} max={120} onChange={(v) => updateSetting("focusDuration", v * 60)} />
                        <NumberControl label="Short Break" unit="min" val={settings.shortBreakDuration / 60} min={1} max={60} onChange={(v) => updateSetting("shortBreakDuration", v * 60)} />
                        <NumberControl label="Long Break" unit="min" val={settings.longBreakDuration / 60} min={1} max={60} onChange={(v) => updateSetting("longBreakDuration", v * 60)} />
                        <div className="pt-3 border-t border-white/10">
                          <NumberControl label="Sessions Until Long Break" unit="sessions" val={settings.sessionsUntilLongBreak} min={1} max={10} onChange={(v) => updateSetting("sessionsUntilLongBreak", v)} />
                        </div>
                      </div>
                    )}

                    {activeTab === "scenes" && (
                      <div>
                        <SectionHeader label="Backgrounds" />
                        <div className="grid grid-cols-2 gap-3 mt-4">
                          {BACKGROUNDS.map((bg) => (
                            <button
                              key={bg.id}
                              onClick={() => onBgChange(bg.id)}
                              className={`relative text-left p-4 rounded-xl border transition-all overflow-hidden ${
                                currentBgId === bg.id ? "border-white bg-white/20 shadow-lg" : "border-white/10 bg-white/5 hover:bg-white/10"
                              }`}
                            >
                              <span className="block text-sm font-medium relative z-10">{bg.name}</span>
                              <div
                                className="absolute inset-0 opacity-20 -z-10"
                                style={{ backgroundImage: bg.theme === "dark" ? "linear-gradient(135deg,#2a2a3e,#111)" : bg.theme === "warm" ? "linear-gradient(135deg,#c18861,#693b1b)" : bg.theme === "nature" ? "linear-gradient(135deg,#5c855a,#2c422b)" : "linear-gradient(135deg,#eaeaea,#a5a5a5)" }}
                              />
                              {currentBgId === bg.id && (
                                <motion.div layoutId="active-scene-ring" className="absolute inset-0 border-2 border-white rounded-xl pointer-events-none" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab === "mixer" && (
                      <div>
                        <SectionHeader label="Soundscapes" />
                        <div className="mt-4">
                          <AudioMixer />
                        </div>
                      </div>
                    )}

                    {activeTab === "account" && <AccountPanel />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// --- Account Panel ---
function AccountPanel() {
  const { user, loading, signIn, signUp, signInWithGoogle, logOut, error, clearError } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { saveData, isSyncing } = useFirestoreSync(user);
  
  // Get data to sync
  const [tasks] = useLocalStorage<any[]>("aetheris_tasks", []);
  const [settings] = useLocalStorage<TimerSettings>("aetheris_timer_settings", DEFAULT_SETTINGS);
  const [bgId] = useLocalStorage<string>("aetheris_bg_id", "");

  const handleManualSync = async () => {
    if (!user) return;
    await saveData({ tasks, timerSettings: settings, bgId }, true);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "login") {
        await signIn(email, password);
      } else {
        await signUp(email, password, displayName);
      }
      setEmail(""); setPassword(""); setDisplayName("");
    } catch {
      // Error handled in context
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 animate-spin opacity-50" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="space-y-6">
        <SectionHeader label="Account" />
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center font-bold text-lg flex-shrink-0">
            {user.displayName?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{user.displayName ?? "User"}</p>
            <p className="text-sm text-white/50 truncate">{user.email}</p>
          </div>
        </div>
        <div className="pt-2 space-y-3">
          <p className="text-xs text-white/40 mb-4">Your tasks, settings, and background are automatically synced to the cloud in real-time.</p>
          
          <div className="flex flex-col gap-2">
            <button 
              onClick={handleManualSync}
              disabled={isSyncing}
              className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl transition-all w-full justify-center border ${
                showSuccess 
                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300" 
                  : "bg-white/5 hover:bg-white/10 border-white/5 text-white/70 hover:text-white"
              }`}
            >
              {isSyncing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : showSuccess ? (
                <Check className="w-4 h-4" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {isSyncing ? "Syncing..." : showSuccess ? "Data Synced!" : "Force Sync (Fallback)"}
            </button>

            <button onClick={logOut} className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-4 py-2.5 rounded-xl transition-colors w-full justify-center">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionHeader label={mode === "login" ? "Sign In" : "Create Account"} />

      {error && (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
          <button onClick={clearError} className="ml-auto flex-shrink-0"><X className="w-4 h-4" /></button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === "register" && (
          <FormField icon={<User className="w-4 h-4" />} type="text" placeholder="Your name" value={displayName} onChange={setDisplayName} required />
        )}
        <FormField icon={<Mail className="w-4 h-4" />} type="email" placeholder="Email address" value={email} onChange={setEmail} required />
        <FormField icon={<Lock className="w-4 h-4" />} type="password" placeholder="Password" value={password} onChange={setPassword} required />

        <button
          type="submit"
          disabled={submitting}
          className="w-full mt-2 flex items-center justify-center gap-2 bg-white text-black font-semibold py-3 rounded-xl hover:bg-white/90 transition-colors disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === "login" ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          {mode === "login" ? "Sign In" : "Create Account"}
        </button>

        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-white/30">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <button
          type="button"
          onClick={async () => { setSubmitting(true); try { await signInWithGoogle(); } catch {} finally { setSubmitting(false); } }}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 border border-white/10 font-medium py-3 rounded-xl transition-colors disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
      </form>

      <div className="text-center pt-2">
        <button
          onClick={() => { clearError(); setMode(mode === "login" ? "register" : "login"); }}
          className="text-sm text-white/50 hover:text-white transition-colors"
        >
          {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>

      <p className="text-xs text-white/30 text-center pt-2">
        By signing in, your data is securely synced across devices via Firebase.
      </p>
    </div>
  );
}

// --- Shared Subcomponents ---

function FormField({ icon, type, placeholder, value, onChange, required }: { icon: React.ReactNode; type: string; placeholder: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
      />
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return <h3 className="text-sm font-semibold opacity-50 uppercase tracking-widest">{label}</h3>;
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-3 w-full p-3 rounded-lg text-sm font-medium transition-colors ${active ? "text-white" : "text-white/60 hover:text-white hover:bg-white/5"}`}
    >
      {active && (
        <motion.div layoutId="tab-indicator" className="absolute inset-0 bg-white/10 rounded-lg" initial={false} transition={{ type: "spring", stiffness: 400, damping: 30 }} />
      )}
      <span className="relative z-10 flex items-center gap-3">{icon}{label}</span>
    </button>
  );
}

function NumberControl({ label, unit, val, min, max, onChange }: { label: string; unit: string; val: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between py-2 group">
      <label className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">{label}</label>
      <div className="flex items-center gap-3 bg-black/20 rounded-lg p-1 border border-white/5">
        <button onClick={() => onChange(Math.max(min, val - 1))} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/10 text-white/70 hover:text-white transition-colors">−</button>
        <span className="w-12 text-center font-mono text-sm tracking-widest">{val}</span>
        <button onClick={() => onChange(Math.min(max, val + 1))} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/10 text-white/70 hover:text-white transition-colors">+</button>
      </div>
    </div>
  );
}
