import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen, Users, Sparkles, Cloud, Shield, Zap, ChevronRight, Lock, Scale } from "lucide-react";

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DocsModal({ isOpen, onClose }: DocsModalProps) {
  const [activeTab, setActiveTab] = useState<"architecture" | "structure" | "security" | "moderation" | "legal">("architecture");

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="glass-panel relative z-10 w-full max-w-5xl flex flex-col md:flex-row overflow-hidden bg-zinc-900/95 border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.6)] h-[85vh]"
          >
            {/* Sidebar / Table of Contents */}
            <div className="w-full md:w-[260px] flex-shrink-0 p-8 border-b md:border-b-0 md:border-r border-white/5 bg-white/[0.01]">
              <div className="flex items-center gap-3 mb-10">
                <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-base tracking-tight leading-none mb-1">Technical Manual</h2>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest font-mono">Project Blueprint</p>
                </div>
              </div>

              <nav className="space-y-1">
                <TabButton
                  icon={<Zap className="w-4 h-4" />}
                  label="System Architecture"
                  active={activeTab === "architecture"}
                  onClick={() => setActiveTab("architecture")}
                />
                <TabButton
                  icon={<ChevronRight className="w-4 h-4" />}
                  label="Project Structure"
                  active={activeTab === "structure"}
                  onClick={() => setActiveTab("structure")}
                />
                <TabButton
                  icon={<Shield className="w-4 h-4" />}
                  label="Security & AI"
                  active={activeTab === "security"}
                  onClick={() => setActiveTab("security")}
                />
                <TabButton
                  icon={<Users className="w-4 h-4" />}
                  label="Moderation Guide"
                  active={activeTab === "moderation"}
                  onClick={() => setActiveTab("moderation")}
                />
                <TabButton
                  icon={<Scale className="w-4 h-4" />}
                  label="Legal & Terms"
                  active={activeTab === "legal"}
                  onClick={() => setActiveTab("legal")}
                />
              </nav>

              <div className="mt-auto pt-8 border-t border-white/5">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                  <p className="text-[10px] text-white/30 leading-relaxed mb-3">
                    Aetheris Engine v1.0.0 High-performance study environment built with Next.js & Firebase.
                  </p>
                  <p className="text-[10px] text-indigo-400 font-mono">BUILD#2026.04.18</p>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-black/20">
              <div className="flex justify-end absolute top-6 right-6 z-10">
                <button
                  onClick={onClose}
                  className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white/40 hover:text-white border border-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="max-w-3xl">
                {activeTab === "architecture" && (
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                    <section className="space-y-6">
                      <div className="space-y-2">
                        <Tag text="Foundations" />
                        <h1 className="text-4xl font-bold text-white tracking-tight">System Architecture</h1>
                      </div>
                      <p className="text-lg text-white/60 leading-relaxed">
                        Aetheris is built on a <strong>Hybrid Edge-Cloud</strong> architecture. It prioritizes local performance for basic timing while utilizing real-time synchronization for collaborative features.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FeatureCard
                          title="Reactive State"
                          desc="Custom hooks (useTimer, useStudyRoom) manage complex state outside the UI tree for performance."
                        />
                        <FeatureCard
                          title="Persistence Engine"
                          desc="Graceful fallback patterns between LocalStorage and Firestore ensure zero data loss."
                        />
                      </div>
                    </section>

                    <section className="space-y-6">
                      <h2 className="text-xl font-bold text-white border-l-2 border-indigo-500 pl-4">The Dual-Database Model</h2>
                      <p className="text-white/60 leading-relaxed">
                        We avoid common performance bottlenecks by splitting data across two purpose-built engines:
                      </p>
                      <div className="space-y-4">
                        <div className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                          <h4 className="font-bold text-indigo-400 mb-2 whitespace-nowrap">Realtime Database (RTDB)</h4>
                          <p className="text-sm text-white/70">Handles presence, ephemeral chat, and live session syncing. Optimized for millisecond latency.</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                          <h4 className="font-bold text-emerald-400 mb-2 whitespace-nowrap">Cloud Firestore</h4>
                          <p className="text-sm text-white/70">Handles long-term storage: Task history, User preferences, and User profiles. Optimized for complex queries and durability.</p>
                        </div>
                      </div>
                    </section>
                  </motion.div>
                )}

                {activeTab === "structure" && (
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                    <div className="space-y-2">
                      <Tag text="Source Map" />
                      <h1 className="text-4xl font-bold text-white tracking-tight">Project Structure</h1>
                    </div>

                    <div className="space-y-8">
                      <FolderBreakdown
                        path="src/hooks"
                        desc="The Engine Room. Contains autonomous logic hooks. This allows components to remain 'dumb' and focused on rendering."
                        files={["useTimer", "useStudyRoom", "useAbuseProtection", "useFirestoreSync"]}
                      />
                      <FolderBreakdown
                        path="src/components"
                        desc="The UI Library. Atomic components designed with glassmorphism and Framer Motion for premium UX."
                        files={["StudyRoomDrawer", "AetherisModal", "ReportModal", "SettingsModal"]}
                      />
                      <FolderBreakdown
                        path="src/app/api"
                        desc="The Secure Gateway. Serverless functions for AI Coach logic and token-gate security."
                      />
                    </div>
                  </motion.div>
                )}

                {activeTab === "security" && (
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                    <div className="space-y-2">
                      <Tag text="Security Hub" />
                      <h1 className="text-4xl font-bold text-white tracking-tight">Governance & AI</h1>
                    </div>

                    <p className="text-white/60 leading-relaxed">
                      To prevent API abuse and ensure sustainable AI features, Aetheris implements a <strong>Tiered Abuse Protection</strong> system.
                    </p>

                    <div className="grid grid-cols-1 gap-6">
                      <div className="p-8 rounded-3xl bg-zinc-950/50 border border-white/5 space-y-4">
                        <Zap className="text-amber-400 w-8 h-8" />
                        <h3 className="text-xl font-bold text-white">Token Throttling</h3>
                        <p className="text-sm text-white/50 leading-relaxed">
                          The `useAbuseProtection` hook tracks user interactions and limits AI coach requests per session. This prevents automated botting and controls operational costs.
                        </p>
                      </div>
                      <div className="p-8 rounded-3xl bg-zinc-950/50 border border-white/5 space-y-4">
                        <Lock className="text-indigo-400 w-8 h-8" />
                        <h3 className="text-xl font-bold text-white">Admin SDK Validation</h3>
                        <p className="text-sm text-white/50 leading-relaxed">
                          Sensitive actions (like increasing usage tokens) are NEVER done on the client. They are proxied through `/api/aetheris` where the Firebase Admin SDK performs identity validation.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "moderation" && (
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                    <div className="space-y-2">
                      <Tag text="Operations" />
                      <h1 className="text-4xl font-bold text-white tracking-tight">Moderation Hub</h1>
                    </div>

                    <section className="space-y-4">
                      <p className="text-white/60">Study room hosts possess advanced tools to maintain focus standards:</p>
                      <div className="space-y-3">
                        <ModRow title="Kicking" desc="Instant removal of a user by deleting their presence node." />
                        <ModRow title="Banning" desc="Permanent UID flagging in the room node to prevent re-entry." />
                        <ModRow title="Reporting" desc="Snapshotting chat logs into a private 'reports' Firestore collection for manual admin review." />
                      </div>
                    </section>

                    <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/10 text-xs text-red-200/50 leading-relaxed">
                      NOTICE: All moderation actions are logged. Continued abuse of moderation power may result in account termination.
                    </div>
                  </motion.div>
                )}

                {activeTab === "legal" && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                    <div className="space-y-2">
                      <Tag text="Compliance & Governance" />
                      <h1 className="text-4xl font-bold text-white tracking-tight">Legal Notice & Terms</h1>
                      <p className="text-xs text-white/30 uppercase font-mono mt-2 tracking-tighter">REVISED: APRIL 18, 2026</p>
                    </div>

                    <div className="space-y-10 max-w-2xl">
                      {/* Section 1: Agreement */}
                      <section className="space-y-4">
                        <h2 className="text-base font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_indigo]" />
                          1. Binding Agreement
                        </h2>
                        <div className="space-y-4">
                          <p className="text-sm text-white/60 leading-relaxed font-serif italic border-l border-white/10 pl-6">
                            "These Terms of Service constitute a legally binding agreement between the end-user ('you' or 'User') and the Developers of Aetheris. By initializing the Aetheris Protocol or accessing any collaborative Study Room, you hereby represent that you have read, understood, and irrevocably consented to the terms set forth herein."
                          </p>
                          <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10">
                            <h4 className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-1">Non-Affiliation Notice</h4>
                            <p className="text-[10px] text-white/40 leading-relaxed">
                              Aetheris (The Focus Protocol) is an independent productivity application. We are not affiliated, associated, authorized, endorsed by, or in any way officially connected with any video games, software entities, or trademarks bearing the name "Aetheris" or similar.
                            </p>
                          </div>
                        </div>
                      </section>

                      {/* Section 2: Intellectual Property */}
                      <section className="space-y-4">
                        <h2 className="text-base font-bold text-white uppercase tracking-widest flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-white/40 shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
                          2. Proprietary Rights
                        </h2>
                        <div className="text-xs text-white/50 leading-relaxed space-y-4">
                          <p>
                            All software architecture, source code, visual components, branding (including the "Aetheris" name and logo), and algorithmic focus-slicing logic are the exclusive proprietary property of the Developers. Except as expressly provided in these Terms, no part of the Aetheris Engine may be copied, reproduced, aggregated, republished, or distributed for any commercial purpose whatsoever without prior written authorization.
                          </p>
                        </div>
                      </section>

                      {/* Section 3: Indemnification */}
                      <section className="space-y-4">
                        <h2 className="text-base font-bold text-white uppercase tracking-widest flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-white/40 shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
                          3. Indemnification & Liability
                        </h2>
                        <div className="text-xs text-white/50 leading-relaxed space-y-4">
                          <p>
                            User agrees to defend, indemnify, and hold harmless Aetheris and its developers from and against any and all claims, damages, obligations, losses, liabilities, costs, or debt (including attorney's fees) arising from: (i) your use of and access to the service; (ii) your violation of any third-party right, including copyright or privacy rights; or (iii) any claim that your user-generated chat content caused damage to a third party.
                          </p>
                          <p className="font-mono text-[10px] leading-tight text-white/30 p-4 rounded-xl bg-indigo-500/[0.03] border border-indigo-500/10 uppercase">
                            TO THE FULL EXTENT PERMISSIBLE BY APPLICABLE LAW, THE DEVELOPERS SHALL NOT BE LIABLE FOR ANY DAMAGES OF ANY KIND ARISING FROM THE USE OF THE SERVICE, INCLUDING CONSEQUENTIAL, INDIRECT, SPECIAL, OR PUNITIVE DAMAGES, REGARDLESS OF THE LEGAL THEORY ASSERTED.
                          </p>
                        </div>
                      </section>

                      {/* Section 4: Privacy & AI (PDPA Compliance) */}
                      <section className="space-y-4">
                        <h2 className="text-base font-bold text-white uppercase tracking-widest flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-white/40 shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
                          4. Privacy & PDPA Compliance
                        </h2>
                        <div className="text-xs text-white/50 leading-relaxed space-y-4">
                          <p>
                            Aetheris complies with the <strong>Personal Data Protection Act (PDPA)</strong> of Singapore. We collect data for specified purposes and will not retain your personal data for longer than is necessary. By using the Protocol, you consent to the collection, use, and disclosure of your personal data as described in the Privacy Policy section.
                          </p>
                          <p>
                            User acknowledges that prompts submitted to the AI Focus Coach are processed by external infrastructure by groq (including Anthropic frameworks) and are subject to their respective privacy standards.
                          </p>
                        </div>
                      </section>

                      {/* Section 5: Licensing */}
                      <section className="space-y-4">
                        <h2 className="text-base font-bold text-white uppercase tracking-widest flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-white/40 shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
                          5. Licensing & Open Source
                        </h2>
                        <div className="text-xs text-white/50 leading-relaxed space-y-4">
                          <p>
                            Aetheris is distributed under the <strong>MIT License</strong>. Copyright © 2026 Junyu. The software is provided "as is", without warranty of any kind. You are permitted to use, modify, and distribute the software provided the original license and copyright notice are preserved.
                          </p>
                        </div>
                      </section>

                      {/* Section 6: Final Notice */}
                      <section className="space-y-4 mb-20 pt-8 border-t border-white/5 text-center">
                        <p className="text-[10px] text-white/20 uppercase tracking-[0.3em]">MIT Licensed / Governing Law: Singapore</p>
                      </section>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function TabButton({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-xl text-xs font-medium transition-all cursor-pointer group ${active ? "bg-white/10 text-white translate-x-1" : "text-white/40 hover:text-white/70"
        }`}
    >
      <div className={`${active ? "text-indigo-400" : "text-white/20"}`}>
        {icon}
      </div>
      {label}
    </div>
  );
}

function Tag({ text }: { text: string }) {
  return (
    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
      {text}
    </span>
  );
}

function FeatureCard({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
      <h4 className="font-bold text-white/90 text-sm tracking-tight">{title}</h4>
      <p className="text-xs text-white/40 leading-relaxed">{desc}</p>
    </div>
  );
}

function FolderBreakdown({ path, desc, files }: { path: string, desc: string, files?: string[] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="font-mono text-sm text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded italic">/{path}</div>
      </div>
      <p className="text-sm text-white/60 leading-relaxed">{desc}</p>
      {files && (
        <div className="flex flex-wrap gap-2">
          {files.map(f => (
            <span key={f} className="text-[10px] font-mono text-white/30 bg-white/5 px-2 py-1 rounded-md border border-white/5">{f}.ts</span>
          ))}
        </div>
      )}
    </div>
  );
}

function ModRow({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="flex gap-6 p-4 rounded-xl border border-white/5 bg-white/[0.01]">
      <div className="w-24 flex-shrink-0 font-bold text-sm text-white/80">{title}</div>
      <div className="text-sm text-white/40 leading-relaxed">{desc}</div>
    </div>
  );
}

function CheckItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3 text-sm text-white/60">
      <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-current" />
      </div>
      {text}
    </li>
  );
}
