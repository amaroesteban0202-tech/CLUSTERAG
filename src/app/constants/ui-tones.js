export const SHORT_MONTHS_ES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

export const PILL_TONES = {
  red: "bg-red-500/10 text-red-600 dark:text-red-400",
  orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  yellow: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  teal: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  indigo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  pink: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  slate: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
};

// Acento lateral (border-left) por tono.
export const ACCENT_BORDER = {
  red: "border-l-red-500",
  orange: "border-l-orange-500",
  amber: "border-l-amber-500",
  emerald: "border-l-emerald-500",
  teal: "border-l-teal-500",
  blue: "border-l-blue-500",
  indigo: "border-l-indigo-500",
  violet: "border-l-violet-500",
  slate: "border-l-slate-300 dark:border-l-slate-600",
};

// Mapa color almacenado de persona -> familia tailwind sólida para avatar.
export const AVATAR_FAMILY = {
  purple: "purple",
  indigo: "indigo",
  blue: "blue",
  cyan: "cyan",
  amber: "amber",
  orange: "orange",
  fuchsia: "fuchsia",
  violet: "violet",
  stone: "stone",
  emerald: "emerald",
  teal: "teal",
  slate: "slate",
  red: "red",
  pink: "pink",
  rose: "rose",
  sky: "sky",
  green: "green",
  yellow: "amber",
  c1: "purple",
  c2: "blue",
  c3: "emerald",
  c4: "amber",
  c5: "fuchsia",
  c6: "violet",
  c7: "cyan",
  c8: "orange",
  c9: "indigo",
  c10: "teal",
  c21: "red",
  c22: "blue",
  c23: "emerald",
  c24: "amber",
  c25: "purple",
  c26: "pink",
};

export const CLIENT_STATUSES = [
  {
    id: "Activo",
    label: "Activo",
    dot: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    id: "Pausado",
    label: "Pausado",
    dot: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    id: "Inactivo",
    label: "Inactivo",
    dot: "bg-slate-400",
    text: "text-slate-500 dark:text-slate-400",
    bg: "bg-slate-500/10",
  },
];

export const MGMT_CATEGORY_COLORS = {
  seguimiento:
    "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300 border-sky-200 dark:border-sky-500/20",
  reunion:
    "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border-purple-200 dark:border-purple-500/20",
  entrega:
    "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300 border-orange-200 dark:border-orange-500/20",
  revision:
    "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300 border-teal-200 dark:border-teal-500/20",
};
const getMgmtCategoryColor = (cat) =>
  MGMT_CATEGORY_COLORS[(cat || "").toLowerCase()] ||
  "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700";

export const DASHBOARD_PALETTE = {
  emerald: { solid: "var(--status-green-bg)", strong: "var(--status-green-text)" },
  amber: { solid: "var(--status-yellow-bg)", strong: "var(--status-yellow-text)" },
  red: { solid: "var(--status-red-bg)", strong: "var(--status-red-text)" },
  purple: { solid: "var(--primary-soft)", strong: "var(--primary)" },
  violet: { solid: "var(--primary-soft)", strong: "var(--primary)" },
  indigo: { solid: "var(--primary-soft)", strong: "var(--primary)" },
  blue: { solid: "var(--status-blue-bg)", strong: "var(--status-blue-text)" },
  cyan: { solid: "var(--status-blue-bg)", strong: "var(--status-blue-text)" },
  orange: { solid: "var(--status-yellow-bg)", strong: "var(--status-yellow-text)" },
  fuchsia: { solid: "var(--status-red-bg)", strong: "var(--status-red-text)" },
  stone: { solid: "var(--surface-muted)", strong: "var(--text-muted)" },
  slate: { solid: "var(--surface-muted)", strong: "var(--text-muted)" },
};
