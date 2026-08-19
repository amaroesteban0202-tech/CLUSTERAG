import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "../icons.jsx";
import {
  EMBEDDED_UPLOAD_MAX_BYTES,
  CHAT_MUTE_FOREVER,
  isChatMuteActive,
  formatChatMuteUntil,
} from "../../constants/chat.js";
import { apiFetch } from "../../lib/backend-api.js";
import { getCallRoomAlias } from "../../lib/call-links.js";
import {
  CHAT_TASK_CHIP_STYLES,
  CHAT_TASK_LABELS,
  CHAT_REACTIONS,
  CHAT_REACTION_PICKER,
  CHAT_VOICE_WAVEFORM,
  chatAvatarColor,
} from "./constants.js";
import { StickerImage } from "./StickerImage.jsx";
import { ChatVoiceNote } from "./ChatVoiceNote.jsx";

const renderChatText = (text = "", onColored = false) =>
  String(text)
    .split(/(@[^\s@]+)/g)
    .map((part, index) =>
      part.startsWith("@") ? (
        <span
          key={index}
          className={
            onColored
              ? "font-bold underline"
              : "font-semibold text-blue-600 dark:text-blue-400"
          }
        >
          {part}
        </span>
      ) : (
        <React.Fragment key={index}>{part}</React.Fragment>
      ),
    );

const getChatReactionDefinition = (key) =>
  CHAT_REACTIONS.find((reaction) => reaction.key === key) || {
    key,
    label: "Reacción",
    emoji: "✨",
  };

let jaasScriptPromise = null;
const loadJaasExternalApi = (appId) => {
  if (typeof window !== "undefined" && window.JitsiMeetExternalAPI) {
    return Promise.resolve();
  }
  if (jaasScriptPromise) return jaasScriptPromise;
  jaasScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://8x8.vc/${appId}/external_api.js`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      jaasScriptPromise = null;
      reject(new Error("No se pudo cargar el SDK de la llamada."));
    };
    document.body.appendChild(script);
  });
  return jaasScriptPromise;
};

const buildChatRoomId = (clientName = "") => {
  const slug =
    String(clientName)
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24) || "sala";
  return `cluster-${slug}-${Math.random().toString(36).slice(2, 8)}`;
};
const chatFileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
const formatChatBytes = (bytes = 0) => {
  if (!bytes) return "";
  const kb = bytes / 1024;
  return kb < 1024 ? `${Math.round(kb)} KB` : `${(kb / 1024).toFixed(1)} MB`;
};
const isChatImage = (type = "") => String(type).startsWith("image/");
const isChatVideo = (type = "") => String(type).startsWith("video/");
const isChatAudio = (type = "") => String(type).startsWith("audio/");

const formatVoiceDuration = (seconds = 0) => {
  const safeSeconds = Number.isFinite(Number(seconds))
    ? Math.max(0, Math.floor(Number(seconds)))
    : 0;
  return `${Math.floor(safeSeconds / 60)}:${String(safeSeconds % 60).padStart(2, "0")}`;
};

