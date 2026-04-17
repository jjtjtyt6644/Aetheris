import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Clock, Settings, Image as ImageIcon, Music, LogIn, UserPlus, User,
  LogOut, Loader2, Mail, Lock, AlertCircle, Check, RefreshCw, ChevronLeft,
  Shield, FileText, Trash2, Download, AlertTriangle, Sparkles
} from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { BACKGROUNDS } from "@/components/Wallpaper";
import AudioMixer from "@/components/AudioMixer";
import { deleteUser } from "firebase/auth";
import { deleteDoc, doc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useAITracker } from "@/hooks/useAITracker";
import { useAuth } from "@/contexts/AuthContext";

interface TimerSettings {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
  autoStartTimer?: boolean;
}

const DEFAULT_SETTINGS: TimerSettings = {
  focusDuration: 25 * 60,
  shortBreakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  sessionsUntilLongBreak: 4,
  autoStartTimer: false,
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab: "general" | "scenes" | "mixer" | "account";
  currentBgId: string;
  onBgChange: (id: string) => void;
  onManualSync: () => Promise<void>;
  isSyncing: boolean;
}

// ─── Legal content ────────────────────────────────────────────────────────────

type LegalScreen = "tos" | "privacy" | null;

const TOS_CONTENT = `Terms of Service

Last updated: April 2026

1. Acceptance of Terms
By creating an account or using Aetheris, you agree to be bound by these Terms of Service. If you do not agree, please do not use the service.

2. Description of Service
Aetheris is a productivity and focus timer application that allows users to manage tasks, timer settings, and background preferences. Cloud sync is provided via Firebase.

3. User Accounts
You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorised use of your account.

4. User Data
All data you create in Aetheris (tasks, settings, preferences) belongs to you. We do not sell or share your personal data with third parties. See our Privacy Policy for full details.

5. Acceptable Use
You agree not to misuse the service, attempt to gain unauthorised access, or use it for any unlawful purpose.

6. Disclaimer of Warranties
Aetheris is provided "as is" without warranties of any kind. We do not guarantee uninterrupted or error-free service.

7. Limitation of Liability
To the fullest extent permitted by law, Aetheris and its creators shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service.

8. Changes to Terms
We may update these Terms at any time. Continued use of the service after changes constitutes acceptance of the new Terms.

9. Contact
For questions about these Terms, please reach out via the GitHub repository linked in the app.`;

