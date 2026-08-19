import React, { useMemo, useState } from "react";
import { Icon } from "./icons.jsx";
import { EmptyState, SearchBar } from "./ui.jsx";
import {
  KanbanCard,
  KanbanColumn,
  KanbanStage,
  TaskRoomInspector,
  TaskRoomWorkspace,
  DateHeader,
  buildAssignee,
  formatShortDate,
  PersonAvatar,
} from "./kanban.jsx";
import { useTaskRoomState } from "../hooks/useTaskRoomState.js";
import {
  compareDateOnlyStrings,
  getHondurasTodayStr,
  isDateBeforeDateString,
  normalizeDateOnlyString,
} from "../utils/date.js";
import {
  getEditingHierarchyId,
  getRankingMonthPeriod,
  isAccountTaskDone,
  isCompletedStatus,
  isDateWithinPeriod,
  isTaskAssignedToProfile,
} from "../utils/task-helpers.js";
import { userHasPermission } from "../utils/permissions.js";
import { normalizeEmail } from "../utils/text.js";
import {
  isEditingActionable,
  normalizeEditingWorkflowStatus,
  rankPendingEditingTasks,
} from "../utils/kpi.js";
import { EDITING_STATUS_OPTIONS } from "../constants/editing.js";
import { MGMT_CATEGORY_COLORS, PILL_TONES } from "../constants/ui-tones.js";
import { EDITING_HIERARCHY_OPTIONS } from "../constants/app.constants.js";

