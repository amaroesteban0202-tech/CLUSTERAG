import React, { useId } from "react";
import { Icon } from "../icons.jsx";
import { EmptyState } from "../ui.jsx";
import { useDialogA11y } from "../../hooks/useDialogA11y.js";

export const DayDetailsModal = ({
  config,
  onClose,
  activities,
  clients,
  managers,
  editors,
  users,
  canEditActivity,
  onEdit,
  onDelete,
}) => {
  const dialogRef = useDialogA11y(config.isOpen, onClose);
  const dialogTitleId = useId();
  if (!config.isOpen) return null;
  const dayActivities = activities.filter((a) => a.date === config.date);
  const modalTitles = {
    client: "Cliente",
    manager: "Account Manager",
    editor: "Editor",
    event: "Produccion",
    accountTask: "Tarea de Account",
    editingTask: "Tarea de Edicion",
    managementTask: "Tarea de Gestion",
    user: "Usuario",
  };

  let displayDate = "";
  if (config.date) {
    const [y, m, d] = config.date.split("-");
    displayDate = new Date(y, m - 1, d).toLocaleDateString("es-HN", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        tabIndex={-1}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950 shrink-0">
          <div>
            <h3
              id={dialogTitleId}
              className="font-black text-lg text-slate-800 dark:text-white capitalize"
            >
              {displayDate}
            </h3>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Detalle de Actividades
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400"
          >
            <Icon name="X" size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scroll space-y-3">
          {dayActivities.length === 0 ? (
            <EmptyState icon="Inbox" text="No hay actividades este día" />
          ) : (
            dayActivities.map((act) => {
              const client = clients?.find((c) => c.id === act.clientId);
              let personName = "Sin asignar";

              if (act.collectionType === "accountTask") {
                const manager = managers?.find((m) => m.id === act.contextId);
                if (manager) personName = manager.name;
              } else if (act.collectionType === "editingTask") {
                const editor = editors?.find((e) => e.id === act.contextId);
                if (editor) personName = editor.name;
              } else if (act.collectionType === "managementTask") {
                const managementUser = users?.find(
                  (u) => u.id === act.contextId,
                );
                if (managementUser) personName = managementUser.name;
              }

              return (
                <div
                  key={`${act.collectionType}-${act.id}`}
                  className={`p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 shadow-sm flex items-center gap-4`}
                >
                  <div
                    className={`p-3 rounded-xl bg-${act._color}-50 dark:bg-${act._color}-500/20 text-${act._color}-600 dark:text-${act._color}-400 shrink-0`}
                  >
                    <Icon name={act._icon} size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-800 dark:text-white truncate">
                      {act.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span
                        className={`text-[9px] font-black uppercase tracking-wider text-${act._color}-600 dark:text-${act._color}-400`}
                      >
                        {act._label}
                      </span>

                      {client && (
                        <span className="flex items-center gap-1 text-[9px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800">
                          <Icon name="Briefcase" size={8} /> {client.name}
                        </span>
                      )}

                      {(act.collectionType === "accountTask" ||
                        act.collectionType === "editingTask" ||
                        act.collectionType === "managementTask") && (
                        <span className="flex items-center gap-1 text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          <Icon name="UserCircle2" size={8} /> {personName}
                        </span>
                      )}

                      {act.status && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border ${
                            act.status === "publicado" ||
                            act.status === "aprobado"
                              ? "bg-green-50 text-green-600 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                              : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                          }`}
                        >
                          {act.status.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                  </div>
                  {canEditActivity(act.collectionType) && (
                    <div className="flex items-center gap-1 opacity-100 md:opacity-60 md:hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          onClose();
                          onEdit(act, act.collectionType);
                        }}
                        className="p-2 text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Icon name="Edit" size={18} />
                      </button>
                      <button
                        onClick={() => {
                          onClose();
                          onDelete(act, act.collectionType);
                        }}
                        className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Icon name="Trash2" size={18} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
