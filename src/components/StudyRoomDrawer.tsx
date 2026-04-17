import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, X, LogOut, Check, Shield, Users, Send, AlertTriangle, Lock, UserMinus, Crown, Trash2, ShieldAlert, AlertOctagon, UserX, Ghost } from "lucide-react";
import { useStudyRoom, ChatMessage } from "@/hooks/useStudyRoom";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useAuth } from "@/contexts/AuthContext";
import ReportModal from "./ReportModal";

interface StudyRoomDrawerProps {
  userId?: string;
  studyRoom: ReturnType<typeof useStudyRoom>;
  onClose: () => void;
  isOpen: boolean;
}

export default function StudyRoomDrawer({ userId, studyRoom, onClose, isOpen }: StudyRoomDrawerProps) {
  const {
    roomId,
    participants,
    messages,
    isHost,
    createRoom,
    joinRoom,
    leaveRoom,
    sendMessage,
    kickParticipant,
    banUser,
    deleteMessage,
    reportMessage,
    localId,
    moderationEvent,
    clearModerationEvent
  } = studyRoom;

  const { user } = useAuth();
  const [joinCode, setJoinCode] = useState("");
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [copied, setCopied] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [hasAcceptedTos, setHasAcceptedTos] = useLocalStorage("aetheris_chat_tos_accepted", false);
  const [confirmingKick, setConfirmingKick] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportingMessage, setReportingMessage] = useState<ChatMessage | null>(null);
  const [statusModal, setStatusModal] = useState<{
    title: string;
    message: string;
    type: "error" | "kick" | "ban";
  } | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // React to moderation events from the hook
  useEffect(() => {
    if (moderationEvent === "kicked") {
      setStatusModal({
        title: "Kicked from Room",
        message: "The host has removed you from this study session.",
        type: "kick"
      });
      clearModerationEvent();
    } else if (moderationEvent === "banned") {
      setStatusModal({
        title: "Banned permanently",
        message: "You have been banned from this room and can no longer enter.",
        type: "ban"
      });
      clearModerationEvent();
    }
  }, [moderationEvent, clearModerationEvent]);

  // Auto-fill name when user object loads
  useEffect(() => {
    if (user?.displayName && !displayName) {
      setDisplayName(user.displayName);
    }
  }, [user, displayName]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleCopy = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreate = async () => {
    if (!displayName.trim()) return;
    try {
      await createRoom(displayName);
    } catch (err: any) {
      setStatusModal({
        title: "Creation Failed",
        message: err.message || "Something went wrong while creating the room.",
        type: "error"
      });
    }
  };

  const handleJoin = async () => {
    if (!displayName.trim() || !joinCode.trim()) return;
    try {
      await joinRoom(joinCode, displayName);
    } catch (err: any) {
      setStatusModal({
        title: "Invalid Room",
        message: err.message || "Failed to join room.",
        type: "error"
      });
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(chatInput, displayName || "Guest");
    setChatInput("");
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
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-[400px] bg-black/60 backdrop-blur-2xl border-l border-white/10 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <Users className="w-5 h-5 text-indigo-400" />
                <h2 className="font-semibold text-lg">Study Room</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {!userId ? (
                /* ─── AUTH WALL SCREEN ─── */
                <div className="p-6 h-full flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <Lock className="w-10 h-10 text-indigo-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white">Login Required</h3>
                    <p className="text-sm text-white/50 leading-relaxed px-4">
                      Study Rooms are a social feature. Please sign in or create an account to join the community.
                    </p>
                  </div>
                  <p className="text-xs text-indigo-300 font-medium">Your progress and name will be synced automatically.</p>
                </div>
              ) : !roomId ? (
                /* ─── JOIN OR CREATE SCREEN ─── */
                <div className="p-6 space-y-8 mt-10">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-white/70" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Focus Together</h3>
                    <p className="text-sm text-white/50 leading-relaxed">
                      Join a study room to keep each other accountable.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-white/50 ml-1 mb-1 block">Display Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Study Ninja"
                        maxLength={20}
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/50 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/10">
                    <button
                      onClick={handleCreate}
                      disabled={!displayName.trim()}
                      className="w-full py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-all shadow-lg active:scale-95 disabled:opacity-50"
                    >
                      Create New Room
                    </button>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Room Code"
                        maxLength={6}
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/50 uppercase placeholder:normal-case font-mono"
                      />
                      <button
                        onClick={handleJoin}
                        disabled={!displayName.trim() || joinCode.length < 6}
                        className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-all active:scale-95 disabled:opacity-50"
                      >
                        Join
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* ─── ACTIVE ROOM SCREEN ─── */
                <div className="flex flex-col h-full">
                  {/* Room Info */}
                  <div className="p-6 pb-4 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs text-white/40 font-medium mb-1 uppercase tracking-wider">Room Code</p>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-mono font-bold tracking-widest text-indigo-300 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                            {roomId}
                          </span>
                          <button
                            onClick={handleCopy}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                          >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={leaveRoom}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium transition-colors border border-red-500/20"
                      >
                        <LogOut className="w-4 h-4" />
                        Leave
                      </button>
                    </div>
                  </div>

                  {/* Participants List */}
                  <div className="p-4 flex-1 overflow-y-auto max-h-[40vh] space-y-2">
                    <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3 px-2">
                      Members ({participants.length})
                    </h4>
                    {participants.map((p, i) => {
                      const isMe = p.id === localId;
                      const isRoomHost = p.id === studyRoom.hostId;
                      
                      return (
                        <div
                          key={p.id || i}
                          className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 group"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="relative">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-inner ${
                                p.isActive ? "bg-gradient-to-br from-emerald-400 to-teal-600" : "bg-gradient-to-br from-indigo-400 to-purple-600"
                              } text-white`}>
                                {p.name?.charAt(0).toUpperCase() || "A"}
                              </div>
                              <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-black ${p.isActive ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-indigo-400"}`} />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-white truncate max-w-[120px]">
                                  {p.name || "Anonymous"}
                                </span>
                                {studyRoom.hostId === p.id && <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />}
                                {isMe && <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/60">You</span>}
                              </div>
                              <span className={`text-[11px] font-medium tracking-wide ${p.isActive ? "text-emerald-400" : "text-indigo-300"}`}>
                                {p.isActive ? "Focusing" : p.sessionType === "shortBreak" || p.sessionType === "longBreak" ? "Taking Breaking" : "Idle"}
                                {p.completedSessions > 0 && ` • ${p.completedSessions} sessions`}
                              </span>
                            </div>
                          </div>
                          
                          {/* Kick Button for Host */}
                          {isHost && !isMe && (
                            <div className="flex items-center">
                              {confirmingKick === p.id ? (
                                <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2 duration-200">
                                  <button
                                    onClick={() => setConfirmingKick(null)}
                                    className="text-[10px] px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-white/50 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => {
                                      kickParticipant(p.id);
                                      setConfirmingKick(null);
                                    }}
                                    className="text-[10px] px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white font-bold transition-colors"
                                  >
                                    Kick
                                  </button>
                                  <button
                                    onClick={() => {
                                      banUser(p.id);
                                      setConfirmingKick(null);
                                    }}
                                    className="text-[10px] px-2 py-1 rounded-md bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold transition-colors"
                                  >
                                    Ban
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmingKick(p.id)}
                                  className="p-2 rounded-lg hover:bg-red-500/10 text-red-400/60 hover:text-red-400 transition-all"
                                  title="Kick user"
                                >
                                  <UserMinus className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Chat interface */}
                  <div className="h-[45%] flex flex-col border-t border-white/10 bg-black/40">
                    <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.map((m, i) => {
                        const isMe = m.uid === localId;
                        return (
                          <div key={m.id || i} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                            {!isMe && <span className="text-[10px] text-white/40 ml-2 mb-1">{m.name || "Anonymous"}</span>}
                             <div className={`group/msg relative px-4 py-2 rounded-2xl max-w-[85%] text-sm ${
                               isMe ? "bg-indigo-500 text-white rounded-tr-sm" : "bg-white/10 text-white/90 rounded-tl-sm"
                             }`}>
                               {m.text}
                               
                               {/* Message Actions */}
                               <div className={`absolute top-0 ${isMe ? "right-full mr-2" : "left-full ml-2"} opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center gap-1.5`}>
                                 {!isMe && (
                                   <button 
                                     onClick={() => {
                                       setReportingMessage(m);
                                       setIsReportModalOpen(true);
                                     }}
                                     className="p-1.5 rounded-lg bg-black/40 hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors"
                                     title="Report message"
                                   >
                                     <AlertTriangle className="w-3.5 h-3.5" />
                                   </button>
                                 )}
                                 {(isMe || isHost) && (
                                   <button 
                                     onClick={() => deleteMessage(m.id)}
                                     className="p-1.5 rounded-lg bg-black/40 hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors"
                                     title="Delete message"
                                   >
                                     <Trash2 className="w-3.5 h-3.5" />
                                   </button>
                                 )}
                               </div>
                             </div>
                           </div>
                        );
                      })}
                      {messages.length === 0 && (
                        <div className="h-full flex items-center justify-center text-xs text-white/30 text-center px-8">
                          Send a message to start chatting with your room.
                        </div>
                      )}
                    </div>
                    
                    {!hasAcceptedTos ? (
                      <div className="p-4 mx-4 mb-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex flex-col items-center text-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-indigo-400" />
                        <p className="text-[10px] leading-relaxed text-white/60">
                          <strong>Chat Terms & Privacy:</strong> We do not take responsibility for user-submitted content. All chats are confidential and only monitored if required by law enforcement.
                        </p>
                        <button
                          onClick={() => setHasAcceptedTos(true)}
                          className="w-full py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium transition-colors"
                        >
                          I Agree
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleSendChat} className="p-4 pt-2 flex gap-2">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Type a message..."
                          className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white outline-none focus:border-indigo-500/50"
                        />
                        <button
                          type="submit"
                          disabled={!chatInput.trim()}
                          className="p-2.5 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50 transition-colors"
                        >
                          <Send className="w-4 h-4 -ml-0.5" />
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Status Modal Overlay */}
          <AnimatePresence>
            {statusModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 10 }}
                  className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
                >
                  <div className={`h-2 w-full ${
                    statusModal.type === "ban" ? "bg-red-500" :
                    statusModal.type === "kick" ? "bg-amber-500" : "bg-indigo-500"
                  }`} />
                  
                  <div className="p-8 text-center">
                    <div className={`w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center ${
                      statusModal.type === "ban" ? "bg-red-500/10 text-red-400" :
                      statusModal.type === "kick" ? "bg-amber-500/10 text-amber-400" : "bg-indigo-500/10 text-indigo-400"
                    }`}>
                      {statusModal.type === "ban" ? <ShieldAlert className="w-8 h-8" /> :
                       statusModal.type === "kick" ? <Ghost className="w-8 h-8" /> : <AlertOctagon className="w-8 h-8" />}
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2">{statusModal.title}</h3>
                    <p className="text-sm text-white/50 leading-relaxed mb-8">
                      {statusModal.message}
                    </p>

                    <button
                      onClick={() => setStatusModal(null)}
                      className="w-full py-4 rounded-2xl bg-white text-black font-bold hover:bg-zinc-200 transition-colors active:scale-95"
                    >
                      Got it
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
      
      <ReportModal 
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        message={reportingMessage}
        onReport={(reason) => reportingMessage ? reportMessage(reportingMessage, reason) : Promise.resolve(false)}
      />
    </AnimatePresence>
  );
}
