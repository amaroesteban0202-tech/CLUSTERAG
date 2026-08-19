import React, { useMemo, useState } from "react";
import { Icon } from "../icons.jsx";
import { SearchBar } from "../ui.jsx";
import {
  KanbanCard,
  TaskRoomWorkspace,
  buildAssignee,
  formatShortDate,
  PersonAvatar,
} from "../kanban.jsx";
import {
  compareDateOnlyStrings,
  getHondurasTodayStr,
  isDateBeforeDateString,
  normalizeDateOnlyString,
} from "../../utils/date.js";
import {
  getRankingMonthPeriod,
  isDateWithinPeriod,
  isTaskAssignedToProfile,
} from "../../utils/task-helpers.js";
import { normalizeEmail } from "../../utils/text.js";
import { normalizeEditingWorkflowStatus } from "../../utils/kpi.js";
import {
  AccentStatCard,
  getModuleStatusMeta,
  getModuleLaneByStatus,
  getModuleDropStatus,
  getModuleStatusOptions,
} from "./shared.jsx";

export const UnifiedModuleKanbanView = ({
  moduleKey,
  moduleTitle,
  moduleEyebrow,
  moduleDescription,
  searchPlaceholder,
  addButtonLabel = "Nueva Tarea",
  statIcon,
  statTone,
  events = [],
  accountTasks = [],
  editingTasks = [],
  managers = [],
  editors = [],
  currentUserProfile = null,
  onAddTask,
  canCreateTask = false,
  onTaskClick,
  onEventClick,
  onChangeAccountStatus,
  onChangeEditingStatus,
  onChangeEventStatus,
}) => {
  const {
    currentDate,
    setCurrentDate,
    filterMode,
    setFilterMode,
    ownershipFilter,
    setOwnershipFilter,
  } = useTaskRoomState(`cluster_${moduleKey}_kanban_state`, {
    preferMine: Boolean(currentUserProfile?.linkedManagerId || currentUserProfile?.linkedEditorId),
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("all");
  const [showTeam, setShowTeam] = useState(false);
  const [draggedItemKey, setDraggedItemKey] = useState("");

  const todayStr = getHondurasTodayStr();
  const monthPeriod = getRankingMonthPeriod(todayStr);
  const managerById = useMemo(
    () => new Map((managers || []).map((manager) => [manager.id, manager])),
    [managers],
  );
  const editorById = useMemo(
    () => new Map((editors || []).map((editor) => [editor.id, editor])),
    [editors],
  );
  const teamMembers = useMemo(() => {
    const seen = new Set();
    const rows = [];
    [...(managers || []), ...(editors || [])].forEach((person) => {
      const personId = String(person?.id || "").trim();
      if (!personId || seen.has(personId)) return;
      seen.add(personId);
      rows.push(person);
    });
    return rows;
  }, [managers, editors]);

  const normalizedSearch = String(searchTerm || "").trim().toLowerCase();
  const sourceItems = useMemo(() => {
    const allRows = [
      ...(events || []).map((item) => ({ ...item, _taskType: "event" })),
      ...(accountTasks || []).map((item) => ({ ...item, _taskType: "accountTask" })),
      ...(editingTasks || []).map((item) => ({ ...item, _taskType: "editingTask" })),
    ];
    return allRows
      .map((item) => {
        const title = item.title || item.name || "Sin título";
        const notes = item.notes || item.note || item.description || "Sin detalle";
        const haystack = `${title} ${notes}`.toLowerCase();
        const itemType = String(item.type || "").toLowerCase();
        const isPodcast =
          itemType === "podcast" || /podcast|episodio|episode|audio/i.test(haystack);
        const isProduction =
          itemType === "production" ||
          /producción|production|grabación|shoot|post|montaje/i.test(haystack);
        if (moduleKey === "podcast" && !isPodcast) return null;
        if (moduleKey === "production" && !isProduction) return null;

        const dateStr = normalizeDateOnlyString(
          item.date || item.createdAt || item.updatedAt || "",
        );
        if (!dateStr) return null;
        const normalizedStatus =
          item._taskType === "editingTask"
            ? normalizeEditingWorkflowStatus(item.status || "editar")
            : String(item.status || "programado").toLowerCase();
        const assigneePerson =
          item._taskType === "accountTask"
            ? managerById.get(item.contextId)
            : item._taskType === "editingTask"
              ? editorById.get(item.contextId)
              : managerById.get(item.contextId) || editorById.get(item.contextId);

        return {
          ...item,
          _key: `${item._taskType}:${item.id || `${title}-${dateStr}`}`,
          _title: title,
          _notes: notes,
          _date: dateStr,
          _status: normalizedStatus,
          _lane: getModuleLaneByStatus(item._taskType, normalizedStatus),
          _assignee: assigneePerson,
          _ownerText:
            item.assignee || item.owner || item.manager || item.editor || assigneePerson?.name || "",
        };
      })
      .filter(Boolean);
  }, [
    moduleKey,
    events,
    accountTasks,
    editingTasks,
    managerById,
    editorById,
  ]);

  const isMineByProfile = (item) => {
    const linkedContextIds = [
      currentUserProfile?.id,
      currentUserProfile?.linkedManagerId,
      currentUserProfile?.linkedEditorId,
    ].filter(Boolean);
    if (item._taskType === "event") {
      return (
        linkedContextIds.includes(item.contextId) ||
        linkedContextIds.includes(item.assigneeUserId)
      );
    }
    return isTaskAssignedToProfile(item, currentUserProfile, linkedContextIds);
  };

  const filteredItems = sourceItems.filter((item) => {
    if (normalizedSearch && !`${item._title} ${item._notes}`.toLowerCase().includes(normalizedSearch)) {
      return false;
    }
    if (ownershipFilter === "mine" && !isMineByProfile(item)) return false;
    if (selectedTeamId !== "all") {
      const matchesTeam =
        String(item.contextId || "") === String(selectedTeamId) ||
        String(item.assigneeUserId || "") === String(selectedTeamId);
      if (!matchesTeam) return false;
    }
    if (filterMode === "date") {
      return compareDateOnlyStrings(item._date, currentDate) === 0;
    }
    if (filterMode === "overdue") {
      return (
        isDateBeforeDateString(item._date, todayStr) &&
        !["publicado", "cerrado"].includes(item._status)
      );
    }
    if (filterMode === "history") return true;
    return isDateWithinPeriod(item._date, monthPeriod);
  });

  const filteredByLane = {
    start: filteredItems.filter((item) => item._lane === "start"),
    production: filteredItems.filter((item) => item._lane === "production"),
    ready: filteredItems.filter((item) => item._lane === "ready"),
  };
  const itemByKey = useMemo(
    () => new Map(sourceItems.map((item) => [item._key, item])),
    [sourceItems],
  );
  const teamWithoutEmailCount = teamMembers.filter(
    (member) => !normalizeEmail(member?.email),
  ).length;

  const handleStatusChange = async (item, newStatus) => {
    if (!item || !newStatus || newStatus === item._status) return;
    if (item._taskType === "accountTask") {
      await onChangeAccountStatus?.(item, newStatus);
      return;
    }
    if (item._taskType === "editingTask") {
      await onChangeEditingStatus?.(item, newStatus);
      return;
    }
    await onChangeEventStatus?.(item, newStatus);
  };

  const handleDropLane = async (event, laneId) => {
    event.preventDefault();
    event.currentTarget.classList.remove("drag-over");
    if (!draggedItemKey) return;
    const draggedItem = itemByKey.get(draggedItemKey);
    if (!draggedItem) return;
    const nextStatus = getModuleDropStatus(
      draggedItem._taskType,
      laneId,
      draggedItem._status,
    );
    if (!nextStatus || nextStatus === draggedItem._status) return;
    await handleStatusChange(draggedItem, nextStatus);
  };

  const moduleGroups = [
    {
      id: "start",
      title: "Por iniciar",
      subtitle: "Pendientes de comenzar",
      color: "slate",
      stages: [
        {
          id: "start",
          title: "Pendientes",
          color: "slate",
          tasks: filteredByLane.start,
        },
      ],
    },
    {
      id: "production",
      title: "En producción",
      subtitle: "En curso, edición o revisión",
      color: moduleKey === "podcast" ? "rose" : "cyan",
      stages: [
        {
          id: "production",
          title: "En curso",
          color: moduleKey === "podcast" ? "rose" : "cyan",
          tasks: filteredByLane.production,
        },
      ],
    },
    {
      id: "ready",
      title: "Listas",
      subtitle: "Aprobadas y publicadas/cerradas",
      color: "emerald",
      stages: [
        {
          id: "ready",
          title: "Finalizadas",
          color: "emerald",
          tasks: filteredByLane.ready,
        },
      ],
    },
  ];

  const totalItems = filteredItems.length;
  const inProgressCount = filteredByLane.production.length;
  const readyCount = filteredByLane.ready.length;
  const startCount = filteredByLane.start.length;
  const canShowAddButton = Boolean(onAddTask) && canCreateTask;
  const addDate =
    filterMode === "date"
      ? currentDate
      : filterMode === "history"
        ? todayStr
        : todayStr;
  const handleAddTask = useCallback(() => {
    const nextDate = normalizeDateOnlyString(addDate) || todayStr;
    onAddTask?.(nextDate);
  }, [addDate, onAddTask, todayStr]);

  return (
    <div className="task-room min-h-0 flex flex-col gap-3 fade-in">
      <header className="task-room-header shrink-0 border-b border-[var(--border)] pb-3 dark:border-white/10">
        <div className="mb-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="eyebrow">{moduleEyebrow}</p>
            <h2 className="editorial-title truncate text-[clamp(1.75rem,3vw,2.5rem)] leading-none text-[var(--text)] dark:text-[var(--text)]">
              {moduleTitle}
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {moduleDescription}
            </p>
          </div>
          <div className="flex w-full flex-col items-stretch gap-2 sm:flex-row sm:items-center lg:w-auto">
            <SearchBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              placeholder={searchPlaceholder}
            />
            {canShowAddButton && (
              <button
                type="button"
                onClick={handleAddTask}
                className="bg-[var(--primary)] text-[var(--primary-contrast)] font-bold rounded-xl px-4 py-2.5 flex items-center gap-2 hover:opacity-90 transition-opacity shrink-0"
              >
                <Icon name="Plus" size={16} />
                {addButtonLabel}
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowTeam((value) => !value)}
              className="surface flex shrink-0 items-center gap-3 px-4 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <div className="flex -space-x-2 shrink-0">
                {teamMembers.slice(0, 4).map((member) => (
                  <PersonAvatar
                    key={member.id}
                    person={member}
                    size={28}
                    className="border-2 border-white dark:border-slate-900"
                  />
                ))}
                {teamMembers.length > 4 && (
                  <div className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[9px] font-black bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    +{teamMembers.length - 4}
                  </div>
                )}
              </div>
              <div className="text-left">
                <p className="text-xs font-black text-slate-700 dark:text-slate-200">
                  Equipo
                </p>
                {teamWithoutEmailCount > 0 ? (
                  <p className="text-[10px] font-bold text-amber-500">
                    {teamWithoutEmailCount} sin email
                  </p>
                ) : (
                  <p className="text-[10px] font-bold text-emerald-500">Todos con email</p>
                )}
              </div>
              <Icon
                name={showTeam ? "ChevronUp" : "ChevronDown"}
                size={14}
                className="text-slate-500 ml-1"
              />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex max-w-full overflow-x-auto rounded-lg bg-[var(--surface-muted)] p-1 kanban-mobile-scroll dark:bg-[var(--surface-raised)]">
            <button
              onClick={() => setFilterMode("date")}
              className={`shrink-0 min-h-9 px-3 py-2 text-[12px] font-medium rounded-lg transition-colors flex items-center gap-1.5 ${filterMode === "date" ? "bg-white text-[var(--text)] shadow-sm dark:bg-[var(--surface-muted)] dark:text-[var(--text)]" : "text-slate-500 dark:text-slate-400 hover:bg-black/5 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-slate-200"}`}
            >
              <Icon name="CalendarDays" size={14} />
              Día específico
            </button>
            <button
              onClick={() => setFilterMode("overdue")}
              className={`shrink-0 min-h-9 px-3 py-2 text-[12px] font-medium rounded-lg transition-colors flex items-center gap-1.5 ${filterMode === "overdue" ? "bg-[var(--status-red-bg)] text-[var(--status-red-text)] dark:bg-red-500/15 dark:text-red-300" : "text-slate-500 dark:text-slate-400 hover:bg-black/5 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-slate-200"}`}
            >
              Atrasadas <Icon name="Flame" size={14} />
            </button>
            <button
              onClick={() => setFilterMode("all")}
              className={`shrink-0 min-h-9 px-3 py-2 text-[12px] font-medium rounded-lg transition-colors flex items-center gap-1.5 ${filterMode === "all" ? "bg-white text-[var(--text)] shadow-sm dark:bg-[var(--surface-muted)] dark:text-[var(--text)]" : "text-slate-500 dark:text-slate-400 hover:bg-black/5 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-slate-200"}`}
            >
              Este mes
            </button>
            <button
              onClick={() => setFilterMode("history")}
              className={`shrink-0 min-h-9 px-3 py-2 text-[12px] font-medium rounded-lg transition-colors flex items-center gap-1.5 ${filterMode === "history" ? "bg-white text-[var(--text)] shadow-sm dark:bg-[var(--surface-muted)] dark:text-[var(--text)]" : "text-slate-500 dark:text-slate-400 hover:bg-black/5 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-slate-200"}`}
            >
              <Icon name="Clock" size={14} />
              Histórico
            </button>
          </div>
          <div className="flex max-w-full overflow-x-auto rounded-lg bg-[var(--surface-muted)] p-1 kanban-mobile-scroll dark:bg-[var(--surface-raised)]">
            <button
              onClick={() => setOwnershipFilter("all")}
              className={`shrink-0 min-h-9 px-3 py-2 text-[12px] font-medium rounded-lg transition-colors flex items-center gap-1.5 ${ownershipFilter === "all" ? "bg-white text-[var(--text)] shadow-sm dark:bg-[var(--surface-muted)] dark:text-[var(--text)]" : "text-slate-500 dark:text-slate-400 hover:bg-black/5 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-slate-200"}`}
            >
              Todo el equipo
            </button>
            <button
              onClick={() => setOwnershipFilter("mine")}
              className={`shrink-0 min-h-9 px-3 py-2 text-[12px] font-medium rounded-lg transition-colors flex items-center gap-1.5 ${ownershipFilter === "mine" ? "bg-white text-[var(--text)] shadow-sm dark:bg-[var(--surface-muted)] dark:text-[var(--text)]" : "text-slate-500 dark:text-slate-400 hover:bg-black/5 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-slate-200"}`}
            >
              <Icon name="User" size={14} />
              Asignadas a mí
            </button>
          </div>
          {filterMode === "date" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={currentDate}
                onChange={(event) => setCurrentDate(event.target.value)}
                className="min-h-10 rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-[13px] font-semibold text-slate-600 outline-none focus:border-[var(--focus)] dark:border-white/10 dark:bg-[var(--surface-raised)] dark:text-slate-300"
              />
              {currentDate === todayStr && (
                <span className="text-[10px] bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 font-bold px-2 py-1 rounded-full shrink-0">
                  Hoy
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      {showTeam && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 fade-in">
          <button
            type="button"
            onClick={() => setSelectedTeamId("all")}
            className={`flex items-center gap-3 p-3 rounded-xl border text-left ${selectedTeamId === "all" ? "border-violet-300 dark:border-violet-500/40 bg-violet-50/70 dark:bg-violet-500/10" : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"}`}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-white bg-violet-500 shrink-0">
              EQ
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-800 dark:text-white text-sm truncate">
                Todo el equipo
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Sin filtro por persona
              </p>
            </div>
          </button>
          {teamMembers.map((member) => {
            const isActive = String(selectedTeamId) === String(member.id);
            return (
              <button
                key={member.id}
                type="button"
                onClick={() => setSelectedTeamId(member.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left ${isActive ? "border-violet-300 dark:border-violet-500/40 bg-violet-50/70 dark:bg-violet-500/10" : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"}`}
              >
                <PersonAvatar person={member} size={36} />
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 dark:text-white text-sm truncate">
                    {member.name}
                  </p>
                  <p className="text-[10px] truncate text-slate-500 dark:text-slate-400">
                    {member.email || "Sin correo asignado"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <AccentStatCard
          label="Total"
          value={totalItems}
          icon={statIcon}
          tone={statTone}
          sub="tareas filtradas"
        />
        <AccentStatCard
          label="Por iniciar"
          value={startCount}
          icon="Clock"
          tone="slate"
          sub="pendientes"
        />
        <AccentStatCard
          label="En producción"
          value={inProgressCount}
          icon="Play"
          tone="amber"
          sub="en curso"
        />
        <AccentStatCard
          label="Listas"
          value={readyCount}
          icon="CheckCircle2"
          tone="emerald"
          sub="aprobadas o cerradas"
        />
      </div>

      <TaskRoomWorkspace
        groups={moduleGroups}
        canAdd={false}
        renderTask={(task, stage) => {
          const statusMeta = getModuleStatusMeta(task._status, moduleKey);
          const statusOptions = getModuleStatusOptions(task._taskType);
          const laneStatus = stage?.id || task._lane;
          const isOverdue =
            isDateBeforeDateString(task._date, todayStr) &&
            !["publicado", "cerrado"].includes(task._status);
          const accentTone =
            statusMeta.tone === "rose"
              ? "red"
              : statusMeta.tone === "cyan"
                ? "blue"
                : statusMeta.tone;
          const assigneeMeta =
            task._assignee || task._ownerText
              ? buildAssignee(
                  task._assignee || {
                    name: task._ownerText || "Sin asignar",
                    color: "slate",
                  },
                )
              : null;
          return (
            <KanbanCard
              key={task._key}
              onClick={() => {
                if (task._taskType === "event") {
                  onEventClick?.(task);
                  return;
                }
                if (["accountTask", "editingTask", "managementTask"].includes(task._taskType)) {
                  onTaskClick?.(task, task._taskType);
                }
              }}
              draggable
              onDragStart={(event) => {
                setDraggedItemKey(task._key);
                event.dataTransfer.effectAllowed = "move";
                setTimeout(() => event.currentTarget.classList.add("drag-source-hidden"), 0);
              }}
              onDragEnd={(event) => {
                event.currentTarget.classList.remove("drag-source-hidden");
                setDraggedItemKey("");
              }}
              accentTone={accentTone}
              isOverdue={isOverdue}
              client={task.clientName || task.client || ""}
              title={task._title}
              notes={task._notes}
              badges={[
                { label: statusMeta.label, tone: statusMeta.tone },
                {
                  label:
                    task._taskType === "accountTask"
                      ? "Account"
                      : task._taskType === "editingTask"
                        ? "Edición"
                        : "Evento",
                  tone: "slate",
                },
              ]}
              due={{
                label: formatShortDate(task._date) + (isOverdue ? " · atrasada" : ""),
                tone: isOverdue ? "red" : "slate",
              }}
              assignee={assigneeMeta}
              statusControl={{
                value: task._status,
                options: statusOptions,
                onChange: (status) => handleStatusChange(task, status),
              }}
              menuItems={[
                laneStatus !== "start" && {
                  key: "move-start",
                  label: "Mover a Por iniciar",
                  icon: "ChevronLeft",
                  onClick: () =>
                    handleStatusChange(
                      task,
                      getModuleDropStatus(task._taskType, "start", task._status),
                    ),
                },
                laneStatus !== "production" && {
                  key: "move-production",
                  label: "Mover a En producción",
                  icon: "ArrowRight",
                  onClick: () =>
                    handleStatusChange(
                      task,
                      getModuleDropStatus(task._taskType, "production", task._status),
                    ),
                },
                laneStatus !== "ready" && {
                  key: "move-ready",
                  label: "Mover a Listas",
                  icon: "Check",
                  onClick: () =>
                    handleStatusChange(
                      task,
                      getModuleDropStatus(task._taskType, "ready", task._status),
                    ),
                },
              ].filter(Boolean)}
            />
          );
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.currentTarget.classList.add("drag-over");
        }}
        onDragLeave={(event) => event.currentTarget.classList.remove("drag-over")}
        onDrop={handleDropLane}
      />
    </div>
  );
};
