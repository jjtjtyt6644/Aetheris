import { useState, useEffect, useCallback, useRef } from "react";
import { ref, onValue, set, push, serverTimestamp, onDisconnect, remove } from "firebase/database";
import { collection, addDoc, serverTimestamp as firestoreTimestamp } from "firebase/firestore";
import { rtdb, db } from "@/lib/firebase";
import { SessionType } from "./useTimer";

export interface Participant {
  id: string;
  name: string;
  joinedAt: number;
  isActive: boolean;
  sessionType: SessionType;
  completedSessions: number;
}

export interface ChatMessage {
  id: string;
  uid: string;
  name: string;
  text: string;
  timestamp: number;
}

export interface RoomState {
  hostId: string;
}

export function useStudyRoom(userId: string | undefined) {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [hostId, setHostId] = useState<string | null>(null);
  const [bans, setBans] = useState<Record<string, boolean>>({});
  const [moderationEvent, setModerationEvent] = useState<"kicked" | "banned" | null>(null);

  const localIdRef = useRef(userId || crypto.randomUUID());
  const leavingVoluntarilyRef = useRef(false);

  useEffect(() => {
    if (userId) localIdRef.current = userId;
  }, [userId]);

  const joinRoom = useCallback(async (code: string, displayName: string) => {
    const codeUpper = code.toUpperCase();
    const roomRef = ref(rtdb, `rooms/${codeUpper}`);
    
    // Check if banned first
    const roomsSnapshot = await new Promise<any>((resolve) => {
      onValue(roomRef, (snap) => resolve(snap.val()), { onlyOnce: true });
    });
    
    if (!roomsSnapshot) {
      throw new Error("Invalid Room Code. This room doesn't exist or has been closed.");
    }
    
    if (roomsSnapshot?.bans && roomsSnapshot.bans[localIdRef.current]) {
      throw new Error("You have been banned from this room.");
    }

    setRoomId(codeUpper);

    const participantRef = ref(rtdb, `rooms/${codeUpper}/participants/${localIdRef.current}`);
    
    // Set participant on join
    await set(participantRef, {
      id: localIdRef.current,
      name: displayName,
      joinedAt: Date.now(),
      isActive: false,
      sessionType: "focus",
      completedSessions: 0
    });

    onDisconnect(participantRef).remove();
  }, []);

  const createRoom = useCallback(async (displayName: string) => {
    const code = crypto.randomUUID().substring(0, 6).toUpperCase();
    const roomRef = ref(rtdb, `rooms/${code}`);
    
    await set(roomRef, {
      hostId: localIdRef.current,
      createdAt: Date.now()
    });

    const participantRef = ref(rtdb, `rooms/${code}/participants/${localIdRef.current}`);
    await set(participantRef, {
      id: localIdRef.current,
      name: displayName,
      joinedAt: Date.now(),
      isActive: false,
      sessionType: "focus",
      completedSessions: 0
    });

    onDisconnect(participantRef).remove();
    // In an independent timer model, we don't destroy the room when the host leaves.
    // Instead, the room persists until all users leave.
    
    setRoomId(code);
    setIsHost(true);
    return code;
  }, []);

  const exitRoom = useCallback(() => {
    setRoomId(null);
    setParticipants([]);
    setMessages([]);
    setIsHost(false);
    setBans({});
  }, []);

  const leaveRoom = useCallback(async () => {
    if (!roomId) return;
    
    const currentRoomId = roomId; 
    leavingVoluntarilyRef.current = true;
    const participantRef = ref(rtdb, `rooms/${currentRoomId}/participants/${localIdRef.current}`);
    await set(participantRef, null);

    // If we were the last one in the room (client side check), schedule room deletion 60s
    if (participants.length <= 1) {
      setTimeout(async () => {
        // Try to delete the room node. 
        // Our security rules will allow this if the room is empty.
        const roomRef = ref(rtdb, `rooms/${currentRoomId}`);
        set(roomRef, null).catch(err => {
          console.log("[Cleanup] Room deletion skipped (likely someone joined):", err.message);
        });
      }, 60000);
    }

    exitRoom();
    leavingVoluntarilyRef.current = false;
  }, [roomId, participants.length, exitRoom]);

  // Handle being kicked
  useEffect(() => {
    if (!roomId) return;
    const participantRef = ref(rtdb, `rooms/${roomId}/participants/${localIdRef.current}`);
    const unsubscribe = onValue(participantRef, (snap) => {
      if (!snap.exists() && !leavingVoluntarilyRef.current) {
        setModerationEvent("kicked");
        exitRoom();
      }
    });

    const roomRef = ref(rtdb, `rooms/${roomId}`);
    const unsubscribeBan = onValue(roomRef, (snap) => {
      const data = snap.val();
      if (data?.bans && data.bans[localIdRef.current]) {
        setModerationEvent("banned");
        exitRoom();
      }
    });

    return () => {
      unsubscribe();
      unsubscribeBan();
    };
  }, [roomId, userId]);

  // Reactive host check
  useEffect(() => {
    if (!roomId) return;

    const roomRef = ref(rtdb, `rooms/${roomId}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        // Room was closed
        setRoomId(null);
        setParticipants([]);
        setMessages([]);
        setIsHost(false);
        return;
      }

      setIsHost(data.hostId === localIdRef.current);
      setHostId(data.hostId);

      if (data.participants) {
        const pArray = Object.values(data.participants) as Participant[];
        pArray.sort((a, b) => a.joinedAt - b.joinedAt);
        setParticipants(pArray);
      } else {
        setParticipants([]);
      }

      if (data.chat) {
        const mArray = Object.values(data.chat) as ChatMessage[];
        mArray.sort((a, b) => a.timestamp - b.timestamp);
        // Only keep last 50 messages to prevent heavy DOM rendering
        setMessages(mArray.slice(-50));
      } else {
        setMessages([]);
      }

      if (data.bans) {
        setBans(data.bans);
      } else {
        setBans({});
      }
    });

    return () => unsubscribe();
  }, [roomId, userId]);

  // Reactive host check
  useEffect(() => {
    if (hostId) {
      setIsHost(hostId === (userId || localIdRef.current));
    }
  }, [userId, hostId]);

  // Send Chat Message
  const sendMessage = useCallback((text: string, displayName: string) => {
    if (!roomId) return;
    const chatRef = ref(rtdb, `rooms/${roomId}/chat`);
    const newMsgRef = push(chatRef);
    set(newMsgRef, {
      id: newMsgRef.key,
      uid: localIdRef.current,
      name: displayName,
      text,
      timestamp: serverTimestamp()
    });
  }, [roomId]);

  // Kick Participant (Host Only)
  const kickParticipant = useCallback((uid: string) => {
    if (!roomId || !isHost || uid === localIdRef.current) return;
    const participantRef = ref(rtdb, `rooms/${roomId}/participants/${uid}`);
    set(participantRef, null);
  }, [roomId, isHost]);

  // Sync Local Timer Status
  const syncTimerStatus = useCallback((isActive: boolean, sessionType: SessionType, completedSessions: number, name?: string) => {
    if (!roomId) return;
    const participantRef = ref(rtdb, `rooms/${roomId}/participants/${localIdRef.current}`);
    
    // Use update on the participant's specific ref instead of the root to avoid permission errors
    import("firebase/database").then(({ update }) => {
      const payload: any = {
        isActive,
        sessionType,
        completedSessions
      };
      if (name) payload.name = name;
      
      update(participantRef, payload);
    });
  }, [roomId]);

  return {
    roomId,
    participants,
    messages,
    isHost,
    hostId,
    createRoom,
    joinRoom,
    leaveRoom,
    sendMessage,
    kickParticipant,
    banUser: useCallback((uid: string) => {
      if (!roomId || !isHost) return;
      const banRef = ref(rtdb, `rooms/${roomId}/bans/${uid}`);
      set(banRef, true);
      // Also kick them
      kickParticipant(uid);
    }, [roomId, isHost, kickParticipant]),
    deleteMessage: useCallback((msgId: string) => {
      if (!roomId) return;
      const msgRef = ref(rtdb, `rooms/${roomId}/chat/${msgId}`);
      set(msgRef, null);
    }, [roomId]),
    reportMessage: useCallback(async (msg: ChatMessage, reason: string) => {
      if (!roomId) return false;
      try {
        await addDoc(collection(db, "reports"), {
          reporterUid: localIdRef.current,
          reportedUid: msg.uid,
          reportedName: msg.name,
          messageId: msg.id,
          messageText: msg.text,
          roomCode: roomId,
          reason,
          timestamp: firestoreTimestamp()
        });
        return true;
      } catch (err) {
        console.error("Failed to submit report:", err);
        return false;
      }
    }, [roomId]),
    syncTimerStatus,
    localId: localIdRef.current,
    bans,
    moderationEvent,
    clearModerationEvent: () => setModerationEvent(null)
  };
}
