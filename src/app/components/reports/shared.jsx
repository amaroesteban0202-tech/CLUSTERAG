import React from "react";
import { Icon } from "../icons.jsx";
import { EDITING_STATUS_OPTIONS } from "../../constants/editing.js";
import { normalizeEditingWorkflowStatus } from "../../utils/kpi.js";

export const ReportStatCard = ({ label, value, color, icon, sub }) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <span className="text-xs font-black uppercase tracking-widest text-slate-500">
        {label}
      </span>
      <div
        className={`w-8 h-8 rounded-xl bg-${color}-50 dark:bg-${color}-500/20 flex items-center justify-center`}
      >
        <Icon name={icon} size={16} className={`text-${color}-500`} />
      </div>
    </div>
    <p
      className={`text-3xl font-black text-${color}-600 dark:text-${color}-400`}
    >
      {value}
    </p>
    {sub && <p className="text-xs text-slate-500">{sub}</p>}
  </div>
);

export const AccentStatCard = ({ label, value, icon, sub, tone = "indigo" }) => {
  const toneClasses = {
    amber: {
      shell: "bg-amber-50 dark:bg-amber-500/20 border-amber-200 dark:border-amber-500/20",
      icon: "text-amber-600 dark:text-amber-300",
      value: "text-amber-700 dark:text-amber-300",
    },
    emerald: {
      shell: "bg-emerald-50 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/20",
      icon: "text-emerald-600 dark:text-emerald-300",
      value: "text-emerald-700 dark:text-emerald-300",
    },
    indigo: {
      shell: "bg-indigo-50 dark:bg-indigo-500/20 border-indigo-200 dark:border-indigo-500/20",
      icon: "text-indigo-600 dark:text-indigo-300",
      value: "text-indigo-700 dark:text-indigo-300",
    },
    rose: {
      shell: "bg-rose-50 dark:bg-rose-500/20 border-rose-200 dark:border-rose-500/20",
      icon: "text-rose-600 dark:text-rose-300",
      value: "text-rose-700 dark:text-rose-300",
    },
    cyan: {
      shell: "bg-cyan-50 dark:bg-cyan-500/20 border-cyan-200 dark:border-cyan-500/20",
      icon: "text-cyan-600 dark:text-cyan-300",
      value: "text-cyan-700 dark:text-cyan-300",
    },
    slate: {
      shell: "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
      icon: "text-slate-600 dark:text-slate-300",
      value: "text-slate-700 dark:text-slate-200",
    },
  };
  const classes = toneClasses[tone] || toneClasses.indigo;
  return (
    <div className={`rounded-2xl border p-5 ${classes.shell}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          {label}
        </span>
        <div className={`rounded-xl bg-white/70 p-2 dark:bg-slate-900/70 ${classes.icon}`}>
          <Icon name={icon} size={16} />
        </div>
      </div>
      <p className={`mt-4 text-3xl font-black ${classes.value}`}>{value}</p>
      {sub && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{sub}</p>}
    </div>
  );
};

export const getModuleStatusMeta = (value = "", kind = "production") => {
  const normalized = String(value || "").trim().toLowerCase();
  const base = {
    programado: { label: "Programado", tone: "slate" },
    pendiente: { label: "Pendiente", tone: "slate" },
    grabando: { label: "Grabando", tone: "amber" },
    "en_produccion": { label: "En producción", tone: "amber" },
    editando: { label: "Editando", tone: "indigo" },
    "post_produccion": { label: "Postproducción", tone: "indigo" },
    revision: { label: "Revisión", tone: "cyan" },
    aprobado: { label: "Aprobado", tone: "emerald" },
    publicado: { label: "Publicado", tone: "emerald" },
    cerrado: { label: "Cerrado", tone: "emerald" },
  };
  if (base[normalized]) return base[normalized];
  if (kind === "podcast") {
    if (normalized.includes("grab")) return base.grabando;
    if (normalized.includes("edit")) return base.editando;
    if (normalized.includes("pub")) return base.publicado;
  }
  if (kind === "production") {
    if (normalized.includes("post")) return base["post_produccion"];
    if (normalized.includes("produ")) return base["en_produccion"];
    if (normalized.includes("pub")) return base.publicado;
  }
  return { label: normalized || "Programado", tone: "slate" };
};

export const MODULE_ACCOUNT_STATUS_OPTIONS = [
  { id: "por_disenar", label: "Por Diseñar" },
  { id: "aprobacion_interna", label: "Aprobación Interna" },
  { id: "aprobado_internamente", label: "Aprobado Interno" },
  { id: "publicado", label: "Publicado" },
];
export const MODULE_EVENT_STATUS_OPTIONS = [
  { id: "programado", label: "Programado" },
  { id: "en_produccion", label: "En producción" },
  { id: "post_produccion", label: "Postproducción" },
  { id: "revision", label: "Revisión" },
  { id: "aprobado", label: "Aprobado" },
  { id: "publicado", label: "Publicado" },
  { id: "cerrado", label: "Cerrado" },
];

export const getModuleLaneByStatus = (taskType, statusValue = "") => {
  const normalizedStatus = String(statusValue || "").trim().toLowerCase();
  if (taskType === "accountTask") {
    if (normalizedStatus === "por_disenar" || normalizedStatus === "pendiente")
      return "start";
    if (["aprobacion_interna", "en_proceso", "en_espera"].includes(normalizedStatus))
      return "production";
    return "ready";
  }
  if (taskType === "editingTask") {
    const normalizedEditing = normalizeEditingWorkflowStatus(normalizedStatus);
    if (normalizedEditing === "editar") return "start";
    if (["en_edicion", "revision_interna"].includes(normalizedEditing))
      return "production";
    return "ready";
  }
  if (["programado", "pendiente"].includes(normalizedStatus)) return "start";
  if (
    [
      "grabando",
      "en_produccion",
      "editando",
      "post_produccion",
      "revision",
      "en_proceso",
      "en_espera",
    ].includes(normalizedStatus)
  ) {
    return "production";
  }
  return "ready";
};

export const getModuleDropStatus = (taskType, laneId, currentStatus = "") => {
  const maps = {
    accountTask: {
      start: "por_disenar",
      production: "aprobacion_interna",
      ready: "aprobado_internamente",
    },
    editingTask: { start: "editar", production: "en_edicion", ready: "aprobado" },
    event: { start: "programado", production: "en_produccion", ready: "publicado" },
  };
  const laneMap = maps[taskType] || maps.event;
  const nextStatus = laneMap[laneId] || "";
  if (!nextStatus) return "";
  if (laneId === "ready" && ["publicado", "cerrado"].includes(String(currentStatus || "").toLowerCase())) {
    return currentStatus;
  }
  return nextStatus;
};

export const getModuleStatusOptions = (taskType) => {
  if (taskType === "accountTask") return MODULE_ACCOUNT_STATUS_OPTIONS;
  if (taskType === "editingTask") return EDITING_STATUS_OPTIONS;
  return MODULE_EVENT_STATUS_OPTIONS;
};
