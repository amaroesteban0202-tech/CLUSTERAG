import React, { useMemo, useState } from "react";
import { Icon } from "./icons.jsx";
import { Button, EmptyState, Input, PhotoUploader } from "./ui.jsx";
import { DASHBOARD_PALETTE } from "../constants/ui-tones.js";
import { THEME_PALETTES } from "../constants/theme.js";
import {
  ROLE_DEFINITIONS,
  MONTH_NAMES,
} from "../constants/app.constants.js";
import {
  compareDateOnlyStrings,
  getHondurasTodayStr,
  isDateBeforeDateString,
  normalizeDateOnlyString,
} from "../utils/date.js";
import {
  getRankingMonthPeriod,
  isDateWithinPeriod,
  isTaskAssignedToProfile,
  isAccountTaskDone,
  isCompletedStatus,
} from "../utils/task-helpers.js";
import { normalizeEmail } from "../utils/text.js";
import { getRoleMeta } from "../utils/permissions.js";
import { formatShortDate } from "./kanban.jsx";
import {
  isEditingDelivered,
  KPI_MIN_TASKS,
} from "../utils/kpi.js";

export const getDashboardPalette = (name = "slate") =>
  DASHBOARD_PALETTE[name] || DASHBOARD_PALETTE.slate;

export const buildPersonalTaskList = ({
  profile,
  tasks = [],
  accountTasks = [],
  managementTasks = [],
}) =>
  [
    ...tasks
      .filter((task) =>
        isTaskAssignedToProfile(task, profile, [profile?.linkedEditorId]),
      )
      .map((task) => ({
        ...task,
        _area: "Edición",
        _taskType: "editingTask",
        _room: "editions",
        _done: isCompletedStatus(task.status),
      })),
    ...accountTasks
      .filter((task) =>
        isTaskAssignedToProfile(task, profile, [profile?.linkedManagerId]),
      )
      .map((task) => ({
        ...task,
        _area: "Accounts",
        _taskType: "accountTask",
        _room: "account-room",
        _done:
          task.status === "aprobado_internamente" ||
          task.status === "publicado",
      })),
    ...managementTasks
      .filter((task) => isTaskAssignedToProfile(task, profile, [profile?.id]))
      .map((task) => ({
        ...task,
        _area: "Gestión",
        _taskType: "managementTask",
        _room: "management-room",
        _done: task.status === "cerrado",
      })),
  ].sort((a, b) => {
    if (a._done !== b._done) return a._done ? 1 : -1;
    return String(a.date || "9999-12-31").localeCompare(
      String(b.date || "9999-12-31"),
    );
  });

export const buildCompanyTaskList = ({
  tasks = [],
  accountTasks = [],
  managementTasks = [],
}) => [
  ...tasks.map((task) => ({
    ...task,
    _area: "Edición",
    _done: isCompletedStatus(task.status),
  })),
  ...accountTasks.map((task) => ({
    ...task,
    _area: "Accounts",
    _done: isAccountTaskDone(task),
  })),
  ...managementTasks.map((task) => ({
    ...task,
    _area: "Gestión",
    _done: task.status === "cerrado",
  })),
];

export const buildPersonalKpiSnapshot = (
  personalTasks = [],
  period = getRankingMonthPeriod(),
) => {
  const monthlyTasks = personalTasks.filter((task) =>
    isDateWithinPeriod(task.date, period),
  );
  const completedTasks = monthlyTasks.filter((task) => task._done);
  const completionPercent =
    monthlyTasks.length > 0
      ? Math.round((completedTasks.length / monthlyTasks.length) * 100)
      : 0;
  const measuredCompletedTasks = completedTasks
    .map((task) => ({
      task,
      completionIso: getTaskCompletionIso(task),
    }))
    .filter(({ task, completionIso }) =>
      Boolean(normalizeDateOnlyString(task.date) && completionIso),
    );
  const onTimePercent =
    measuredCompletedTasks.length > 0
      ? Math.round(
          (measuredCompletedTasks.filter(({ task, completionIso }) =>
            isCompletionOnTime(task, completionIso),
          ).length /
            measuredCompletedTasks.length) *
            100,
        )
      : null;

  return {
    monthlyTasks,
    completedTasks,
    completionPercent,
    onTimePercent,
    score:
      onTimePercent === null
        ? completionPercent
        : Math.round(completionPercent * 0.7 + onTimePercent * 0.3),
  };
};

