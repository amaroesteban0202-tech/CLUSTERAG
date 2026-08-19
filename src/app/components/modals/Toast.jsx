import React from "react";
import { Icon } from "../icons.jsx";

export const Toast = ({ message, type }) => (
  <div
    role={type === "error" ? "alert" : "status"}
    aria-live={type === "error" ? "assertive" : "polite"}
    className={`pointer-events-auto px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 fade-in ${type === "error" ? "bg-red-600 text-white" : "bg-slate-800 dark:bg-white text-white dark:text-slate-900"}`}
  >
    <Icon
      name={type === "success" ? "CheckCircle2" : "AlertTriangle"}
      size={20}
      className={type === "success" ? "text-green-400" : ""}
    />
    <span className="font-bold text-sm">{message}</span>
  </div>
);
