import React, { useEffect, useRef, useState } from "react";
import { Icon } from "./icons.jsx";
import { Button, SearchBar } from "./ui.jsx";
import {
  SHORT_MONTHS_ES,
  PILL_TONES,
  ACCENT_BORDER,
  AVATAR_FAMILY,
  CLIENT_STATUSES,
} from "../constants/ui-tones.js";
import {
  compareDateOnlyStrings,
  getHondurasTodayStr,
  isDateBeforeDateString,
} from "../utils/date.js";
import { isCompletedStatus } from "../utils/task-helpers.js";

export const formatShortDate = (dateStr) => {
  if (!dateStr) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dateStr));
  if (!m) return String(dateStr);
  const month = SHORT_MONTHS_ES[parseInt(m[2], 10) - 1] || "";
  return `${parseInt(m[3], 10)} ${month}`;
};

export const getInitials = (name) => {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

export const buildAssignee = (person, legacyColorMap = {}) => {
  if (!person) return null;
  let key = person.color;
  if (legacyColorMap && legacyColorMap[key]) key = legacyColorMap[key];
  const family = AVATAR_FAMILY[key] || "slate";
  return {
    name: person.name || "Sin asignar",
    initials: getInitials(person.name),
    className: `bg-${family}-600 text-white`,
    photo: person.photo || "",
  };
};

// Avatar de persona reutilizable: muestra la foto si existe, o las iniciales.
export const PersonAvatar = ({ person, size = 24, legacyColorMap = {}, className = "" }) => {
  const dim = { width: size, height: size };
  if (!person) {
    return (
      <span
        style={dim}
        className={`rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 shrink-0 ${className}`}
      >
        <Icon name="User" size={Math.round(size * 0.55)} />
      </span>
    );
  }
  const meta = buildAssignee(person, legacyColorMap);
  if (meta.photo) {
    return (
      <img
        src={meta.photo}
        alt={meta.name}
        style={dim}
        className={`rounded-full object-cover shrink-0 border border-black/5 dark:border-white/10 ${className}`}
      />
    );
  }
  return (
    <span
      style={{ ...dim, fontSize: Math.round(size * 0.4) }}
      className={`rounded-full flex items-center justify-center font-bold shrink-0 ${meta.className} ${className}`}
    >
      {meta.initials}
    </span>
  );
};


export const getClientStatus = (client) =>
  CLIENT_STATUSES.find((s) => s.id === (client?.status || "Activo")) ||
  CLIENT_STATUSES[0];

// Menú "⋯" con acciones de tarjeta (avanzar, volver, editar, eliminar).
export const CardMenu = ({ items = [] }) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (
        menuRef.current?.contains(e.target) ||
        btnRef.current?.contains(e.target)
      )
        return;
      setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  if (!items.length) return null;

  const toggle = (e) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const menuWidth = 190;
      let left = r.right - menuWidth;
      if (left < 8) left = 8;
      setCoords({ top: r.bottom + 6, left });
    }
    setOpen((o) => !o);
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        aria-label="Más acciones"
        aria-haspopup="true"
        aria-expanded={open}
        className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <Icon name="MoreHorizontal" size={16} />
      </button>
      {open && (
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            top: coords.top,
            left: coords.left,
            width: 190,
            zIndex: 9999,
          }}
          className="py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl shadow-black/10 dark:shadow-black/50 fade-in"
        >
          {items.map((it) => (
            <button
              key={it.key}
              disabled={it.disabled}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                it.onClick?.();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13px] font-semibold transition-colors disabled:opacity-40 ${
                it.danger
                  ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Icon name={it.icon} size={15} /> {it.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
};

// Tarjeta compartida: compacta, navegable y consistente en todas las salas.
export const KanbanCard = ({
  onClick,
  draggable,
  onDragStart,
  onDragEnd,
  accentTone,
  isOverdue,
  client,
  rank,
  badges = [],
  title,
  notes,
  due,
  assignee,
  menuItems = [],
  selected = false,
  statusControl = null,
}) => {
  const accent = isOverdue
    ? "border-l-red-500"
    : ACCENT_BORDER[accentTone] || "border-l-transparent";
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Abrir tarea ${title}`}
      onClick={onClick}
      onKeyDown={(event) => {
        if (
          event.target === event.currentTarget &&
          (event.key === "Enter" || event.key === " ")
        ) {
          event.preventDefault();
          onClick?.();
        }
      }}
      draggable={draggable ? "true" : undefined}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`task-card group relative cursor-pointer rounded-xl border border-[var(--border)] border-l-[3px] bg-white p-4 transition-[border-color,background-color,transform] duration-200 hover:-translate-y-px hover:border-[var(--border-strong)] focus-visible:outline-none dark:border-white/10 dark:bg-[var(--surface-raised)] dark:hover:border-white/20 ${selected ? "ring-2 ring-[var(--status-yellow-text)] dark:ring-[var(--status-yellow-text)]" : ""} ${accent}`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5 min-h-[20px]">
        <div className="min-w-0 flex-1">
          {client && (
            <span className="inline-flex max-w-full items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-slate-500 dark:text-slate-400">
              <Icon name="Briefcase" size={10} className="shrink-0" />
              <span className="truncate">{client}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {rank != null && (
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 rounded px-1.5 py-0.5">
              #{rank}
            </span>
          )}
          {menuItems.length > 0 && (
            <span className="opacity-70 group-hover:opacity-100 transition-opacity">
              <CardMenu items={menuItems} />
            </span>
          )}
        </div>
      </div>

      <p className="mb-2.5 line-clamp-2 text-[15px] font-semibold leading-snug text-slate-800 dark:text-slate-100">
        {title}
      </p>

      {badges.length > 0 && (
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {badges.map((b, i) => (
            <span
              key={i}
              className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                b.className || PILL_TONES[b.tone] || PILL_TONES.slate
              }`}
            >
              {b.label}
            </span>
          ))}
        </div>
      )}

      {statusControl && (
        <label
          className="mb-2.5 block"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          onTouchStart={(event) => event.stopPropagation()}
        >
          <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
            Estado
          </span>
          <span className="relative block">
            <select
              value={statusControl.value}
              onChange={(event) => statusControl.onChange(event.target.value)}
              onClick={(event) => event.stopPropagation()}
              onDragStart={(event) => event.stopPropagation()}
              aria-label={`Cambiar estado de ${title}`}
              className="min-h-11 w-full appearance-none rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2 pr-10 text-sm font-semibold text-slate-700 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 dark:border-white/10 dark:bg-[var(--surface)] dark:text-slate-200 lg:min-h-9 lg:py-1.5 lg:text-xs"
            >
              {statusControl.options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label || option.title}
                </option>
              ))}
            </select>
            <Icon
              name="ChevronDown"
              size={14}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
          </span>
        </label>
      )}

      {notes && (
        <p className="mb-2 line-clamp-1 text-[11.5px] leading-snug text-slate-400 dark:text-slate-500">
          {notes}
        </p>
      )}

      <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-white/5">
        {due ? (
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
              due.tone === "red"
                ? "text-red-500 dark:text-red-400"
                : due.tone === "amber"
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-slate-400 dark:text-slate-500"
            }`}
          >
            <Icon name="CalendarDays" size={12} className="shrink-0" />
            {due.label}
          </span>
        ) : (
          <span />
        )}
        {assignee ? (
          assignee.photo ? (
            <img
              src={assignee.photo}
              alt={assignee.name}
              title={assignee.name}
              className="w-6 h-6 rounded-full object-cover shrink-0 border border-black/5 dark:border-white/10"
            />
          ) : (
            <span
              title={assignee.name}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${assignee.className}`}
            >
              {assignee.initials}
            </span>
          )
        ) : (
          <span className="w-6 h-6 rounded-full border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-300 dark:text-slate-600 shrink-0">
            <Icon name="User" size={11} />
          </span>
        )}
      </div>
    </div>
  );
};

