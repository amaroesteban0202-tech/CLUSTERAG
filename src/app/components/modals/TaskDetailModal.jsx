import React, { useEffect, useId, useRef, useState } from "react";
import { Icon } from "../icons.jsx";
import { useDialogA11y } from "../../hooks/useDialogA11y.js";
import { getEditingHierarchyId } from "../../utils/task-helpers.js";
import { TASK_STATUS_DEFS, STATUS_COLOR_CLASSES } from "./task-status.js";

const formatDuration = (ms) => {
  if (!ms || ms <= 0) return "0s";
  const totalSecs = Math.floor(ms / 1000);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  if (hrs > 0) return `${hrs}h ${mins > 0 ? `${mins}m` : ""}`.trim();
  if (mins > 0) return `${mins}m ${secs > 0 ? `${secs}s` : ""}`.trim();
  return `${secs}s`;
};

const formatClockDuration = (ms = 0) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
};

const relativeTime = (iso) => {
  if (!iso) return "";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
};

export const TaskDetailModal = ({
  config,
  onClose,
  clients,
  managers,
  editors,
  users,
  canEdit,
  onEdit,
  onChangeStatus,
  onAddComment,
  onAddTimeEntry,
  onUpdateChecklist,
  onChangePriority,
  onChangeAssignee,
  onChangeAssignees,
  sendNotification,
  onAddAttachment,
  onRemoveAttachment,
  onDelete,
  currentUserProfile,
  accountTasks = [],
  editingTasks = [],
  managementTasks = [],
  clientChats = [],
  onSendClientChatMessage,
  onOpenClientChat,
}) => {
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerElapsed, setTimerElapsed] = useState(0);
  const [savingTime, setSavingTime] = useState(false);
  const [newCheckItem, setNewCheckItem] = useState("");
  const [addingCheck, setAddingCheck] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStart, setMentionStart] = useState(-1);
  const [mentionedIds, setMentionedIds] = useState([]);
  const dialogRef = useDialogA11y(config.isOpen, onClose);
  const dialogTitleId = useId();
  const [fullAttachments, setFullAttachments] = useState(null);
  const [clientChatText, setClientChatText] = useState("");
  const [sendingClientChat, setSendingClientChat] = useState(false);

  // Cerrar dropdowns al click fuera
  useEffect(() => {
    if (!statusOpen && !priorityOpen && !assigneeOpen && !actionsOpen) return;
    const handler = (e) => {
      if (!e.target.closest("[data-dropdown]")) {
        setStatusOpen(false);
        setPriorityOpen(false);
        setAssigneeOpen(false);
        setActionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [statusOpen, priorityOpen, assigneeOpen, actionsOpen]);
  const timerStartRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const commentInputRef = useRef(null);

  useEffect(() => {
    if (timerRunning) {
      timerStartRef.current = Date.now() - timerElapsed;
      timerIntervalRef.current = setInterval(() => {
        setTimerElapsed(Date.now() - timerStartRef.current);
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [timerRunning]);

  const attachmentColMap = {
    accountTask: "account_tasks",
    editingTask: "editing",
    managementTask: "management_tasks",
  };
  const liveTaskForAttachments = config.task
    ? ({ accountTask: accountTasks, editingTask: editingTasks, managementTask: managementTasks }[
        config.type
      ] || []
      ).find((t) => t.id === config.task.id) || config.task
    : null;
  const attachmentsSignature = Array.isArray(
    liveTaskForAttachments?.attachments,
  )
    ? liveTaskForAttachments.attachments
        .map((att) => `${att.id}:${att.hasData ? 1 : 0}:${att.data ? 1 : 0}`)
        .join(",")
    : "";

  // Los adjuntos llegan sin el archivo (base64) desde el listado con polling,
  // para no re-descargar MBs de datos cada 2 min. Al abrir una tarea con
  // adjuntos pendientes de cargar (o al subir uno nuevo), se pide el registro
  // completo una sola vez.
  useEffect(() => {
    if (!config.isOpen || !config.task) {
      setFullAttachments(null);
      return;
    }
    const col = attachmentColMap[config.type];
    const taskId = config.task.id;
    const pendingAttachments = Array.isArray(
      liveTaskForAttachments?.attachments,
    )
      ? liveTaskForAttachments.attachments
      : [];
    const needsFetch = pendingAttachments.some(
      (att) => att.hasData && !att.data,
    );
    if (!col || !taskId || !needsFetch) return;
    let cancelled = false;
    getDoc(doc(db, "artifacts", appId, "public", "data", col, taskId))
      .then((snap) => {
        if (!cancelled) setFullAttachments(snap.data()?.attachments || null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [config.isOpen, config.task?.id, config.type, attachmentsSignature]);

  if (!config.isOpen || !config.task) return null;
  const { type } = config;

  const liveArrays = {
    accountTask: accountTasks,
    editingTask: editingTasks,
    managementTask: managementTasks,
  };
  const task =
    (liveArrays[type] || []).find((t) => t.id === config.task.id) ||
    config.task;

  const client = clients.find((c) => c.id === task.clientId);
  // Mensajes del chat del cliente que referencian esta tarea.
  const taskChatMessages = clientChats
    .filter((message) => message.taskRef?.taskId === task.id)
    .sort((a, b) => ((a.createdAt || "") > (b.createdAt || "") ? 1 : -1));
  const handleSendClientChat = async () => {
    const trimmed = clientChatText.trim();
    if (
      !trimmed ||
      sendingClientChat ||
      !task.clientId ||
      !onSendClientChatMessage
    )
      return;
    setSendingClientChat(true);
    try {
      await onSendClientChatMessage({
        clientId: task.clientId,
        text: trimmed,
        mentionedIds: [],
        taskRef: { taskId: task.id, taskType: type, taskTitle: task.title || "" },
      });
      setClientChatText("");
    } finally {
      setSendingClientChat(false);
    }
  };
  const assignee =
    type === "accountTask"
      ? managers.find((m) => m.id === task.contextId)
      : type === "managementTask"
        ? users.find((u) => u.id === task.contextId)
        : editors.find((e) => e.id === task.contextId);
  // Multi-assignees: use task.assignees if present, else fall back to contextId
  const currentAssigneeIds = Array.isArray(task.assignees)
    ? task.assignees
    : task.contextId
      ? [task.contextId]
      : [];

  const tagColor =
    type === "accountTask"
      ? "indigo"
      : type === "managementTask"
        ? "violet"
        : "amber";
  const typeLabel =
    type === "accountTask"
      ? "Account"
      : type === "managementTask"
        ? "Gestión"
        : "Edición";
  const iconName =
    type === "accountTask"
      ? "LayoutList"
      : type === "managementTask"
        ? "ShieldCheck"
        : "Video";
  const statuses = TASK_STATUS_DEFS[type] || [];
  const currentStatus =
    statuses.find((s) => s.id === task.status) || statuses[0];
  const canAct = canEdit(type);
  const comments = Array.isArray(task.comments)
    ? [...task.comments].reverse()
    : [];
  const timeEntries = Array.isArray(task.timeEntries) ? task.timeEntries : [];
  const totalLoggedMs = timeEntries.reduce(
    (acc, e) => acc + (e.durationMs || 0),
    0,
  );

  // Activity feed: merge comments + time entries sorted newest first
  const activityFeed = [
    ...comments.map((c) => ({ ...c, _kind: "comment" })),
    ...timeEntries.map((e) => ({ ...e, _kind: "time", createdAt: e.loggedAt })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const handleStopTimer = async () => {
    setTimerRunning(false);
    const elapsed = timerElapsed;
    setTimerElapsed(0);
    if (elapsed >= 1000) {
      setSavingTime(true);
      try {
        await onAddTimeEntry(task, type, elapsed);
      } finally {
        setSavingTime(false);
      }
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onAddComment(task, type, commentText.trim(), mentionedIds);
      setCommentText("");
      setMentionedIds([]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCommentChange = (e) => {
    const val = e.target.value;
    setCommentText(val);
    const pos = e.target.selectionStart;
    const before = val.slice(0, pos);
    const atMatch = before.match(/@([\wÀ-ž]*)$/);
    if (atMatch) {
      setMentionOpen(true);
      setMentionQuery(atMatch[1]);
      setMentionStart(before.lastIndexOf("@"));
    } else {
      setMentionOpen(false);
      setMentionQuery("");
      setMentionStart(-1);
    }
  };

  const insertMention = (person) => {
    const before = commentText.slice(0, mentionStart);
    const after = commentText.slice(mentionStart + 1 + mentionQuery.length);
    setCommentText(before + "@" + person.name + " " + after);
    setMentionedIds((prev) =>
      prev.includes(person.id) ? prev : [...prev, person.id],
    );
    setMentionOpen(false);
    setMentionQuery("");
    setMentionStart(-1);
    setTimeout(
      () => commentInputRef.current && commentInputRef.current.focus(),
      0,
    );
  };

  const scrollToTaskSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const FieldRow = ({ icon, label, children }) => (
    <div className="flex items-center min-h-[32px] hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg px-2 -mx-2 transition-colors">
      <div className="flex items-center gap-2 w-40 shrink-0">
        <Icon name={icon} size={13} className="text-slate-500 shrink-0" />
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {label}
        </span>
      </div>
      <div className="flex-1 text-sm">{children}</div>
    </div>
  );

  const priorityColors = {
    urgente: "text-red-500",
    alta: "text-orange-500",
    normal: "text-slate-500",
    baja: "text-slate-300",
  };

  const PRIORITIES = [
    {
      id: "urgente",
      label: "Urgente",
      color: "text-red-500",
      iconColor: "var(--status-red-text)",
    },
    {
      id: "alta",
      label: "Alta",
      color: "text-orange-400",
      iconColor: "var(--status-yellow-text)",
    },
    {
      id: "normal",
      label: "Normal",
      color: "text-blue-400",
      iconColor: "var(--status-blue-text)",
    },
    {
      id: "baja",
      label: "Baja",
      color: "text-slate-500",
      iconColor: "var(--text-faint)",
    },
  ];
  const currentPriority = PRIORITIES.find((p) => p.id === task.priority);
  const peoplePool =
    type === "accountTask"
      ? managers
      : type === "editingTask"
        ? editors
        : users;
  const activePeoplePool = peoplePool.filter(
    (person) => person.isActive !== false,
  );
  const allMentionables = [
    ...(users || []),
    ...(managers || []),
    ...(editors || []),
  ].filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i);
  const mentionSuggestions = mentionOpen
    ? allMentionables
        .filter(
          (p) =>
            p.name && p.name.toLowerCase().includes(mentionQuery.toLowerCase()),
        )
        .slice(0, 6)
    : [];

  const FlagIcon = ({ color, filled, size = 13 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? color : "none"}
      stroke={color || "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );

  return (
    <div
      className="task-detail-overlay fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-[var(--surface-overlay)] p-3 backdrop-blur-sm md:p-6"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        tabIndex={-1}
        className="task-detail-shell flex h-[92dvh] max-h-[860px] w-full max-w-[1320px] flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] shadow-2xl outline-none dark:border-white/10 dark:bg-[var(--surface)]"
        onClick={function (e) {
          e.stopPropagation();
        }}
      >
        {/* Barra superior */}
        <div className="flex min-h-[68px] shrink-0 items-center gap-2 border-b border-[var(--border)] bg-[var(--surface-subtle)] px-4 dark:border-white/10 dark:bg-[var(--surface)] md:px-5">
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wide bg-${tagColor}-100 dark:bg-${tagColor}-500/20 text-${tagColor}-700 dark:text-${tagColor}-400`}
          >
            <Icon name={iconName} size={11} />
            {typeLabel}
          </div>
          <Icon
            name="ChevronRight"
            size={12}
            className="text-slate-300 dark:text-slate-600"
          />
          <span className="text-xs text-slate-500 font-mono">
            {task.id?.slice(0, 8)}
          </span>
          <div className="hidden items-center gap-2 text-xs text-slate-500 lg:flex dark:text-slate-400">
            <Icon name="ChevronRight" size={12} />
            <span>Sala de {typeLabel}</span>
            <Icon name="ChevronRight" size={12} />
            <span>{currentStatus?.label || task.status}</span>
          </div>
          <div className="flex-1" />
          {canAct && (
            <div className="flex items-center gap-2" data-dropdown>
              <button
                onClick={() => onEdit(task, type)}
                aria-label={`Editar ${task.title || "tarea"}`}
                title="Editar"
                className="flex min-h-11 items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)] dark:border-white/10 dark:bg-[var(--surface-raised)] dark:text-slate-200 dark:hover:border-white/20 dark:hover:bg-[var(--surface-muted)]"
              >
                <Icon name="Pencil" size={14} />{" "}
                <span className="hidden sm:inline">Editar</span>
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActionsOpen((value) => !value)}
                  aria-label="Más acciones"
                  aria-expanded={actionsOpen}
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-slate-500 transition-colors hover:border-[var(--border-strong)] hover:text-slate-800 dark:border-white/10 dark:bg-[var(--surface-raised)] dark:text-slate-400 dark:hover:border-white/20 dark:hover:text-slate-100"
                >
                  <Icon name="MoreHorizontal" size={18} />
                </button>
                {actionsOpen && (
                  <div className="absolute right-0 top-full z-30 mt-2 w-48 rounded-xl border border-[var(--border)] bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-[var(--surface-raised)]">
                    <button
                      type="button"
                      onClick={() => {
                        setActionsOpen(false);
                        onDelete(task, type);
                      }}
                      className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                    >
                      <Icon name="Trash2" size={15} />
                      Eliminar tarea
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="ml-1 flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-transparent text-slate-500 transition-colors hover:border-[var(--border)] hover:bg-white hover:text-slate-800 dark:text-slate-400 dark:hover:border-white/10 dark:hover:bg-[var(--surface-raised)] dark:hover:text-slate-100"
          >
            <Icon name="X" size={16} />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="task-detail-body custom-scroll min-h-0 flex-1 overflow-y-auto lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:grid-rows-1 lg:overflow-hidden">
          {/* LEFT — Contenido principal */}
          <div className="min-w-0 overflow-visible bg-[var(--surface-subtle)] dark:bg-[var(--surface)] lg:custom-scroll lg:overflow-y-auto">
            <div className="mx-auto max-w-4xl px-5 pb-10 pt-6 md:px-8 md:pt-7">
              {/* Title */}
              <h1
                id={dialogTitleId}
                className="editorial-title mb-4 break-words pr-4 text-3xl leading-tight text-slate-900 dark:text-[var(--text)] md:text-[38px]"
              >
                {task.title}
              </h1>

              {/* Estado pill prominente bajo el título */}
              <div
                className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2"
                data-dropdown
              >
                <div className="relative">
                  <button
                    onClick={() => canAct && setStatusOpen((o) => !o)}
                    className={`flex min-h-10 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold ${STATUS_COLOR_CLASSES[currentStatus?.color || "slate"]} ${canAct ? "cursor-pointer hover:opacity-90" : "cursor-default"} transition-opacity`}
                  >
                    {currentStatus?.label || task.status}
                    {canAct && <Icon name="ChevronDown" size={10} />}
                  </button>
                  {statusOpen && canAct && (
                    <div
                      className="absolute left-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 py-1 min-w-[180px]"
                      data-dropdown
                    >
                      {statuses.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            onChangeStatus(task, type, s.id);
                            setStatusOpen(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left ${task.status === s.id ? "text-purple-600 dark:text-purple-400" : "text-slate-700 dark:text-slate-200"}`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full bg-${s.color}-500 shrink-0`}
                          />
                          {s.label}
                          {task.status === s.id && (
                            <Icon
                              name="Check"
                              size={12}
                              className="ml-auto text-purple-500"
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {client && (
                  <span className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <span className="text-xs text-slate-400">Cliente</span>
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-blue-100 text-[10px] font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                      {client.name?.charAt(0).toUpperCase()}
                    </span>
                    <strong className="font-semibold">{client.name}</strong>
                  </span>
                )}
                <span className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <Icon name="CalendarDays" size={14} className="text-slate-400" />
                  <span className="text-xs text-slate-400">Fecha límite</span>
                  <strong className="font-semibold">{task.date || "Sin fecha"}</strong>
                </span>
                {assignee && (
                  <span className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--text-muted)] text-[9px] font-bold text-white">
                      {assignee.name?.slice(0, 2).toUpperCase()}
                    </span>
                    <strong className="font-semibold">{assignee.name}</strong>
                  </span>
                )}
                {task.createdAt && (
                  <span className="hidden items-center gap-1 text-xs text-slate-500 dark:text-slate-400 xl:flex">
                    <Icon name="Clock" size={11} />
                    Creado el{" "}
                    {new Date(task.createdAt).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    a las{" "}
                    {new Date(task.createdAt).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>

              <nav
                aria-label="Secciones de la tarea"
                className="sticky top-0 z-10 mb-5 flex gap-1 border-b border-[var(--border)] bg-[var(--surface-subtle)] backdrop-blur-sm dark:border-white/10 dark:bg-[var(--surface)]"
              >
                {[
                  { id: "task-summary", label: "Resumen" },
                  { id: "task-activity", label: "Actividad" },
                  {
                    id: "task-files",
                    label: `Archivos (${Array.isArray(task.attachments) ? task.attachments.length : 0})`,
                  },
                ].map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollToTaskSection(item.id)}
                    className={`relative min-h-11 px-3 text-sm font-semibold transition-colors ${index === 0 ? "text-slate-900 after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:bg-blue-500 dark:text-[var(--text)]" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"}`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>

              {/* Descripción */}
              <section
                id="task-summary"
                className="mb-4 scroll-mt-16 rounded-xl border border-[var(--border)] bg-white p-5 dark:border-white/10 dark:bg-[var(--surface-raised)]"
              >
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400 mb-2">
                  Descripción
                </p>
                {task.notes ? (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 px-4 py-3">
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {task.notes}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={canAct ? () => onEdit(task, type) : undefined}
                    className={`w-full min-h-[54px] flex items-center gap-2 text-left px-4 py-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/60 text-sm text-slate-500 dark:text-slate-400 hover:border-blue-300 dark:hover:border-blue-600 hover:text-slate-700 dark:hover:text-slate-200 transition-colors ${canAct ? "cursor-pointer" : ""}`}
                  >
                    <Icon name="Plus" size={14} className="shrink-0" />
                    <span>
                      <strong className="block font-semibold text-slate-700 dark:text-slate-200">
                        {canAct ? "Agregar descripción" : "Sin descripción"}
                      </strong>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        Añade contexto, enlaces o instrucciones para el equipo.
                      </span>
                    </span>
                  </button>
                )}
              </section>

              {/* Checklist */}
              {(() => {
                const checklist = Array.isArray(task.checklist)
                  ? task.checklist
                  : [];
                const done = checklist.filter((i) => i.done).length;
                const pct =
                  checklist.length > 0
                    ? Math.round((done / checklist.length) * 100)
                    : 0;
                const toggleItem = (id) =>
                  onUpdateChecklist(
                    task,
                    type,
                    checklist.map((i) =>
                      i.id === id ? { ...i, done: !i.done } : i,
                    ),
                  );
                const deleteItem = (id) =>
                  onUpdateChecklist(
                    task,
                    type,
                    checklist.filter((i) => i.id !== id),
                  );
                const addItem = () => {
                  if (!newCheckItem.trim()) return;
                  onUpdateChecklist(task, type, [
                    ...checklist,
                    {
                      id: Math.random().toString(36).slice(2, 10),
                      text: newCheckItem.trim(),
                      done: false,
                    },
                  ]);
                  setNewCheckItem("");
                  setAddingCheck(false);
                };
                return (
                  <section className="mb-4 rounded-xl border border-[var(--border)] bg-white p-5 dark:border-white/10 dark:bg-[var(--surface-raised)]">
                    <div className="mb-4 flex items-center gap-2">
                      <Icon
                        name="CheckSquare"
                        size={13}
                        className="text-slate-500"
                      />
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                        Lista de control
                      </p>
                      {checklist.length > 0 && (
                        <span className="ml-1 text-xs text-slate-500">
                          {done} de {checklist.length} completados
                        </span>
                      )}
                      {checklist.length > 0 && (
                        <span className="ml-auto text-xs font-bold text-slate-500">
                          {pct}%
                        </span>
                      )}
                    </div>
                    {checklist.length > 0 && (
                      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-[var(--surface-muted)] dark:bg-white/10">
                        <div
                          className="h-full rounded-full bg-[var(--status-yellow-text)] transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                    <div className="space-y-1">
                      {checklist.map((item) => (
                        <div
                          key={item.id}
                          className="group flex min-h-11 items-center gap-3 rounded-lg border border-transparent px-3 py-2 transition-colors hover:border-[var(--border)] hover:bg-[var(--surface-subtle)] dark:hover:border-white/10 dark:hover:bg-[var(--surface-muted)]"
                        >
                          <button
                            onClick={() => toggleItem(item.id)}
                            aria-label={item.done ? `Marcar ${item.text} como pendiente` : `Completar ${item.text}`}
                            className={`flex h-6 min-h-0 w-6 min-w-0 shrink-0 items-center justify-center rounded-md border-2 transition-all ${item.done ? "border-emerald-500 bg-emerald-500" : "border-slate-300 hover:border-emerald-400 dark:border-slate-600"}`}
                          >
                            {item.done && (
                              <Icon
                                name="Check"
                                size={11}
                                className="text-white"
                              />
                            )}
                          </button>
                          <span
                            className={`flex-1 text-sm ${item.done ? "line-through text-slate-500" : "text-slate-700 dark:text-slate-200"}`}
                          >
                            {item.text}
                          </span>
                          <button
                            onClick={() => deleteItem(item.id)}
                            aria-label={`Eliminar ${item.text}`}
                            className="flex h-9 min-h-0 w-9 min-w-0 items-center justify-center rounded-lg text-slate-500 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 focus:opacity-100 group-hover:opacity-100 dark:hover:bg-red-500/10"
                          >
                            <Icon name="X" size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                    {addingCheck ? (
                      <div className="flex gap-3 items-center mt-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                        <div className="w-[18px] h-[18px] rounded-[4px] border-2 border-slate-300 dark:border-slate-600 shrink-0" />
                        <input
                          autoFocus
                          value={newCheckItem}
                          onChange={(e) => setNewCheckItem(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") addItem();
                            if (e.key === "Escape") {
                              setAddingCheck(false);
                              setNewCheckItem("");
                            }
                          }}
                          placeholder="Nombre del elemento... (Enter para guardar)"
                          className="flex-1 text-sm bg-transparent outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400"
                        />
                        <button
                          onClick={() => {
                            setAddingCheck(false);
                            setNewCheckItem("");
                          }}
                          className="text-slate-500 hover:text-slate-600 transition-colors"
                        >
                          <Icon name="X" size={13} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => canAct && setAddingCheck(true)}
                        className={`mt-3 flex min-h-11 w-full items-center gap-2 rounded-lg border border-dashed border-[var(--border-strong)] bg-[var(--surface-subtle)] px-4 py-2 text-sm text-slate-500 transition-colors hover:border-[var(--border-strong)] hover:text-slate-700 dark:border-white/15 dark:bg-[var(--surface)] dark:hover:border-white/25 dark:hover:text-slate-200 ${!canAct ? "cursor-default opacity-40" : ""}`}
                      >
                        <Icon name="Plus" size={13} /> Agregar elemento
                      </button>
                    )}
                  </section>
                );
              })()}

              {/* Adjuntos */}
              {(() => {
                const attachments = Array.isArray(fullAttachments)
                  ? fullAttachments
                  : Array.isArray(task.attachments)
                    ? task.attachments
                    : [];
                const handleFileChange = async (e) => {
                  const file = e.target.files && e.target.files[0];
                  if (!file) return;
                  setUploadingFile(true);
                  try {
                    await onAddAttachment(task, type, file);
                  } finally {
                    setUploadingFile(false);
                    e.target.value = "";
                  }
                };
                const formatFileSize = (bytes) => {
                  if (bytes < 1024) return bytes + " B";
                  if (bytes < 1024 * 1024)
                    return (bytes / 1024).toFixed(1) + " KB";
                  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
                };
                const downloadFile = (att) => {
                  if (!att.data) return;
                  const a = document.createElement("a");
                  a.href = att.data;
                  a.download = att.name;
                  a.click();
                };
                const isImage = (att) =>
                  att.type && att.type.startsWith("image/");
                const isLoadingData = (att) => att.hasData && !att.data;
                return (
                  <section
                    id="task-files"
                    className="mb-4 scroll-mt-16 rounded-xl border border-[var(--border)] bg-white p-5 dark:border-white/10 dark:bg-[var(--surface-raised)]"
                  >
                    <div className="mb-4 flex items-center gap-2">
                      <Icon name="Inbox" size={13} className="text-slate-500" />
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                        Archivos
                      </p>
                      {attachments.length > 0 && (
                        <span className="text-xs text-slate-500 ml-1">
                          {attachments.length}
                        </span>
                      )}
                      {canAct && attachments.length > 0 && (
                        <button
                          onClick={() =>
                            fileInputRef.current && fileInputRef.current.click()
                          }
                          disabled={uploadingFile}
                          className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                        >
                          {uploadingFile ? (
                            <Icon
                              name="Loader2"
                              size={11}
                              className="animate-spin"
                            />
                          ) : (
                            <Icon name="Plus" size={11} />
                          )}
                          {uploadingFile ? "Subiendo..." : "Adjuntar"}
                        </button>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.mp4,.mov"
                    />
                    {attachments.length > 0 && (
                      <div className="space-y-2">
                        {attachments.map((att) => (
                          <div
                            key={att.id}
                            className="group flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] p-3 transition-colors hover:border-[var(--border-strong)] dark:border-white/10 dark:bg-[var(--surface-muted)] dark:hover:border-white/20"
                          >
                            {isImage(att) && att.data ? (
                              <img
                                src={att.data}
                                alt={att.name}
                                className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                                <Icon
                                  name={isLoadingData(att) ? "Loader2" : "FileText"}
                                  size={16}
                                  className={
                                    isLoadingData(att)
                                      ? "text-slate-500 animate-spin"
                                      : "text-slate-500"
                                  }
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                                {att.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {formatFileSize(att.size)} · {att.uploadedBy} ·{" "}
                                {relativeTime(att.uploadedAt)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <button
                                onClick={() => downloadFile(att)}
                                title={
                                  isLoadingData(att)
                                    ? "Cargando adjunto..."
                                    : "Descargar"
                                }
                                disabled={isLoadingData(att)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                              >
                                <Icon name="ArrowRight" size={13} />
                              </button>
                              {canAct && (
                                <button
                                  onClick={() =>
                                    onRemoveAttachment(task, type, att.id)
                                  }
                                  title="Eliminar"
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                >
                                  <Icon name="X" size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {attachments.length === 0 && (
                      <button
                        onClick={() =>
                          canAct &&
                          fileInputRef.current &&
                          fileInputRef.current.click()
                        }
                        className={`flex min-h-[76px] w-full items-center justify-center gap-3 rounded-lg border border-dashed border-[var(--border-strong)] bg-[var(--surface-subtle)] px-4 py-3 text-sm text-slate-500 transition-colors hover:border-blue-400 hover:text-slate-700 dark:border-white/15 dark:bg-[var(--surface)] dark:hover:border-blue-500/60 dark:hover:text-slate-200 ${!canAct ? "cursor-default opacity-40" : ""}`}
                      >
                        <Icon name="Paperclip" size={16} />
                        <span className="text-left">
                          <strong className="block font-semibold text-slate-700 dark:text-slate-200">
                            Selecciona un archivo
                          </strong>
                          <span className="mt-0.5 block text-xs text-slate-500">
                            Imágenes, documentos, hojas de cálculo o video
                          </span>
                        </span>
                      </button>
                    )}
                  </section>
                );
              })()}

              {/* Chat del cliente — referencia esta tarea */}
              <section className="rounded-xl border border-blue-200 bg-blue-50/40 p-5 dark:border-blue-500/20 dark:bg-blue-500/5">
                <div className="mb-4 flex items-center gap-2">
                  <Icon
                    name="MessageSquare"
                    size={13}
                    className="text-blue-600 dark:text-blue-400"
                  />
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">
                    Chat del cliente
                  </p>
                  {client?.name && (
                    <span className="truncate text-xs font-semibold text-slate-500">
                      · {client.name}
                    </span>
                  )}
                  {task.clientId && onOpenClientChat && (
                    <button
                      onClick={() => onOpenClientChat(task.clientId)}
                      className="ml-auto shrink-0 text-[11px] font-bold text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Abrir chat completo
                    </button>
                  )}
                </div>

                {!task.clientId ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Esta tarea no tiene cliente asignado, así que no tiene chat.
                  </p>
                ) : (
                  <>
                    {taskChatMessages.length > 0 && (
                      <div className="mb-4 space-y-3">
                        {taskChatMessages.slice(-4).map((message) => (
                          <div key={message.id} className="flex gap-2.5">
                            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--text-muted)] text-[9px] font-black text-white">
                              {(message.authorName || "U")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline gap-2">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                  {message.authorName || "Usuario"}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  {relativeTime(message.createdAt)}
                                </span>
                              </div>
                              <p className="whitespace-pre-wrap break-words text-sm text-slate-700 dark:text-slate-200">
                                {renderChatText(message.text)}
                              </p>
                            </div>
                          </div>
                        ))}
                        {taskChatMessages.length > 4 && onOpenClientChat && (
                          <button
                            onClick={() => onOpenClientChat(task.clientId)}
                            className="text-[11px] font-bold text-blue-600 hover:underline dark:text-blue-400"
                          >
                            Ver los {taskChatMessages.length} mensajes en el chat
                          </button>
                        )}
                      </div>
                    )}
                    <div className="flex items-end gap-2">
                      <textarea
                        value={clientChatText}
                        onChange={(e) => setClientChatText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault();
                            handleSendClientChat();
                          }
                        }}
                        placeholder="Comenta esta tarea en el chat del cliente…"
                        rows={1}
                        className="min-h-[42px] flex-1 resize-none rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500/60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      />
                      <button
                        onClick={handleSendClientChat}
                        disabled={sendingClientChat || !clientChatText.trim()}
                        className="flex h-[42px] shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        <Icon
                          name={sendingClientChat ? "Loader2" : "Send"}
                          size={13}
                          className={sendingClientChat ? "animate-spin" : ""}
                        />
                        Enviar
                      </button>
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-400">
                      Se publicará en el chat de {client?.name || "el cliente"} con
                      esta tarea enlazada.
                    </p>
                  </>
                )}
              </section>

              {/* Actividad — en el contenido principal, estilo Jira */}
              <section
                id="task-activity"
                className="scroll-mt-16 rounded-xl border border-[var(--border)] bg-white p-5 dark:border-white/10 dark:bg-[var(--surface-raised)]"
              >
                <div className="flex items-center gap-2 mb-5">
                  <Icon
                    name="MessageSquare"
                    size={13}
                    className="text-slate-500"
                  />
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    Actividad
                  </p>
                  {totalLoggedMs > 0 && (
                    <span className="ml-auto text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Icon name="Clock" size={11} />
                      {formatDuration(totalLoggedMs)}
                    </span>
                  )}
                </div>

                {/* Comment input */}
                <div className="mb-6 flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--text-muted)] text-[10px] font-black text-white">
                    {(currentUserProfile?.name || "U")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="flex-1 relative">
                    <textarea
                      ref={commentInputRef}
                      value={commentText}
                      onChange={handleCommentChange}
                      onKeyDown={(e) => {
                        if (mentionOpen && e.key === "Escape") {
                          setMentionOpen(false);
                          e.preventDefault();
                          return;
                        }
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                          handleSubmitComment();
                      }}
                      placeholder="Escribe una actualización o menciona con @"
                      rows={commentText ? 3 : 1}
                      className="min-h-[48px] w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/25 dark:border-white/10 dark:bg-[var(--surface)] dark:text-slate-200"
                    />
                    {/* @mention dropdown */}
                    {mentionOpen && mentionSuggestions.length > 0 && (
                      <div className="absolute left-0 bottom-full mb-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 py-1 w-52">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-3 pt-1.5 pb-1">
                          Mencionar
                        </p>
                        {mentionSuggestions.map((p) => (
                          <button
                            key={p.id}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              insertMention(p);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            <div className="w-6 h-6 rounded-full bg-[var(--text-muted)] flex items-center justify-center text-white font-black text-[9px] shrink-0">
                              {p.name.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex-1 text-left">
                              {p.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    {commentText.trim() && (
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={handleSubmitComment}
                          disabled={submitting}
                          className="flex min-h-10 items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                        >
                          {submitting ? (
                            <Icon
                              name="Loader2"
                              size={12}
                              className="animate-spin"
                            />
                          ) : (
                            <Icon name="Send" size={12} />
                          )}
                          {submitting ? "Enviando..." : "Comentar"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Feed */}
                <div className="space-y-4 border-l border-[var(--border)] pl-4 dark:border-white/10">
                  {activityFeed.length === 0 && (
                    <div className="rounded-lg border border-dashed border-[var(--border-strong)] bg-[var(--surface-subtle)] px-4 py-5 text-center dark:border-white/15 dark:bg-[var(--surface)]">
                      <Icon
                        name="MessageSquare"
                        size={18}
                        className="mx-auto mb-2 text-slate-400"
                      />
                      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                        Sin actividad aún
                      </p>
                    </div>
                  )}
                  {activityFeed.map((item) =>
                    item._kind === "time" ? (
                      <div key={item.id} className="flex gap-3 items-center">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                          <Icon
                            name="Clock"
                            size={12}
                            className="text-emerald-600 dark:text-emerald-400"
                          />
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          <span className="font-bold text-slate-700 dark:text-slate-200">
                            {item.authorName}
                          </span>{" "}
                          registró{" "}
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {formatDuration(item.durationMs)}
                          </span>
                          <span className="text-slate-500 text-xs ml-2">
                            {relativeTime(item.loggedAt)}
                          </span>
                        </p>
                      </div>
                    ) : (
                      <div key={item.id} className="flex gap-3">
                        <div className="w-7 h-7 rounded-full bg-[var(--text-muted)] flex items-center justify-center text-white font-black text-[9px] shrink-0 mt-0.5">
                          {(item.authorName || "U").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-1.5">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                              {item.authorName || "Usuario"}
                            </span>
                            <span className="text-xs text-slate-500">
                              {relativeTime(item.createdAt)}
                            </span>
                          </div>
                          <div className="rounded-lg rounded-tl-none border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3 dark:border-white/10 dark:bg-[var(--surface-muted)]">
                            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed break-words">
                              {item.text.split(/(@\S+)/g).map((part, i) =>
                                part.startsWith("@") ? (
                                  <span
                                    key={i}
                                    className="text-purple-600 dark:text-purple-400 font-bold"
                                  >
                                    {part}
                                  </span>
                                ) : (
                                  part
                                ),
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </section>
            </div>
          </div>

          {/* RIGHT — Panel de detalles estilo Jira */}
          <aside className="w-full overflow-visible border-t border-[var(--border)] bg-[var(--surface-muted)] dark:border-white/10 dark:bg-[var(--surface-subtle)] lg:custom-scroll lg:max-h-none lg:overflow-y-auto lg:border-l lg:border-t-0">
            <div className="space-y-3 p-5">
              <p className="mb-4 text-sm font-semibold text-slate-800 dark:text-[var(--text)]">
                Detalles
              </p>

              {/* Asignados */}
              <div data-dropdown className="relative rounded-xl border border-[var(--border)] bg-white p-4 dark:border-white/10 dark:bg-[var(--surface-raised)]">
                <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                  <Icon name="Users" size={14} />
                  Responsable
                </p>
                {/* Avatars row */}
                <div className="flex min-h-10 flex-wrap items-center gap-2">
                  {currentAssigneeIds.length > 0 ? (
                    currentAssigneeIds.map((uid) => {
                      const person = peoplePool.find((p) => p.id === uid);
                      if (!person) return null;
                      return (
                        <div
                          key={uid}
                          className="group flex min-h-10 items-center gap-2 rounded-lg bg-[var(--surface-subtle)] py-1 pl-1.5 pr-2 dark:bg-[var(--surface-muted)]"
                        >
                          <div className="w-5 h-5 rounded-full bg-[var(--text-muted)] flex items-center justify-center text-white font-black text-[8px] shrink-0">
                            {person.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-none">
                            {person.name.split(" ")[0]}
                          </span>
                          {canAct && (
                            <button
                              onClick={() =>
                                onChangeAssignees(
                                  task,
                                  type,
                                  currentAssigneeIds.filter((id) => id !== uid),
                                )
                              }
                              className="ml-0.5 text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Icon name="X" size={9} />
                            </button>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-sm text-slate-500 italic">
                      Sin asignar
                    </span>
                  )}
                  {canAct && (
                    <button
                      onClick={() => setAssigneeOpen((o) => !o)}
                      aria-label="Cambiar responsable"
                      className="flex h-10 min-h-0 w-10 min-w-0 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-500 transition-colors hover:border-blue-400 hover:text-blue-500 dark:border-slate-600"
                    >
                      <Icon name="Plus" size={12} />
                    </button>
                  )}
                </div>
                {assigneeOpen && canAct && (
                  <div
                    className="absolute left-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 py-1 w-52 max-h-60 overflow-y-auto"
                    data-dropdown
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-4 pt-2 pb-1 sticky top-0 bg-white dark:bg-slate-800">
                      Asignar a
                    </p>
                    {activePeoplePool.map((p) => {
                      const isChecked = currentAssigneeIds.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            const newIds = isChecked
                              ? currentAssigneeIds.filter((id) => id !== p.id)
                              : [...currentAssigneeIds, p.id];
                            onChangeAssignees(task, type, newIds);
                            // Notificar al nuevo asignado
                            if (!isChecked && sendNotification) {
                              const email = p.email || p.authEmail;
                              if (email)
                                sendNotification({
                                  to: email,
                                  type: "assigned",
                                  senderName:
                                    currentUserProfile?.name || "Alguien",
                                  taskTitle: task.title,
                                  taskType: type,
                                  taskId: task.id,
                                });
                            }
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                          <div
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isChecked ? "bg-purple-500 border-purple-500" : "border-slate-300 dark:border-slate-600"}`}
                          >
                            {isChecked && (
                              <Icon
                                name="Check"
                                size={9}
                                className="text-white"
                              />
                            )}
                          </div>
                          <div className="w-6 h-6 rounded-full bg-[var(--text-muted)] flex items-center justify-center text-white font-black text-[9px] shrink-0">
                            {p.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span
                            className={`text-sm font-semibold flex-1 ${isChecked ? "text-purple-600 dark:text-purple-400" : "text-slate-700 dark:text-slate-200"}`}
                          >
                            {p.name}
                          </span>
                        </button>
                      );
                    })}
                    {currentAssigneeIds.length > 0 && (
                      <button
                        onClick={() => {
                          onChangeAssignees(task, type, []);
                          setAssigneeOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-t border-slate-100 dark:border-slate-700 mt-1"
                      >
                        <Icon name="UserX" size={13} /> Quitar todos
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Prioridad */}
              <div data-dropdown className="relative rounded-xl border border-[var(--border)] bg-white p-4 dark:border-white/10 dark:bg-[var(--surface-raised)]">
                <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                  <Icon name="Flag" size={14} />
                  Prioridad
                </p>
                <button
                  onClick={() => canAct && setPriorityOpen((o) => !o)}
                  className={`flex min-h-11 w-full items-center gap-2 rounded-lg px-2 py-1.5 ${canAct ? "cursor-pointer hover:bg-[var(--surface-subtle)] dark:hover:bg-[var(--surface-muted)]" : "cursor-default"} transition-colors`}
                >
                  <FlagIcon
                    color={currentPriority?.iconColor || "var(--text-faint)"}
                    filled={!!currentPriority}
                  />
                  <span
                    className={`text-sm font-semibold ${currentPriority?.color || "text-slate-500 italic"}`}
                  >
                    {currentPriority?.label || "Sin prioridad"}
                  </span>
                </button>
                {priorityOpen && canAct && (
                  <div
                    className="absolute left-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 py-1 w-44"
                    data-dropdown
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-4 pt-2 pb-1">
                      Prioridad
                    </p>
                    {PRIORITIES.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          onChangePriority(task, type, p.id);
                          setPriorityOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left ${p.color}`}
                      >
                        <FlagIcon color={p.iconColor} filled size={14} />
                        {p.label}
                        {task.priority === p.id && (
                          <Icon
                            name="Check"
                            size={12}
                            className="ml-auto text-slate-500"
                          />
                        )}
                      </button>
                    ))}
                    {task.priority && (
                      <button
                        onClick={() => {
                          onChangePriority(task, type, null);
                          setPriorityOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-t border-slate-100 dark:border-slate-700 mt-1"
                      >
                        <Icon name="X" size={12} /> Quitar prioridad
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Fecha límite */}
              <div className="rounded-xl border border-[var(--border)] bg-white p-4 dark:border-white/10 dark:bg-[var(--surface-raised)]">
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 mb-2">
                  Fecha límite
                </p>
                <div className="min-h-[38px] flex items-center gap-2 py-1 -mx-1 px-2 rounded-xl">
                  <Icon
                    name="CalendarDays"
                    size={13}
                    className="text-slate-500 shrink-0"
                  />
                  <span
                    className={`text-sm font-semibold ${task.date ? "text-slate-700 dark:text-slate-200" : "text-slate-500 italic"}`}
                  >
                    {task.date || "Sin fecha"}
                  </span>
                </div>
              </div>

              {/* Cliente */}
              <div className="rounded-xl border border-[var(--border)] bg-white p-4 dark:border-white/10 dark:bg-[var(--surface-raised)]">
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 mb-2">
                  Cliente
                </p>
                <div className="min-h-[38px] flex items-center gap-2 py-1 -mx-1 px-2 rounded-xl">
                  {client ? (
                    <>
                      <div className="w-5 h-5 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-[9px] shrink-0">
                        {client.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {client.name}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-slate-500 italic">
                      Interno
                    </span>
                  )}
                </div>
              </div>

              {/* Jerarquía / Categoría */}
              {type === "editingTask" && (
                <div className="rounded-xl border border-[var(--border)] bg-white p-4 dark:border-white/10 dark:bg-[var(--surface-raised)]">
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 mb-2">
                    Jerarquía
                  </p>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800">
                    {getEditingHierarchyId(task).toUpperCase()}
                  </span>
                </div>
              )}
              {type === "managementTask" && task.category && (
                <div className="rounded-xl border border-[var(--border)] bg-white p-4 dark:border-white/10 dark:bg-[var(--surface-raised)]">
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 mb-2">
                    Categoría
                  </p>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {task.category}
                  </span>
                </div>
              )}

              {/* Tiempo */}
              <div className="rounded-xl border border-[var(--border)] bg-white p-5 text-center dark:border-white/10 dark:bg-[var(--surface-raised)]">
                <p className="mb-3 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                  <Icon name="Timer" size={14} />
                  Tiempo registrado
                </p>
                <div className="flex min-h-[74px] flex-col items-center justify-center gap-3">
                  {timerRunning ? (
                    <>
                      <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-red-500">
                        <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-red-500" />
                        En curso
                      </span>
                      <span className="text-2xl font-semibold tabular-nums text-red-500 dark:text-red-400">
                        {formatClockDuration(timerElapsed)}
                      </span>
                      <button
                        onClick={handleStopTimer}
                        disabled={savingTime}
                        className="flex min-h-10 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-60 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                      >
                        {savingTime ? (
                          <Icon
                            name="Loader2"
                            size={10}
                            className="animate-spin"
                          />
                        ) : (
                          <Icon name="Square" size={10} />
                        )}
                        {savingTime ? "..." : "Detener"}
                      </button>
                    </>
                  ) : (
                    <>
                      <span
                        className={`text-2xl font-semibold tabular-nums ${totalLoggedMs > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-200"}`}
                      >
                        {formatClockDuration(totalLoggedMs)}
                      </span>
                      {canAct && (
                        <button
                          onClick={() => {
                            setTimerElapsed(0);
                            setTimerRunning(true);
                          }}
                          className="flex min-h-11 items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-6 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
                        >
                          <Icon name="Play" size={10} /> Iniciar
                        </button>
                      )}
                    </>
                  )}
                </div>
                {timeEntries.length === 0 && !timerRunning && (
                  <p className="mt-1 text-xs text-slate-500">Sin registros todavía</p>
                )}
                {timeEntries.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {[...timeEntries]
                      .reverse()
                      .slice(0, 3)
                      .map((e) => (
                        <div
                          key={e.id}
                          className="flex items-center text-xs gap-2 text-slate-500"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                          <span className="font-bold text-slate-600 dark:text-slate-300">
                            {formatDuration(e.durationMs)}
                          </span>
                          <span className="truncate">{e.authorName}</span>
                          <span className="ml-auto shrink-0">
                            {relativeTime(e.loggedAt)}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Fecha creación */}
              {task.createdAt && (
                <div className="border-t border-[var(--border)] px-1 pt-4 dark:border-white/10">
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 mb-2">
                    Creado
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(task.createdAt).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    <br />
                    {new Date(task.createdAt).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              )}
              <p className="flex items-center justify-center gap-2 pt-2 text-xs text-slate-500 dark:text-slate-400">
                <kbd className="rounded border border-[var(--border-strong)] bg-white px-2 py-1 font-mono text-[10px] dark:border-white/15 dark:bg-[var(--surface-raised)]">
                  Esc
                </kbd>
                para cerrar
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
