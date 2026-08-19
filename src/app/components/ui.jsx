import React, { useId, useRef, useState } from "react";
import { Icon } from "./icons.jsx";

const slugifyId = (value = "") =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

export const ViewTabs = ({ items, active, onChange }) => (
  <div
    className="inline-flex w-fit max-w-full overflow-x-auto rounded-md border border-[var(--border)] bg-white p-1 dark:border-white/10 dark:bg-[var(--surface-raised)]"
    role="tablist"
  >
    {items.map((item) => (
      <button
        key={item.id}
        type="button"
        role="tab"
        aria-selected={active === item.id}
        onClick={() => onChange(item.id)}
        className={`min-h-[38px] min-w-0 whitespace-nowrap rounded px-3 py-1.5 text-sm font-medium transition-colors ${
          active === item.id
            ? "bg-[var(--primary)] text-white dark:bg-[var(--primary)] dark:text-[var(--primary-contrast)]"
            : "text-[var(--text-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text)] dark:text-[var(--text-muted)] dark:hover:bg-[var(--surface-muted)] dark:hover:text-[var(--text)]"
        }`}
      >
        {item.label}
      </button>
    ))}
  </div>
);

export const Button = ({
  children,
  onClick,
  type = "button",
  color = "purple",
  full,
  icon,
  ...props
}) => (
  <button
    type={type}
    onClick={onClick}
    className={`${full ? "w-full" : ""} primary-action min-h-[44px] whitespace-nowrap px-4 py-2.5 font-semibold flex items-center justify-center gap-2 transition-colors active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--focus)] dark:focus-visible:ring-[var(--focus)] dark:focus-visible:ring-offset-[#181817]`}
    {...props}
  >
    {icon && <Icon name={icon} />} {children}
  </button>
);

export const EmptyState = ({ icon, text }) => (
  <div className="flex flex-col items-center justify-center p-6 text-center h-full">
    <Icon
      name={icon}
      size={32}
      className="text-slate-500 dark:text-slate-400 mb-3"
    />
    <p className="text-sm font-medium text-[var(--text-muted)] dark:text-[var(--text-muted)]">
      {text}
    </p>
  </div>
);