// Columna de tablero compartida (cabecera discreta + cuerpo + añadir).
export const KanbanColumn = ({
  dotColor = "slate",
  title,
  subtitle,
  count,
  onAdd,
  onDragOver,
  onDragLeave,
  onDrop,
  isEmpty,
  children,
}) => {
  const columnColor = getDashboardPalette(dotColor).strong;
  return (
    <section
      className="task-room-column flex h-[calc(100dvh-15rem)] min-h-[32rem] w-[88vw] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] transition-colors dark:border-white/10 dark:bg-[var(--surface)] sm:w-[24rem] lg:h-full lg:min-h-0 lg:w-auto lg:shrink"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      aria-label={`${title}: ${count} tareas`}
    >
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3.5 dark:border-white/10 dark:bg-[var(--surface)]">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: columnColor }}
            />
            <span className="truncate text-sm font-semibold text-[var(--text)] dark:text-[var(--text)]">
              {title}
            </span>
            <span className="mono-meta shrink-0 rounded-md bg-[var(--surface-muted)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text-muted)] dark:bg-[var(--surface-muted)] dark:text-[var(--text-muted)]">
              {count}
            </span>
          </div>
          {subtitle && (
            <p className="mt-1.5 pl-5 text-[11px] text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            aria-label={`Añadir tarea en ${title}`}
            title="Añadir tarea"
            className="flex h-8 min-h-0 w-8 min-w-0 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)] dark:text-[var(--text-muted)] dark:hover:bg-[var(--surface-muted)] dark:hover:text-[var(--text)]"
          >
            <Icon name="Plus" size={15} />
          </button>
        )}
      </header>
      <div className="custom-scroll flex-1 space-y-3 overflow-y-auto overscroll-contain p-3">
        {isEmpty && (
          <div className="flex h-full min-h-40 select-none flex-col items-center justify-center gap-2 text-slate-300 dark:text-slate-600">
            <Icon name="Inbox" size={24} />
            <span className="text-[11px] font-semibold">Sin tareas en esta etapa</span>
          </div>
        )}
        {children}
      </div>
    </section>
  );
};

