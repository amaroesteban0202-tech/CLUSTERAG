export const EMBEDDED_UPLOAD_MAX_BYTES = 3 * 1024 * 1024;
export const CHAT_MUTE_FOREVER = "forever";
export const CHAT_MUTE_DURATION_MS = {
  "8h": 8 * 60 * 60 * 1000,
  "1w": 7 * 24 * 60 * 60 * 1000,
};

export const isChatMuteActive = (mutedUntil, now = Date.now()) => {
  if (mutedUntil === CHAT_MUTE_FOREVER) return true;
  const untilMs = Date.parse(String(mutedUntil || ""));
  return Number.isFinite(untilMs) && untilMs > now;
};

export const formatChatMuteUntil = (mutedUntil) => {
  if (mutedUntil === CHAT_MUTE_FOREVER) return "para siempre";
  const untilMs = Date.parse(String(mutedUntil || ""));
  if (!Number.isFinite(untilMs)) return "";
  return `hasta ${new Date(untilMs).toLocaleString("es", {
    dateStyle: "short",
    timeStyle: "short",
  })}`;
};