export const AccountRoomView = ({
  tasks,
  managers,
  clients,
  currentUserProfile,
  onAdd,
  onEdit,
  onChangeStatus,
  onDelete,
  onTaskClick,
  legacyColorMap,
  onLoadHistory,
  historyLoaded,
  historyLoading,
}) => {
  const {
    currentDate,
    setCurrentDate,
    filterMode,
    setFilterMode,
    ownershipFilter,
    setOwnershipFilter,
    rangeStart,
    setRangeStart,
    rangeEnd,
    setRangeEnd,
  } = useTaskRoomState("cluster_account_room_state", {
    preferMine: Boolean(currentUserProfile?.linkedManagerId),
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const todayStr = getHondurasTodayStr();
  const currentMonthPeriod = getRankingMonthPeriod(todayStr);

  const columns = [
    {
      id: "por_disenar",
      title: "Por Diseñar",
      color: "slate",
      icon: "PenTool",
    },
    {
      id: "aprobacion_interna",
      title: "Aprobación Interna",
      color: "blue",
      icon: "Search",
    },
    {
      id: "aprobado_internamente",
      title: "Aprobado Interno",
      color: "emerald",
      icon: "CheckCircle2",
    },
    { id: "publicado", title: "Publicado", color: "indigo", icon: "Sparkles" },
  ];

  const effectiveRangeStart = rangeStart || todayStr;
  const effectiveRangeEnd = rangeEnd || todayStr;
  const filteredTasks = tasks.filter((t) => {
    if (searchTerm && !t.title.toLowerCase().includes(searchTerm.toLowerCase()))
      return false;
    if (
      ownershipFilter === "mine" &&
      !isTaskAssignedToProfile(t, currentUserProfile, [
        currentUserProfile?.linkedManagerId,
      ])
    )
      return false;
    if (filterMode === "date")
      return compareDateOnlyStrings(t.date, currentDate) === 0;
    if (filterMode === "overdue")
      return (
        isDateBeforeDateString(t.date, todayStr) && t.status !== "publicado"
      );
    if (filterMode === "range")
      return (
        compareDateOnlyStrings(t.date, effectiveRangeStart) >= 0 &&
        compareDateOnlyStrings(t.date, effectiveRangeEnd) <= 0
      );
    if (filterMode === "history") return true;
    return isDateWithinPeriod(t.date, currentMonthPeriod);
  });
  const handleAddTask = (dateStr) => {
    const nextDate = normalizeDateOnlyString(dateStr) || todayStr;
    setCurrentDate(nextDate);
    setFilterMode("date");
    onAdd(nextDate);
  };

  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
    try {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const clone = e.currentTarget.cloneNode(true);
      clone.id = "custom-drag-ghost-" + taskId;
      clone.style.width = `${rect.width}px`;
      clone.style.height = `${rect.height}px`;
      clone.style.position = "absolute";
      clone.style.top = "-9999px";
      clone.style.left = "-9999px";
      clone.style.opacity = "1";
      clone.style.backgroundColor = getComputedStyle(
        document.documentElement,
      ).getPropertyValue("--surface-raised");
      clone.style.borderRadius = "0.75rem";
      clone.style.boxShadow = "0 25px 50px -12px rgba(0, 0, 0, 0.4)";
      clone.style.transform = "rotate(3deg) scale(1.05)";
      clone.style.zIndex = "99999";
      clone.style.pointerEvents = "none";
      document.body.appendChild(clone);
      e.dataTransfer.setDragImage(clone, x, y);
    } catch (err) {}
    setTimeout(() => e.currentTarget.classList.add("drag-source-hidden"), 0);
  };

  const handleDragEnd = (e, taskId) => {
    e.currentTarget.classList.remove("drag-source-hidden");
    setDraggedTaskId(null);
    document
      .querySelectorAll(".drag-over")
      .forEach((el) => el.classList.remove("drag-over"));
    const clone = document.getElementById("custom-drag-ghost-" + taskId);
    if (clone) clone.remove();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add("drag-over");
  };
  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove("drag-over");
  };
  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");
    if (draggedTaskId) {
      const task = tasks.find((t) => t.id === draggedTaskId);
      if (task && task.status !== targetStatus)
        onChangeStatus(task, targetStatus);
    }
  };

  const defaultAddDate =
    filterMode === "date"
      ? currentDate
      : filterMode === "range"
        ? effectiveRangeStart
        : todayStr;
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || null;
  const selectedManager = selectedTask
    ? managers.find((manager) => manager.id === selectedTask.contextId)
    : null;
  const selectedClient = selectedTask
    ? clients.find((client) => client.id === selectedTask.clientId)
    : null;
  const accountGroups = [
    {
      id: "start",
      title: "Por iniciar",
      subtitle: "Tareas pendientes de comenzar",
      color: "slate",
      stages: [{ ...columns[0], tasks: filteredTasks.filter((task) => task.status === columns[0].id) }],
    },
    {
      id: "production",
      title: "En producción",
      subtitle: "Validación y aprobación interna",
      color: "blue",
      stages: [{ ...columns[1], tasks: filteredTasks.filter((task) => task.status === columns[1].id) }],
    },
    {
      id: "ready",
      title: "Listas",
      subtitle: "Aprobadas y publicadas",
      color: "emerald",
      stages: columns.slice(2).map((column) => ({
        ...column,
        tasks: filteredTasks.filter((task) => task.status === column.id),
        collapsible: column.id === "publicado",
        collapsedLimit: 3,
      })),
    },
  ];

  const renderAccountTask = (task, stage) => {
    const columnIndex = columns.findIndex((column) => column.id === stage.id);
    const previous = columns[columnIndex - 1];
    const next = columns[columnIndex + 1];
    const manager = managers.find((item) => item.id === task.contextId);
    const client = clients.find((item) => item.id === task.clientId);
    const isOverdue =
      isDateBeforeDateString(task.date, todayStr) && stage.id !== "publicado";
    const menuItems = [];
    if (next)
      menuItems.push({
        key: "next",
        label: next.id === "publicado" ? "Publicar" : `Avanzar a ${next.title}`,
        icon: next.id === "publicado" ? "CheckCircle2" : "ArrowRight",
        onClick: () => onChangeStatus(task, next.id),
      });
    if (previous)
      menuItems.push({
        key: "prev",
        label: `Volver a ${previous.title}`,
        icon: "ChevronLeft",
        onClick: () => onChangeStatus(task, previous.id),
      });
    menuItems.push(
      { key: "edit", label: "Editar", icon: "Edit", onClick: () => onEdit(task) },
      { key: "delete", label: "Eliminar", icon: "Trash2", danger: true, onClick: () => onDelete(task.id) },
    );

    return (
      <KanbanCard
        key={task.id}
        onClick={() => setSelectedTaskId(task.id)}
        selected={selectedTaskId === task.id}
        draggable
        onDragStart={(event) => handleDragStart(event, task.id)}
        onDragEnd={(event) => handleDragEnd(event, task.id)}
        accentTone={stage.color}
        isOverdue={isOverdue}
        client={client?.name}
        title={task.title}
        badges={
          task.priority
            ? [{
                label: task.priority,
                tone: task.priority === "urgente" ? "red" : task.priority === "recurrente" ? "emerald" : "amber",
              }]
            : []
        }
        due={{
          label: formatShortDate(task.date) + (isOverdue ? " · atrasada" : ""),
          tone: isOverdue ? "red" : "slate",
        }}
        assignee={buildAssignee(manager, legacyColorMap)}
        menuItems={menuItems}
        statusControl={{
          value: task.status,
          options: columns,
          onChange: (status) => {
            if (status !== task.status) onChangeStatus(task, status);
          },
        }}
      />
    );
  };

  return (
    <div className="task-room min-h-0 flex flex-col gap-3 fade-in">
      <DateHeader
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        filterMode={filterMode}
        setFilterMode={setFilterMode}
        ownershipFilter={ownershipFilter}
        setOwnershipFilter={setOwnershipFilter}
        title="Sala de Accounts"
        onAdd={handleAddTask}
        btnColor="indigo"
        btnIcon="Briefcase"
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        rangeStart={rangeStart}
        setRangeStart={setRangeStart}
        rangeEnd={rangeEnd}
        setRangeEnd={setRangeEnd}
        onLoadHistory={onLoadHistory}
        historyLoaded={historyLoaded}
        historyLoading={historyLoading}
        taskCount={filteredTasks.length}
      />
      <TaskRoomWorkspace
        groups={accountGroups}
        onAdd={() => handleAddTask(defaultAddDate)}
        renderTask={renderAccountTask}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        inspector={
          selectedTask ? (
            <TaskRoomInspector
              task={selectedTask}
              client={selectedClient?.name}
              assignee={buildAssignee(selectedManager, legacyColorMap)}
              status={columns.find((column) => column.id === selectedTask.status)}
              onClose={() => setSelectedTaskId(null)}
              onOpenFull={() => onTaskClick(selectedTask)}
            />
          ) : null
        }
      />
    </div>
  );
};