export const KanbanStage = ({
  title,
  dotColor = "slate",
  tasks,
  renderTask,
  showHeader = true,
  collapsible = false,
  collapsedLimit = 3,
  onDragOver,
  onDragLeave,
  onDrop,
}) => {
  const [expanded, setExpanded] = useState(false);
  const color = getDashboardPalette(dotColor).strong;
  const canCollapse = collapsible && tasks.length > collapsedLimit;
  const visibleTasks = canCollapse && !expanded ? tasks.slice(0, collapsedLimit) : tasks;

  return (
    <section
      className="rounded-lg border border-transparent transition-colors [&.drag-over]:border-[var(--status-yellow-text)] [&.drag-over]:bg-[var(--status-yellow-text)]/5"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      aria-label={`${title}: ${tasks.length} tareas`}
    >
      {showHeader && (
        <div className="mb-2 flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2.5 dark:border-white/10 dark:bg-[var(--surface-muted)]">
          <div className="flex min-w-0 items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
            <span className="truncate text-[11px] font-semibold uppercase tracking-[0.07em] text-slate-600 dark:text-slate-300">
              {title}
            </span>
            <span className="rounded bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-[var(--surface-muted)] dark:text-slate-400">
              {tasks.length}
            </span>
          </div>
          {canCollapse && (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-black/5 dark:text-slate-400 dark:hover:bg-white/5"
              aria-label={expanded ? `Contraer ${title}` : `Expandir ${title}`}
            >
              <Icon name={expanded ? "ChevronUp" : "ChevronDown"} size={14} />
            </button>
          )}
        </div>
      )}
      <div className="space-y-2.5">
        {visibleTasks.map((task) => renderTask(task))}
      </div>
      {canCollapse && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--border-strong)] px-3 py-2.5 text-xs font-semibold text-slate-500 hover:border-[var(--border-strong)] hover:text-slate-700 dark:border-white/15 dark:text-slate-400 dark:hover:border-white/25 dark:hover:text-slate-200"
        >
          Ver {tasks.length - collapsedLimit} más
          <Icon name="ChevronDown" size={14} />
        </button>
      )}
    </section>
  );
};

