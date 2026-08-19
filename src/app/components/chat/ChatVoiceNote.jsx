import React, { useEffect, useRef, useState } from "react";
import { Icon } from "../icons.jsx";
import { CHAT_VOICE_WAVEFORM, chatAvatarColor } from "./constants.js";

const formatVoiceDuration = (seconds = 0) => {
  const safeSeconds = Number.isFinite(Number(seconds))
    ? Math.max(0, Math.floor(Number(seconds)))
    : 0;
  return `${Math.floor(safeSeconds / 60)}:${String(safeSeconds % 60).padStart(2, "0")}`;
};

export const ChatVoiceNote = ({
  attachment,
  mine = false,
  authorName = "Usuario",
  avatarUrl = "",
  compact = false,
}) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(
    Number(attachment?.duration) || 0,
  );
  const source = attachment?.data || "";
  const loading = !source;
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
  const progress = safeDuration
    ? Math.min(100, (currentTime / safeDuration) * 100)
    : 0;
  const playedBars = Math.round(
    (progress / 100) * CHAT_VOICE_WAVEFORM.length,
  );

  useEffect(() => {
    setPlaying(false);
    setCurrentTime(0);
    setDuration(Number(attachment?.duration) || 0);
  }, [source, attachment?.duration]);

  useEffect(
    () => () => {
      if (audioRef.current) audioRef.current.pause();
    },
    [],
  );

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio || loading) return;
    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        setPlaying(false);
      }
    } else {
      audio.pause();
    }
  };

  const handleSeek = (event) => {
    const audio = audioRef.current;
    if (!audio || !safeDuration) return;
    const nextTime = Number(event.target.value);
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  return (
    <div
      className={`chat-voice-note ${mine ? "is-mine" : "is-incoming"} ${loading ? "is-loading" : ""} ${compact ? "is-compact" : ""}`}
      aria-label={loading ? "Cargando nota de voz" : "Nota de voz"}
    >
      <div
        className="chat-voice-avatar"
        style={
          avatarUrl
            ? undefined
            : { backgroundColor: chatAvatarColor(authorName || "Usuario") }
        }
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" />
        ) : (
          <span>{(authorName || "U").slice(0, 2).toUpperCase()}</span>
        )}
        <span className="chat-voice-avatar-mic" aria-hidden="true">
          <Icon name="Microphone" size={10} />
        </span>
      </div>
      <button
        type="button"
        onClick={togglePlayback}
        disabled={loading}
        aria-label={
          loading
            ? "Cargando nota de voz"
            : playing
              ? "Pausar nota de voz"
              : "Reproducir nota de voz"
        }
        className="chat-voice-play"
      >
        <Icon
          name={loading ? "Loader2" : playing ? "PauseCircle" : "Play"}
          size={compact ? 25 : 28}
          className={loading ? "animate-spin" : ""}
        />
      </button>
      <div className="chat-voice-content">
        <div className="chat-voice-wave">
          <div className="chat-voice-wave-bars" aria-hidden="true">
            {CHAT_VOICE_WAVEFORM.map((height, index) => (
              <span
                key={`${height}-${index}`}
                className={index < playedBars ? "is-played" : ""}
                style={{ height: `${height}px` }}
              />
            ))}
          </div>
          <input
            type="range"
            min="0"
            max={safeDuration || 1}
            step="0.1"
            value={Math.min(currentTime, safeDuration || 1)}
            onChange={handleSeek}
            disabled={loading || !safeDuration}
            aria-label="Posición de la nota de voz"
          />
        </div>
        <div className="chat-voice-meta" aria-live="polite">
          <span>
            {loading
              ? "Cargando audio"
              : formatVoiceDuration(playing ? currentTime : safeDuration)}
          </span>
          {!loading && <span className="chat-voice-kind">Nota de voz</span>}
        </div>
      </div>
      {source && (
        <audio
          ref={audioRef}
          src={source}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            setPlaying(false);
            setCurrentTime(0);
          }}
          onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
          onLoadedMetadata={(event) => {
            const nextDuration = event.currentTarget.duration;
            if (Number.isFinite(nextDuration)) setDuration(nextDuration);
          }}
        />
      )}
    </div>
  );
};