// --- PANEL PERSONAL ---
export const DashboardView = ({
  clients = [],
  managers = [],
  editors = [],
  users = [],
  events,
  tasks = [],
  accountTasks = [],
  managementTasks = [],
  currentUserProfile,
  onSignIn,
  onNavigate,
  onOpenTask,
}) => {
  const [taskScope, setTaskScope] = React.useState("today");
  const todayStr = getHondurasTodayStr();
  const dashboardPeriod = getRankingMonthPeriod(todayStr);
  const parseDashboardDate = (value) => {
    const normalized = normalizeDateOnlyString(value);
    if (!normalized) return null;
    const [year, month, day] = normalized.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  };
  const shiftDashboardDate = (value, amount) => {
    const date = parseDashboardDate(value);
    if (!date) return "";
    date.setUTCDate(date.getUTCDate() + amount);
    return date.toISOString().slice(0, 10);
  };
  const todayDate = parseDashboardDate(todayStr);
  const mondayOffset = todayDate ? -((todayDate.getUTCDay() + 6) % 7) : 0;
  const weekStart = shiftDashboardDate(todayStr, mondayOffset);
  const weekEnd = shiftDashboardDate(weekStart, 6);
  const tomorrowStr = shiftDashboardDate(todayStr, 1);

  const clientNames = new Map(
    clients.map((client) => [client.id, client.name || "Sin cliente"]),
  );
  const personalTasks = buildPersonalTaskList({
    profile: currentUserProfile,
    tasks,
    accountTasks,
    managementTasks,
  });
  const companyTasks = buildCompanyTaskList({
    tasks,
    accountTasks,
    managementTasks,
  });

  const personalKpi = buildPersonalKpiSnapshot(
    personalTasks,
    dashboardPeriod,
  );
  const monthlyPersonalTasks = personalKpi.monthlyTasks;
  const openPersonalTasks = personalTasks.filter((task) => !task._done);
  const completedThisMonth = personalKpi.completedTasks.length;
  const completionPercent = personalKpi.completionPercent;
  const onTimePercent = personalKpi.onTimePercent;
  const individualKpi = personalKpi.score;
  const overdueTasks = openPersonalTasks.filter((task) =>
    isDateBeforeDateString(task.date, todayStr),
  );
  const dueTodayCount = openPersonalTasks.filter(
    (task) => normalizeDateOnlyString(task.date) === todayStr,
  ).length;

  const tasksByScope = {
    today: openPersonalTasks.filter(
      (task) =>
        normalizeDateOnlyString(task.date) &&
        compareDateOnlyStrings(task.date, todayStr) <= 0,
    ),
    week: openPersonalTasks.filter(
      (task) =>
        normalizeDateOnlyString(task.date) &&
        compareDateOnlyStrings(task.date, weekEnd) <= 0,
    ),
    all: openPersonalTasks,
  };
  const visiblePersonalTasks = (tasksByScope[taskScope] || []).slice(0, 7);

  const taskScopes = [
    { id: "today", label: "Hoy" },
    { id: "week", label: "Esta semana" },
    { id: "all", label: "Todas" },
  ];

  const formatDueDate = (task) => {
    const date = normalizeDateOnlyString(task.date);
    if (!date) return "Sin fecha";
    if (date === todayStr) return "Hoy";
    if (date === tomorrowStr) return "Mañana";
    if (isDateBeforeDateString(date, todayStr))
      return `${formatShortDate(date)} · vencida`;
    return formatShortDate(date);
  };

  const weeklySeries = Array.from({ length: 7 }, (_, index) => {
    const date = shiftDashboardDate(weekStart, index);
    const dayTasks = companyTasks.filter(
      (task) => normalizeDateOnlyString(task.date) === date,
    );
    const parsedDate = parseDashboardDate(date);
    const weekday = parsedDate
      ? new Intl.DateTimeFormat("es-HN", {
          weekday: "short",
          timeZone: "UTC",
        })
          .format(parsedDate)
          .replace(".", "")
      : "";
    return {
      date,
      weekday,
      day: parsedDate?.getUTCDate() || "",
      total: dayTasks.length,
      completed: dayTasks.filter((task) => task._done).length,
      isToday: date === todayStr,
    };
  });
  const weeklyMax = Math.max(
    1,
    ...weeklySeries.map((item) => item.total),
  );
  const weeklySummary = weeklySeries.reduce(
    (summary, item) => ({
      assigned: summary.assigned + item.total,
      completed: summary.completed + item.completed,
    }),
    { assigned: 0, completed: 0 },
  );
  weeklySummary.rate = weeklySummary.assigned
    ? Math.round((weeklySummary.completed / weeklySummary.assigned) * 100)
    : 0;

  const teamProfiles = [];
  const addTeamProfile = (
    profile,
    { linkedManagerId = "", linkedEditorId = "", fallbackRole = "" } = {},
  ) => {
    const candidateId = profile?.userId || profile?.id;
    if (!candidateId || profile?.isActive === false) return;
    const candidate = {
      ...profile,
      id: candidateId,
      role: profile.role || fallbackRole,
      linkedManagerId: profile.linkedManagerId || linkedManagerId,
      linkedEditorId: profile.linkedEditorId || linkedEditorId,
    };
    const candidateEmail = normalizeEmail(candidate.email);
    const existingIndex = teamProfiles.findIndex(
      (item) =>
        item.id === candidate.id ||
        (candidateEmail && normalizeEmail(item.email) === candidateEmail) ||
        (candidate.linkedManagerId &&
          item.linkedManagerId === candidate.linkedManagerId) ||
        (candidate.linkedEditorId &&
          item.linkedEditorId === candidate.linkedEditorId),
    );
    if (existingIndex < 0) {
      teamProfiles.push(candidate);
      return;
    }
    const existing = teamProfiles[existingIndex];
    teamProfiles[existingIndex] = {
      ...candidate,
      ...existing,
      name: existing.name || candidate.name,
      email: existing.email || candidate.email,
      role: existing.role || candidate.role,
      linkedManagerId:
        existing.linkedManagerId || candidate.linkedManagerId,
      linkedEditorId: existing.linkedEditorId || candidate.linkedEditorId,
    };
  };
  users.forEach((profile) => addTeamProfile(profile));
  managers.forEach((manager) =>
    addTeamProfile(manager, {
      linkedManagerId: manager.id,
      fallbackRole: "manager",
    }),
  );
  editors.forEach((editor) =>
    addTeamProfile(editor, {
      linkedEditorId: editor.id,
      fallbackRole: "editor",
    }),
  );
  addTeamProfile(currentUserProfile);

  const currentUserEmail = normalizeEmail(currentUserProfile?.email);
  const userKpiCandidates = teamProfiles
    .map((profile) => {
      const memberTasks = buildPersonalTaskList({
        profile,
        tasks,
        accountTasks,
        managementTasks,
      });
      const snapshot = buildPersonalKpiSnapshot(
        memberTasks,
        dashboardPeriod,
      );
      const isCurrent =
        profile.id === currentUserProfile?.id ||
        Boolean(
          currentUserEmail &&
            normalizeEmail(profile.email) === currentUserEmail,
        );
      const resolvedRole =
        ROLE_DEFINITIONS[profile.role]?.label ||
        profile.profession ||
        (profile.linkedManagerId
          ? "Account Manager"
          : profile.linkedEditorId
            ? "Editor"
            : "Equipo Cluster");
      const name = profile.name?.trim() || profile.email || "Usuario";
      const initials = name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();

      return {
        id: profile.id,
        name,
        initials,
        role: resolvedRole,
        score: snapshot.score,
        completed: snapshot.completedTasks.length,
        assigned: snapshot.monthlyTasks.length,
        onTimePercent: snapshot.onTimePercent,
        isCurrent,
      };
    })
    .filter((item) => item.assigned > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.completed - left.completed ||
        left.name.localeCompare(right.name),
    )
    .map((item, index) => ({ ...item, rank: index + 1 }));
  const leadingUserKpis = userKpiCandidates.slice(0, 5);
  const currentUserKpi = userKpiCandidates.find((item) => item.isCurrent);
  const visibleUserKpis =
    currentUserKpi &&
    !leadingUserKpis.some((item) => item.id === currentUserKpi.id)
      ? [...leadingUserKpis.slice(0, 4), currentUserKpi]
      : leadingUserKpis;
  const nextTask = openPersonalTasks[0] || null;
  const displayName = currentUserProfile?.name?.trim() || "Usuario";
  const firstName = displayName.split(/\s+/)[0];
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Buenos días"
      : currentHour < 18
        ? "Buenas tardes"
        : "Buenas noches";
  const roleLabel =
    ROLE_DEFINITIONS[currentUserProfile?.role]?.label ||
    currentUserProfile?.profession ||
    "Equipo Cluster";

  const dateOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const formattedDate = new Date().toLocaleDateString("es-HN", dateOptions);

  return (
    <div className="personal-dashboard">
      <header className="pd-header">
        <div>
          <p className="pd-kicker">Tu trabajo, en orden</p>
          <h2 className="pd-title">
            {greeting}, <span>{firstName}</span>
          </h2>
          <div className="pd-header-meta">
            <span className="capitalize">
              <Icon name="CalendarDays" size={15} />
              {formattedDate}
            </span>
            <span aria-hidden="true">·</span>
            <span>{roleLabel}</span>
          </div>
        </div>

        <div className="pd-progress-summary">
          <div
            className="pd-progress-ring"
            style={{ "--pd-progress": `${completionPercent * 3.6}deg` }}
            aria-label={`${completionPercent}% de cumplimiento en ${dashboardPeriod.label}`}
          >
            <span>{completionPercent}%</span>
          </div>
          <div>
            <p>Progreso personal</p>
            <strong>{dashboardPeriod.label}</strong>
          </div>
        </div>
      </header>

      <div className="pd-workspace">
        <section className="pd-task-ledger" aria-labelledby="pd-tasks-title">
          <div className="pd-section-heading">
            <div>
              <h3 id="pd-tasks-title">Mis tareas</h3>
              <p>
                {dueTodayCount} para hoy · {overdueTasks.length} vencidas
              </p>
            </div>
            <button
              type="button"
              className="pd-calendar-link"
              onClick={() => onNavigate("calendar")}
            >
              <Icon name="CalendarIcon" size={16} />
              Ver calendario
            </button>
          </div>

          <div className="pd-task-tabs" role="tablist" aria-label="Filtrar tareas">
            {taskScopes.map((scope) => (
              <button
                type="button"
                role="tab"
                aria-selected={taskScope === scope.id}
                key={scope.id}
                className={taskScope === scope.id ? "is-active" : ""}
                onClick={() => setTaskScope(scope.id)}
              >
                {scope.label}
                {scope.id === "all" && (
                  <span>{openPersonalTasks.length}</span>
                )}
              </button>
            ))}
          </div>

          <div className="pd-task-head" aria-hidden="true">
            <span>Tarea</span>
            <span>Cliente</span>
            <span>Sala</span>
            <span>Vence</span>
            <span />
          </div>

          <div className="pd-task-list" role="tabpanel">
            {visiblePersonalTasks.length === 0 ? (
              <div className="pd-empty-state">
                <span>
                  <Icon name="Check" size={18} />
                </span>
                <div>
                  <strong>Todo despejado</strong>
                  <p>No tienes tareas pendientes en este período.</p>
                </div>
              </div>
            ) : (
              visiblePersonalTasks.map((task, index) => {
                const isOverdue = isDateBeforeDateString(
                  task.date,
                  todayStr,
                );
                return (
                  <button
                    type="button"
                    key={`${task._taskType}-${task.id}`}
                    className={`pd-task-row ${isOverdue ? "is-overdue" : ""}`}
                    style={{ "--pd-row-index": index }}
                    onClick={() => onOpenTask(task, task._taskType)}
                    aria-label={`Abrir tarea ${task.title}`}
                  >
                    <span className="pd-task-title-cell">
                      <span className="pd-task-check" aria-hidden="true" />
                      <span>
                        <strong>{task.title || "Tarea sin título"}</strong>
                        <small>
                          {task.priority
                            ? `Prioridad ${task.priority}`
                            : "Prioridad normal"}
                        </small>
                      </span>
                    </span>
                    <span className="pd-task-client">
                      <i aria-hidden="true" />
                      {clientNames.get(task.clientId) || "Interno"}
                    </span>
                    <span className="pd-task-area">{task._area}</span>
                    <span className="pd-task-due">
                      {formatDueDate(task)}
                    </span>
                    <Icon
                      name="ExternalLink"
                      size={17}
                      className="pd-task-arrow"
                    />
                  </button>
                );
              })
            )}
          </div>

          {tasksByScope[taskScope]?.length > visiblePersonalTasks.length && (
            <button
              type="button"
              className="pd-view-more"
              onClick={() =>
                onNavigate(
                  visiblePersonalTasks[0]?._room || "calendar",
                )
              }
            >
              Ver las {tasksByScope[taskScope].length} tareas
              <Icon name="ArrowRight" size={15} />
            </button>
          )}
        </section>

        <aside className="pd-kpi-rail" aria-label="KPI personales">
          <div className="pd-kpi">
            <span className="pd-kpi-icon">
              <Icon name="CheckCircle2" size={19} />
            </span>
            <div>
              <p>Completadas</p>
              <strong>{completedThisMonth}</strong>
              <small>de {monthlyPersonalTasks.length} asignadas</small>
            </div>
          </div>
          <div className="pd-kpi">
            <span className="pd-kpi-icon">
              <Icon name="BarChart3" size={19} />
            </span>
            <div>
              <p>KPI individual</p>
              <strong>{individualKpi}%</strong>
              <small>
                {completionPercent}% avance ·{" "}
                {onTimePercent === null ? "N/D" : `${onTimePercent}%`} puntualidad
              </small>
            </div>
          </div>
          <div className={`pd-kpi ${overdueTasks.length > 0 ? "is-danger" : ""}`}>
            <span className="pd-kpi-icon">
              <Icon name="Timer" size={19} />
            </span>
            <div>
              <p>Vencidas</p>
              <strong>{overdueTasks.length}</strong>
              <small>
                {overdueTasks.length > 0
                  ? "necesitan atención"
                  : "sin tareas atrasadas"}
              </small>
            </div>
          </div>

          <div className="pd-next-task">
            <span className="pd-kpi-icon">
              <Icon name="CalendarDays" size={18} />
            </span>
            <div>
              <p>Próxima acción</p>
              {nextTask ? (
                <button
                  type="button"
                  onClick={() => onOpenTask(nextTask, nextTask._taskType)}
                >
                  <strong>{nextTask.title}</strong>
                  <small>
                    {clientNames.get(nextTask.clientId) || "Interno"} ·{" "}
                    {formatDueDate(nextTask)}
                  </small>
                </button>
              ) : (
                <strong>Sin pendientes</strong>
              )}
            </div>
          </div>
        </aside>
      </div>

      <div className="pd-insights">
        <section className="pd-weekly" aria-labelledby="pd-weekly-title">
          <div className="pd-insight-heading">
            <div>
              <h3 id="pd-weekly-title">Rendimiento semanal de la empresa</h3>
              <p>Cumplimiento de entregas de Accounts, Gestión y Edición</p>
            </div>
            <div
              className="pd-week-summary"
              aria-label={`${weeklySummary.completed} completadas de ${weeklySummary.assigned} asignadas; ${weeklySummary.rate}% de cumplimiento`}
            >
              <span>
                <strong>{weeklySummary.assigned}</strong>
                <small>Asignadas</small>
              </span>
              <span>
                <strong>{weeklySummary.completed}</strong>
                <small>Completadas</small>
              </span>
              <span className="is-primary">
                <strong>{weeklySummary.rate}%</strong>
                <small>Cumplimiento</small>
              </span>
            </div>
          </div>

          <div className="pd-chart-legend" aria-label="Leyenda">
            <span><i className="is-complete" />Completadas</span>
            <span><i />Asignadas</span>
          </div>

          {weeklySummary.assigned > 0 ? (
            <div className="pd-week-chart">
              {weeklySeries.map((item) => {
                const totalHeight = Math.round((item.total / weeklyMax) * 100);
                const completedHeight = Math.round(
                  (item.completed / weeklyMax) * 100,
                );
                return (
                  <div
                    key={item.date}
                    className={`pd-week-column ${item.isToday ? "is-today" : ""}`}
                    title={`${item.completed} de ${item.total} completadas`}
                  >
                    <span
                      className="pd-week-value"
                      aria-label={`${item.completed} completadas de ${item.total} asignadas`}
                    >
                      <strong>{item.completed}</strong>
                      <small>/{item.total}</small>
                    </span>
                    <div className="pd-week-bars">
                      <span
                        className="pd-week-total"
                        style={{ "--pd-height": `${totalHeight}%` }}
                      />
                      <span
                        className="pd-week-completed"
                        style={{ "--pd-height": `${completedHeight}%` }}
                      />
                    </div>
                    <strong>{item.weekday}</strong>
                    <small>{item.day}</small>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="pd-week-empty">
              <Icon name="BarChart3" size={22} />
              <div>
                <strong>Sin entregas esta semana</strong>
                <p>La gráfica aparecerá cuando existan tareas con fecha.</p>
              </div>
            </div>
          )}
        </section>

        <section className="pd-user-kpi" aria-labelledby="pd-user-kpi-title">
          <div className="pd-insight-heading">
            <div>
              <h3 id="pd-user-kpi-title">KPI por usuario</h3>
              <p>{dashboardPeriod.label} · avance 70% + puntualidad 30%</p>
            </div>
            <button
              type="button"
              className="pd-user-kpi-link"
              onClick={() => onNavigate("performance")}
            >
              Ver reporte
              <Icon name="ArrowRight" size={14} />
            </button>
          </div>

          {visibleUserKpis.length > 0 ? (
            <div className="pd-user-kpi-list">
              {visibleUserKpis.map((item) => (
                <article
                  key={item.id}
                  className={`pd-user-kpi-row ${item.isCurrent ? "is-current" : ""}`}
                  aria-label={`${item.name}: KPI ${item.score}%`}
                >
                  <span className="pd-user-kpi-rank">#{item.rank}</span>
                  <span className="pd-user-kpi-avatar">{item.initials}</span>
                  <span className="pd-user-kpi-identity">
                    <strong>
                      {item.name}
                      {item.isCurrent && <em>Tú</em>}
                    </strong>
                    <small>
                      {item.role} · {item.completed}/{item.assigned} completadas
                    </small>
                  </span>
                  <span className="pd-user-kpi-score">
                    <strong>{item.score}%</strong>
                    <small>
                      {item.onTimePercent === null
                        ? "Puntualidad N/D"
                        : `${item.onTimePercent}% puntualidad`}
                    </small>
                  </span>
                  <span className="pd-user-kpi-track" aria-hidden="true">
                    <i style={{ "--pd-kpi-score": `${item.score}%` }} />
                  </span>
                </article>
              ))}
            </div>
          ) : (
            <div className="pd-user-kpi-empty">
              <Icon name="Users" size={21} />
              <div>
                <strong>Sin KPI calculable</strong>
                <p>Asigna las tareas a usuarios para medir su rendimiento.</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

// Vista "Configuración" con la sección de Perfil (editar perfil propio).
export const ProfileSettingsView = ({
  profile,
  roleLabel,
  onSave,
  tasks = [],
  accountTasks = [],
  managementTasks = [],
  themePalette,
  isDark,
  onPaletteChange,
  onModeChange,
}) => {
  const todayStr = getHondurasTodayStr();
  const monthPeriod = getRankingMonthPeriod(todayStr);
  const personalTasks = buildPersonalTaskList({
    profile,
    tasks,
    accountTasks,
    managementTasks,
  });
  const monthlyTasks = personalTasks.filter((task) =>
    isDateWithinPeriod(task.date, monthPeriod),
  );
  const completedTasks = monthlyTasks.filter((task) => task._done);
  const openTasks = personalTasks.filter((task) => !task._done);
  const overdueTasks = openTasks.filter((task) =>
    isDateBeforeDateString(task.date, todayStr),
  );
  const completionRate = monthlyTasks.length
    ? Math.round((completedTasks.length / monthlyTasks.length) * 100)
    : 0;
  const profileFields = [
    profile?.name,
    profile?.email,
    profile?.profession,
    profile?.photo,
  ];
  const profileCompletion = Math.round(
    (profileFields.filter(Boolean).length / profileFields.length) * 100,
  );
  const activePalette =
    THEME_PALETTES.find((palette) => palette.id === themePalette) ||
    THEME_PALETTES[0];
  const workload = ["Accounts", "Gestión", "Edición"].map((area) => {
    const count = openTasks.filter((task) => task._area === area).length;
    return {
      area,
      count,
      share: openTasks.length ? Math.round((count / openTasks.length) * 100) : 0,
    };
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = Object.fromEntries(
      new FormData(event.currentTarget).entries(),
    );
    onSave({
      name: formData.name || "",
      profession: formData.profession || "",
      photo: formData.photo || "",
      themePalette,
      themeMode: isDark ? "dark" : "light",
    });
  };

  const displayName = profile?.name?.trim() || "Usuario";
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="profile-dashboard fade-in">
      {!profile?.id ? (
        <EmptyState icon="User" text="Inicia sesión para ver tu perfil." />
      ) : (
        <>
          <header className="profile-hero">
            <div className="profile-identity">
              <div className="profile-avatar">
                {profile.photo ? (
                  <img src={profile.photo} alt={`Foto de ${displayName}`} />
                ) : (
                  <span>{initials || "U"}</span>
                )}
              </div>
              <div>
                <p className="profile-kicker">Espacio personal</p>
                <h2>{displayName}</h2>
                <div className="profile-meta">
                  <span>
                    <Icon name="Briefcase" size={15} />
                    {profile.profession || roleLabel || "Equipo Cluster"}
                  </span>
                  <span>
                    <Icon name="Mail" size={15} />
                    {profile.email || "Sin correo"}
                  </span>
                </div>
              </div>
            </div>
            <div className="profile-completion">
              <div
                className="profile-completion-ring"
                style={{ "--profile-progress": `${profileCompletion * 3.6}deg` }}
              >
                <span>{profileCompletion}%</span>
              </div>
              <div>
                <strong>Perfil completo</strong>
                <small>
                  {profileCompletion === 100
                    ? "Tu identidad está lista"
                    : "Completa los datos pendientes"}
                </small>
              </div>
            </div>
          </header>

          <section className="profile-kpi-grid" aria-label="Rendimiento personal">
            {[
              {
                label: "Cumplimiento",
                value: `${completionRate}%`,
                note: monthPeriod.label,
                icon: "BarChart3",
              },
              {
                label: "Completadas",
                value: completedTasks.length,
                note: `${monthlyTasks.length} asignadas`,
                icon: "CheckCircle2",
              },
              {
                label: "Pendientes",
                value: openTasks.length,
                note: "en todas tus salas",
                icon: "ClipboardList",
              },
              {
                label: "Vencidas",
                value: overdueTasks.length,
                note: overdueTasks.length ? "requieren atención" : "todo al día",
                icon: "Timer",
                danger: overdueTasks.length > 0,
              },
            ].map((item) => (
              <article
                className={`profile-kpi ${item.danger ? "is-danger" : ""}`}
                key={item.label}
              >
                <span><Icon name={item.icon} size={18} /></span>
                <p>{item.label}</p>
                <strong>{item.value}</strong>
                <small>{item.note}</small>
              </article>
            ))}
          </section>

          <div className="profile-layout">
            <main className="profile-main-column">
              <section className="profile-panel profile-workload">
                <div className="profile-section-heading">
                  <div>
                    <p>Ritmo operativo</p>
                    <h3>Tu carga actual</h3>
                  </div>
                  <span>{openTasks.length} tareas abiertas</span>
                </div>
                <div className="profile-workload-list">
                  {workload.map((item) => (
                    <div key={item.area}>
                      <div>
                        <strong>{item.area}</strong>
                        <span>{item.count} pendientes · {item.share}%</span>
                      </div>
                      <span className="profile-workload-track">
                        <i style={{ "--profile-load": `${item.share}%` }} />
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <form onSubmit={handleSubmit} className="profile-panel profile-form">
                <div className="profile-section-heading">
                  <div>
                    <p>Identidad</p>
                    <h3>Información del perfil</h3>
                  </div>
                  <Icon name="UserCircle2" size={21} />
                </div>
                <PhotoUploader defaultValue={profile.photo} />
                <div className="profile-form-grid">
                  <Input
                    name="name"
                    label="Nombre"
                    placeholder="Tu nombre"
                    defaultValue={profile.name}
                    required
                  />
                  <Input
                    name="profession"
                    label="Profesión / Cargo"
                    placeholder="Ej. Director de agencia"
                    defaultValue={profile.profession}
                  />
                </div>
                <div className="profile-readonly-grid">
                  <div>
                    <span>Correo de acceso</span>
                    <strong>
                      <Icon name="Mail" size={15} />
                      {profile.email || "—"}
                    </strong>
                  </div>
                  <div>
                    <span>Rol en el equipo</span>
                    <strong>
                      <Icon name="ShieldCheck" size={15} />
                      {roleLabel || "—"}
                    </strong>
                  </div>
                </div>
                <Button type="submit" full color="purple" icon="Save">
                  Guardar perfil y preferencias
                </Button>
              </form>
            </main>

            <aside className="profile-side-column">
              <section className="profile-panel profile-theme-studio">
                <div className="profile-section-heading">
                  <div>
                    <p>Apariencia</p>
                    <h3>Hazlo tuyo</h3>
                  </div>
                  <Icon name="Sparkles" size={21} />
                </div>
                <p className="profile-theme-description">
                  Combina una paleta con el modo que mejor se adapte a tu espacio.
                </p>
                <div className="profile-mode-switch" aria-label="Modo de color">
                  <button
                    type="button"
                    className={!isDark ? "is-active" : ""}
                    aria-pressed={!isDark}
                    onClick={() => onModeChange("light")}
                  >
                    <Icon name="Sun" size={16} />
                    Claro
                  </button>
                  <button
                    type="button"
                    className={isDark ? "is-active" : ""}
                    aria-pressed={isDark}
                    onClick={() => onModeChange("dark")}
                  >
                    <Icon name="Moon" size={16} />
                    Oscuro
                  </button>
                </div>
                <div className="profile-palette-grid">
                  {THEME_PALETTES.map((palette) => {
                    const colors = isDark
                      ? palette.darkSwatches
                      : palette.swatches;
                    return (
                      <button
                        type="button"
                        key={palette.id}
                        className={themePalette === palette.id ? "is-active" : ""}
                        aria-pressed={themePalette === palette.id}
                        onClick={() => onPaletteChange(palette.id)}
                      >
                        <span className="profile-palette-preview">
                          {colors.map((color) => (
                            <i key={color} style={{ backgroundColor: color }} />
                          ))}
                        </span>
                        <span>
                          <strong>{palette.name}</strong>
                          <small>{palette.description}</small>
                        </span>
                        {themePalette === palette.id && (
                          <Icon name="CheckCircle2" size={17} />
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="profile-theme-current">
                  <span style={{ background: "var(--primary)" }} />
                  <div>
                    <small>Selección actual</small>
                    <strong>
                      {activePalette.name} · {isDark ? "Oscuro" : "Claro"}
                    </strong>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </>
      )}
    </div>
  );
};