const chatShortTime = (iso) => {
  try {
    return new Date(iso).toLocaleTimeString("es", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

const chatDayKey = (iso) => {
  try {
    return new Date(iso).toDateString();
  } catch {
    return "";
  }
};
const chatDayLabel = (iso) => {
  try {
    const date = new Date(iso);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Hoy";
    if (date.toDateString() === yesterday.toDateString()) return "Ayer";
    return date.toLocaleDateString("es", {
      day: "numeric",
      month: "long",
      year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
    });
  } catch {
    return "";
  }
};

// Chat interno por cliente: lista de conversaciones + hilo + composer
// con @menciones, enlace opcional a una tarea y adjuntos (imágenes/video/PDF).
export const ClientChatView = ({
  clients = [],
  clientChats = [],
  chatUnread = { byClient: {}, total: 0 },
  chatMuteMap = {},
  activeClient,
  onSelectClient,
  onSetMute,
  onSendMessage,
  onOpenTask,
  onDeleteForEveryone,
  onDeleteForMe,
  hiddenIds,
  reactions = [],
  pins = [],
  stickers = [],
  onAddSticker,
  onDeleteSticker,
  onReact,
  onPin,
  onForward,
  onEndCall,
  currentUserId = "",
  currentUserProfile,
  canModerate = false,
  mentionables = [],
  groupsByClient = {},
  groupsLoaded = false,
  currentGroupMemberId = "",
  canManageMembers = false,
  canLeaveGroup = false,
  onUpdateMembers,
  accountTasks = [],
  editingTasks = [],
  managementTasks = [],
  fetchFullMessage,
  incomingCallToJoin = null,
  onIncomingCallJoined,
}) => {
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [menuFor, setMenuFor] = useState(null);
  const [reactionPickerFor, setReactionPickerFor] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [forwardTarget, setForwardTarget] = useState(null);
  const [forwardSearch, setForwardSearch] = useState("");
  const [callPicker, setCallPicker] = useState(null);
  const [callSelected, setCallSelected] = useState([]);
  const [callSearch, setCallSearch] = useState("");
  const [activeCall, setActiveCall] = useState(null);
  const [callError, setCallError] = useState("");
  const [muteMenuOpen, setMuteMenuOpen] = useState(false);
  const [muteClock, setMuteClock] = useState(() => Date.now());
  const [membersOpen, setMembersOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberDraftIds, setMemberDraftIds] = useState([]);
  const [savingMembers, setSavingMembers] = useState(false);
  const callContainerRef = useRef(null);
  const jitsiApiRef = useRef(null);
  const [text, setText] = useState("");
  const [mentionedIds, setMentionedIds] = useState([]);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStart, setMentionStart] = useState(-1);
  const [taskRef, setTaskRef] = useState(null);
  const [taskPickerOpen, setTaskPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pending, setPending] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [fullMap, setFullMap] = useState({});
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [stickerOpen, setStickerOpen] = useState(false);
  const [uploadingSticker, setUploadingSticker] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingPaused, setRecordingPaused] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const textareaRef = useRef(null);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const stickerInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  const recordSecondsRef = useRef(0);
  const discardRef = useRef(false);
  const sendRecordingRef = useRef(false);
  const recordContextRef = useRef(null);

  useEffect(
    () => () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      discardRef.current = true;
      const recorder = mediaRecorderRef.current;
      if (recorder?.state && recorder.state !== "inactive") recorder.stop();
      recorder?.stream?.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  const myId = String(currentUserProfile?.id || "");
  const activeMuteUntil = activeClient
    ? chatMuteMap[String(activeClient.id)] || ""
    : "";
  const activeClientMuted = isChatMuteActive(activeMuteUntil, muteClock);

  useEffect(() => {
    setMuteMenuOpen(false);
    setMembersOpen(false);
  }, [activeClient?.id]);

  useEffect(() => {
    const hasTimedMute = Object.values(chatMuteMap).some(
      (mutedUntil) =>
        mutedUntil !== CHAT_MUTE_FOREVER &&
        Number.isFinite(Date.parse(String(mutedUntil || ""))),
    );
    if (!hasTimedMute) return;
    const intervalId = window.setInterval(() => setMuteClock(Date.now()), 60000);
    return () => window.clearInterval(intervalId);
  }, [chatMuteMap]);

  // Biblioteca de stickers: base SVG propia + los subidos por el equipo (webp/gif/png).
  const customStickerMap = {};
  (stickers || []).forEach((item) => {
    if (item?.id) customStickerMap[item.id] = item;
  });
  const customStickers = [...(stickers || [])].sort((a, b) =>
    (b.createdAt || "") > (a.createdAt || "") ? 1 : -1,
  );
  const renderSticker = (id, size, className = "") => {
    const custom = customStickerMap[id];
    if (custom?.data) {
      return (
        <img
          src={custom.data}
          alt={custom.name || "sticker"}
          draggable={false}
          className={`inline-block select-none object-contain ${className}`}
          style={{ width: size, height: size }}
        />
      );
    }
    return <StickerImage id={id} size={size} className={className} />;
  };

  const lastMsgByClient = {};
  clientChats.forEach((message) => {
    if (!message.clientId) return;
    const prev = lastMsgByClient[message.clientId];
    if (!prev || (message.createdAt || "") > (prev.createdAt || "")) {
      lastMsgByClient[message.clientId] = message;
    }
  });

  const previewText = (message) => {
    if (!message) return "Sin mensajes";
    if (message.call) return message.call.ended ? "Llamada finalizada" : "Llamada";
    if (message.deleted) return "Mensaje eliminado";
    if (message.text) return message.text;
    if (message.sticker) return "Sticker";
    const count = Array.isArray(message.attachments)
      ? message.attachments.length
      : 0;
    if (count === 1 && isChatAudio(message.attachments[0]?.type)) {
      return "Nota de voz";
    }
    return count > 0 ? `${count} archivo${count === 1 ? "" : "s"}` : "…";
  };

  const membershipIdentity = String(
    currentGroupMemberId || currentUserProfile?.id || "",
  );
  const belongsToChatGroup = (clientId) =>
    (groupsByClient[String(clientId)]?.memberIds || [])
      .map(String)
      .includes(membershipIdentity);
  const term = search.trim().toLowerCase();
  const matchingClients = [...clients]
    .filter((client) => !term || (client.name || "").toLowerCase().includes(term))
    .sort((a, b) => {
      const aTime = lastMsgByClient[a.id]?.createdAt || "";
      const bTime = lastMsgByClient[b.id]?.createdAt || "";
      if (aTime !== bTime) return aTime > bTime ? -1 : 1;
      return (a.name || "").localeCompare(b.name || "");
    });
  const activeClients = groupsLoaded
    ? matchingClients.filter((client) => belongsToChatGroup(client.id))
    : matchingClients;
  const activeClientCount = groupsLoaded
    ? clients.filter((client) => belongsToChatGroup(client.id)).length
    : clients.length;
  const archivedClients = groupsLoaded
    ? matchingClients.filter((client) => !belongsToChatGroup(client.id))
    : [];
  const archivedClientCount = groupsLoaded
    ? clients.filter((client) => !belongsToChatGroup(client.id)).length
    : 0;
  const sortedClients = showArchived ? archivedClients : activeClients;

  const messages = activeClient
    ? clientChats
        .filter(
          (message) =>
            message.clientId === activeClient.id &&
            !(hiddenIds && hiddenIds.has(String(message.id))),
        )
        .sort((a, b) => ((a.createdAt || "") > (b.createdAt || "") ? 1 : -1))
    : [];

  // Reacciones agrupadas por mensaje: { messageId: { emoji: {count, mine, names} } }
  const reactionsByMessage = {};
  reactions.forEach((reaction) => {
    if (!reaction.messageId || !reaction.emoji) return;
    const byEmoji = (reactionsByMessage[reaction.messageId] ||= {});
    const entry = (byEmoji[reaction.emoji] ||= { count: 0, mine: false, names: [] });
    entry.count += 1;
    if (reaction.userName) entry.names.push(reaction.userName);
    if (String(reaction.userId || "") === String(currentUserId)) entry.mine = true;
  });

  const pinnedIds = new Set(
    pins
      .filter((pin) => activeClient && pin.clientId === activeClient.id)
      .map((pin) => String(pin.messageId)),
  );
  const pinnedMessages = messages.filter(
    (message) => pinnedIds.has(String(message.id)) && !message.deleted,
  );

  const clientTasks = activeClient
    ? [
        ...accountTasks
          .filter((task) => task.clientId === activeClient.id)
          .map((task) => ({ id: task.id, title: task.title, type: "accountTask" })),
        ...editingTasks
          .filter((task) => task.clientId === activeClient.id)
          .map((task) => ({ id: task.id, title: task.title, type: "editingTask" })),
        ...managementTasks
          .filter((task) => task.clientId === activeClient.id)
          .map((task) => ({ id: task.id, title: task.title, type: "managementTask" })),
      ]
    : [];

  const activeGroup = activeClient
    ? groupsByClient[String(activeClient.id)] || {
        clientId: String(activeClient.id),
        memberIds: [],
        source: "history",
      }
    : null;
  const activeGroupMemberIds = (activeGroup?.memberIds || []).map(String);
  const activeGroupMemberSet = new Set(activeGroupMemberIds);
  const isActiveGroupMember = activeGroupMemberSet.has(membershipIdentity);
  const canInteractWithActiveGroup =
    !groupsLoaded || isActiveGroupMember;
  const activeGroupMembers = mentionables.filter((person) =>
    activeGroupMemberSet.has(String(person.id)),
  );
  const scopedMentionables = groupsLoaded ? activeGroupMembers : [];
  const callMentionables = groupsLoaded
    ? mentionables.filter(
        (person) =>
          activeGroupMemberSet.has(String(person.id)) ||
          person.canReceiveCallsOutsideGroups === true,
      )
    : [];

  const mentionSuggestions = mentionOpen
    ? scopedMentionables
        .filter((person) => {
          const q = mentionQuery.toLowerCase();
          if (!q) return true;
          return (
            (person.name || "").toLowerCase().includes(q) ||
            (person.email || "").toLowerCase().includes(q)
          );
        })
        .slice(0, 30)
    : [];

  const openMembers = () => {
    setMemberDraftIds(activeGroupMemberIds);
    setMemberSearch("");
    setMembersOpen(true);
  };

  const saveMembers = async () => {
    if (!activeClient?.id || !onUpdateMembers || savingMembers) return;
    setSavingMembers(true);
    try {
      await onUpdateMembers(activeClient.id, memberDraftIds);
      setMembersOpen(false);
    } catch {
      // El contenedor ya muestra el mensaje devuelto por el servidor.
    } finally {
      setSavingMembers(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeClient?.id, messages.length]);

  // Al contestar desde el aviso global, abre la sala directamente sin requerir
  // un segundo clic sobre la tarjeta del chat.
  useEffect(() => {
    if (!incomingCallToJoin?.roomId) return;
    setActiveCall({
      roomId: incomingCallToJoin.roomId,
      messageId: incomingCallToJoin.messageId || null,
      isHost: false,
    });
    if (onIncomingCallJoined) onIncomingCallJoined(incomingCallToJoin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingCallToJoin?.roomId, incomingCallToJoin?.messageId]);

  // Trae el base64 de los adjuntos (los listados llegan solo con metadata).
  useEffect(() => {
    if (!activeClient || typeof fetchFullMessage !== "function") return;
    let cancelled = false;
    const need = messages.filter((message) => {
      const atts = message.attachments || [];
      if (atts.length === 0 || fullMap[message.id]) return false;
      if (atts.some((a) => a.data)) return false;
      return atts.some((a) => a.hasData);
    });
    if (need.length === 0) return;
    (async () => {
      const results = await Promise.all(
        need.map(async (message) => [
          message.id,
          (await fetchFullMessage(message.id))?.attachments || [],
        ]),
      );
      if (cancelled) return;
      setFullMap((prev) => {
        const next = { ...prev };
        results.forEach(([id, atts]) => {
          next[id] = atts;
        });
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeClient?.id, messages.length]);

  // Monta la videollamada (Jitsi as a Service) cuando hay una llamada activa.
  useEffect(() => {
    if (!activeCall) return;
    let disposed = false;
    let api = null;
    setCallError("");
    (async () => {
      try {
        const tok = await apiFetch("/api/calls/jaas-token", {
          method: "POST",
          body: JSON.stringify({
            roomId: activeCall.roomId,
            messageId: activeCall.messageId,
            clientId: activeClient?.id || "",
          }),
        });
        if (disposed || !tok?.jwt || !tok?.appId) return;
        await loadJaasExternalApi(tok.appId);
        if (
          disposed ||
          !callContainerRef.current ||
          !window.JitsiMeetExternalAPI
        )
          return;
        api = new window.JitsiMeetExternalAPI("8x8.vc", {
          roomName: `${tok.appId}/${activeCall.roomId}`,
          jwt: tok.jwt,
          parentNode: callContainerRef.current,
          configOverwrite: {
            prejoinPageEnabled: false,
            brandingRoomAlias: getCallRoomAlias(activeCall.roomId),
          },
          userInfo: {
            displayName: currentUserProfile?.name || "Usuario",
            email: currentUserProfile?.email || "",
          },
        });
        jitsiApiRef.current = api;
        api.addEventListener("readyToClose", () => {
          if (activeCall.isHost && onEndCall) {
            onEndCall(activeCall.messageId, {
              roomId: activeCall.roomId,
              provider: "jaas",
            });
          }
          setActiveCall(null);
        });
      } catch (error) {
        if (!disposed) setCallError(error.message || "No se pudo iniciar la llamada.");
      }
    })();
    return () => {
      disposed = true;
      try {
        if (api) api.dispose();
      } catch {
        /* noop */
      }
      jitsiApiRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCall?.roomId]);

  const handleTextChange = (event) => {
    const value = event.target.value;
    setText(value);
    const caret = event.target.selectionStart ?? value.length;
    const before = value.slice(0, caret);
    const atMatch = before.match(/@([^\s@]*)$/);
    if (atMatch) {
      setMentionOpen(true);
      setMentionQuery(atMatch[1]);
      setMentionStart(before.lastIndexOf("@"));
      // Evita que se superpongan los desplegables.
      setTaskPickerOpen(false);
      setAttachMenuOpen(false);
    } else {
      setMentionOpen(false);
      setMentionQuery("");
      setMentionStart(-1);
    }
  };

  const insertMention = (person) => {
    const before = text.slice(0, mentionStart);
    const after = text.slice(mentionStart + 1 + mentionQuery.length);
    setText(`${before}@${person.name} ${after}`);
    setMentionedIds((prev) =>
      prev.includes(person.id) ? prev : [...prev, person.id],
    );
    setMentionOpen(false);
    setMentionQuery("");
    setMentionStart(-1);
    setTimeout(() => textareaRef.current && textareaRef.current.focus(), 0);
  };

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    let pendingSize = pending.reduce(
      (total, attachment) => total + Number(attachment?.size || 0),
      0,
    );
    setUploading(true);
    try {
      for (const file of files) {
        if (pendingSize + file.size > EMBEDDED_UPLOAD_MAX_BYTES) {
          alert("Los archivos pendientes no pueden superar 3 MB en total.");
          continue;
        }
        const data = await chatFileToBase64(file);
        pendingSize += file.size;
        setPending((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).slice(2, 10),
            name: file.name,
            type: file.type,
            size: file.size,
            data,
          },
        ]);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const openFilePicker = (accept) => {
    setAttachMenuOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept || "";
      fileInputRef.current.click();
    }
  };

  const startRecordTimer = () => {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    recordTimerRef.current = setInterval(() => {
      recordSecondsRef.current += 1;
      setRecordSeconds(recordSecondsRef.current);
    }, 1000);
  };

  const startRecording = async () => {
    if (recording) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      alert("Tu navegador no permite grabar audio.");
      return;
    }
    try {
      setMentionOpen(false);
      setTaskPickerOpen(false);
      setAttachMenuOpen(false);
      setStickerOpen(false);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      discardRef.current = false;
      sendRecordingRef.current = false;
      recordSecondsRef.current = 0;
      recordContextRef.current = {
        clientId: activeClient?.id || "",
        replyTo: replyingTo
          ? {
              id: replyingTo.id,
              authorName: replyingTo.authorName,
              text: replyingTo.text,
              sticker: replyingTo.sticker || null,
            }
          : null,
      };
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        mediaRecorderRef.current = null;
        stream.getTracks().forEach((track) => track.stop());
        if (discardRef.current) {
          discardRef.current = false;
          sendRecordingRef.current = false;
          recordSecondsRef.current = 0;
          recordContextRef.current = null;
          return;
        }
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        if (blob.size === 0) {
          sendRecordingRef.current = false;
          recordSecondsRef.current = 0;
          recordContextRef.current = null;
          return;
        }
        if (blob.size > EMBEDDED_UPLOAD_MAX_BYTES) {
          alert("La nota de voz supera el máximo de 3 MB.");
          sendRecordingRef.current = false;
          recordSecondsRef.current = 0;
          recordContextRef.current = null;
          return;
        }
        const data = await chatFileToBase64(blob);
        const voiceAttachment = {
          id: Math.random().toString(36).slice(2, 10),
          name: `nota-de-voz-${Date.now()}.webm`,
          type: blob.type || "audio/webm",
          size: blob.size,
          duration: recordSecondsRef.current,
          data,
        };
        if (sendRecordingRef.current && recordContextRef.current?.clientId) {
          setSubmitting(true);
          try {
            await onSendMessage({
              clientId: recordContextRef.current.clientId,
              attachments: [voiceAttachment],
              replyTo: recordContextRef.current.replyTo,
            });
            setReplyingTo(null);
          } catch {
            setPending((prev) => [...prev, voiceAttachment]);
            alert(
              "No se pudo enviar la nota de voz. Quedó adjunta para que puedas reintentar.",
            );
          } finally {
            setSubmitting(false);
          }
        } else {
          setPending((prev) => [...prev, voiceAttachment]);
        }
        sendRecordingRef.current = false;
        recordSecondsRef.current = 0;
        recordContextRef.current = null;
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setRecordingPaused(false);
      setRecordSeconds(0);
      startRecordTimer();
    } catch {
      alert("No se pudo acceder al micrófono.");
    }
  };

  const toggleRecordingPause = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    if (recorder.state === "recording") {
      recorder.pause();
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
      setRecordingPaused(true);
      return;
    }
    if (recorder.state === "paused") {
      recorder.resume();
      setRecordingPaused(false);
      startRecordTimer();
    }
  };

  const stopRecording = (discard = false, sendImmediately = false) => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    discardRef.current = discard;
    sendRecordingRef.current = sendImmediately && !discard;
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    setRecording(false);
    setRecordingPaused(false);
    setRecordSeconds(0);
  };

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if ((!trimmed && pending.length === 0) || submitting || !activeClient) return;
    setSubmitting(true);
    try {
      await onSendMessage({
        clientId: activeClient.id,
        text: trimmed,
        mentionedIds,
        taskRef,
        attachments: pending,
        replyTo: replyingTo
          ? {
              id: replyingTo.id,
              authorName: replyingTo.authorName,
              text: replyingTo.text,
              sticker: replyingTo.sticker || null,
            }
          : null,
      });
      setText("");
      setMentionedIds([]);
      setTaskRef(null);
      setPending([]);
      setReplyingTo(null);
      setMentionOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendSticker = async (stickerId) => {
    if (!stickerId || submitting || !activeClient) return;
    setStickerOpen(false);
    setSubmitting(true);
    try {
      await onSendMessage({
        clientId: activeClient.id,
        sticker: stickerId,
        replyTo: replyingTo
          ? {
              id: replyingTo.id,
              authorName: replyingTo.authorName,
              text: replyingTo.text,
              sticker: replyingTo.sticker || null,
            }
          : null,
      });
      setReplyingTo(null);
    } finally {
      setSubmitting(false);
    }
  };

  const STICKER_MAX = 512 * 1024;
  const handleStickerUpload = async (fileList) => {
    const file = (fileList || [])[0];
    if (!file) return;
    const okTypes = [
      "image/webp",
      "image/gif",
      "image/png",
      "image/jpeg",
    ];
    if (!okTypes.includes(file.type)) {
      alert("Usa una imagen webp, gif, png o jpg.");
      return;
    }
    if (file.size > STICKER_MAX) {
      alert("El sticker supera el máximo de 512 KB.");
      return;
    }
    setUploadingSticker(true);
    try {
      const data = await chatFileToBase64(file);
      if (onAddSticker) {
        await onAddSticker({
          name: file.name.replace(/\.[^.]+$/, ""),
          type: file.type,
          data,
        });
      }
    } finally {
      setUploadingSticker(false);
      if (stickerInputRef.current) stickerInputRef.current.value = "";
    }
  };

  const renderAttachment = (
    att,
    { mine = false, authorName = "Usuario", avatarUrl = "", compact = false } = {},
  ) => {
    const key = att.id || att.name;
    if (isChatAudio(att.type)) {
      return (
        <ChatVoiceNote
          key={key}
          attachment={att}
          mine={mine}
          authorName={authorName}
          avatarUrl={avatarUrl}
          compact={compact}
        />
      );
    }
    if (att.data && isChatImage(att.type)) {
      return (
        <a
          key={key}
          href={att.data}
          target="_blank"
          rel="noreferrer"
          className="block"
        >
          <img
            src={att.data}
            alt={att.name}
            className="max-h-56 max-w-[260px] rounded-lg border border-slate-200 object-cover dark:border-white/10"
          />
        </a>
      );
    }
    if (att.data && isChatVideo(att.type)) {
      return (
        <video
          key={key}
          src={att.data}
          controls
          className="max-h-60 max-w-[300px] rounded-lg border border-slate-200 dark:border-white/10"
        />
      );
    }
    return (
      <a
        key={key}
        href={att.data || undefined}
        download={att.name}
        target="_blank"
        rel="noreferrer"
        className={`inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-white/10 dark:bg-slate-800 ${att.data ? "hover:bg-slate-50 dark:hover:bg-slate-700" : "opacity-60"}`}
      >
        <Icon name="Paperclip" size={14} className="shrink-0 text-slate-500" />
        <span className="max-w-[180px] truncate font-semibold text-slate-700 dark:text-slate-200">
          {att.name}
        </span>
        <span className="text-slate-400">
          {att.data ? formatChatBytes(att.size) : "cargando…"}
        </span>
      </a>
    );
  };

  return (
    <div className="chat-shell flex h-full min-h-0 overflow-hidden">
      {/* Lista de clientes (canales) */}
      <aside
        className={`chat-list-pane ${activeClient ? "hidden md:flex" : "flex"} min-h-0 w-full shrink-0 flex-col md:w-[21rem] lg:w-[23rem]`}
      >
        <div className="chat-list-header">
          <div className="chat-inbox-heading flex items-center gap-3">
            {showArchived && (
              <button
                type="button"
                onClick={() => {
                  setShowArchived(false);
                  setSearch("");
                  onSelectClient(null);
                }}
                aria-label="Volver a chats activos"
                className="chat-header-button chat-archive-back shrink-0"
              >
                <Icon name="ChevronLeft" size={19} />
              </button>
            )}
            <span className="chat-section-icon">
              <Icon name={showArchived ? "Inbox" : "MessageSquare"} size={19} />
            </span>
            <div className="min-w-0">
              <p className="chat-list-kicker">Cluster / equipo</p>
              <h2 className="chat-list-title">
                {showArchived ? "Archivados" : "Mensajes"}
              </h2>
              <p className="chat-list-subtitle">
                {showArchived
                  ? `${archivedClientCount} fuera de tu bandeja principal`
                  : `${activeClientCount} grupo${activeClientCount === 1 ? "" : "s"} activo${activeClientCount === 1 ? "" : "s"}`}
              </p>
            </div>
            {!showArchived && chatUnread.total > 0 && (
              <span
                className="chat-total-unread"
                aria-label={`${chatUnread.total} mensajes sin leer`}
              >
                {chatUnread.total}
              </span>
            )}
          </div>
          <div className="chat-search relative mt-5">
            <Icon
              name="Search"
              size={16}
              className="chat-search-icon absolute left-3.5 top-1/2 -translate-y-1/2"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Buscar conversación"
              placeholder={
                showArchived ? "Buscar en archivados" : "Buscar un grupo"
              }
              className="chat-search-input w-full pl-10 pr-4"
            />
          </div>
        </div>
        <div className="chat-list-scroll custom-scroll flex-1 min-h-0 overflow-y-auto">
          {!showArchived && archivedClientCount > 0 && !term && (
            <button
              type="button"
              onClick={() => {
                setShowArchived(true);
                onSelectClient(null);
              }}
              className="chat-archive-link flex w-full items-center gap-3 text-left"
            >
              <span className="chat-archive-icon">
                <Icon name="Inbox" size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <strong>Archivados</strong>
                <small>Grupos en los que no participas</small>
              </span>
              <span className="chat-archive-count">{archivedClientCount}</span>
              <Icon name="ChevronRight" size={15} className="chat-archive-chevron" />
            </button>
          )}
          {showArchived && !term && (
            <div className="chat-archive-note">
              <Icon name="Inbox" size={15} />
              <p>
                Estos grupos quedan aquí como referencia y no aparecen entre tus
                conversaciones activas.
              </p>
            </div>
          )}
          {sortedClients.length === 0 && (
            <div className="chat-empty-state">
              <span className="chat-empty-icon">
                <Icon name={showArchived ? "Inbox" : "Search"} size={21} />
              </span>
              <p>
                {showArchived ? "No hay grupos archivados" : "Tu bandeja está al día"}
              </p>
              <span>
                {term
                  ? "Prueba con otro nombre."
                  : showArchived
                    ? "Los grupos que abandones aparecerán aquí."
                    : "Los grupos activos aparecerán en este espacio."}
              </span>
            </div>
          )}
          {sortedClients.map((client) => {
            const unread = chatUnread.byClient?.[client.id] || 0;
            const last = lastMsgByClient[client.id];
            const isActive = activeClient?.id === client.id;
            const muted = isChatMuteActive(
              chatMuteMap[String(client.id)] || "",
              muteClock,
            );
            return (
              <button
                key={client.id}
                onClick={() => onSelectClient(client)}
                aria-current={isActive ? "page" : undefined}
                className={`chat-list-item flex w-full items-center gap-3 text-left ${isActive ? "is-active" : ""} ${showArchived ? "is-archived" : ""}`}
              >
                <span className="chat-list-avatar-wrap relative shrink-0">
                  {client.photo ? (
                    <img
                      src={client.photo}
                      alt={client.name}
                      className="chat-list-avatar object-cover"
                    />
                  ) : (
                    <span
                      className="chat-list-avatar flex items-center justify-center text-xs font-black text-white"
                      style={{ backgroundColor: chatAvatarColor(client.name || client.id) }}
                    >
                      {(client.name || "C").slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  {!showArchived && <span className="chat-presence-dot" />}
                </span>
                <div className="chat-list-copy min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p
                      className={`chat-contact-name truncate ${unread > 0 ? "is-unread" : ""}`}
                    >
                      {client.name || "Cliente"}
                    </p>
                    {muted && (
                      <Icon
                        name="BellSlash"
                        size={13}
                        className="shrink-0 text-slate-400"
                      />
                    )}
                    {last?.createdAt && (
                      <span
                        className={`chat-list-time ${unread > 0 ? "is-unread" : ""}`}
                      >
                        {chatShortTime(last.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    {last?.sticker && (
                      <Icon name="Sticker" size={14} className="shrink-0" />
                    )}
                    <p
                      className={`chat-contact-preview truncate ${unread > 0 ? "is-unread" : ""}`}
                    >
                      {last
                        ? last.sticker
                          ? "Sticker"
                          : `${last.authorName ? `${last.authorName}: ` : ""}${previewText(last)}`
                        : "Sin mensajes todavía"}
                    </p>
                  </div>
                </div>
                {unread > 0 && (
                  <span className="chat-unread-badge ml-1 shrink-0">
                    {unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Hilo del cliente */}
      <section
        className={`chat-conversation-pane ${activeClient ? "flex" : "hidden md:flex"} min-h-0 min-w-0 flex-1 flex-col`}
      >
        {!activeClient ? (
          <div className="chat-welcome flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="chat-welcome-orbit" aria-hidden="true">
              <span className="chat-welcome-icon">
                <Icon name="MessageSquare" size={31} />
              </span>
            </div>
            <p className="chat-welcome-kicker">Mensajería interna</p>
            <h3>Las conversaciones que mueven el trabajo.</h3>
            <p>
              Elige un grupo activo para continuar donde quedó el equipo, o
              consulta Archivados cuando necesites una referencia.
            </p>
            <div className="chat-welcome-capabilities" aria-hidden="true">
              <span><Icon name="Paperclip" size={14} /> Archivos</span>
              <span><Icon name="VideoCamera" size={14} /> Llamadas</span>
              <span><Icon name="ClipboardList" size={14} /> Tareas</span>
            </div>
          </div>
        ) : (
          <>
            <div className="chat-conversation-header flex shrink-0 items-center gap-3">
              <button
                onClick={() => onSelectClient(null)}
                aria-label="Volver a la lista"
                className="chat-header-button chat-back-button md:hidden"
              >
                <Icon name="ChevronLeft" size={20} />
              </button>
              {activeClient.photo ? (
                <img
                  src={activeClient.photo}
                  alt={activeClient.name}
                  className="chat-header-avatar object-cover"
                />
              ) : (
                <div
                  className="chat-header-avatar flex items-center justify-center text-xs font-black text-white"
                  style={{ backgroundColor: chatAvatarColor(activeClient.name || activeClient.id) }}
                >
                  {(activeClient.name || "C").slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="chat-header-name truncate">
                  {activeClient.name || "Cliente"}
                </p>
                <p className="chat-header-status">
                  <span
                    className={`chat-group-state-dot ${isActiveGroupMember ? "is-active" : "is-archived"}`}
                  />
                  {isActiveGroupMember ? "Grupo activo" : "Archivado"}
                  {` · ${messages.length} mensaje${messages.length === 1 ? "" : "s"}`}
                  {groupsLoaded
                    ? ` · ${activeGroupMembers.length} integrante${activeGroupMembers.length === 1 ? "" : "s"}`
                    : ""}
                  {activeClientMuted
                    ? ` · Silenciado ${formatChatMuteUntil(activeMuteUntil)}`
                    : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={openMembers}
                aria-label="Ver integrantes del grupo"
                title="Integrantes del grupo"
                className="chat-members-button shrink-0"
              >
                <span className="chat-member-stack" aria-hidden="true">
                  {activeGroupMembers.slice(0, 3).map((person) => (
                    <span
                      key={person.id}
                      style={{
                        backgroundColor: chatAvatarColor(person.id || person.name),
                      }}
                    >
                      {(person.name || "U").slice(0, 1).toUpperCase()}
                    </span>
                  ))}
                </span>
                <span className="chat-members-count">
                  {activeGroupMembers.length || 0}
                </span>
              </button>
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setMuteMenuOpen((open) => !open)}
                  aria-label={
                    activeClientMuted
                      ? "Cambiar silencio del grupo"
                      : "Silenciar grupo"
                  }
                  aria-expanded={muteMenuOpen}
                  title={
                    activeClientMuted
                      ? `Silenciado ${formatChatMuteUntil(activeMuteUntil)}`
                      : "Silenciar grupo"
                  }
                  className={`chat-header-button ${
                    activeClientMuted ? "text-amber-500" : ""
                  }`}
                >
                  <Icon
                    name={activeClientMuted ? "BellSlash" : "Bell"}
                    size={19}
                  />
                </button>
                {muteMenuOpen && (
                  <>
                    <button
                      type="button"
                      aria-label="Cerrar opciones de silencio"
                      className="fixed inset-0 z-20 cursor-default"
                      onClick={() => setMuteMenuOpen(false)}
                    />
                    <div className="chat-action-menu absolute right-0 top-full z-30 mt-2 w-64 p-1.5">
                      <div className="border-b border-slate-200/70 px-3 py-2 dark:border-white/10">
                        <p className="text-xs font-black text-slate-700 dark:text-slate-100">
                          Notificaciones del grupo
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          {activeClientMuted
                            ? `Silenciado ${formatChatMuteUntil(activeMuteUntil)}`
                            : "Elige durante cuánto tiempo silenciarlo."}
                        </p>
                      </div>
                      {activeClientMuted && (
                        <button
                          type="button"
                          onClick={() => {
                            onSetMute?.(activeClient.id, null);
                            setMuteMenuOpen(false);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-bold text-emerald-600 hover:bg-slate-50 dark:text-emerald-400 dark:hover:bg-slate-700"
                        >
                          <Icon name="Bell" size={16} />
                          Activar notificaciones
                        </button>
                      )}
                      {[
                        { key: "8h", label: "8 horas" },
                        { key: "1w", label: "1 semana" },
                        { key: CHAT_MUTE_FOREVER, label: "Siempre" },
                      ].map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => {
                            onSetMute?.(activeClient.id, option.key);
                            setMuteMenuOpen(false);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                          <Icon name="BellSlash" size={16} />
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={() => {
                  setCallSelected([]);
                  setCallSearch("");
                  setCallPicker({ mode: "start" });
                }}
                disabled={!canInteractWithActiveGroup}
                className="chat-call-button flex shrink-0 items-center gap-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Icon name="VideoCamera" size={18} />
                <span className="hidden sm:inline">Nueva llamada</span>
              </button>
            </div>

            {pinnedMessages.length > 0 && (
              <div className="chat-pinned-bar shrink-0 space-y-1">
                {pinnedMessages.slice(-3).map((pinned) => (
                  <div key={pinned.id} className="flex items-center gap-2 text-xs">
                    <Icon
                      name="Pin"
                      size={12}
                      className="shrink-0 text-amber-600 dark:text-amber-400"
                    />
                    <span className="shrink-0 font-bold text-slate-600 dark:text-slate-300">
                      {pinned.authorName}:
                    </span>
                    <span className="truncate text-slate-500 dark:text-slate-400">
                      {pinned.text ||
                        (Array.isArray(pinned.attachments) &&
                        pinned.attachments.length
                          ? "Adjunto"
                          : "")}
                    </span>
                    <button
                      onClick={() => onPin && onPin(pinned)}
                      aria-label="Desfijar"
                      className="ml-auto shrink-0 text-slate-400 hover:text-red-500"
                    >
                      <Icon name="X" size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div
              ref={scrollRef}
              className="chat-thread custom-scroll flex-1 min-h-0 overflow-y-auto py-4"
            >
              {messages.length === 0 && (
                <div className="chat-thread-empty">
                  <span>
                    <Icon name="MessageSquare" size={24} />
                  </span>
                  <h3>Comienza la conversación</h3>
                  <p>
                    Los mensajes y archivos de este cliente aparecerán aquí.
                  </p>
                </div>
              )}
              {messages.map((message, index) => {
                const mine = myId && String(message.authorId || "") === myId;
                const prev = messages[index - 1];
                const grouped =
                  prev &&
                  String(prev.authorId || "") === String(message.authorId || "") &&
                  (prev.authorName || "") === (message.authorName || "") &&
                  message.createdAt &&
                  prev.createdAt &&
                  new Date(message.createdAt) - new Date(prev.createdAt) <
                    5 * 60 * 1000;
                const atts = fullMap[message.id] || message.attachments || [];
                const stickerOnly =
                  message.sticker &&
                  !message.deleted &&
                  !message.text &&
                  atts.length === 0 &&
                  !message.call?.roomId;
                const showDaySeparator =
                  chatDayKey(message.createdAt) !== chatDayKey(prev?.createdAt);
                return (
                  <React.Fragment key={message.id}>
                    {showDaySeparator && (
                      <div className="chat-day-separator">
                        <span>{chatDayLabel(message.createdAt)}</span>
                      </div>
                    )}
                    <div
                      className={`chat-message-row group flex px-4 ${grouped ? "is-grouped" : ""} ${mine ? "is-mine justify-end" : "justify-start"}`}
                    >
                    {!mine && (
                      <div className="chat-message-avatar-slot mr-2 w-8 shrink-0 self-end">
                        {!grouped && (
                          <div
                            className="chat-message-avatar flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-black text-white"
                            style={{ backgroundColor: chatAvatarColor(message.authorId || message.authorName) }}
                          >
                            {(message.authorName || "U").slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="chat-message-stack relative min-w-0 max-w-[78%]">
                      {!mine && !grouped && (
                        <p className="chat-message-author mb-1 px-1">
                          {message.authorName || "Usuario"}
                        </p>
                      )}
                      <div
                        className={`chat-bubble relative ${mine ? "is-mine" : "is-incoming"} ${stickerOnly ? "is-sticker" : ""}`}
                      >
                        {!message.deleted && (
                          <button
                            onClick={() =>
                              setMenuFor(menuFor === message.id ? null : message.id)
                            }
                            aria-label="Opciones del mensaje"
                            aria-expanded={menuFor === message.id}
                            className="chat-message-options absolute right-0 top-0 z-30 flex items-center justify-center"
                          >
                            <Icon name="ChevronDown" size={14} />
                          </button>
                        )}
                        {reactionPickerFor === message.id && (
                          <div
                            className={`chat-reaction-picker absolute bottom-full z-40 mb-2 flex items-center gap-1 ${mine ? "right-0" : "left-0"}`}
                          >
                            {CHAT_REACTION_PICKER.map((reaction) => (
                              <button
                                key={reaction.key}
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                  if (onReact) onReact(message, reaction.key);
                                  setReactionPickerFor(null);
                                }}
                                aria-label={reaction.label}
                                title={reaction.label}
                                className="chat-reaction-option flex items-center justify-center"
                              >
                                <span aria-hidden="true">{reaction.emoji}</span>
                              </button>
                            ))}
                          </div>
                        )}
                        {menuFor === message.id && (
                          <div
                            className={`chat-action-menu absolute bottom-full z-50 mb-2 w-52 p-1.5 ${mine ? "right-0" : "left-0"}`}
                          >
                            {[
                              {
                                key: "reply",
                                label: "Responder",
                                icon: "Reply",
                                show: true,
                                on: () => {
                                  setMenuFor(null);
                                  setReplyingTo(message);
                                },
                              },
                              {
                                key: "react",
                                label: "Reaccionar",
                                icon: "Smile",
                                show: true,
                                on: () => {
                                  setMenuFor(null);
                                  setReactionPickerFor(message.id);
                                },
                              },
                              {
                                key: "forward",
                                label: "Reenviar",
                                icon: "Send",
                                show: true,
                                on: () => {
                                  setMenuFor(null);
                                  setForwardTarget(message);
                                  setForwardSearch("");
                                },
                              },
                              {
                                key: "copy",
                                label: "Copiar",
                                icon: "ClipboardList",
                                show: Boolean(message.text),
                                on: () => {
                                  if (navigator.clipboard) {
                                    navigator.clipboard.writeText(message.text);
                                  }
                                  setMenuFor(null);
                                },
                              },
                              {
                                key: "pin",
                                label: pinnedIds.has(String(message.id)) ? "Desfijar" : "Fijar",
                                icon: "Pin",
                                show: true,
                                on: () => {
                                  setMenuFor(null);
                                  if (onPin) onPin(message);
                                },
                              },
                            ]
                              .filter((item) => item.show)
                              .map((item) => (
                                <button
                                  key={item.key}
                                  onMouseDown={(event) => {
                                    event.preventDefault();
                                    item.on();
                                  }}
                                  className="chat-action-item flex w-full items-center gap-2.5 px-2 text-sm font-medium"
                                >
                                  <span
                                    className={`chat-action-icon is-${item.key} flex h-8 w-8 items-center justify-center`}
                                  >
                                    <Icon name={item.icon} size={15} />
                                  </span>
                                  {item.label}
                                </button>
                              ))}
                            {mine && (
                              <>
                                <div className="my-1 h-px bg-slate-100 dark:bg-white/10" />
                                <button
                                  onMouseDown={(event) => {
                                    event.preventDefault();
                                    setMenuFor(null);
                                    setDeleteTarget(message);
                                  }}
                                  className="chat-action-item is-danger flex w-full items-center gap-2.5 px-2 text-sm font-medium"
                                >
                                  <span className="chat-action-icon is-delete flex h-8 w-8 items-center justify-center">
                                    <Icon name="Trash2" size={15} />
                                  </span>
                                  Eliminar
                                </button>
                              </>
                            )}
                          </div>
                        )}
                        {message.deleted ? (
                          <p
                            className={`flex items-center gap-1.5 pr-6 text-sm italic ${mine ? "text-white/70" : "text-slate-400"}`}
                          >
                            <Icon name="Trash2" size={12} /> Este mensaje fue
                            eliminado
                          </p>
                        ) : (
                          <>
                            {message.forwarded && (
                              <p
                                className={`mb-1 flex items-center gap-1 text-[11px] italic ${mine ? "text-white/70" : "text-slate-400"}`}
                              >
                                <Icon name="Send" size={10} /> Reenviado
                              </p>
                            )}
                            {message.replyTo && (
                              <div
                                className={`mb-1 rounded-md border-l-2 px-2 py-1 text-xs ${mine ? "border-white/60 bg-black/15" : "border-blue-400 bg-black/5 dark:bg-white/5"}`}
                              >
                                <p className="font-bold opacity-80">
                                  {message.replyTo.authorName || "Mensaje"}
                                </p>
                                <p className="truncate opacity-70">
                                  {message.replyTo.sticker
                                    ? "Sticker"
                                    : message.replyTo.text}
                                </p>
                              </div>
                            )}
                            {message.sticker &&
                              renderSticker(
                                message.sticker,
                                stickerOnly ? 144 : 104,
                                "chat-sticker-asset",
                              )}
                            {message.text && !message.call && (
                              <p className="chat-message-text whitespace-pre-wrap break-words pr-6">
                                {renderChatText(message.text, mine)}
                              </p>
                            )}
                            {atts.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-2">
                                {atts.map((att) =>
                                  renderAttachment(att, {
                                    mine,
                                    authorName: mine
                                      ? currentUserProfile?.name || "Usuario"
                                      : message.authorName || "Usuario",
                                    avatarUrl: mine
                                      ? currentUserProfile?.photo || ""
                                      : "",
                                  }),
                                )}
                              </div>
                            )}
                            {message.taskRef?.taskId && (
                              <button
                                onClick={() => onOpenTask(message.taskRef)}
                                className={`mt-1.5 inline-flex max-w-full items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-bold ${CHAT_TASK_CHIP_STYLES[message.taskRef.taskType] || CHAT_TASK_CHIP_STYLES.accountTask}`}
                              >
                                <Icon
                                  name="ClipboardList"
                                  size={11}
                                  className="shrink-0"
                                />
                                <span className="truncate">
                                  {message.taskRef.taskTitle || "Tarea"}
                                </span>
                                <span className="opacity-70">
                                  ·{" "}
                                  {CHAT_TASK_LABELS[message.taskRef.taskType] || ""}
                                </span>
                              </button>
                            )}
                            {message.call?.roomId &&
                              (message.call.ended ? (
                                <div
                                  className="chat-call-card is-ended mt-1.5 flex w-full items-center gap-2"
                                >
                                  <span
                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${mine ? "bg-white/15 text-white/70" : "bg-slate-300 text-slate-600 dark:bg-slate-600 dark:text-slate-300"}`}
                                  >
                                    <Icon name="Phone" size={15} />
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span
                                      className={`block text-xs font-bold ${mine ? "text-white/80" : "text-slate-600 dark:text-slate-300"}`}
                                    >
                                      Llamada finalizada
                                    </span>
                                  </span>
                                </div>
                              ) : (
                                <button
                                  onClick={() =>
                                    setActiveCall({
                                      roomId: message.call.roomId,
                                      messageId: message.id,
                                      isHost:
                                        !!myId &&
                                        String(message.authorId || "") === myId,
                                    })
                                  }
                                  className="chat-call-card is-live mt-1.5 flex w-full items-center gap-2 text-left"
                                >
                                  <span
                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${mine ? "bg-white/20 text-white" : "bg-emerald-600 text-white"}`}
                                  >
                                    <Icon name="VideoCamera" size={16} />
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span
                                      className={`block text-xs font-bold ${mine ? "" : "text-emerald-700 dark:text-emerald-300"}`}
                                    >
                                      Videollamada
                                    </span>
                                    <span
                                      className={`block text-[11px] ${mine ? "text-white/70" : "text-slate-500 dark:text-slate-400"}`}
                                    >
                                      Toca para unirte
                                    </span>
                                  </span>
                                </button>
                              ))}
                          </>
                        )}
                        <span
                          className={`chat-message-time ${stickerOnly ? "is-sticker" : ""}`}
                        >
                          {chatShortTime(message.createdAt)}
                          {mine && <Icon name="Check" size={11} aria-label="Enviado" />}
                        </span>
                      </div>
                      {reactionsByMessage[message.id] &&
                        Object.keys(reactionsByMessage[message.id]).length > 0 && (
                          <div
                            className={`chat-reaction-list mt-1 flex flex-wrap gap-1 ${mine ? "justify-end" : ""}`}
                          >
                            {Object.entries(reactionsByMessage[message.id]).map(
                              ([reactionKey, info]) => {
                                const reaction =
                                  getChatReactionDefinition(reactionKey);
                                return (
                                  <button
                                    key={reactionKey}
                                    onClick={() =>
                                      onReact && onReact(message, reactionKey)
                                    }
                                    aria-label={`${reaction.label}: ${info.count}`}
                                    title={info.names.join(", ")}
                                    className={`chat-reaction-chip flex items-center gap-1 ${info.mine ? "is-mine" : ""}`}
                                  >
                                    <span
                                      className="chat-reaction-emoji"
                                      aria-hidden="true"
                                    >
                                      {reaction.emoji}
                                    </span>
                                    <span>{info.count}</span>
                                  </button>
                                );
                              },
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                  </React.Fragment>
                );
              })}
              {(menuFor || reactionPickerFor) && (
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => {
                    setMenuFor(null);
                    setReactionPickerFor(null);
                  }}
                />
              )}
            </div>

            {/* Composer de mensajería */}
            {canInteractWithActiveGroup ? (
              <div className="chat-composer-shell shrink-0">
              {replyingTo && (
                <div className="chat-reply-bar mb-2 flex items-center gap-2">
                  <Icon
                    name="Reply"
                    size={14}
                    className="shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="chat-reply-title">
                      Respondiendo a {replyingTo.authorName || "mensaje"}
                    </p>
                    <p className="chat-reply-preview truncate">
                      {replyingTo.text ||
                        (replyingTo.sticker ? "Sticker" : "") ||
                        (Array.isArray(replyingTo.attachments) &&
                        replyingTo.attachments.length
                          ? "Adjunto"
                          : "")}
                    </p>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    aria-label="Cancelar respuesta"
                    className="chat-composer-button shrink-0"
                  >
                    <Icon name="X" size={14} />
                  </button>
                </div>
              )}
              {(taskRef || pending.length > 0) && (
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {taskRef && (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-bold ${CHAT_TASK_CHIP_STYLES[taskRef.taskType] || CHAT_TASK_CHIP_STYLES.accountTask}`}
                    >
                      <Icon name="ClipboardList" size={11} />
                      <span className="max-w-[220px] truncate">
                        {taskRef.taskTitle}
                      </span>
                      <button
                        onClick={() => setTaskRef(null)}
                        aria-label="Quitar tarea"
                        className="opacity-70 hover:opacity-100"
                      >
                        <Icon name="X" size={11} />
                      </button>
                    </span>
                  )}
                  {pending.map((att) => (
                    <div key={att.id} className="relative">
                      {isChatImage(att.type) ? (
                        <img
                          src={att.data}
                          alt={att.name}
                          className="h-16 w-16 rounded-lg border border-slate-200 object-cover dark:border-white/10"
                        />
                      ) : isChatAudio(att.type) ? (
                        <div className="chat-voice-pending">
                          {renderAttachment(att, {
                            mine: true,
                            authorName: currentUserProfile?.name || "Usuario",
                            avatarUrl: currentUserProfile?.photo || "",
                            compact: true,
                          })}
                        </div>
                      ) : (
                        <div className="flex h-16 w-36 items-center gap-1.5 rounded-lg border border-slate-200 px-2 dark:border-white/10">
                          <Icon
                            name="Paperclip"
                            size={14}
                            className="shrink-0 text-slate-500"
                          />
                          <span className="truncate text-[11px] text-slate-600 dark:text-slate-300">
                            {att.name}
                          </span>
                        </div>
                      )}
                      <button
                        onClick={() =>
                          setPending((prev) =>
                            prev.filter((item) => item.id !== att.id),
                          )
                        }
                        aria-label="Quitar archivo"
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-white"
                      >
                        <Icon name="X" size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="chat-compose-box relative">
                {mentionOpen && mentionSuggestions.length > 0 && (
                  <div className="chat-picker absolute bottom-full left-0 z-40 mb-2 max-h-72 w-72 overflow-y-auto py-1 custom-scroll">
                    <div className="flex items-center justify-between px-3 pb-1 pt-1.5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Mencionar
                      </p>
                      <button
                        onMouseDown={(event) => {
                          event.preventDefault();
                          setMentionOpen(false);
                        }}
                        aria-label="Cerrar"
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <Icon name="X" size={13} />
                      </button>
                    </div>
                    {mentionSuggestions.map((person) => (
                      <button
                        key={person.id}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          insertMention(person);
                        }}
                        className="flex w-full items-center gap-2.5 px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--text-muted)] text-[9px] font-black text-white">
                          {(person.name || person.email || "?")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                          <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                            {person.name || person.email}
                          </p>
                          {person.email && (
                            <p className="truncate text-[11px] text-slate-400">
                              {person.email}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {taskPickerOpen && (
                  <div className="chat-picker absolute bottom-full left-0 z-30 mb-2 max-h-64 w-72 overflow-y-auto py-1 custom-scroll">
                    <div className="flex items-center justify-between px-3 pb-1 pt-1.5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Enlazar tarea del cliente
                      </p>
                      <button
                        onMouseDown={(event) => {
                          event.preventDefault();
                          setTaskPickerOpen(false);
                        }}
                        aria-label="Cerrar"
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <Icon name="X" size={13} />
                      </button>
                    </div>
                    {clientTasks.length === 0 && (
                      <p className="px-3 py-2 text-xs text-slate-400">
                        Este cliente no tiene tareas.
                      </p>
                    )}
                    {clientTasks.map((task) => (
                      <button
                        key={`${task.type}-${task.id}`}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          setTaskRef({
                            taskId: task.id,
                            taskType: task.type,
                            taskTitle: task.title || "Tarea",
                          });
                          setTaskPickerOpen(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        <span
                          className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-black ${CHAT_TASK_CHIP_STYLES[task.type]}`}
                        >
                          {CHAT_TASK_LABELS[task.type]}
                        </span>
                        <span className="flex-1 truncate text-sm text-slate-700 dark:text-slate-200">
                          {task.title || "(sin título)"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {!recording && (
                  <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={handleTextChange}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Escape" &&
                        (mentionOpen || taskPickerOpen || attachMenuOpen)
                      ) {
                        setMentionOpen(false);
                        setTaskPickerOpen(false);
                        setAttachMenuOpen(false);
                        event.preventDefault();
                        return;
                      }
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        handleSubmit();
                      }
                    }}
                    placeholder={`Mensaje para ${activeClient.name || "el cliente"}`}
                    rows={text ? 2 : 1}
                    aria-label={`Mensaje para ${activeClient.name || "el cliente"}`}
                    className="chat-compose-input w-full resize-none bg-transparent"
                  />
                )}
                <div
                  className={`chat-compose-actions relative flex items-center gap-2 px-2 pb-2 ${recording ? "is-recording" : ""}`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(event) => handleFiles(event.target.files)}
                  />
                  {recording ? (
                    <div
                      className={`chat-recording-bar ${recordingPaused ? "is-paused" : ""}`}
                    >
                      <button
                        type="button"
                        onClick={() => stopRecording(true)}
                        aria-label="Eliminar grabación"
                        className="chat-recording-control is-delete"
                      >
                        <Icon name="Trash2" size={21} />
                      </button>
                      <div className="chat-recording-timer" aria-live="polite">
                        <span className="chat-recording-dot" aria-hidden="true" />
                        <span>{formatVoiceDuration(recordSeconds)}</span>
                      </div>
                      <div
                        className="chat-recording-wave"
                        role="img"
                        aria-label={
                          recordingPaused ? "Grabación pausada" : "Grabando audio"
                        }
                      >
                        {CHAT_VOICE_WAVEFORM.slice(0, 24).map((height, index) => (
                          <span
                            key={`${height}-${index}`}
                            style={{
                              height: `${Math.max(5, Math.round(height * 0.72))}px`,
                              animationDelay: `${(index % 8) * -70}ms`,
                            }}
                          />
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={toggleRecordingPause}
                        aria-label={
                          recordingPaused
                            ? "Continuar grabación"
                            : "Pausar grabación"
                        }
                        className="chat-recording-control"
                      >
                        <Icon
                          name={recordingPaused ? "Play" : "PauseCircle"}
                          size={24}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => stopRecording(false, true)}
                        disabled={submitting}
                        aria-label="Enviar nota de voz"
                        className="chat-recording-send"
                      >
                        <Icon
                          name={submitting ? "Loader2" : "Send"}
                          size={20}
                          className={submitting ? "animate-spin" : ""}
                        />
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Adjuntar archivo (elegir tipo) */}
                      <div className="relative">
                        <button
                          onClick={() => {
                            setAttachMenuOpen((open) => !open);
                            setMentionOpen(false);
                            setTaskPickerOpen(false);
                          }}
                          aria-label="Adjuntar archivo"
                          disabled={uploading}
                          className={`chat-composer-button flex items-center justify-center disabled:opacity-50 ${attachMenuOpen ? "is-active" : ""}`}
                        >
                          <Icon
                            name={uploading ? "Loader2" : "Paperclip"}
                            size={18}
                            className={uploading ? "animate-spin" : ""}
                          />
                        </button>
                        {attachMenuOpen && (
                          <div className="chat-picker absolute bottom-full left-0 z-30 mb-2 w-52 py-1">
                            <button
                              onMouseDown={(event) => {
                                event.preventDefault();
                                openFilePicker("image/*");
                              }}
                              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
                            >
                              <Icon name="Image" size={16} className="text-slate-500" />
                              Imagen
                            </button>
                            <button
                              onMouseDown={(event) => {
                                event.preventDefault();
                                openFilePicker("video/*");
                              }}
                              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
                            >
                              <Icon name="Video" size={16} className="text-slate-500" />
                              Video
                            </button>
                            <button
                              onMouseDown={(event) => {
                                event.preventDefault();
                                openFilePicker(
                                  "application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip",
                                );
                              }}
                              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
                            >
                              <Icon name="FileText" size={16} className="text-slate-500" />
                              Documento / PDF
                            </button>
                            <button
                              onMouseDown={(event) => {
                                event.preventDefault();
                                openFilePicker("");
                              }}
                              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
                            >
                              <Icon name="FilePlus" size={16} className="text-slate-500" />
                              Cualquier archivo
                            </button>
                          </div>
                        )}
                      </div>
                      {/* Nota de voz */}
                      <button
                        onClick={startRecording}
                        aria-label="Grabar nota de voz"
                        className="chat-composer-button flex items-center justify-center"
                      >
                        <Icon name="Microphone" size={18} />
                      </button>
                      {/* Enlazar tarea */}
                      <button
                        onClick={() => {
                          setTaskPickerOpen((open) => !open);
                          setMentionOpen(false);
                          setAttachMenuOpen(false);
                        }}
                        aria-label="Enlazar tarea"
                        className={`chat-composer-button flex items-center justify-center ${taskRef || taskPickerOpen ? "is-active" : ""}`}
                      >
                        <Icon name="ClipboardList" size={17} />
                      </button>
                      {/* Stickers */}
                      <div className="relative">
                        <button
                          onClick={() => {
                            setStickerOpen((open) => !open);
                            setMentionOpen(false);
                            setTaskPickerOpen(false);
                            setAttachMenuOpen(false);
                          }}
                          aria-label="Stickers"
                          className={`chat-composer-button flex items-center justify-center ${stickerOpen ? "is-active" : ""}`}
                        >
                          <Icon name="Sticker" size={18} />
                        </button>
                        {stickerOpen && (
                          <div className="chat-picker chat-sticker-picker absolute bottom-full right-0 z-40 mb-2 w-80 p-3 sm:left-0 sm:right-auto">
                            <input
                              ref={stickerInputRef}
                              type="file"
                              accept="image/webp,image/gif,image/png,image/jpeg"
                              className="hidden"
                              onChange={(event) =>
                                handleStickerUpload(event.target.files)
                              }
                            />
                            <div className="flex items-center justify-between border-b border-slate-200/70 px-1 pb-2 dark:border-white/10">
                              <div>
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                  Stickers del equipo
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                  Selecciona uno para enviarlo
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onMouseDown={(event) => {
                                    event.preventDefault();
                                    if (stickerInputRef.current)
                                      stickerInputRef.current.click();
                                  }}
                                  disabled={uploadingSticker}
                                  className="chat-picker-action flex items-center gap-1.5 px-2 text-xs font-bold disabled:opacity-50"
                                >
                                  <Icon
                                    name={uploadingSticker ? "Loader2" : "Plus"}
                                    size={12}
                                    className={uploadingSticker ? "animate-spin" : ""}
                                  />
                                  Subir
                                </button>
                                <button
                                  onMouseDown={(event) => {
                                    event.preventDefault();
                                    setStickerOpen(false);
                                  }}
                                  aria-label="Cerrar"
                                  className="chat-composer-button"
                                >
                                  <Icon name="X" size={13} />
                                </button>
                              </div>
                            </div>
                            <div className="mt-2 max-h-72 overflow-y-auto custom-scroll">
                              {customStickers.length > 0 ? (
                                <div className="grid grid-cols-4 gap-2 pb-1">
                                  {customStickers.map((sticker) => (
                                    <div
                                      key={sticker.id}
                                      className="group/st relative"
                                    >
                                      <button
                                        onMouseDown={(event) => {
                                          event.preventDefault();
                                          handleSendSticker(sticker.id);
                                        }}
                                        title={sticker.name}
                                        disabled={submitting}
                                        className="chat-sticker-tile flex w-full items-center justify-center disabled:opacity-50"
                                      >
                                        {renderSticker(sticker.id, 60)}
                                      </button>
                                      {(canModerate ||
                                        String(sticker.authorId || "") ===
                                          myId) && (
                                        <button
                                          onMouseDown={(event) => {
                                            event.preventDefault();
                                            if (
                                              onDeleteSticker &&
                                              confirm(
                                                "¿Eliminar este sticker de la biblioteca?",
                                              )
                                            )
                                              onDeleteSticker(sticker.id);
                                          }}
                                          aria-label="Eliminar sticker"
                                          className="chat-sticker-delete absolute -right-1 -top-1 items-center justify-center"
                                        >
                                          <Icon name="X" size={9} />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <button
                                  onMouseDown={(event) => {
                                    event.preventDefault();
                                    if (stickerInputRef.current)
                                      stickerInputRef.current.click();
                                  }}
                                  className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-slate-400 transition-colors hover:border-blue-400 hover:text-blue-500 dark:border-white/15"
                                >
                                  <Icon name="Sticker" size={28} />
                                  <span className="text-xs font-semibold">
                                    Aún no hay stickers
                                  </span>
                                  <span className="text-[11px]">
                                    Pulsa para subir el primero (webp, gif o png)
                                  </span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <span className="chat-compose-hint ml-auto hidden sm:block">
                        Enter para enviar · Shift+Enter salto de línea
                      </span>
                      <button
                        onClick={handleSubmit}
                        disabled={
                          submitting || (!text.trim() && pending.length === 0)
                        }
                        aria-label="Enviar mensaje"
                        className="chat-send-button ml-auto flex items-center justify-center disabled:opacity-40"
                      >
                        <Icon
                          name={submitting ? "Loader2" : "Send"}
                          size={16}
                          className={submitting ? "animate-spin" : ""}
                        />
                      </button>
                    </>
                  )}
                </div>
                </div>
              </div>
            ) : (
              <div className="chat-archived-notice shrink-0">
                <span className="chat-archived-notice-icon">
                  <Icon name="Inbox" size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <strong>Este grupo está archivado</strong>
                  <p>
                    Ya no formas parte del grupo. Puedes consultar su referencia,
                    pero no enviar mensajes ni iniciar llamadas.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Popup de confirmación de borrado (estilo WhatsApp) */}
      {deleteTarget && (
        <div
          className="chat-dialog-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="chat-dialog-panel w-full max-w-xs p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
              ¿Eliminar mensaje?
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Elige cómo eliminarlo. Queda registro de que se eliminó.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={() => {
                  if (onDeleteForEveryone) onDeleteForEveryone(deleteTarget);
                  setDeleteTarget(null);
                }}
                className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700"
              >
                Eliminar para todos
              </button>
              <button
                onClick={() => {
                  if (onDeleteForMe) onDeleteForMe(deleteTarget);
                  setDeleteTarget(null);
                }}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Eliminar para mí
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="w-full rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reenviar a otro cliente */}
      {forwardTarget && (
        <div
          className="chat-dialog-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setForwardTarget(null)}
        >
          <div
            className="chat-dialog-panel flex max-h-[70vh] w-full max-w-sm flex-col overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-white/10">
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                Reenviar a…
              </h3>
              <button
                onClick={() => setForwardTarget(null)}
                aria-label="Cerrar"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <Icon name="X" size={18} />
              </button>
            </div>
            <div className="p-3">
              <input
                value={forwardSearch}
                onChange={(event) => setForwardSearch(event.target.value)}
                placeholder="Buscar cliente..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              />
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-2 custom-scroll">
              {clients
                .filter(
                  (client) =>
                    (!groupsLoaded || belongsToChatGroup(client.id)) &&
                    (!forwardSearch.trim() ||
                      (client.name || "")
                        .toLowerCase()
                        .includes(forwardSearch.trim().toLowerCase())),
                )
                .map((client) => (
                  <button
                    key={client.id}
                    onClick={() => {
                      if (onForward) onForward(forwardTarget, client.id);
                      setForwardTarget(null);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--text-muted)] text-[10px] font-black text-white">
                      {(client.name || "C").slice(0, 2).toUpperCase()}
                    </div>
                    <span className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {client.name || "Cliente"}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Integrantes reales del grupo y administración por rol. */}
      {membersOpen &&
        createPortal(
          <div
            className="chat-members-overlay fixed inset-0 z-[85] flex items-center justify-center bg-black/50 p-4"
            onClick={() => !savingMembers && setMembersOpen(false)}
          >
            <div
              className="chat-members-panel flex max-h-[82vh] w-full max-w-md flex-col overflow-hidden"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="chat-members-panel-header flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                    Integrantes del grupo
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {activeGroup?.source === "managed"
                      ? "Lista administrada por el equipo."
                      : "Lista inicial detectada del historial del chat."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMembersOpen(false)}
                  aria-label="Cerrar"
                  disabled={savingMembers}
                  className="text-slate-400 hover:text-slate-600 disabled:opacity-40 dark:hover:text-slate-200"
                >
                  <Icon name="X" size={18} />
                </button>
              </div>

              <div className="chat-members-panel-body custom-scroll flex-1 overflow-y-auto">
                <p className="mb-2 px-1 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                  En este grupo · {memberDraftIds.length}
                </p>
                <div className="space-y-1">
                  {mentionables
                    .filter((person) =>
                      memberDraftIds.map(String).includes(String(person.id)),
                    )
                    .map((person) => {
                      const isSelf =
                        String(person.id) === String(currentGroupMemberId);
                      const canRemove =
                        canManageMembers && (!isSelf || canLeaveGroup);
                      return (
                        <div
                          key={person.id}
                          className="chat-member-row flex items-center gap-3"
                        >
                          <span
                            className="chat-member-avatar flex h-9 w-9 shrink-0 items-center justify-center text-[11px] font-black text-white"
                            style={{
                              backgroundColor: chatAvatarColor(
                                person.id || person.name,
                              ),
                            }}
                          >
                            {(person.name || "U").slice(0, 2).toUpperCase()}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-slate-700 dark:text-slate-100">
                              {person.name || person.email}
                              {isSelf ? " (tú)" : ""}
                            </p>
                            {person.email && (
                              <p className="truncate text-[11px] text-slate-400">
                                {person.email}
                              </p>
                            )}
                          </div>
                          {canManageMembers && (
                            <button
                              type="button"
                              onClick={() =>
                                canRemove &&
                                setMemberDraftIds((current) =>
                                  current.filter(
                                    (id) => String(id) !== String(person.id),
                                  ),
                                )
                              }
                              disabled={!canRemove || savingMembers}
                              title={
                                !canRemove && isSelf
                                  ? "Los managers no pueden salir por sí mismos"
                                  : isSelf
                                    ? "Salir del grupo"
                                    : "Quitar del grupo"
                              }
                              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-35 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                            >
                              <Icon name={isSelf ? "LogOut" : "UserX"} size={16} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  {memberDraftIds.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400 dark:border-white/10">
                      Este grupo no tiene integrantes.
                    </div>
                  )}
                </div>

                {canManageMembers && (
                  <div className="chat-member-add-section mt-5 pt-4">
                    <p className="mb-2 px-1 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                      Agregar personas
                    </p>
                    <div className="relative mb-2">
                      <Icon
                        name="Search"
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        value={memberSearch}
                        onChange={(event) => setMemberSearch(event.target.value)}
                        placeholder="Buscar en el equipo..."
                        className="chat-member-search w-full py-2 pl-9 pr-3 text-sm outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      {mentionables
                        .filter(
                          (person) =>
                            !memberDraftIds
                              .map(String)
                              .includes(String(person.id)) &&
                            (!memberSearch.trim() ||
                              (person.name || "")
                                .toLowerCase()
                                .includes(memberSearch.trim().toLowerCase()) ||
                              (person.email || "")
                                .toLowerCase()
                                .includes(memberSearch.trim().toLowerCase())),
                        )
                        .slice(0, 20)
                        .map((person) => (
                          <button
                            key={person.id}
                            type="button"
                            onClick={() =>
                              setMemberDraftIds((current) => [
                                ...current,
                                person.id,
                              ])
                            }
                            className="chat-member-candidate flex w-full items-center gap-3 text-left"
                          >
                            <span className="chat-member-avatar flex h-8 w-8 shrink-0 items-center justify-center bg-slate-500 text-[10px] font-black text-white">
                              {(person.name || "U").slice(0, 2).toUpperCase()}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700 dark:text-slate-100">
                              {person.name || person.email}
                            </span>
                            <Icon
                              name="UserPlus"
                              size={16}
                              className="text-blue-600 dark:text-blue-400"
                            />
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="chat-members-panel-footer flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMembersOpen(false)}
                  disabled={savingMembers}
                  className="chat-member-secondary-action px-4 py-2 text-sm font-bold disabled:opacity-40"
                >
                  {canManageMembers ? "Cancelar" : "Cerrar"}
                </button>
                {canManageMembers && (
                  <button
                    type="button"
                    onClick={saveMembers}
                    disabled={savingMembers}
                    className="chat-member-primary-action inline-flex items-center gap-2 px-4 py-2 text-sm font-bold disabled:opacity-50"
                  >
                    {savingMembers && (
                      <Icon name="Loader2" size={15} className="animate-spin" />
                    )}
                    Guardar integrantes
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Selector de participantes para la llamada */}
      {callPicker &&
        createPortal(
          <div
            className="chat-dialog-overlay fixed inset-0 z-[80] flex items-center justify-center p-4"
            onClick={() => setCallPicker(null)}
          >
          <div
            className="chat-dialog-panel flex max-h-[75vh] w-full max-w-sm flex-col overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-white/10">
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                {callPicker.mode === "add"
                  ? "Agregar a la llamada"
                  : "Iniciar llamada"}
              </h3>
              <button
                onClick={() => setCallPicker(null)}
                aria-label="Cerrar"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <Icon name="X" size={18} />
              </button>
            </div>
            <div className="p-3">
              <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                Elige a quién invitar
                {callPicker.mode === "add"
                  ? " (además de quienes ya están)."
                  : " primero. Podrás agregar más durante la llamada."}
              </p>
              <input
                value={callSearch}
                onChange={(event) => setCallSearch(event.target.value)}
                placeholder="Buscar persona..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              />
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-2 custom-scroll">
              {callMentionables
                .filter(
                  (person) =>
                    String(person.id) !== membershipIdentity &&
                    (!callSearch.trim() ||
                      (person.name || "")
                        .toLowerCase()
                        .includes(callSearch.trim().toLowerCase()) ||
                      (person.email || "")
                        .toLowerCase()
                        .includes(callSearch.trim().toLowerCase())),
                )
                .map((person) => {
                  const checked = callSelected.includes(person.id);
                  return (
                    <button
                      key={person.id}
                      onClick={() =>
                        setCallSelected((prev) =>
                          checked
                            ? prev.filter((id) => id !== person.id)
                            : [...prev, person.id],
                        )
                      }
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${checked ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 dark:border-slate-600"}`}
                      >
                        {checked && <Icon name="Check" size={12} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                          {person.name || person.email}
                        </p>
                        {person.email && (
                          <p className="truncate text-[11px] text-slate-400">
                            {person.email}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
            </div>
            <div className="border-t border-slate-100 p-3 dark:border-white/10">
              <button
                onClick={async () => {
                  const room =
                    callPicker.mode === "add"
                      ? callPicker.roomId
                      : buildChatRoomId(activeClient?.name);
                  let created = null;
                  if (onSendMessage) {
                    created = await onSendMessage({
                      clientId: activeClient.id,
                      text:
                        callPicker.mode === "add"
                          ? "Invitó a la llamada"
                          : "Inició una llamada",
                      mentionedIds: callSelected,
                      call: { roomId: room, provider: "jitsi" },
                    });
                  }
                  if (callPicker.mode !== "add") {
                    setActiveCall({
                      roomId: room,
                      messageId: created?.id || null,
                      isHost: true,
                    });
                  }
                  setCallPicker(null);
                  setCallSelected([]);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
              >
                <Icon name="VideoCamera" size={16} />
                {callPicker.mode === "add" ? "Invitar" : "Iniciar llamada"}
              </button>
            </div>
          </div>
          </div>,
          document.body,
        )}

      {/* Llamada embebida (Jitsi) — portal a body para ocupar toda la ventana
          sin que ningún contenedor con transform la recorte */}
      {activeCall &&
        createPortal(
          <div className="fixed inset-0 z-[70] flex flex-col bg-slate-900">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-2 text-white">
              <Icon
                name="VideoCamera"
                size={16}
                className="shrink-0 text-emerald-400"
              />
              <span className="truncate text-sm font-bold">
                Llamada · {activeClient?.name || "Cliente"}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => {
                  setCallSelected([]);
                  setCallSearch("");
                  setCallPicker({ mode: "add", roomId: activeCall.roomId });
                }}
                className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20"
              >
                <Icon name="UserPlus" size={14} /> Agregar personas
              </button>
              <button
                onClick={() => {
                  if (activeCall.isHost && onEndCall) {
                    onEndCall(activeCall.messageId, {
                      roomId: activeCall.roomId,
                      provider: "jitsi",
                    });
                  }
                  setActiveCall(null);
                }}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
              >
                <Icon name="X" size={14} />
                {activeCall.isHost ? "Finalizar llamada" : "Salir"}
              </button>
            </div>
          </div>
          <div
            ref={callContainerRef}
            className="relative min-h-0 w-full flex-1 [&_iframe]:h-full [&_iframe]:w-full"
          >
            {callError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
                <Icon name="VideoCamera" size={32} className="text-white/40" />
                <p className="max-w-sm text-sm text-white/80">{callError}</p>
              </div>
            )}
          </div>
        </div>,
          document.body,
        )}
    </div>
  );
};
