import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

export const INCOMING_CALL_MAX_AGE_MS = 90 * 1000;
export const INCOMING_CALL_RING_MS = 45 * 1000;
export const NATIVE_MESSAGE_CHANNEL = "cluster-messages";
export const NATIVE_CALL_CHANNEL = "cluster-calls";
let incomingCallAudioContext = null;
export const incomingCallAudioReadyListeners = new Set();

export const isNativeApp = () => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

export const nativeNotificationId = (value = "") => {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash || 1) % 2147483647;
};

export const scheduleNativeNotification = async ({
  title,
  body,
  data = {},
  isCall = false,
}) => {
  if (!isNativeApp()) return false;
  try {
    const permission = await LocalNotifications.checkPermissions();
    if (permission.display !== "granted") return false;
    await LocalNotifications.schedule({
      notifications: [
        {
          id: nativeNotificationId(
            data.messageId || `${data.type || "notification"}-${Date.now()}`,
          ),
          title,
          body,
          sound: "default",
          channelId: isCall ? NATIVE_CALL_CHANNEL : NATIVE_MESSAGE_CHANNEL,
          schedule: { at: new Date(Date.now() + 150) },
          extra: data,
          autoCancel: true,
        },
      ],
    });
    return true;
  } catch (error) {
    console.warn("[native-notification]", error?.message || error);
    return false;
  }
};

export const chatMessagePreview = (message = {}) => {
  if (message.text) return String(message.text).slice(0, 180);
  if (message.sticker) return "Envió un sticker";
  const attachmentCount = Array.isArray(message.attachments)
    ? message.attachments.length
    : 0;
  if (attachmentCount > 0) {
    return `Envió ${attachmentCount} archivo${attachmentCount === 1 ? "" : "s"}`;
  }
  return "Nuevo mensaje";
};

export const getIncomingCallAudioContext = () => {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!incomingCallAudioContext || incomingCallAudioContext.state === "closed") {
    incomingCallAudioContext = new AudioContextClass();
  }
  return incomingCallAudioContext;
};

export const unlockIncomingCallAudio = async () => {
  try {
    const context = getIncomingCallAudioContext();
    if (!context) return false;
    if (context.state !== "running") await context.resume();
    if (context.state !== "running") return false;

    const silentBuffer = context.createBuffer(1, 1, context.sampleRate);
    const silentSource = context.createBufferSource();
    silentSource.buffer = silentBuffer;
    silentSource.connect(context.destination);
    silentSource.onended = () => silentSource.disconnect();
    silentSource.start();
    incomingCallAudioReadyListeners.forEach((listener) => listener());
    return true;
  } catch {
    return false;
  }
};

export const playBrowserNotificationSound = () => {
  try {
    const context = getIncomingCallAudioContext();
    if (!context || context.state !== "running") return false;
    const startsAt = context.currentTime + 0.01;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, startsAt);
    oscillator.frequency.exponentialRampToValueAtTime(660, startsAt + 0.16);
    gain.gain.setValueAtTime(0.0001, startsAt);
    gain.gain.exponentialRampToValueAtTime(0.16, startsAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + 0.24);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startsAt);
    oscillator.stop(startsAt + 0.25);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
    return true;
  } catch {
    return false;
  }
};

export const createIncomingCallRingtone = () => {
  let context = null;
  let intervalId = null;
  let beginRinging = null;
  let stopped = false;
  const activeOscillators = new Set();

  const ringOnce = () => {
    if (stopped || !context || context.state !== "running") return;
    const baseTime = context.currentTime + 0.03;
    [0, 0.48].forEach((offset) => {
      [440, 480].forEach((frequency) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const startsAt = baseTime + offset;
        const endsAt = startsAt + 0.36;
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, startsAt);
        gain.gain.setValueAtTime(0.0001, startsAt);
        gain.gain.exponentialRampToValueAtTime(0.14, startsAt + 0.025);
        gain.gain.setValueAtTime(0.14, endsAt - 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, endsAt);
        oscillator.connect(gain);
        gain.connect(context.destination);
        activeOscillators.add(oscillator);
        oscillator.onended = () => activeOscillators.delete(oscillator);
        oscillator.start(startsAt);
        oscillator.stop(endsAt + 0.02);
      });
    });
  };

  return {
    start() {
      if (stopped) return;
      try {
        context = getIncomingCallAudioContext();
        if (!context) return;
        beginRinging = () => {
          if (stopped || context.state !== "running") return;
          ringOnce();
          if (intervalId === null) {
            intervalId = window.setInterval(ringOnce, 2800);
          }
        };
        incomingCallAudioReadyListeners.add(beginRinging);
        if (context.state === "running") beginRinging();
        else unlockIncomingCallAudio();
      } catch {}
    },
    stop() {
      stopped = true;
      if (intervalId !== null) window.clearInterval(intervalId);
      intervalId = null;
      if (beginRinging) incomingCallAudioReadyListeners.delete(beginRinging);
      beginRinging = null;
      activeOscillators.forEach((oscillator) => {
        try {
          oscillator.stop();
          oscillator.disconnect();
        } catch {}
      });
      activeOscillators.clear();
      context = null;
    },
  };
};