export const EditionsRoomView = ({
  tasks,
  editors,
  clients,
  currentUserProfile,
  onAdd,
  onEdit,
  onChangeStatus,
  onDelete,
  onTaskClick,
  onLoadHistory,
  historyLoaded,
  historyLoading,
}) => {
  const {
    currentDate,
    setCurrentDate,
    filterMode,
    setFilterMode,
    ownershipFilter,
    setOwnershipFilter,
  } = useTaskRoomState("cluster_editions_room_state", {
    preferMine: Boolean(currentUserProfile?.linkedEditorId),
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const todayStr = getHondurasTodayStr();
  const currentMonthPeriod = getRankingMonthPeriod(todayStr);

  const columns = [
    { id: "editar", title: "Por Editar", color: "slate", icon: "PenTool" },
    { id: "en_edicion", title: "En Edición", color: "amber", icon: "Video" },
    {
      id: "revision_interna",
      title: "En Revisión",
      color: "blue",
      icon: "Search",
    },
    {
      id: "aprobado",
      title: "Aprobado",
      color: "emerald",
      icon: "CheckCircle2",
    },
    { id: "publicado", title: "Publicado", color: "indigo", icon: "Sparkles" },
  ];

  const priorityStyles = {
    urgente:
      "bg-red-50 dark:bg-red-500/20 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400",
    normal:
      "bg-amber-50 dark:bg-amber-500/20 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400",
    recurrente:
      "bg-emerald-50 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400",
  };
  const hierarchyStyles = {
    p1: "bg-red-50 dark:bg-red-500/20 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400",
    p2: "bg-amber-50 dark:bg-amber-500/20 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400",
    p3: "bg-emerald-50 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400",
    p4: "bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300",
  };

  const filteredTasks = tasks.filter((t) => {
    if (searchTerm && !t.title.toLowerCase().includes(searchTerm.toLowerCase()))
      return false;
    if (
      ownershipFilter === "mine" &&
      !isTaskAssignedToProfile(t, currentUserProfile, [
        currentUserProfile?.linkedEditorId,
      ])
    )
      return false;
    if (filterMode === "date")
      return compareDateOnlyStrings(t.date, currentDate) === 0;
    if (filterMode === "overdue")
      return (
        isDateBeforeDateString(t.date, todayStr) && t.status !== "publicado"
      );
    if (filterMode === "history") return true;
    return isDateWithinPeriod(t.date, currentMonthPeriod);
  });
  const canManageEditingTasks = userHasPermission(
    currentUserProfile,
    "manage_editing_tasks",
  );
  const canCreateEditingTasks = userHasPermission(
    currentUserProfile,
    "create_editing_tasks",
  );
  const handleAddTask = (dateStr) => {
    const nextDate = normalizeDateOnlyString(dateStr) || todayStr;
    setCurrentDate(nextDate);
    setFilterMode("date");
    onAdd(nextDate);
  };
  const rankedTasks = rankPendingEditingTasks(filteredTasks, todayStr);
  const displayTasks = [
    ...rankedTasks,
    ...filteredTasks.filter((task) => !isEditingActionable(task)),
  ];
  const rankingMap = rankedTasks.reduce(
    (acc, task, index) => ({ ...acc, [task.id]: index + 1 }),
    {},
  );

  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
    try {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const clone = e.currentTarget.cloneNode(true);
      clone.id = "custom-drag-ghost-edit-" + taskId;
      clone.style.width = `${rect.width}px`;
      clone.style.height = `${rect.height}px`;
      clone.style.position = "absolute";
      clone.style.top = "-9999px";
      clone.style.left = "-9999px";
      clone.style.opacity = "1";
      clone.style.backgroundColor = getComputedStyle(
        document.documentElement,
      ).getPropertyValue("--surface-raised");
      clone.style.borderRadius = "0.75rem";
      clone.style.boxShadow = "0 25px 50px -12px rgba(0, 0, 0, 0.4)";
      clone.style.transform = "rotate(3deg) scale(1.05)";
      clone.style.zIndex = "99999";
      clone.style.pointerEvents = "none";
      document.body.appendChild(clone);
      e.dataTransfer.setDragImage(clone, x, y);
    } catch (err) {}
    setTimeout(() => e.currentTarget.classList.add("drag-source-hidden"), 0);
  };

  const handleDragEnd = (e, taskId) => {
    e.currentTarget.classList.remove("drag-source-hidden");
    setDraggedTaskId(null);
    document
      .querySelectorAll(".drag-over")
      .forEach((el) => el.classList.remove("drag-over"));
    const clone = document.getElementById("custom-drag-ghost-edit-" + taskId);
    if (clone) clone.remove();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add("drag-over");
  };
  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove("drag-over");
  };
  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");
    if (draggedTaskId) {
      const task = tasks.find((t) => t.id === draggedTaskId);
      if (task && task.status !== targetStatus)
        onChangeStatus(task, targetStatus);
    }
  };

  const defaultAddDate = filterMode === "date" ? currentDate : todayStr;
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || null;
  const selectedEditor = selectedTask
    ? editors.find((editor) => editor.id === selectedTask.contextId)
    : null;
  const selectedClient = selectedTask
    ? clients.find((client) => client.id === selectedTask.clientId)
    : null;
  const editingGroups = [
    {
      id: "start",
      title: "Por iniciar",
      subtitle: "Tareas pendientes de comenzar",
      color: "slate",
      stages: [{
        ...columns[0],
        tasks: displayTasks.filter(
          (task) => normalizeEditingWorkflowStatus(task.status) === columns[0].id,
        ),
      }],
    },
    {
      id: "production",
      title: "En producción",
      subtitle: "En edición o en revisión",
      color: "amber",
      stages: columns.slice(1, 3).map((column) => ({
        ...column,
        tasks: displayTasks.filter(
          (task) => normalizeEditingWorkflowStatus(task.status) === column.id,
        ),
      })),
    },
    {
      id: "ready",
      title: "Listas",
      subtitle: "Aprobadas y publicadas",
      color: "emerald",
      stages: columns.slice(3).map((column) => ({
        ...column,
        tasks: displayTasks.filter(
          (task) => normalizeEditingWorkflowStatus(task.status) === column.id,
        ),
        collapsible: column.id === "publicado",
        collapsedLimit: 3,
      })),
    },
  ];

  const renderEditingTask = (task, stage) => {
    const columnIndex = columns.findIndex((column) => column.id === stage.id);
    const previous = columns[columnIndex - 1];
    const next = columns[columnIndex + 1];
    const editor = editors.find((item) => item.id === task.contextId);
    const client = clients.find((item) => item.id === task.clientId);
    const isOverdue =
      isDateBeforeDateString(task.date, todayStr) && !isCompletedStatus(task.status);
    const hierarchyId = task.hierarchy || getEditingHierarchyId(task);
    const hierarchyTone =
      hierarchyId === "p1"
        ? "red"
        : hierarchyId === "p2"
          ? "amber"
          : hierarchyId === "p3"
            ? "emerald"
            : "slate";
    const priorityTone =
      task.priority === "urgente"
        ? "red"
        : task.priority === "recurrente"
          ? "emerald"
          : "amber";
    const menuItems = [];
    if (canManageEditingTasks) {
      if (next)
        menuItems.push({
          key: "next",
          label: next.id === "publicado" ? "Publicar" : `Avanzar a ${next.title}`,
          icon: next.id === "publicado" ? "CheckCircle2" : "ArrowRight",
          onClick: () => onChangeStatus(task, next.id),
        });
      if (previous)
        menuItems.push({
          key: "prev",
          label: `Volver a ${previous.title}`,
          icon: "ChevronLeft",
          onClick: () => onChangeStatus(task, previous.id),
        });
      menuItems.push(
        { key: "edit", label: "Editar", icon: "Edit", onClick: () => onEdit(task) },
        { key: "delete", label: "Eliminar", icon: "Trash2", danger: true, onClick: () => onDelete(task.id) },
      );
    }

    return (
      <KanbanCard
        key={task.id}
        onClick={() => setSelectedTaskId(task.id)}
        selected={selectedTaskId === task.id}
        draggable
        onDragStart={(event) => handleDragStart(event, task.id)}
        onDragEnd={(event) => handleDragEnd(event, task.id)}
        accentTone={hierarchyTone}
        isOverdue={isOverdue}
        client={client?.name}
        rank={rankingMap[task.id]}
        title={task.title}
        notes={task.notes}
        badges={[
          { label: hierarchyId.toUpperCase(), tone: hierarchyTone },
          { label: task.priority || "Normal", tone: priorityTone },
        ]}
        due={{
          label: formatShortDate(task.date) + (isOverdue ? " · atrasada" : ""),
          tone: isOverdue ? "red" : "slate",
        }}
        assignee={buildAssignee(editor)}
        menuItems={menuItems}
        statusControl={
          canManageEditingTasks
            ? {
                value: normalizeEditingWorkflowStatus(task.status),
                options: columns,
                onChange: (status) => {
                  if (status !== normalizeEditingWorkflowStatus(task.status))
                    onChangeStatus(task, status);
                },
              }
            : null
        }
      />
    );
  };

  return (
    <div className="task-room min-h-0 flex flex-col gap-3 fade-in">
      <DateHeader
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        filterMode={filterMode}
        setFilterMode={setFilterMode}
        ownershipFilter={ownershipFilter}
        setOwnershipFilter={setOwnershipFilter}
        title="Sala de Edición"
        onAdd={handleAddTask}
        btnColor="amber"
        btnIcon="Video"
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onLoadHistory={onLoadHistory}
        historyLoaded={historyLoaded}
        historyLoading={historyLoading}
        taskCount={filteredTasks.length}
      />
      <TaskRoomWorkspace
        groups={editingGroups}
        onAdd={() => handleAddTask(defaultAddDate)}
        canAdd={canCreateEditingTasks}
        renderTask={renderEditingTask}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        inspector={
          selectedTask ? (
            <TaskRoomInspector
              task={selectedTask}
              client={selectedClient?.name}
              assignee={buildAssignee(selectedEditor)}
              status={columns.find(
                (column) => column.id === normalizeEditingWorkflowStatus(selectedTask.status),
              )}
              onClose={() => setSelectedTaskId(null)}
              onOpenFull={() => onTaskClick(selectedTask)}
            />
          ) : null
        }
      />
    </div>
  );
};

