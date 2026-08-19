import React, { useEffect, useId, useState } from "react";
import { Icon } from "../icons.jsx";
import { useDialogA11y } from "../../hooks/useDialogA11y.js";
import { EDITING_HIERARCHY_OPTIONS } from "../../constants/app.constants.js";
import { normalizeEditingWorkflowStatus } from "../../utils/kpi.js";

export const CreateTaskModal = ({
  config,
  onClose,
  clients,
  managers,
  editors,
  managementUsers,
  actions,
}) => {
  const { type, data } = config;
  const isTaskDialogOpen =
    config.isOpen &&
    ["accountTask", "editingTask", "managementTask"].includes(type);
  const dialogRef = useDialogA11y(isTaskDialogOpen, onClose);
  const dialogTitleId = useId();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [showDesc, setShowDesc] = useState(false);
  const [assigneeId, setAssigneeId] = useState("");
  const [clientId, setClientId] = useState("");
  const [date, setDate] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("editar");
  const [hierarchy, setHierarchy] = useState("p2");
  const [time, setTime] = useState("");
  const [category, setCategory] = useState("seguimiento");
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [clientOpen, setClientOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [confirmNoDate, setConfirmNoDate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Reset / pre-fill when modal opens
  useEffect(() => {
    if (config.isOpen) {
      if (config.isEdit && data) {
        setTitle(data.title || "");
        setNotes(data.notes || "");
        setShowDesc(!!data.notes);
        setAssigneeId(data.contextId || "");
        setClientId(data.clientId || "");
        setDate(data.date || "");
        setPriority(data.priority || "");
        setTime(data.time || "");
        setHierarchy(data.hierarchy || data.editingHierarchy || "p2");
        setCategory(data.category || "seguimiento");
        setStatus(
          type === "editingTask"
            ? normalizeEditingWorkflowStatus(data.status || "editar")
            : data.status || "editar",
        );
      } else {
        setTitle("");
        setNotes("");
        setShowDesc(false);
        setAssigneeId(data?.contextId || "");
        setClientId(data?.clientId || "");
        setDate(data?.date || "");
        setPriority("");
        setTime("");
        setHierarchy("p2");
        setCategory("seguimiento");
        setStatus("editar");
      }
      setAssigneeOpen(false);
      setClientOpen(false);
      setPriorityOpen(false);
      setDatePickerOpen(false);
    }
  }, [config.isOpen, config.type, config.isEdit]);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!assigneeOpen && !clientOpen && !priorityOpen) return;
    const h = (e) => {
      if (!e.target.closest("[data-ctdrop]")) {
        setAssigneeOpen(false);
        setClientOpen(false);
        setPriorityOpen(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [assigneeOpen, clientOpen, priorityOpen]);

  if (!isTaskDialogOpen) return null;

  const peoplePool =
    (
      type === "accountTask"
        ? managers
        : type === "editingTask"
          ? editors
          : managementUsers
    ).filter((person) => person.isActive !== false);
  const assignee = peoplePool.find((p) => p.id === assigneeId);
  const client = clients.find((c) => c.id === clientId);
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

  const TASK_PRIORITIES = [
    {
      id: "urgente",
      label: "Urgente",
      iconColor: "var(--status-red-text)",
      color: "text-red-500",
    },
    {
      id: "alta",
      label: "Alta",
      iconColor: "var(--status-yellow-text)",
      color: "text-orange-400",
    },
    {
      id: "normal",
      label: "Normal",
      iconColor: "var(--status-blue-text)",
      color: "text-blue-400",
    },
    {
      id: "baja",
      label: "Baja",
      iconColor: "var(--text-faint)",
      color: "text-slate-500",
    },
  ];
  const curPriority = TASK_PRIORITIES.find((p) => p.id === priority);

  const FlagIcon = ({ color, filled, size = 12 }) => (
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

  const Chip = ({ icon, label, active, color, onClick, children }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors
                ${
                  active
                    ? "border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                } ${color || ""}`}
    >
      {icon && <Icon name={icon} size={11} />}
      {children || label}
    </button>
  );

  const doSubmit = async () => {
    if (submitting) return null;
    setSubmitting(true);
    try {
      let result;
      if (config.isEdit && data?.id) {
        if (type === "accountTask")
          result = await actions.updateAccountTask(data.id, {
            date,
            title: title.trim(),
            time,
            contextId: assigneeId,
            clientId,
            notes,
            priority,
          });
        if (type === "editingTask")
          result = await actions.updateEditingTask(data.id, {
            date,
            title: title.trim(),
            priority: priority || "normal",
            hierarchy,
            status,
            notes,
            contextId: assigneeId,
            clientId,
          });
        if (type === "managementTask")
          result = await actions.updateManagementTask(data.id, {
            date,
            title: title.trim(),
            time,
            contextId: assigneeId,
            clientId,
            category,
            notes,
            priority,
            notificationsEnabled: data.notificationsEnabled || false,
          });
      } else {
        if (type === "accountTask")
          result = await actions.addAccountTask({
            date,
            title: title.trim(),
            time,
            contextId: assigneeId,
            clientId,
            notes,
            priority,
          });
        if (type === "editingTask")
          result = await actions.addEditingTask({
            date,
            title: title.trim(),
            priority: priority || "normal",
            hierarchy,
            status,
            notes,
            contextId: assigneeId,
            clientId,
          });
        if (type === "managementTask")
          result = await actions.addManagementTask({
            date,
            title: title.trim(),
            time,
            contextId: assigneeId,
            clientId,
            category,
            notes,
            priority,
            notificationsEnabled: false,
          });
      }
      if (type !== "managementTask" || result !== null) onClose();
      return result;
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || submitting) return;
    if (!date && !config.isEdit) {
      setConfirmNoDate(true);
      return;
    }
    await doSubmit();
  };

  let displayDate = "";
  if (date) {
    try {
      const [y, m, d] = date.split("-");
      displayDate = new Date(y, m - 1, d).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
      });
    } catch (e) {}
  } else if (data?.date) {
    try {
      const [y, m, d] = data.date.split("-");
      displayDate = new Date(y, m - 1, d).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
      });
    } catch (e) {}
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-[90] flex items-start justify-center pt-12 pb-8 px-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        tabIndex={-1}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-visible outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={dialogTitleId} className="sr-only">
          {config.isEdit ? `Editar ${typeLabel}` : `Nueva ${typeLabel}`}
        </h2>

        {/* Header */}
        <div className="flex items-center gap-2 px-6 pt-5 pb-2">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-wide bg-${tagColor}-100 dark:bg-${tagColor}-500/20 text-${tagColor}-700 dark:text-${tagColor}-400`}
          >
            <Icon name={iconName} size={11} />{" "}
            {config.isEdit ? `Editar ${typeLabel}` : `Nueva ${typeLabel}`}
          </div>
          {displayDate && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Icon name="CalendarDays" size={11} />
              {displayDate}
            </span>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Icon name="X" size={15} />
          </button>
        </div>

        {/* Title input */}
        <div className="px-6 py-3">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && title.trim()) handleSubmit();
            }}
            placeholder="Escribe el nombre de la tarea..."
            className="w-full text-xl font-bold text-slate-900 dark:text-white bg-transparent outline-none placeholder-slate-300 dark:placeholder-slate-600"
          />
        </div>

        {/* Description */}
        <div className="px-6 pb-4">
          {showDesc ? (
            <textarea
              autoFocus
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Agregar descripción..."
              rows={4}
              className="w-full text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-3 outline-none resize-none placeholder-slate-400 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
            />
          ) : (
            <button
              onClick={() => setShowDesc(true)}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors py-1"
            >
              <Icon name="AlignLeft" size={14} /> Agregar descripción
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100 dark:border-slate-800" />

        {/* Chips */}
        <div className="px-6 py-4 flex flex-wrap gap-2.5">
          {/* Persona asignada */}
          <div className="relative" data-ctdrop>
            <Chip
              icon={assignee ? null : "UserCircle2"}
              active={!!assignee}
              onClick={() => setAssigneeOpen((o) => !o)}
            >
              {assignee ? (
                <>
                  <div className="w-4 h-4 rounded-full bg-[var(--text-muted)] flex items-center justify-center text-white font-black text-[8px]">
                    {assignee.name.slice(0, 2).toUpperCase()}
                  </div>
                  {assignee.name}
                </>
              ) : (
                "Persona asignada"
              )}
            </Chip>
            {assigneeOpen && (
              <div
                className="absolute left-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 py-1 w-52 max-h-60 overflow-y-auto"
                data-ctdrop
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-4 pt-2 pb-1 sticky top-0 bg-white dark:bg-slate-800">
                  Asignar a
                </p>
                {peoplePool.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setAssigneeId(assigneeId === p.id ? "" : p.id);
                      setAssigneeOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-[var(--text-muted)] flex items-center justify-center text-white font-black text-[9px] shrink-0">
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span
                      className={`text-sm font-semibold flex-1 ${assigneeId === p.id ? "text-purple-600 dark:text-purple-400" : "text-slate-700 dark:text-slate-200"}`}
                    >
                      {p.name}
                    </span>
                    {assigneeId === p.id && (
                      <Icon
                        name="Check"
                        size={12}
                        className="text-purple-500"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fecha límite */}
          <div className="relative">
            <Chip
              icon="CalendarDays"
              active={!!date}
              onClick={() => setDatePickerOpen((o) => !o)}
            >
              {date || "Fecha límite"}
            </Chip>
            {datePickerOpen && (
              <div className="absolute left-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 p-3">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setDatePickerOpen(false);
                  }}
                  className="text-sm bg-transparent outline-none text-slate-700 dark:text-slate-200 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Prioridad */}
          <div className="relative" data-ctdrop>
            <button
              onClick={() => setPriorityOpen((o) => !o)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors
                            ${curPriority ? "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
            >
              <FlagIcon
                color={curPriority?.iconColor || "var(--text-faint)"}
                filled={!!curPriority}
              />
              <span
                className={
                  curPriority?.color || "text-slate-600 dark:text-slate-300"
                }
              >
                {curPriority?.label || "Prioridad"}
              </span>
            </button>
            {priorityOpen && (
              <div
                className="absolute left-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 py-1 w-44"
                data-ctdrop
              >
                {TASK_PRIORITIES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setPriority(priority === p.id ? "" : p.id);
                      setPriorityOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left ${p.color}`}
                  >
                    <FlagIcon color={p.iconColor} filled size={13} />
                    {p.label}
                    {priority === p.id && (
                      <Icon
                        name="Check"
                        size={12}
                        className="ml-auto text-slate-500"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cliente */}
          <div className="relative" data-ctdrop>
            <Chip
              icon="Briefcase"
              active={!!client}
              onClick={() => {
                setClientOpen((o) => !o);
                setClientSearch("");
              }}
            >
              {client ? client.name : "Cliente"}
            </Chip>
            {clientOpen && (
              <div
                className="absolute left-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 w-64 overflow-hidden"
                data-ctdrop
              >
                {/* Search */}
                <div className="px-3 pt-2.5 pb-1.5 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg px-2.5 py-1.5">
                    <Icon
                      name="Search"
                      size={12}
                      className="text-slate-500 shrink-0"
                    />
                    <input
                      autoFocus
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      placeholder="Buscar cliente..."
                      className="flex-1 text-sm bg-transparent outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400 min-w-0"
                    />
                    {clientSearch && (
                      <button
                        onClick={() => setClientSearch("")}
                        className="text-slate-500 hover:text-slate-600"
                      >
                        <Icon name="X" size={11} />
                      </button>
                    )}
                  </div>
                </div>
                {/* List */}
                <div className="overflow-y-auto" style={{ maxHeight: "280px" }}>
                  {!clientSearch && (
                    <button
                      onClick={() => {
                        setClientId("");
                        setClientOpen(false);
                        setClientSearch("");
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left border-b border-slate-100 dark:border-slate-700"
                    >
                      <Icon name="X" size={13} /> Sin cliente (interno)
                    </button>
                  )}
                  {clients
                    .filter(
                      (c) =>
                        !clientSearch ||
                        c.name
                          .toLowerCase()
                          .includes(clientSearch.toLowerCase()),
                    )
                    .slice(0, 8)
                    .map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setClientId(c.id);
                          setClientOpen(false);
                          setClientSearch("");
                        }}
                        className={`w-full flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${clientId === c.id ? "bg-purple-50 dark:bg-purple-500/10" : ""}`}
                      >
                        <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-[10px] shrink-0">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <span
                          className={`text-sm font-semibold flex-1 text-left truncate ${clientId === c.id ? "text-purple-600 dark:text-purple-400" : "text-slate-700 dark:text-slate-200"}`}
                        >
                          {c.name}
                        </span>
                        {clientId === c.id && (
                          <Icon
                            name="Check"
                            size={12}
                            className="text-purple-500 shrink-0"
                          />
                        )}
                      </button>
                    ))}
                  {clientSearch &&
                    clients.filter((c) =>
                      c.name.toLowerCase().includes(clientSearch.toLowerCase()),
                    ).length === 0 && (
                      <p className="px-4 py-3 text-sm text-slate-500 text-center">
                        Sin resultados
                      </p>
                    )}
                </div>
              </div>
            )}
          </div>

          {/* Jerarquía — solo editingTask */}
          {type === "editingTask" && (
            <select
              value={hierarchy}
              onChange={(e) => setHierarchy(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 outline-none cursor-pointer"
            >
              {(
                EDITING_HIERARCHY_OPTIONS || [
                  { id: "p1", label: "P1" },
                  { id: "p2", label: "P2" },
                  { id: "p3", label: "P3" },
                  { id: "reel", label: "Reel" },
                  { id: "story", label: "Story" },
                ]
              ).map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label || o.id}
                </option>
              ))}
            </select>
          )}

          {/* Categoría — solo managementTask */}
          {type === "managementTask" && (
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 outline-none cursor-pointer"
            >
              {["seguimiento", "reunion", "revision", "entrega", "otro"].map(
                (c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ),
              )}
            </select>
          )}

          {/* Hora — account & management */}
          {(type === "accountTask" || type === "managementTask") && (
            <div className="relative">
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                title="Hora"
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 outline-none cursor-pointer w-[110px]"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors px-4 py-2"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || submitting}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-${tagColor}-600 hover:bg-${tagColor}-700 shadow-sm`}
          >
            <Icon name={config.isEdit ? "Save" : "Plus"} size={14} />
            {submitting
              ? "Guardando..."
              : config.isEdit
                ? "Guardar cambios"
                : `Crear ${typeLabel}`}
          </button>
        </div>
      </div>

      {/* Popup confirmación sin fecha */}
      {confirmNoDate && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={() => setConfirmNoDate(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-no-date-title"
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
                <Icon name="CalendarOff" size={18} className="text-amber-500" />
              </div>
              <div>
                <p
                  id="confirm-no-date-title"
                  className="font-black text-slate-800 dark:text-white text-base"
                >
                  ¿Sin fecha límite?
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Esta tarea no tendrá una fecha de vencimiento asignada. Podrás
                  agregarla después.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmNoDate(false)}
                className="px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  setConfirmNoDate(false);
                  await doSubmit();
                }}
                className="px-5 py-2 text-sm font-black text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-colors"
              >
                Sí, crear sin fecha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
