import React, { useMemo, useState } from "react";
import { Icon } from "../icons.jsx";
import {
  compareDateOnlyStrings,
  getHondurasTodayStr,
  getDateOnlyDiffDays,
} from "../../utils/date.js";
import {
  isEditingDelivered,
  isEditingActionable,
  normalizeEditingWorkflowStatus,
} from "../../utils/kpi.js";
import {
  buildManagerRankingStats,
  DEFAULT_RANKING_SETTINGS,
} from "../../utils/ranking.js";

export const PerformanceView = ({
  accountTasks = [],
  editingTasks = [],
  editors = [],
  managers = [],
  users = [],
  clients = [],
  rankingSettings = DEFAULT_RANKING_SETTINGS,
}) => {
  const todayStr = getHondurasTodayStr();
  const now = new Date();
  const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const [fromDate, setFromDate] = useState(firstOfMonth);
  const [toDate, setToDate] = useState(todayStr);
  const [searchTerm, setSearchTerm] = useState("");
  const [personGroupFilter, setPersonGroupFilter] = useState("all");

  const rankingPeriod = useMemo(
    () => ({ start: fromDate, end: toDate }),
    [fromDate, toDate],
  );

  const inRange = (dateStr) => {
    if (!dateStr) return false;
    return (
      compareDateOnlyStrings(dateStr, fromDate) >= 0 &&
      compareDateOnlyStrings(dateStr, toDate) <= 0
    );
  };

  const filteredEditingTasks = editingTasks.filter((task) => inRange(task.date));
  const filteredAccountTasks = accountTasks.filter((task) => inRange(task.date));

  const managerRankingById = useMemo(() => {
    const rows = buildManagerRankingStats({
      managers,
      users,
      clients,
      accountTasks,
      rankingSettings,
      rankingPeriod,
    });
    return new Map(rows.map((row) => [row.id, row]));
  }, [managers, users, clients, accountTasks, rankingSettings, rankingPeriod]);

  const userById = new Map(users.map((item) => [item.id, item]));
  const userByEditorId = new Map(
    users
      .filter((item) => item.linkedEditorId)
      .map((item) => [item.linkedEditorId, item]),
  );
  const userByManagerId = new Map(
    users
      .filter((item) => item.linkedManagerId)
      .map((item) => [item.linkedManagerId, item]),
  );

  const getPersonLoginRecency = (personType, personId, personUserId = "") => {
    const personUser =
      personType === "editor"
        ? userByEditorId.get(personId) ||
          (personUserId ? userById.get(personUserId) : null)
        : userByManagerId.get(personId) ||
          (personUserId ? userById.get(personUserId) : null);
    const lastSeenAt = personUser?.lastSeenAt || "";
    const daysSinceLogin = lastSeenAt
      ? Math.max(0, getDateOnlyDiffDays(todayStr, lastSeenAt))
      : null;
    return {
      lastSeenAt,
      daysSinceLogin,
    };
  };

  const isEditingDeliveredTask = (task) => isEditingDelivered(task);
  const isAccountDelivered = (task) =>
    ["aprobado_internamente", "publicado"].includes(task.status);

  const editorStats = editors
    .map((editor) => {
      const editorTasks = filteredEditingTasks.filter(
        (task) => task.contextId === editor.id,
      );
      const delivered = editorTasks.filter(isEditingDeliveredTask).length;
      const approved = editorTasks.filter(
        (task) => normalizeEditingWorkflowStatus(task.status) === "aprobado",
      ).length;
      const published = editorTasks.filter(
        (task) => task.status === "publicado",
      ).length;
      const inRevision = editorTasks.filter(
        (task) =>
          normalizeEditingWorkflowStatus(task.status) === "revision_interna",
      ).length;
      const inProgress = editorTasks.filter(isEditingActionable).length;
      const total = editorTasks.length;
      const deliveryPerformance = total
        ? Math.round((delivered / total) * 100)
        : 0;
      const approvalPerformance = total
        ? Math.round((approved / total) * 100)
        : 0;
      const publicationPerformance = total
        ? Math.round((published / total) * 100)
        : 0;
      const loginRecency = getPersonLoginRecency(
        "editor",
        editor.id,
        editor.userId,
      );
      const loginScore =
        loginRecency.daysSinceLogin === null
          ? 0
          : Math.max(0, 100 - Math.min(loginRecency.daysSinceLogin, 30) * 2);
      const overallPerformance = total
        ? Math.round(
            publicationPerformance * 0.6 +
              approvalPerformance * 0.2 +
              deliveryPerformance * 0.15 +
              loginScore * 0.05,
          )
        : 0;
      return {
        ...editor,
        kind: "editor",
        kindLabel: "Editor",
        total,
        delivered,
        approved,
        published,
        inRevision,
        inProgress,
        pending: Math.max(total - delivered, 0),
        deliveryPerformance,
        approvalPerformance,
        publicationPerformance,
        overallPerformance,
        scoreSource: "editor-formula",
        lastSeenAt: loginRecency.lastSeenAt,
        daysSinceLogin: loginRecency.daysSinceLogin,
      };
    })
    .filter((editor) => editor.total > 0);

  const managerStats = managers
    .map((manager) => {
      const managerTasks = filteredAccountTasks.filter(
        (task) => task.contextId === manager.id,
      );
      const delivered = managerTasks.filter(isAccountDelivered).length;
      const published = managerTasks.filter(
        (task) => task.status === "publicado",
      ).length;
      const inProgress = managerTasks.filter(
        (task) => !["aprobado_internamente", "publicado"].includes(task.status),
      ).length;
      const total = managerTasks.length;
      const deliveryPerformance = total
        ? Math.round((delivered / total) * 100)
        : 0;
      const publicationPerformance = total
        ? Math.round((published / total) * 100)
        : 0;
      const loginRecency = getPersonLoginRecency(
        "manager",
        manager.id,
        manager.userId,
      );
      const ranked = managerRankingById.get(manager.id);
      const overallPerformance =
        ranked && total > 0
          ? ranked.score
          : total
            ? Math.round(
                publicationPerformance * 0.6 + deliveryPerformance * 0.4,
              )
            : 0;
      return {
        ...manager,
        kind: "manager",
        kindLabel: "Account Manager",
        total,
        delivered,
        published,
        inProgress,
        pending: Math.max(total - delivered, 0),
        deliveryPerformance,
        approvalPerformance: ranked?.completionPercent || 0,
        publicationPerformance,
        overallPerformance,
        scoreSource: ranked ? "ranking-settings" : "fallback",
        efficiencyPercent: ranked?.efficiencyPercent || 0,
        lastSeenAt: loginRecency.lastSeenAt,
        daysSinceLogin: loginRecency.daysSinceLogin,
      };
    })
    .filter((manager) => manager.total > 0);

  const personStats = [...editorStats, ...managerStats].sort(
    (left, right) =>
      right.overallPerformance - left.overallPerformance ||
      right.total - left.total ||
      String(left.name || "").localeCompare(String(right.name || "")),
  );

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const visiblePersonStats = useMemo(() => {
    let filtered = [...personStats];
    if (personGroupFilter !== "all") {
      filtered = filtered.filter((person) =>
        personGroupFilter === "editors"
          ? person.kind === "editor"
          : person.kind === "manager",
      );
    }
    if (!normalizedSearch) return filtered;
    return filtered.filter((person) =>
      String(person.name || "").toLowerCase().includes(normalizedSearch),
    );
  }, [normalizedSearch, personGroupFilter, personStats]);

  const totalTasks = filteredEditingTasks.length + filteredAccountTasks.length;
  const deliveredTasks =
    filteredEditingTasks.filter(isEditingDeliveredTask).length +
    filteredAccountTasks.filter(isAccountDelivered).length;
  const publishedTasks =
    filteredEditingTasks.filter((task) => task.status === "publicado").length +
    filteredAccountTasks.filter((task) => task.status === "publicado").length;
  const averagePerformance = visiblePersonStats.length
    ? Math.round(
        visiblePersonStats.reduce(
          (sum, person) => sum + person.overallPerformance,
          0,
        ) / visiblePersonStats.length,
      )
    : 0;
  const deliveryRate = totalTasks
    ? Math.round((deliveredTasks / totalTasks) * 100)
    : 0;
  const peopleNeedingAttention = visiblePersonStats.filter(
    (person) => person.overallPerformance < 60 || person.pending > 0,
  ).length;
  const groupLabel =
    personGroupFilter === "editors"
      ? "Editores"
      : personGroupFilter === "managers"
        ? "Community Managers"
        : "Todo el equipo";
  const usesRankingRules = visiblePersonStats.some(
    (person) => person.scoreSource === "ranking-settings",
  );

  return (
    <section className="performance-dashboard fade-in">
      <header className="performance-header">
        <div className="performance-heading">
          <p className="eyebrow">Editores y Community Managers</p>
          <h2>Rendimiento del equipo</h2>
          <p>
            Entregas, publicaciones y carga pendiente en una sola lectura.
          </p>
        </div>

        <div className="performance-period" aria-label="Rango del reporte">
          <label>
            <span>Desde</span>
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
            />
          </label>
          <span aria-hidden="true">→</span>
          <label>
            <span>Hasta</span>
            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
            />
          </label>
        </div>
      </header>

      <section
        className="performance-overview"
        aria-label="Resumen de rendimiento"
      >
        <div className="performance-primary-metric">
          <p>KPI promedio</p>
          <strong>{averagePerformance}%</strong>
          <span>
            {groupLabel} · {visiblePersonStats.length} personas
          </span>
          <small>
            {usesRankingRules
              ? "Account Managers usan reglas de ranking · Editores usan fórmula de entrega"
              : "Publicación 60% · aprobación 20% · entrega 15% · actividad 5%"}
          </small>
        </div>

        <dl className="performance-metric-list">
          <div>
            <dt>Entregadas</dt>
            <dd>
              {deliveredTasks}
              <span>/{totalTasks}</span>
            </dd>
            <small>{deliveryRate}% del periodo</small>
          </div>
          <div>
            <dt>Publicadas</dt>
            <dd>{publishedTasks}</dd>
            <small>en el rango</small>
          </div>
          <div>
            <dt>Requieren atención</dt>
            <dd>{peopleNeedingAttention}</dd>
            <small>KPI bajo o pendientes</small>
          </div>
        </dl>
      </section>

      <div className="performance-toolbar">
        <div
          className="performance-group-filter"
          role="tablist"
          aria-label="Filtrar por función"
        >
          {[
            { id: "all", label: "Todos" },
            { id: "editors", label: "Editores" },
            { id: "managers", label: "Community Managers" },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={personGroupFilter === option.id}
              className={personGroupFilter === option.id ? "is-active" : ""}
              onClick={() => setPersonGroupFilter(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="performance-search-wrap">
          <label className="performance-search">
            <Icon name="Search" size={16} />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar persona"
              aria-label="Buscar persona"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Limpiar búsqueda"
              >
                <Icon name="X" size={14} />
              </button>
            )}
          </label>
          {(searchTerm || personGroupFilter !== "all") && (
            <button
              type="button"
              className="performance-reset"
              onClick={() => {
                setSearchTerm("");
                setPersonGroupFilter("all");
              }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      <section
        className="performance-ranking"
        aria-labelledby="performance-ranking-title"
      >
        <header className="performance-ranking-header">
          <div>
            <h3 id="performance-ranking-title">Equipo</h3>
            <p>
              Ordenado por KPI. Lo pendiente queda visible sin abrir otra vista.
            </p>
          </div>
          <span>{visiblePersonStats.length} resultados</span>
        </header>

        {visiblePersonStats.length === 0 ? (
          <div className="performance-empty">
            <span>
              <Icon name="Users" size={20} />
            </span>
            <div>
              <strong>Sin resultados</strong>
              <p>Ajusta la búsqueda, el equipo o el rango de fechas.</p>
            </div>
          </div>
        ) : (
          <div className="performance-person-list">
            <div className="performance-column-head" aria-hidden="true">
              <span />
              <span>Persona</span>
              <span>KPI</span>
              <span>Publicadas</span>
              <span>Pendientes</span>
              <span>Actividad</span>
            </div>

            {visiblePersonStats.map((person, index) => {
              const initials = String(person.name || "Usuario")
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0])
                .join("")
                .toUpperCase();
              const activityLabel =
                person.daysSinceLogin === null
                  ? "Sin registro"
                  : person.daysSinceLogin === 0
                    ? "Hoy"
                    : person.daysSinceLogin === 1
                      ? "Ayer"
                      : `${person.daysSinceLogin} días`;
              const scoreTone =
                person.overallPerformance >= 80
                  ? "is-strong"
                  : person.overallPerformance >= 60
                    ? "is-steady"
                    : "is-attention";
              const kpiDetail =
                person.scoreSource === "ranking-settings"
                  ? `${person.efficiencyPercent || 0}% eficiencia`
                  : `${person.deliveryPerformance}% entregado`;

              return (
                <article
                  key={`${person.kind}-${person.id}`}
                  className={`performance-person-row ${index === 0 ? "is-leading" : ""}`}
                  aria-label={`${person.name}: KPI ${person.overallPerformance}%`}
                >
                  <span className="performance-rank">#{index + 1}</span>

                  <div className="performance-person">
                    <span className="performance-avatar" aria-hidden="true">
                      {initials}
                    </span>
                    <span>
                      <strong>{person.name}</strong>
                      <small>{person.kindLabel}</small>
                    </span>
                  </div>

                  <div className={`performance-person-kpi ${scoreTone}`}>
                    <span>
                      <strong>{person.overallPerformance}%</strong>
                      <small>{kpiDetail}</small>
                    </span>
                    <span className="performance-kpi-track" aria-hidden="true">
                      <span
                        style={{ width: `${person.overallPerformance}%` }}
                      />
                    </span>
                  </div>

                  <div className="performance-person-output">
                    <strong>
                      {person.published}
                      <span>/{person.total}</span>
                    </strong>
                    <small>publicadas</small>
                  </div>

                  <div
                    className={`performance-person-pending ${person.pending > 0 ? "has-pending" : ""}`}
                  >
                    <strong>{person.pending}</strong>
                    <small>sin entregar</small>
                  </div>

                  <div className="performance-person-activity">
                    <strong>{activityLabel}</strong>
                    <small>último acceso</small>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
};