const PRIVACY_CONTENT = `Privacy Policy

Last updated: April 2026

1. What We Collect
When you create an account, we collect your email address and display name (if provided). We also store the data you create in the app: tasks, timer preferences, and background selections.

2. How We Use Your Data
Your data is used solely to provide and improve the Aetheris service — specifically to sync your preferences and tasks across devices. We do not use your data for advertising or sell it to third parties.

3. Data Storage
Your data is stored securely in Google Firebase (Firestore). Firebase is subject to Google's own Privacy Policy and security standards.

4. Cookies & Local Storage
Aetheris uses your browser's localStorage to cache your data for offline use and to record the last sync timestamp. No tracking cookies are used.

5. Third-Party Services
We use the following third-party services:
• Firebase Authentication — for account management
• Firestore — for cloud data synchronisation
• Spotify Embed — for the ambient music player (governed by Spotify's Privacy Policy)

6. Data Retention
Your data is retained as long as your account exists. You may delete your account and associated data at any time by contacting us.

7. Children's Privacy
Aetheris is not directed at children under 13. We do not knowingly collect data from children.

8. Your Rights
Depending on your jurisdiction, you may have the right to access, correct, or delete your personal data. Contact us via the GitHub repository to exercise these rights.

9. Changes to This Policy
We may update this Privacy Policy from time to time. We will indicate the date of the most recent update at the top of this page.

10. Contact
For privacy concerns, please open an issue on our GitHub repository.`;

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function SettingsModal({
  isOpen, onClose, initialTab, currentBgId, onBgChange, onManualSync, isSyncing,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"general" | "scenes" | "mixer" | "account">(initialTab);
  const [settings, setSettings] = useLocalStorage<TimerSettings>("aetheris_timer_settings", DEFAULT_SETTINGS);
  const [legalScreen, setLegalScreen] = useState<LegalScreen>(null);

  const updateSetting = <K extends keyof TimerSettings>(key: K, val: TimerSettings[K]) => {
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

              <TabButton active={activeTab === "general"} onClick={() => { setLegalScreen(null); setActiveTab("general"); }} icon={<Clock className="w-4 h-4" />} label="Timer" />
              <TabButton active={activeTab === "scenes"} onClick={() => { setLegalScreen(null); setActiveTab("scenes"); }} icon={<ImageIcon className="w-4 h-4" />} label="Scenes" />
              <TabButton active={activeTab === "mixer"} onClick={() => { setLegalScreen(null); setActiveTab("mixer"); }} icon={<Music className="w-4 h-4" />} label="Soundscapes" />
              <TabButton active={activeTab === "account"} onClick={() => { setLegalScreen(null); setActiveTab("account"); }} icon={<User className="w-4 h-4" />} label="Account" />
            </div>

            {/* Right Content */}
            <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
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
                        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                          <div>
                            <span className="block text-sm font-medium text-white/90">Auto-Start Timer</span>
                            <span className="text-xs text-white/50 block mt-0.5">Automatically stream sessions (Focus {'->'} Break) without stopping</span>
                          </div>
                          <button
                            onClick={() => updateSetting("autoStartTimer", !settings.autoStartTimer)}
                            className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${
                              settings.autoStartTimer ? "bg-indigo-500" : "bg-white/10"
                            }`}
                          >
                            <motion.div
                              layout
                              className="w-4 h-4 bg-white rounded-full shadow-sm"
                              animate={{ x: settings.autoStartTimer ? 24 : 0 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                          </button>
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

                        <div className="mt-6 pt-5 border-t border-white/10">
                          <SectionHeader label="Custom Render (URL)" />
                          <div className="mt-3 flex gap-2">
                            <input
                              type="text"
                              placeholder="Image or GIF URL"
                              value={currentBgId.startsWith("http") ? currentBgId : ""}
                              onChange={(e) => {
                                const url = e.target.value.trim();
                                if (url) onBgChange(url);
                              }}
                              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500/50 transition-colors"
                            />
                          </div>
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

                    {activeTab === "account" && (
                      <AccountPanel
                        onManualSync={onManualSync}
                        isSyncing={isSyncing}
                        onOpenLegal={setLegalScreen}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Legal screen overlay — slides in over the right panel */}
              <AnimatePresence>
                {legalScreen && (
                  <motion.div
                    key={legalScreen}
                    initial={{ x: "100%", opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: "100%", opacity: 0 }}
                    transition={{ type: "spring", damping: 28, stiffness: 300 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col z-20"
                  >
                    {/* Legal header */}
                    <div className="flex items-center gap-3 p-5 border-b border-white/10">
                      <button
                        onClick={() => setLegalScreen(null)}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-2">
                        {legalScreen === "tos"
                          ? <FileText className="w-4 h-4 text-white/60" />
                          : <Shield className="w-4 h-4 text-white/60" />
                        }
                        <h3 className="font-semibold text-sm">
                          {legalScreen === "tos" ? "Terms of Service" : "Privacy Policy"}
                        </h3>
                      </div>
                    </div>

                    {/* Legal content */}
                    <div className="flex-1 overflow-y-auto p-6">
                      <pre className="text-xs text-white/70 leading-relaxed whitespace-pre-wrap font-sans">
                        {legalScreen === "tos" ? TOS_CONTENT : PRIVACY_CONTENT}
                      </pre>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Account Panel ────────────────────────────────────────────────────────────

function AccountPanel({ 
  onManualSync, 
  isSyncing,
  onOpenLegal 
}: { 
  onManualSync: () => Promise<void>; 
  isSyncing: boolean;
  onOpenLegal: (screen: LegalScreen) => void;
}) {
  const { user, loading, signIn, signUp, signInWithGoogle, logOut, deleteAccount, error, clearError } = useAuth();
  
  const { stats } = useAITracker();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Account deletion
  const [deletePhase, setDeletePhase] = useState<"idle" | "confirm" | "deleting">("idle");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleManualSync = async () => {
    await onManualSync();
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) return;
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

  const handleGoogleSignIn = async () => {
    if (!agreedToTerms) return;
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch {}
    finally { setSubmitting(false); }
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

        <div className="space-y-4">
          {stats && (
            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-indigo-300 font-medium text-sm">
                <Sparkles className="w-4 h-4" />
                Aetheris AI Usage
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-white/50 mb-1">Tokens Used (Today)</p>
                  <p className="font-mono text-lg font-semibold text-white">{stats.tokensUsed.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-white/50 mb-1">Generations Left</p>
                  <p className="font-mono text-lg font-semibold text-white">{stats.maxGenerations - stats.generations}</p>
                </div>
              </div>
            </div>
          )}

          <hr className="border-white/10" />

          <p className="text-xs text-white/40">
            Your tasks, settings, and background are synced to the cloud instantly.
          </p>

          {/* Force Sync */}
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl transition-all w-full justify-center border ${
              showSuccess
                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                : "bg-white/5 hover:bg-white/10 border-white/5 text-white/70 hover:text-white"
            }`}
          >
            {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : showSuccess ? <Check className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
            {isSyncing ? "Syncing..." : showSuccess ? "Data Synced!" : "Force Sync"}
          </button>

          {/* Export Data */}
          <button
            onClick={() => {
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
            }}
            className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white/70 hover:text-white transition-all w-full justify-center"
          >
            <Download className="w-4 h-4" />
            Export My Data (JSON)
          </button>

          {/* Sign Out */}
          <button
            onClick={logOut}
            className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-4 py-2.5 rounded-xl transition-colors w-full justify-center"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>

          {/* Delete Account */}
          <div className="pt-3 border-t border-white/10">
            {deletePhase === "idle" && (
              <button
                onClick={() => setDeletePhase("confirm")}
                className="flex items-center gap-2 text-xs text-white/30 hover:text-red-400 transition-colors w-full justify-center py-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Account & All Data
              </button>
            )}
            {(deletePhase === "confirm" || deletePhase === "deleting") && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-red-900/20 border border-red-500/30 space-y-3"
              >
                <div className="flex items-start gap-2 text-red-300">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed">This will permanently delete your account and all cloud data. This cannot be undone.</p>
                </div>
                {deleteError && <p className="text-xs text-red-400">{deleteError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={() => { setDeletePhase("idle"); setDeleteError(null); }}
                    className="flex-1 text-xs py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!user || !auth.currentUser) return;
                      setDeletePhase("deleting");
                      setDeleteError(null);
                      try {
                        await deleteDoc(doc(db, "users", user.uid));
                        await deleteUser(auth.currentUser);
                        ["aetheris_tasks","aetheris_timer_settings","aetheris_bg_id",
                         "aetheris_focus_history","aetheris_completed_sessions","aetheris_updatedAt"]
                          .forEach((k) => localStorage.removeItem(k));
                      } catch (err: any) {
                        setDeletePhase("confirm");
                        setDeleteError(err?.code === "auth/requires-recent-login"
                          ? "Please sign out and sign back in before deleting your account."
                          : "Failed to delete account. Please try again.");
                      }
                    }}
                    disabled={deletePhase === "deleting"}
                    className="flex-1 text-xs py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {deletePhase === "deleting" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    {deletePhase === "deleting" ? "Deleting..." : "Delete Forever"}
                  </button>
                </div>
              </motion.div>
            )}
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
        {mode === "signup" && (
          <FormField icon={<User className="w-4 h-4" />} type="text" placeholder="Your name" value={displayName} onChange={setDisplayName} required />
        )}
        <FormField icon={<Mail className="w-4 h-4" />} type="email" placeholder="Email address" value={email} onChange={setEmail} required />
        <FormField icon={<Lock className="w-4 h-4" />} type="password" placeholder="Password" value={password} onChange={setPassword} required />

        {/* ToS agreement */}
        <label className="flex items-start gap-2.5 cursor-pointer group pt-1">
          <div
            onClick={() => setAgreedToTerms(!agreedToTerms)}
            className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 border transition-all flex items-center justify-center ${
              agreedToTerms
                ? "bg-white border-white text-black"
                : "border-white/30 bg-white/5 group-hover:border-white/50"
            }`}
          >
            {agreedToTerms && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
          </div>
          <span className="text-xs text-white/50 leading-relaxed">
            I agree to the{" "}
            <button
              type="button"
              onClick={() => onOpenLegal("tos")}
              className="text-white/80 hover:text-white underline underline-offset-2 transition-colors"
            >
              Terms of Service
            </button>
            {" "}and{" "}
            <button
              type="button"
              onClick={() => onOpenLegal("privacy")}
              className="text-white/80 hover:text-white underline underline-offset-2 transition-colors"
            >
              Privacy Policy
            </button>
          </span>
        </label>

        <button
          type="submit"
          disabled={submitting || !agreedToTerms}
          className="w-full mt-2 flex items-center justify-center gap-2 bg-white text-black font-semibold py-3 rounded-xl hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
          onClick={handleGoogleSignIn}
          disabled={submitting || !agreedToTerms}
          className="w-full flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 border border-white/10 font-medium py-3 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {!agreedToTerms && (
          <p className="text-[11px] text-amber-400/70 text-center">
            Please agree to the Terms of Service and Privacy Policy to continue.
          </p>
        )}
      </form>

      <div className="text-center pt-2">
        <button
          onClick={() => { clearError(); setMode(mode === "login" ? "signup" : "login"); }}
          className="text-sm text-white/50 hover:text-white transition-colors"
        >
          {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}

// ─── Shared Subcomponents ─────────────────────────────────────────────────────

function FormField({ icon, type, placeholder, value, onChange, required }: {
  icon: React.ReactNode; type: string; placeholder: string;
  value: string; onChange: (v: string) => void; required?: boolean;
}) {
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

function TabButton({ active, onClick, icon, label }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string;
}) {
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

function NumberControl({ label, unit, val, min, max, onChange }: {
  label: string; unit: string; val: number; min: number; max: number; onChange: (v: number) => void;
}) {
  const [raw, setRaw] = useState(String(val));

  useEffect(() => { setRaw(String(val)); }, [val]);

  const commit = (str: string) => {
    const n = parseInt(str, 10);
    if (!isNaN(n)) {
      const clamped = Math.max(min, Math.min(max, n));
      onChange(clamped);
      setRaw(String(clamped));
    } else {
      setRaw(String(val)); // revert bad input
    }
  };

  return (
    <div className="flex items-center justify-between py-2 group">
      <div>
        <label className="text-sm font-medium text-white/80 group-hover:text-white transition-colors block">
          {label}
        </label>
        <span className="text-xs text-white/30">{unit}</span>
      </div>
      <div className="flex items-center gap-1 bg-black/20 rounded-lg p-1 border border-white/5">
        <button
          onClick={() => { const v = Math.max(min, val - 1); onChange(v); setRaw(String(v)); }}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/10 text-white/70 hover:text-white transition-colors"
        >
          −
        </button>
        <input
          type="number"
          value={raw}
          min={min}
          max={max}
          onChange={(e) => setRaw(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") commit((e.target as HTMLInputElement).value); }}
          className="w-14 text-center font-mono text-sm bg-transparent text-white focus:outline-none focus:bg-white/5 rounded px-1 py-0.5 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          onClick={() => { const v = Math.min(max, val + 1); onChange(v); setRaw(String(v)); }}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/10 text-white/70 hover:text-white transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}

