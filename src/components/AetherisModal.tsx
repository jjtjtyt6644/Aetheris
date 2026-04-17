"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { auth } from "@/lib/firebase";
import { useAITracker } from "@/hooks/useAITracker";
import { Task } from "./TaskList";

interface AetherisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AetherisModal({ isOpen, onClose }: AetherisModalProps) {
  const [tasks, setTasks] = useLocalStorage<Task[]>("aetheris_tasks", []);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedTasks, setGeneratedTasks] = useState<string[] | null>(null);
  
  const { stats, loading: statsLoading, refreshStats } = useAITracker();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError(null);
    setGeneratedTasks(null);

    try {
      if (!auth.currentUser) {
        throw new Error("You must be logged in to use the AI Focus Coach.");
      }
      
      const token = await auth.currentUser.getIdToken();

      const res = await fetch("/api/aetheris", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate tasks.");
      }

      if (data.tasks && Array.isArray(data.tasks)) {
        setGeneratedTasks(data.tasks);
        refreshStats(); // Refresh usage numbers after generation!
      } else {
        throw new Error("Invalid response format.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToQueue = () => {
    if (!generatedTasks) return;

    const newTasks: Task[] = generatedTasks.map((t) => ({
      id: crypto.randomUUID(),
      text: t,
      completed: false,
    }));

    setTasks([...tasks, ...newTasks]);
    setGeneratedTasks(null);
    setPrompt("");
    onClose();
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
            className="relative z-10 w-full max-w-md bg-black/80 border border-indigo-500/30 rounded-2xl backdrop-blur-2xl shadow-[0_0_80px_rgba(79,70,229,0.2)] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-gradient-to-r from-indigo-500/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Aetheris AI</h2>
                  <p className="text-xs text-white/50 mt-0.5">Focus Coach & Task Slicer</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {stats && (
                  <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-white/5 border border-white/10 text-xs">
                    <span className="text-white/40">Tokens Used:</span>
                    <span className="text-indigo-400 font-mono font-medium">{stats.tokensUsed.toLocaleString()}</span>
                  </div>
                )}
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/50 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {!generatedTasks ? (
                <>
                  <p className="text-sm text-white/70 mb-4 leading-relaxed">
                    Have a massive goal but don't know where to start? Tell me what you want to achieve, and I'll break it down into perfectly sized Pomodoro sessions.
                  </p>
                  
                  {stats && (
                    <div className="mb-6 flex gap-2 w-full h-1.5 rounded-full overflow-hidden bg-white/5">
                      <div 
                        className={`h-full transition-all ${stats.generations >= stats.maxGenerations ? "bg-red-500" : "bg-indigo-500"}`} 
                        style={{ width: `${(stats.generations / stats.maxGenerations) * 100}%` }}
                      />
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="e.g., Write a 5-page history paper on the Roman Empire..."
                      className="w-full h-32 p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 resize-none transition-all text-sm"
                      disabled={loading}
                    />

                    {error && (
                      <p className="text-xs text-red-400 p-3 bg-red-500/10 rounded-lg">
                        {error}
                      </p>
                    )}

                    {stats && stats.generations >= stats.maxGenerations && (
                      <p className="text-xs text-red-500 text-center font-medium">Daily AI Generation Limit Reached ({stats.maxGenerations}/{stats.maxGenerations})</p>
                    )}

                    <button
                      type="submit"
                      disabled={!prompt.trim() || loading || (stats ? stats.generations >= stats.maxGenerations : false)}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-all disabled:opacity-50 disabled:hover:bg-indigo-500"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analyzing Goal...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generate Action Plan
                        </>
                      )}
                    </button>
                  </form>
                </>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {generatedTasks.map((task, i) => (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={i}
                        className="p-3 rounded-lg bg-white/5 border border-white/10 text-sm flex items-start gap-3"
                      >
                        <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <span className="text-white/90 leading-relaxed">{task}</span>
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setGeneratedTasks(null)}
                      className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 transition-all text-sm font-medium"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={handleAddToQueue}
                      className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white transition-all text-sm font-medium"
                    >
                      Add to Task List
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
