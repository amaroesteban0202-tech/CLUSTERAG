export const TASK_STATUS_DEFS = {
  accountTask: [
    { id: "por_disenar", label: "Por Diseñar", color: "slate" },
    { id: "aprobacion_interna", label: "Aprob. Interna", color: "blue" },
    { id: "aprobado_internamente", label: "Aprobado", color: "emerald" },
    { id: "publicado", label: "Publicado", color: "indigo" },
  ],
  editingTask: [
    { id: "editar", label: "Por Editar", color: "slate" },
    { id: "en_edicion", label: "En Edición", color: "amber" },
    { id: "revision_interna", label: "Revisión", color: "blue" },
    { id: "aprobado", label: "Aprobado", color: "emerald" },
    { id: "publicado", label: "Publicado", color: "indigo" },
  ],
  managementTask: [
    { id: "pendiente", label: "Pendiente", color: "slate" },
    { id: "en_proceso", label: "En Proceso", color: "violet" },
    { id: "en_espera", label: "En Espera", color: "amber" },
    { id: "cerrado", label: "Cerrado", color: "emerald" },
  ],
};

export const STATUS_COLOR_CLASSES = {
  slate:
    "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600",
  blue: "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-500/40",
  emerald:
    "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40",
  indigo:
    "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-500/40",
  amber:
    "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/40",
  violet:
    "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-500/40",
};