export const AppShellSkeleton = () => (
  <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
    <div className="hidden md:flex w-64 shrink-0 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
      <div className="h-10 w-36 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
      <div className="mt-10 space-y-3">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"
          />
        ))}
      </div>
    </div>
    <div className="flex-1 p-4 md:p-8">
      <div className="mb-6 h-10 w-64 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-28 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"
          >
            <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="mt-5 h-8 w-16 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-72 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"
          >
            <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="mt-5 space-y-3">
              {Array.from({ length: 4 }).map((__, itemIndex) => (
                <div
                  key={itemIndex}
                  className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const Breadcrumb = ({ items }) => (
  <nav
    aria-label="Ruta de navegación"
    className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mb-2"
  >
    {items.map((item, index) => (
      <React.Fragment key={`${item.label}-${index}`}>
        {index > 0 && (
          <span
            aria-hidden="true"
            className="text-slate-300 dark:text-slate-600"
          >
            /
          </span>
        )}
        {item.onClick ? (
          <button
            onClick={item.onClick}
            className="min-h-0 min-w-0 rounded-md px-1 py-0.5 font-bold hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
          >
            {item.label}
          </button>
        ) : (
          <span className="font-bold text-slate-800 dark:text-slate-100">
            {item.label}
          </span>
        )}
      </React.Fragment>
    ))}
  </nav>
);

export const SearchBar = ({ searchTerm, setSearchTerm, placeholder }) => (
  <div className="relative w-full md:w-64 shrink-0">
    <Icon
      name="Search"
      className="absolute left-3 top-3 text-slate-500 dark:text-slate-400"
      size={16}
    />
    <input
      type="text"
      aria-label={placeholder || "Buscar"}
      placeholder={placeholder}
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="min-h-[46px] w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-500 dark:placeholder:text-slate-500"
    />
  </div>
);

export const StatCard = ({
  title,
  value,
  icon,
  detail = "",
  onClick = null,
  actionLabel = "",
}) => {
  const CardElement = onClick ? "button" : "div";
  return (
  <CardElement
    {...(onClick
      ? {
          type: "button",
          onClick,
          "aria-label": actionLabel || `Abrir ${title}`,
        }
      : {})}
    className={`surface group flex min-h-[118px] w-full items-start justify-between p-5 text-left transition-colors ${
      onClick
        ? "hover:border-[var(--border-strong)] hover:bg-[var(--surface-subtle)] dark:hover:border-[var(--border-strong)] dark:hover:bg-[var(--surface-muted)]"
        : ""
    }`}
  >
    <div className="min-w-0">
      <p className="text-xs font-medium text-[var(--text-muted)] dark:text-[var(--text-muted)]">
        {title}
      </p>
      <p className="mono-meta mt-2 text-3xl font-semibold leading-none text-[var(--text)] dark:text-[var(--text)]">
        {value}
      </p>
      {detail && (
        <p className="mt-2 text-xs text-[var(--text-faint)] dark:text-[var(--text-faint)]">
          {detail}
        </p>
      )}
    </div>
    <div className="flex items-center gap-2">
      {onClick && (
        <Icon
          name="ArrowRight"
          size={16}
          className="text-[var(--text-faint)] transition-transform group-hover:translate-x-0.5 dark:text-[var(--text-faint)]"
        />
      )}
      <div className="rounded-lg bg-[var(--surface-muted)] p-2.5 text-[var(--text-muted)] dark:bg-[var(--surface-muted)] dark:text-[var(--text-muted)]">
        <Icon name={icon} size={20} />
      </div>
    </div>
  </CardElement>
  );
};

export const Input = ({ label, id, className = "", ...props }) => {
  const reactId = useId();
  const inputId =
    id ||
    `input-${slugifyId(label || props.name || props.placeholder || reactId)}`;
  const ariaLabel =
    props["aria-label"] ||
    (label ? undefined : props.placeholder || props.name);
  return (
    <div>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-medium text-[var(--text-muted)] dark:text-[var(--text-muted)] mb-1.5"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-label={ariaLabel}
        className={`w-full p-4 md:p-3 bg-white dark:bg-[var(--surface-raised)] border border-[var(--border)] dark:border-white/10 rounded-md focus:border-[var(--focus)] dark:focus:border-[var(--focus)] focus:ring-0 outline-none font-normal text-[var(--text)] dark:text-[var(--text)] transition-colors placeholder:text-[var(--text-faint)] ${className}`}
        {...props}
      />
    </div>
  );
};

// Subida de foto de perfil: comprime a un JPEG pequeño (data URL) en el
// navegador y lo expone como <input hidden name="photo"> para el FormData.
export const PhotoUploader = ({
  name = "photo",
  defaultValue = "",
  label = "Foto de perfil",
}) => {
  const [photo, setPhoto] = useState(defaultValue || "");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    setBusy(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 240;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        try {
          setPhoto(canvas.toDataURL("image/jpeg", 0.82));
        } catch (err) {
          setPhoto(ev.target.result);
        }
        setBusy(false);
      };
      img.onerror = () => setBusy(false);
      img.src = ev.target.result;
    };
    reader.onerror = () => setBusy(false);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-1">
        {label}
      </label>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
          {photo ? (
            <img
              src={photo}
              alt="Foto de perfil"
              className="w-full h-full object-cover"
            />
          ) : (
            <Icon
              name="User"
              size={26}
              className="text-slate-400 dark:text-slate-500"
            />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Icon
              name={busy ? "Loader2" : "UserPlus"}
              size={15}
              className={busy ? "animate-spin" : ""}
            />
            {photo ? "Cambiar foto" : "Subir foto"}
          </button>
          {photo && (
            <button
              type="button"
              onClick={() => setPhoto("")}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <Icon name="Trash2" size={15} /> Quitar
            </button>
          )}
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
      <input type="hidden" name={name} value={photo} />
    </div>
  );
};

export const CheckItem = ({ label, checked, onToggle }) => (
  <button
    onClick={onToggle}
    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${checked ? "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30 text-green-800 dark:text-green-400" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-blue-300 dark:hover:border-blue-600"}`}
  >
    <span className="font-bold text-sm">{label}</span>
    {checked ? (
      <Icon name="CheckCircle2" size={20} className="text-green-500" />
    ) : (
      <Icon name="Circle" size={20} />
    )}
  </button>
);
