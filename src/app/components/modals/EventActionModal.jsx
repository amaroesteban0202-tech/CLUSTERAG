import React, { useId } from "react";
import { Icon } from "../icons.jsx";
import { useDialogA11y } from "../../hooks/useDialogA11y.js";

export const EventActionModal = ({
  config,
  canEdit = true,
  onClose,
  onEdit,
  onDelete,
}) => {
  const dialogRef = useDialogA11y(config.isOpen, onClose);
  const dialogTitleId = useId();
  if (!config.isOpen || !config.event) return null;
  return (
    <div
      className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        tabIndex={-1}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-xs overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 outline-none"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="p-6 text-center border-b border-slate-100 dark:border-slate-800">
          <div className="mx-auto w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 mb-4">
            <Icon name="MousePointerClick" size={24} />
          </div>
          <h3
            id={dialogTitleId}
            className="text-lg font-black text-slate-800 dark:text-white truncate"
          >
            {config.event.title || "Elemento"}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            ¿Qué deseas hacer?
          </p>
        </div>
        <div className="p-4 space-y-3">
          {canEdit ? (
            <>
              <button
                onClick={() => {
                  onClose();
                  onEdit(config.event, config.type);
                }}
                className="w-full flex items-center justify-center gap-3 py-4 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold rounded-2xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
              >
                <Icon name="Edit" size={20} /> Editar elemento
              </button>
              <button
                onClick={() => {
                  onClose();
                  onDelete(config.event, config.type);
                }}
                className="w-full flex items-center justify-center gap-3 py-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold rounded-2xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
              >
                <Icon name="Trash2" size={20} /> Eliminar
              </button>
            </>
          ) : (
            <div className="rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4 text-left">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-sm">
                <Icon name="Lock" size={16} /> Acceso de solo lectura
              </div>
              <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-2">
                No tienes permisos para editar o eliminar este elemento.
              </p>
            </div>
          )}
          <button
            onClick={onClose}
            className="w-full py-4 text-slate-500 dark:text-slate-400 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors mt-2"
          >
            {canEdit ? "Cancelar" : "Cerrar"}
          </button>
        </div>
      </div>
    </div>
  );
};
