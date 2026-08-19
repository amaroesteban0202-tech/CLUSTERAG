export const THEME_PALETTES = [
  {
    id: "botanical",
    name: "Botánica",
    description: "Marfil, bosque y lima editorial",
    swatches: ["#f4f6f1", "#fcfdf9", "#5e7415", "#1c241e"],
    darkSwatches: ["#0e120f", "#151a16", "#c3e15b", "#eff3ea"],
  },
  {
    id: "violet",
    name: "Slate & Violet",
    description: "Violeta profesional con acento ámbar",
    swatches: ["#f8fafc", "#ffffff", "#7c3aed", "#0f172a"],
    darkSwatches: ["#0f172a", "#1e293b", "#a78bfa", "#f1f5f9"],
  },
  {
    id: "midnight",
    name: "Midnight Blue",
    description: "Azul corporativo con acento cian",
    swatches: ["#f8fafc", "#ffffff", "#1e40af", "#172554"],
    darkSwatches: ["#0b1220", "#111827", "#38bdf8", "#e0f2fe"],
  },
  {
    id: "grove",
    name: "Emerald",
    description: "Esmeralda fresca con acento púrpura",
    swatches: ["#f9fafb", "#ffffff", "#059669", "#1e293b"],
    darkSwatches: ["#0b1411", "#12201a", "#34d399", "#d1fae5"],
  },
  {
    id: "warm",
    name: "Warm Neutral",
    description: "Stone editorial con acento coral",
    swatches: ["#fafaf9", "#ffffff", "#292524", "#1c1917"],
    darkSwatches: ["#1c1917", "#292524", "#fb7185", "#f5f5f4"],
  },
  {
    id: "ocean",
    name: "Océano",
    description: "Niebla, petróleo y turquesa",
    swatches: ["#f1f5f7", "#f9fcfd", "#176b73", "#14242b"],
    darkSwatches: ["#091216", "#101c21", "#69d4d0", "#edf6f7"],
  },
  {
    id: "plum",
    name: "Ciruela",
    description: "Lavanda mineral y mora suave",
    swatches: ["#f7f3f8", "#fefbfe", "#79527f", "#281d2b"],
    darkSwatches: ["#130d15", "#1b131d", "#d69cdd", "#f6eff7"],
  },
  {
    id: "cobalt",
    name: "Cobalto",
    description: "Nube fría, tinta y azul eléctrico",
    swatches: ["#f3f5fb", "#fbfcff", "#3157a4", "#182033"],
    darkSwatches: ["#0b0e17", "#121827", "#86a8ff", "#f0f4ff"],
  },
  {
    id: "sand",
    name: "Arena",
    description: "Arena, crema y mostaza dorada",
    swatches: ["#ece3c6", "#fff0c9", "#7e5b08", "#32291a"],
    darkSwatches: ["#18140d", "#211b11", "#f9d95e", "#fff4d6"],
  },
];
export const THEME_PALETTE_IDS = new Set(THEME_PALETTES.map((palette) => palette.id));
export const THEME_PALETTE_ALIASES = {
  clay: "cobalt",
  emerald: "grove",
  "slate-violet": "violet",
  "midnight-blue": "midnight",
  "warm-neutral": "warm",
};
export const normalizeThemePalette = (value) =>
  THEME_PALETTE_IDS.has(value)
    ? value
    : THEME_PALETTE_ALIASES[value] || "botanical";
