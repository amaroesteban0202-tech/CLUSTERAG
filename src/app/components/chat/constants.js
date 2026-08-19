export const CHAT_TASK_CHIP_STYLES = {
  accountTask:
    "text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30",
  editingTask:
    "text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30",
  managementTask:
    "text-violet-600 dark:text-violet-300 bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/30",
};
export const CHAT_TASK_LABELS = {
  accountTask: "Account",
  editingTask: "Edición",
  managementTask: "Gestión",
};

export const CHAT_REACTIONS = [
  { key: "like", label: "Me gusta", emoji: "👍" },
  { key: "important", label: "Me encanta", emoji: "❤️" },
  { key: "laugh", label: "Me divierte", emoji: "😂" },
  { key: "surprised", label: "Me sorprende", emoji: "😮" },
  { key: "sad", label: "Me entristece", emoji: "😢" },
  { key: "thanks", label: "Gracias", emoji: "🙏" },
  { key: "seen", label: "Visto", emoji: "👀", legacy: true },
  { key: "approved", label: "Aprobado", emoji: "✅", legacy: true },
];
export const CHAT_REACTION_PICKER = CHAT_REACTIONS.filter(
  (reaction) => !reaction.legacy,
);

// Stickers estilo meme, dibujados como SVG propios (sin imágenes con copyright,
// sin dependencias externas, funcionan offline). Se guarda solo el `id` en el
// mensaje y se renderiza desde este set.
export const CHAT_STICKERS = [
  {
    id: "muerto",
    label: "Muerto",
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="42" fill="#ffd93b" stroke="#e0a800" stroke-width="2"/><g stroke="#3a2e00" stroke-width="4" stroke-linecap="round"><path d="M28 36l12 10M40 36l-12 10"/><path d="M60 36l12 10M72 36l-12 10"/></g><path d="M30 60q20 22 40 0q-20 8-40 0z" fill="#3a2e00"/><path d="M22 46q-4 8 0 12q4-4 0-12z" fill="#4aa3ff"/><path d="M78 46q4 8 0 12q-4-4 0-12z" fill="#4aa3ff"/></svg>`,
  },
  {
    id: "piedra",
    label: "Cara de piedra",
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="18" y="12" width="64" height="80" rx="14" fill="#9aa3ab" stroke="#6b7480" stroke-width="2"/><rect x="18" y="12" width="64" height="20" rx="14" fill="#aeb6bd"/><ellipse cx="36" cy="46" rx="7" ry="9" fill="#5a626b"/><ellipse cx="64" cy="46" rx="7" ry="9" fill="#5a626b"/><path d="M40 70h20" stroke="#5a626b" stroke-width="5" stroke-linecap="round"/><path d="M30 60l8-3M70 60l-8-3" stroke="#6b7480" stroke-width="3" stroke-linecap="round"/></svg>`,
  },
  {
    id: "shook",
    label: "Shookeado",
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="42" fill="#ffd93b" stroke="#e0a800" stroke-width="2"/><circle cx="36" cy="44" r="8" fill="#fff" stroke="#3a2e00" stroke-width="2"/><circle cx="36" cy="45" r="4" fill="#3a2e00"/><circle cx="64" cy="44" r="8" fill="#fff" stroke="#3a2e00" stroke-width="2"/><circle cx="64" cy="45" r="4" fill="#3a2e00"/><ellipse cx="50" cy="72" rx="10" ry="12" fill="#3a2e00"/><path d="M22 24l6 8M50 16v10M78 24l-6 8" stroke="#ff7a00" stroke-width="4" stroke-linecap="round"/></svg>`,
  },
  {
    id: "llorando",
    label: "Llorando",
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="42" fill="#ffd93b" stroke="#e0a800" stroke-width="2"/><path d="M26 42q6-8 14-2M60 40q8-6 14 2" stroke="#3a2e00" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M30 50q-6 22 0 34q6-12 0-34z" fill="#4aa3ff"/><path d="M70 50q6 22 0 34q-6-12 0-34z" fill="#4aa3ff"/><path d="M38 68q12 12 24 0" stroke="#3a2e00" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`,
  },
  {
    id: "payaso",
    label: "Payaso",
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="42" fill="#fdf0e6" stroke="#e0c3a8" stroke-width="2"/><path d="M8 40a20 18 0 0 1 30-14 20 18 0 0 1-30 14z" fill="#ff5da2"/><path d="M92 40a20 18 0 0 0-30-14 20 18 0 0 0 30 14z" fill="#5db8ff"/><circle cx="36" cy="46" r="5" fill="#3a2e00"/><circle cx="64" cy="46" r="5" fill="#3a2e00"/><circle cx="50" cy="60" r="9" fill="#ff3b3b"/><path d="M32 72q18 16 36 0" stroke="#ff3b3b" stroke-width="5" fill="none" stroke-linecap="round"/></svg>`,
  },
  {
    id: "cool",
    label: "Modo cool",
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="42" fill="#ffd93b" stroke="#e0a800" stroke-width="2"/><path d="M18 40h64l-4 4H22z" fill="#222"/><rect x="22" y="40" width="24" height="16" rx="6" fill="#222"/><rect x="54" y="40" width="24" height="16" rx="6" fill="#222"/><path d="M46 46h8" stroke="#222" stroke-width="3"/><path d="M34 66q16 12 32 0" stroke="#3a2e00" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`,
  },
  {
    id: "sospechoso",
    label: "Sospechoso",
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="42" fill="#ffd93b" stroke="#e0a800" stroke-width="2"/><path d="M24 40q10 6 20 0M56 40q10 6 20 0" stroke="#3a2e00" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="36" cy="50" rx="9" ry="7" fill="#fff" stroke="#3a2e00" stroke-width="2"/><circle cx="42" cy="50" r="4" fill="#3a2e00"/><ellipse cx="64" cy="50" rx="9" ry="7" fill="#fff" stroke="#3a2e00" stroke-width="2"/><circle cx="70" cy="50" r="4" fill="#3a2e00"/><path d="M40 70q10-4 20 0" stroke="#3a2e00" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`,
  },
  {
    id: "enamorado",
    label: "Enamorado",
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="42" fill="#ffd93b" stroke="#e0a800" stroke-width="2"/><path d="M36 40c-6-6-16 0-12 8 2 5 12 12 12 12s10-7 12-12c4-8-6-14-12-8z" fill="#ff3b6b"/><path d="M64 40c-6-6-16 0-12 8 2 5 12 12 12 12s10-7 12-12c4-8-6-14-12-8z" fill="#ff3b6b"/><path d="M34 72q16 12 32 0" stroke="#3a2e00" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`,
  },
  {
    id: "rabia",
    label: "Rabia",
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="42" fill="#ff5a4d" stroke="#d63a2e" stroke-width="2"/><path d="M24 40l20 8M76 40l-20 8" stroke="#7a1c14" stroke-width="4" stroke-linecap="round"/><circle cx="36" cy="52" r="5" fill="#7a1c14"/><circle cx="64" cy="52" r="5" fill="#7a1c14"/><path d="M34 74q16-10 32 0" stroke="#7a1c14" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`,
  },
  {
    id: "aprobado",
    label: "Aprobado",
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="20" y="48" width="18" height="34" rx="5" fill="#e8a25a" stroke="#c9843f" stroke-width="2"/><path d="M40 50c0-6 6-8 8-14 2-5 1-14 6-14 6 0 8 8 5 18h16c6 0 9 5 7 10l-5 20c-1 5-5 8-10 8H40z" fill="#f4b56a" stroke="#d99a4e" stroke-width="2"/></svg>`,
  },
  {
    id: "obvio",
    label: "Obvio...",
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="42" fill="#ffd93b" stroke="#e0a800" stroke-width="2"/><circle cx="36" cy="46" r="9" fill="#fff" stroke="#3a2e00" stroke-width="2"/><circle cx="36" cy="41" r="4" fill="#3a2e00"/><circle cx="64" cy="46" r="9" fill="#fff" stroke="#3a2e00" stroke-width="2"/><circle cx="64" cy="41" r="4" fill="#3a2e00"/><path d="M38 70h24" stroke="#3a2e00" stroke-width="4" stroke-linecap="round"/></svg>`,
  },
  {
    id: "jaja",
    label: "JAJAJA",
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="42" fill="#ffd93b" stroke="#e0a800" stroke-width="2"/><path d="M26 44q8-8 16 0M58 44q8-8 16 0" stroke="#3a2e00" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M30 58q20 24 40 0q-20 10-40 0z" fill="#3a2e00"/><path d="M22 48q-5 10 0 16q5-6 0-16z" fill="#4aa3ff"/><path d="M78 48q5 10 0 16q-5-6 0-16z" fill="#4aa3ff"/></svg>`,
  },
];
export const CHAT_STICKER_MAP = CHAT_STICKERS.reduce((acc, s) => {
  acc[s.id] = s;
  return acc;
}, {});

export const CHAT_AVATAR_COLORS = [
  "var(--primary)",
  "var(--primary-hover)",
  "var(--status-blue-text)",
  "var(--status-green-text)",
  "var(--status-yellow-text)",
  "var(--status-red-text)",
  "#407f8d",
  "#386c4c",
  "#93631b",
  "#ad473e",
  "#68746b",
  "#39433b",
];

export const chatAvatarColor = (seed = "") => {
  const value = String(seed);
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return CHAT_AVATAR_COLORS[hash % CHAT_AVATAR_COLORS.length];
};

export const CHAT_VOICE_WAVEFORM = [
  8, 14, 20, 11, 24, 18, 28, 16, 22, 31, 18, 26, 13, 21, 29, 17, 25, 12,
  19, 27, 15, 23, 30, 18, 25, 14, 22, 28, 16, 24, 12, 20,
];