const computeManagementDueBadge = (task) => {
  if (!task?.date || !task?.time || !/^\d{2}:\d{2}$/.test(task.time))
    return null;
  const iso = `${task.date}T${task.time}:00-06:00`;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  const diffMs = ms - Date.now();
  const absHours = Math.abs(diffMs) / 3600000;
  if (diffMs >= 0) {
    if (absHours >= 48)
      return { label: `Vence en ${Math.round(absHours / 24)}d`, tone: "slate" };
    if (absHours >= 1)
      return {
        label: `Vence en ${Math.round(absHours)}h`,
        tone: absHours <= 8 ? "amber" : "slate",
      };
    const mins = Math.max(1, Math.round(diffMs / 60000));
    return { label: `Vence en ${mins}m`, tone: "red" };
  }
  if (absHours < 1)
    return {
      label: `Vencida hace ${Math.max(1, Math.round(-diffMs / 60000))}m`,
      tone: "red",
    };
  if (absHours < 48)
    return { label: `Vencida hace ${Math.round(absHours)}h`, tone: "red" };
  return { label: `Vencida hace ${Math.round(absHours / 24)}d`, tone: "red" };
};


export const getMgmtCategoryColor = (cat) =>
  MGMT_CATEGORY_COLORS[(cat || "").toLowerCase()] ||
  "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700";

