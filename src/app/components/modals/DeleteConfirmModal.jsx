import React, { useId } from "react";
import { Icon } from "../icons.jsx";
import { useDialogA11y } from "../../hooks/useDialogA11y.js";

export const DeleteConfirmModal = ({ config, onClose, onConfirm }) => {
  const dialogRef = useDialogA11y(config.isOpen, onClose);
  const dialogTitleId = useId();
  return (
    <div
      className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        tabIndex={-1}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 outline-none"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-400">
          <Icon name="AlertTriangle" size={32} />
        </div>
        <h3
          id={dialogTitleId}
          className="text-lg font-black text-slate-800 dark:text-white mb-2"
        >
          ¿Eliminar {config.title}?
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
          Esta acción es permanente y no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 shadow-lg shadow-red-500/30 transition-colors"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};
