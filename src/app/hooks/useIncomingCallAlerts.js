import { useEffect, useRef } from "react";
import {
  INCOMING_CALL_MAX_AGE_MS,
  INCOMING_CALL_RING_MS,
  createIncomingCallRingtone,
  isNativeApp,
  scheduleNativeNotification,
  unlockIncomingCallAudio,
} from "../lib/native-notifications.js";

export const useIncomingCallAudioUnlock = () => {
  useEffect(() => {
    const unlock = () => void unlockIncomingCallAudio();
    window.addEventListener("pointerdown", unlock, { passive: true });
    window.addEventListener("touchstart", unlock, { passive: true });
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("touchstart", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);
};

export const useIncomingCallDetection = ({
  clientChats,
  currentUserId,
  handledIncomingCallIdsRef,
  setIncomingCall,
}) => {
  useEffect(() => {
    const myId = String(currentUserId || "");
    if (!myId) {
      setIncomingCall(null);
      return;
    }

    const endedRoomIds = new Set(
      clientChats
        .filter((message) => message.call?.ended && message.call?.roomId)
        .map((message) => String(message.call.roomId)),
    );
    const now = Date.now();
    const nextIncomingCall = [...clientChats]
      .filter((message) => {
        if (!message.id || !message.call?.roomId || message.call.ended)
          return false;
        if (endedRoomIds.has(String(message.call.roomId))) return false;
        if (String(message.authorId || "") === myId) return false;
        if (
          !Array.isArray(message.mentionedIds) ||
          !message.mentionedIds.map(String).includes(myId)
        )
          return false;
        if (handledIncomingCallIdsRef.current.has(String(message.id)))
          return false;
        const createdAt = new Date(message.createdAt || 0).getTime();
        return (
          Number.isFinite(createdAt) &&
          now - createdAt >= 0 &&
          now - createdAt < INCOMING_CALL_MAX_AGE_MS
        );
      })
      .sort((a, b) =>
        String(b.createdAt || "").localeCompare(a.createdAt || ""),
      )[0];

    setIncomingCall((current) => {
      if (!nextIncomingCall) return null;
      return String(current?.id || "") === String(nextIncomingCall.id)
        ? current
        : nextIncomingCall;
    });
  }, [
    clientChats,
    currentUserId,
    handledIncomingCallIdsRef,
    setIncomingCall,
  ]);
};

export const useIncomingCallRingtone = ({
  incomingCall,
  clients,
  nativePushReady,
  handledIncomingCallIdsRef,
  setIncomingCall,
  onAnswer,
}) => {
  const clientsRef = useRef(clients);
  const nativePushReadyRef = useRef(nativePushReady);
  const onAnswerRef = useRef(onAnswer);
  clientsRef.current = clients;
  nativePushReadyRef.current = nativePushReady;
  onAnswerRef.current = onAnswer;

  useEffect(() => {
    if (!incomingCall?.id) return;
    const ringtone = createIncomingCallRingtone();
    ringtone.start();
    const client = clientsRef.current.find(
      (item) => String(item.id) === String(incomingCall.clientId),
    );
    const title = `Llamada entrante · ${client?.name || "Cliente"}`;
    const body = `${incomingCall.authorName || "Alguien"} te está llamando`;
    if (isNativeApp()) {
      if (!nativePushReadyRef.current) {
        void scheduleNativeNotification({
          title,
          body,
          isCall: true,
          data: {
            type: "call",
            messageId: String(incomingCall.id),
            clientId: String(incomingCall.clientId || ""),
            roomId: String(incomingCall.call?.roomId || ""),
          },
        });
      }
    } else if (
      typeof Notification !== "undefined" &&
      Notification.permission === "granted"
    ) {
      try {
        const notification = new Notification(title, {
          body,
          tag: `cluster-call-${incomingCall.id}`,
          requireInteraction: true,
        });
        notification.onclick = () => {
          window.focus();
          onAnswerRef.current?.(true);
          notification.close();
        };
      } catch {}
    }
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([350, 180, 350]);
    }
    const timeoutId = window.setTimeout(() => {
      handledIncomingCallIdsRef.current.add(String(incomingCall.id));
      setIncomingCall((current) =>
        String(current?.id || "") === String(incomingCall.id) ? null : current,
      );
    }, INCOMING_CALL_RING_MS);
    return () => {
      ringtone.stop();
      window.clearTimeout(timeoutId);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(0);
      }
    };
  }, [incomingCall?.id]);
};