export const ManagementRoomView = ({
  tasks,
  members,
  clients,
  currentUserProfile,
  onAdd,
  onEdit,
  onChangeStatus,
  onDelete,
  onTaskClick,
  onLoadHistory,
  historyLoaded,
  historyLoading,
}) => {
  const {
    currentDate,
    setCurrentDate,
    filterMode,
    setFilterMode,
    ownershipFilter,
    setOwnershipFilter,
  } = useTaskRoomState("cluster_management_room_state", {
    preferMine: currentUserProfile?.role === "management",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [showTeam, setShowTeam] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const todayStr = getHondurasTodayStr();
  const currentMonthPeriod = getRankingMonthPeriod(todayStr);

  const columns = [
    { id: "pendiente", title: "Pendiente", color: "slate", icon: "Circle" },
    { id: "en_proceso", title: "En Proceso", color: "violet", icon: "Zap" },
    {
      id: "en_espera",
      title: "En Espera",
      color: "amber",
      icon: "PauseCircle",
    },
    { id: "cerrado", title: "Cerrado", color: "emerald", icon: "CheckCircle2" },
  ];

  const filteredTasks = tasks.filter((task) => {
    if (
      searchTerm &&
      !task.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false;
    if (
      ownershipFilter === "mine" &&
      !isTaskAssignedToProfile(task, currentUserProfile, [
        currentUserProfile?.id,
      ])
    )
      return false;
    if (filterMode === "date")
      return compareDateOnlyStrings(task.date, currentDate) === 0;
    if (filterMode === "overdue")
      return (
        isDateBeforeDateString(task.date, todayStr) && task.status !== "cerrado"
      );
    if (filterMode === "history") return true;
    return isDateWithinPeriod(task.date, currentMonthPeriod);
  });

  const handleAddTask = (dateStr) => {
    const nextDate = normalizeDateOnlyString(dateStr) || todayStr;
    setCurrentDate(nextDate);
    setFilterMode("date");
    onAdd(nextDate);
  };

  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragEnd = () => setDraggedTaskId(null);
  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add("drag-over");
  };
  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove("drag-over");
  };
  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");
    if (draggedTaskId) {
      const task = tasks.find((t) => t.id === draggedTaskId);
      if (task && task.status !== targetStatus)
        onChangeStatus(task, targetStatus);
    }
  };

  const membersWithAlert = members.filter((m) => !normalizeEmail(m.email));
  const badgeToneMap = {
    slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    amber:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    red: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  };
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || null;
  const selectedMember = selectedTask
    ? members.find((member) => member.id === selectedTask.contextId)
    : null;
  const selectedClient = selectedTask
    ? clients.find((client) => client.id === selectedTask.clientId)
    : null;
  const buildManagementAssignee = (member) =>
    member
      ? {
          name: member.name,
          initials: getInitials(member.name),
          className: `bg-${AVATAR_FAMILY[member.color] || "violet"}-600 text-white`,
          photo: member.photo || "",
        }
      : null;
  const managementGroups = [
    {
      id: "start",
      title: "Por iniciar",
      subtitle: "Tareas pendientes de comenzar",
      color: "slate",
      stages: [{ ...columns[0], tasks: filteredTasks.filter((task) => task.status === columns[0].id) }],
    },
    {
      id: "production",
      title: "En producción",
      subtitle: "En proceso o en espera",
      color: "violet",
      stages: columns.slice(1, 3).map((column) => ({
        ...column,
        tasks: filteredTasks.filter((task) => task.status === column.id),
      })),
    },
    {
      id: "ready",
      title: "Listas",
      subtitle: "Trabajo finalizado",
      color: "emerald",
      stages: [{
        ...columns[3],
        tasks: filteredTasks.filter((task) => task.status === columns[3].id),
        collapsible: true,
        collapsedLimit: 3,
      }],
    },
  ];

  const renderManagementTask = (task, stage) => {
    const columnIndex = columns.findIndex((column) => column.id === stage.id);
    const previous = columns[columnIndex - 1];
    const next = columns[columnIndex + 1];
    const member = members.find((item) => item.id === task.contextId);
    const client = clients.find((item) => item.id === task.clientId);
    const isOverdue =
      isDateBeforeDateString(task.date, todayStr) && stage.id !== "cerrado";
    const dueBadge = computeManagementDueBadge(task);
    const badges = [];
    if (task.category)
      badges.push({ label: task.category, className: getMgmtCategoryColor(task.category) });
    if (dueBadge && stage.id !== "cerrado")
      badges.push({ label: dueBadge.label, tone: dueBadge.tone });
    const menuItems = [];
    if (next)
      menuItems.push({
        key: "next",
        label: next.id === "cerrado" ? "Cerrar tarea" : `Avanzar a ${next.title}`,
        icon: next.id === "cerrado" ? "Check" : "ArrowRight",
        onClick: () => onChangeStatus(task, next.id),
      });
    if (previous)
      menuItems.push({
        key: "prev",
        label: `Volver a ${previous.title}`,
        icon: "ChevronLeft",
        onClick: () => onChangeStatus(task, previous.id),
      });
    menuItems.push(
      { key: "edit", label: "Editar", icon: "Edit", onClick: () => onEdit(task) },
      { key: "delete", label: "Eliminar", icon: "Trash2", danger: true, onClick: () => onDelete(task.id) },
    );

    return (
      <KanbanCard
        key={task.id}
        onClick={() => setSelectedTaskId(task.id)}
        selected={selectedTaskId === task.id}
        draggable
        onDragStart={(event) => handleDragStart(event, task.id)}
        onDragEnd={handleDragEnd}
        accentTone={stage.color}
        isOverdue={isOverdue}
        client={client?.name}
        title={task.title}
        notes={task.notes}
        badges={badges}
        due={{
          label:
            formatShortDate(task.date) +
            (task.time ? ` · ${task.time}` : "") +
            (isOverdue ? " · vencida" : ""),
          tone: isOverdue ? "red" : "slate",
        }}
        assignee={buildManagementAssignee(member)}
        menuItems={menuItems}
        statusControl={{
          value: task.status,
          options: columns,
          onChange: (status) => {
            if (status !== task.status) onChangeStatus(task, status);
          },
        }}
      />
    );
  };

  return (
    <div className="task-room min-h-0 flex flex-col gap-3 fade-in">
      {/* Header */}
      <DateHeader
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        filterMode={filterMode}
        setFilterMode={setFilterMode}
        ownershipFilter={ownershipFilter}
        setOwnershipFilter={setOwnershipFilter}
        title="Sala de Gestión"
        onAdd={handleAddTask}
        btnColor="violet"
        btnIcon="ShieldCheck"
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onLoadHistory={onLoadHistory}
        historyLoaded={historyLoaded}
        historyLoading={historyLoading}
        taskCount={filteredTasks.length}
      />

      <div className="flex flex-col gap-2 lg:flex-row">
        <div className="surface-subtle flex flex-1 flex-wrap rounded-xl border border-[var(--border)] p-1.5 dark:border-white/10">
          {columns.map((col) => {
            const filteredCount = filteredTasks.filter(
              (t) => t.status === col.id,
            ).length;
            const totalCount = tasks.filter(
              (task) =>
                task.status === col.id &&
                (filterMode === "history" ||
                  isDateWithinPeriod(task.date, currentMonthPeriod)),
            ).length;
            const isFiltered = filteredCount !== totalCount;
            return (
              <div
                key={col.id}
                className="flex min-w-[130px] flex-1 items-center gap-2.5 rounded-lg px-3 py-2.5"
              >
                <div
                  className={`shrink-0 rounded-md bg-${col.color}-50 p-1.5 dark:bg-${col.color}-500/20`}
                >
                  <Icon
                    name={col.icon}
                    size={16}
                    className={`text-${col.color}-600 dark:text-${col.color}-400`}
                  />
                </div>
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <p className="mono-meta text-xl font-semibold leading-none text-slate-800 dark:text-white">
                      {filteredCount}
                    </p>
                    {isFiltered && (
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        / {totalCount}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                    {col.title}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => setShowTeam((s) => !s)}
          className="surface flex shrink-0 items-center gap-3 px-4 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 lg:max-w-[260px]"
        >
          <div className="flex -space-x-2 shrink-0">
            {members.slice(0, 4).map((m) => (
              <div
                key={m.id}
                className={`w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[9px] font-black text-white ${membersWithAlert.find((a) => a.id === m.id) ? "bg-amber-500" : "bg-violet-500"}`}
              >
                {(m.name || "?").slice(0, 2).toUpperCase()}
              </div>
            ))}
            {members.length > 4 && (
              <div className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[9px] font-black bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                +{members.length - 4}
              </div>
            )}
          </div>
          <div className="text-left">
            <p className="text-xs font-black text-slate-700 dark:text-slate-200">
              Equipo
            </p>
            {membersWithAlert.length > 0 ? (
              <p className="text-[10px] font-bold text-amber-500">
                {membersWithAlert.length} sin email — ver detalles
              </p>
            ) : (
              <p className="text-[10px] font-bold text-emerald-500">
                Todos con email
              </p>
            )}
          </div>
          <Icon
            name={showTeam ? "ChevronUp" : "ChevronDown"}
            size={14}
            className="text-slate-500 ml-1"
          />
        </button>
      </div>

      {/* Team expanded panel */}
      {showTeam && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 fade-in">
          {members.map((member) => {
            const openCount = tasks.filter(
              (task) =>
                task.contextId === member.id &&
                task.status !== "cerrado" &&
                isDateWithinPeriod(task.date, currentMonthPeriod),
            ).length;
            const hasAlert = !normalizeEmail(member.email);
            return (
              <div
                key={member.id}
                className={`flex items-center gap-3 p-3 rounded-xl border ${hasAlert ? "border-amber-200 dark:border-amber-500/30 bg-amber-50/60 dark:bg-amber-500/5" : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"}`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0 ${hasAlert ? "bg-amber-500" : "bg-violet-500"}`}
                >
                  {(member.name || "?").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 dark:text-white text-sm truncate">
                    {member.name}
                  </p>
                  <p
                    className={`text-[10px] truncate ${hasAlert ? "text-amber-500 dark:text-amber-400" : "text-slate-500 dark:text-slate-400"}`}
                  >
                    {hasAlert ? "Sin correo asignado" : member.email}
                  </p>
                </div>
                {openCount > 0 && (
                  <span className="shrink-0 text-[10px] font-black bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 px-2 py-1 rounded-full">
                    {openCount} activas
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Indicador de filtros activos */}
      {(filterMode !== "all" || ownershipFilter !== "all" || searchTerm) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Filtros activos:
          </span>
          {filterMode === "date" && (
            <span className="flex items-center gap-1 text-[10px] font-bold bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-full border border-violet-200 dark:border-violet-500/30">
              <Icon name="Calendar" size={9} />
              Fecha: {currentDate}
            </span>
          )}
          {filterMode === "overdue" && (
            <span className="flex items-center gap-1 text-[10px] font-bold bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-500/30">
              <Icon name="Flame" size={9} />
              Solo atrasadas
            </span>
          )}
          {filterMode === "history" && (
            <span className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <Icon name="Clock" size={9} />
              Histórico completo
            </span>
          )}
          {ownershipFilter === "mine" && (
            <span className="flex items-center gap-1 text-[10px] font-bold bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-full border border-violet-200 dark:border-violet-500/30">
              <Icon name="User" size={9} />
              Solo mis tareas
            </span>
          )}
          {searchTerm && (
            <span className="flex items-center gap-1 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
              <Icon name="Search" size={9} />"{searchTerm}"
            </span>
          )}
          <span className="text-[10px] text-slate-500">
            — mostrando {filteredTasks.length} de {tasks.length} tareas
          </span>
        </div>
      )}

      <TaskRoomWorkspace
        groups={managementGroups}
        onAdd={() => handleAddTask(filterMode === "date" ? currentDate : todayStr)}
        renderTask={renderManagementTask}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        inspector={
          selectedTask ? (
            <TaskRoomInspector
              task={selectedTask}
              client={selectedClient?.name}
              assignee={buildManagementAssignee(selectedMember)}
              status={columns.find((column) => column.id === selectedTask.status)}
              onClose={() => setSelectedTaskId(null)}
              onOpenFull={() => onTaskClick(selectedTask)}
            />
          ) : null
        }
      />
    </div>
  );
};