export const TaskRoomInspector = ({
  task,
  client,
  assignee,
  status,
  onClose,
  onOpenFull,
}) => {
  if (!task) return null;
  const checklist = Array.isArray(task.checklist) ? task.checklist : [];
  const completed = checklist.filter((item) => item.done).length;
  const progress = checklist.length ? Math.round((completed / checklist.length) * 100) : 0;
  const activity = [
    ...(Array.isArray(task.comments)
      ? task.comments.map((item) => ({
          id: item.id,
          author: item.authorName || "Equipo",
          text: item.text,
          date: item.createdAt,
        }))
      : []),
    ...(Array.isArray(task.timeEntries)
      ? task.timeEntries.map((item) => ({
          id: item.id,
          author: item.authorName || "Equipo",
          text: "Registró tiempo en la tarea",
          date: item.loggedAt,
        }))
      : []),
  ]
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 3);
  const priority = task.priority
    ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1)
    : "Normal";
  const isOverdue = isDateBeforeDateString(task.date, getHondurasTodayStr()) &&
    !isCompletedStatus(task.status);

  return (
    <aside className="task-room-inspector fixed inset-x-3 bottom-3 top-20 z-40 flex min-h-0 flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] shadow-2xl dark:border-white/10 dark:bg-[var(--surface)] 2xl:static 2xl:z-auto 2xl:shadow-none">
      <div className="custom-scroll flex-1 overflow-y-auto p-5">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {client && (
              <p className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                <Icon name="Briefcase" size={11} />
                {client}
              </p>
            )}
            <h3 className="text-lg font-semibold leading-snug text-slate-900 dark:text-[var(--text)]">
              {task.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-black/5 dark:text-slate-400 dark:hover:bg-white/5"
            aria-label="Cerrar inspector"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 dark:border-white/10 dark:bg-[var(--surface-raised)]">
            <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">Estado</p>
            <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">{status?.title || "Sin estado"}</p>
          </div>
          <div className={`rounded-lg border px-3 py-2.5 ${priority.toLowerCase() === "urgente" ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300" : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"}`}>
            <p className="text-[9px] font-semibold uppercase tracking-[0.08em] opacity-70">Prioridad</p>
            <p className="mt-1 text-xs font-semibold">{priority}</p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 border-b border-[var(--border)] pb-6 dark:border-white/10">
          <div>
            <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">Responsable</p>
            <div className="flex items-center gap-2">
              {assignee ? (
                <>
                  {assignee.photo ? (
                    <img src={assignee.photo} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold ${assignee.className}`}>
                      {assignee.initials}
                    </span>
                  )}
                  <span className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">{assignee.name}</span>
                </>
              ) : (
                <span className="text-xs text-slate-500">Sin asignar</span>
              )}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">Vencimiento</p>
            <p className={`inline-flex items-center gap-1.5 text-xs font-semibold ${isOverdue ? "text-red-500" : "text-slate-700 dark:text-slate-200"}`}>
              <Icon name="CalendarDays" size={14} />
              {formatShortDate(task.date)}{isOverdue ? " · atrasada" : ""}
            </p>
          </div>
        </div>

        {task.assignedByName && (
          <div className="mb-6 flex items-center gap-2.5 border-b border-[var(--border)] pb-6 dark:border-white/10">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
              <Icon name="UserCheck" size={15} />
            </span>
            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Creada por
              </p>
              <p className="mt-0.5 truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
                {task.assignedByName}
              </p>
            </div>
          </div>
        )}

        <div className="mb-6 border-b border-[var(--border)] pb-6 dark:border-white/10">
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">Progreso</p>
            <span className="text-xs font-semibold text-slate-500">{progress}%</span>
          </div>
          <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-muted)] dark:bg-white/10">
            <span className="block h-full rounded-full bg-[var(--status-yellow-text)] transition-[width]" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {checklist.length ? `${completed} de ${checklist.length} completadas` : "Sin checklist"}
          </p>
        </div>

        {task.notes && (
          <div className="mb-6 border-b border-[var(--border)] pb-6 dark:border-white/10">
            <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">Descripción</p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-slate-300">{task.notes}</p>
          </div>
        )}

        <div>
          <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">Actividad reciente</p>
          {activity.length ? (
            <div className="space-y-3">
              {activity.map((item) => (
                <div key={item.id} className="flex gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--status-green-text)] text-[9px] font-bold text-white">
                    {getInitials(item.author)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{item.author}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">Sin actividad registrada.</p>
          )}
        </div>
      </div>
      <div className="border-t border-[var(--border)] p-4 dark:border-white/10">
        <button
          type="button"
          onClick={onOpenFull}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-[var(--primary-contrast)] transition-colors hover:bg-[var(--primary-hover)] dark:bg-[var(--primary)] dark:text-[var(--primary-contrast)] dark:hover:bg-[var(--primary-hover)]"
        >
          Abrir tarea completa
          <Icon name="ExternalLink" size={15} />
        </button>
      </div>
    </aside>
  );
};

export const TaskRoomWorkspace = ({
  groups,
  onAdd,
  canAdd = true,
  renderTask,
  onDragOver,
  onDragLeave,
  onDrop,
  inspector,
}) => (
  <div className={`task-room-workspace grid min-h-0 flex-1 gap-3 ${inspector ? "2xl:grid-cols-[minmax(0,1fr)_22rem]" : ""}`}>
    <div className="task-room-board flex min-h-0 gap-3 overflow-x-auto pb-4 snap-x snap-mandatory kanban-mobile-scroll lg:grid lg:grid-cols-3 lg:overflow-hidden lg:pb-0">
      {groups.map((group) => {
        const count = group.stages.reduce((total, stage) => total + stage.tasks.length, 0);
        return (
          <KanbanColumn
            key={group.id}
            dotColor={group.color}
            title={group.title}
            subtitle={group.subtitle}
            count={count}
            onAdd={canAdd ? onAdd : undefined}
            isEmpty={count === 0}
          >
            {group.stages.map((stage) => (
              <KanbanStage
                key={stage.id}
                title={stage.title}
                dotColor={stage.color}
                tasks={stage.tasks}
                renderTask={(task) => renderTask(task, stage)}
                showHeader={group.stages.length > 1}
                collapsible={stage.collapsible}
                collapsedLimit={stage.collapsedLimit}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={(event) => onDrop(event, stage.id)}
              />
            ))}
          </KanbanColumn>
        );
      })}
    </div>
    {inspector}
  </div>
);

export const DateHeader = ({
  currentDate,
  setCurrentDate,
  filterMode,
  setFilterMode,
  ownershipFilter = "all",
  setOwnershipFilter,
  title,
  onAdd,
  btnColor,
  btnIcon,
  searchTerm,
  setSearchTerm,
  rangeStart,
  setRangeStart,
  rangeEnd,
  setRangeEnd,
  onLoadHistory,
  historyLoaded = false,
  historyLoading = false,
  taskCount = 0,
}) => {
  const today = getHondurasTodayStr();
  const hasRangeSupport = Boolean(setRangeStart && setRangeEnd);
  const effectiveRangeStart = rangeStart || today;
  const effectiveRangeEnd = rangeEnd || today;
  const periodDate = new Date(`${currentDate || today}T12:00:00`);
  const periodLabel = new Intl.DateTimeFormat("es-HN", {
    month: "long",
    year: "numeric",
  }).format(periodDate);

  const handleRangeStartChange = (e) => {
    const val = e.target.value;
    setRangeStart(val);
    if (compareDateOnlyStrings(val, effectiveRangeEnd) > 0) setRangeEnd(val);
  };
  const handleRangeEndChange = (e) => {
    const val = e.target.value;
    setRangeEnd(val);
    if (compareDateOnlyStrings(val, effectiveRangeStart) < 0)
      setRangeStart(val);
  };

  const segBase =
    "shrink-0 min-h-9 px-3 py-2 text-[12px] font-medium rounded-lg transition-colors flex items-center gap-1.5";
  const segActive =
    "bg-white text-[var(--text)] shadow-sm dark:bg-[var(--surface-muted)] dark:text-[var(--text)]";
  const segIdle =
    "text-slate-500 dark:text-slate-400 hover:bg-black/5 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-slate-200";

  return (
    <header className="task-room-header shrink-0 border-b border-[var(--border)] pb-3 dark:border-white/10">
      <div className="mb-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h2 className="editorial-title truncate text-[clamp(1.75rem,3vw,2.5rem)] leading-none text-[var(--text)] dark:text-[var(--text)]">
            {title}
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {taskCount} {taskCount === 1 ? "tarea" : "tareas"} · {periodLabel.charAt(0).toUpperCase() + periodLabel.slice(1)}
          </p>
        </div>
        <div className="flex w-full flex-col items-stretch gap-2 sm:flex-row sm:items-center lg:w-auto">
          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            placeholder="Buscar tarea..."
          />
          <div className="shrink-0">
            <Button
              onClick={() =>
                onAdd(
                  filterMode === "date"
                    ? currentDate
                    : filterMode === "range"
                      ? effectiveRangeStart
                      : today,
                )
              }
              color={btnColor}
              icon={btnIcon}
              full
            >
              Nueva Tarea
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
          <div
            className="flex max-w-full overflow-x-auto rounded-lg bg-[var(--surface-muted)] p-1 kanban-mobile-scroll dark:bg-[var(--surface-raised)]"
            role="group"
            aria-label="Filtro por tiempo"
          >
            <button
              onClick={() => setFilterMode("date")}
              className={`${segBase} ${filterMode === "date" ? segActive : segIdle}`}
            >
              <Icon name="CalendarDays" size={14} />
              Hoy / día
            </button>
            {hasRangeSupport && (
              <button
                onClick={() => setFilterMode("range")}
                className={`${segBase} ${filterMode === "range" ? segActive : segIdle}`}
              >
                <Icon name="CalendarRange" size={14} />
                Rango
              </button>
            )}
            <button
              onClick={() => setFilterMode("overdue")}
              className={`${segBase} ${filterMode === "overdue" ? "bg-[var(--status-red-bg)] text-[var(--status-red-text)] dark:bg-red-500/15 dark:text-red-300" : segIdle}`}
            >
              Atrasadas <Icon name="Flame" size={14} />
            </button>
            <button
              onClick={() => setFilterMode("all")}
              className={`${segBase} ${filterMode === "all" ? segActive : segIdle}`}
            >
              Ver todas
            </button>
            {onLoadHistory && (
              <button
                onClick={async () => {
                  if (!historyLoaded) await onLoadHistory();
                  setFilterMode("history");
                }}
                disabled={historyLoading}
                className={`${segBase} ${filterMode === "history" ? segActive : segIdle}`}
              >
                <Icon name="Clock" size={14} />
                {historyLoading ? "Cargando" : "Histórico"}
              </button>
            )}
          </div>
          {setOwnershipFilter && (
            <>
              <span
                className="hidden text-[var(--border-strong)] sm:inline"
                aria-hidden="true"
              >
                |
              </span>
              <div
                className="flex max-w-full overflow-x-auto rounded-lg bg-[var(--surface-muted)] p-1 kanban-mobile-scroll dark:bg-[var(--surface-raised)]"
                role="group"
                aria-label="Filtro por asignación"
              >
                <button
                  onClick={() => setOwnershipFilter("all")}
                  className={`${segBase} ${ownershipFilter === "all" ? segActive : segIdle}`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setOwnershipFilter("mine")}
                  className={`${segBase} ${ownershipFilter === "mine" ? segActive : segIdle}`}
                >
                  <Icon name="User" size={14} />
                  Asignadas a mí
                </button>
              </div>
            </>
          )}
          {filterMode === "date" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={currentDate}
                onChange={(e) => setCurrentDate(e.target.value)}
                className="min-h-10 rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-[13px] font-semibold text-slate-600 outline-none focus:border-[var(--focus)] dark:border-white/10 dark:bg-[var(--surface-raised)] dark:text-slate-300"
              />
              {currentDate === today && (
                <span className="text-[10px] bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 font-bold px-2 py-1 rounded-full shrink-0">
                  Hoy
                </span>
              )}
            </div>
          )}
          {filterMode === "range" && hasRangeSupport && (
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="date"
                value={effectiveRangeStart}
                onChange={handleRangeStartChange}
                className="min-h-10 rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-[13px] font-semibold text-slate-600 outline-none focus:border-[var(--focus)] dark:border-white/10 dark:bg-[var(--surface-raised)] dark:text-slate-300"
              />
              <span className="text-xs font-semibold text-slate-400">→</span>
              <input
                type="date"
                value={effectiveRangeEnd}
                min={effectiveRangeStart}
                onChange={handleRangeEndChange}
                className="min-h-10 rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-[13px] font-semibold text-slate-600 outline-none focus:border-[var(--focus)] dark:border-white/10 dark:bg-[var(--surface-raised)] dark:text-slate-300"
              />
            </div>
          )}
      </div>
    </header>
  );
};
