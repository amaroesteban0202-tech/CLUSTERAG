import React, { useEffect, useMemo, useState } from "react";
import { Icon } from "./icons.jsx";
import {
  Breadcrumb,
  Button,
  EmptyState,
  SearchBar,
  StatCard,
  ViewTabs,
} from "./ui.jsx";
import { PersonAvatar, getClientStatus, buildAssignee } from "./kanban.jsx";
import { CLIENT_STATUSES, PILL_TONES } from "../constants/ui-tones.js";
import {
  ACCOUNT_COLORS,
  EDITOR_COLORS,
  LEGACY_COLOR_MAP,
  PERSON_COLORS,
  ROLE_DEFINITIONS,
} from "../constants/app.constants.js";
import { normalizeEmail } from "../utils/text.js";
import { userHasPermission, getRoleMeta } from "../utils/permissions.js";
import {
  compareDateOnlyStrings,
  getHondurasTodayStr,
} from "../utils/date.js";
import {
  DEFAULT_RANKING_SETTINGS,
  sanitizeRankingSettings,
  toConfigNumber,
} from "../utils/ranking.js";
import {
  getVerificationMeta,
  getLinkedProfileLabels,
} from "../utils/directory-users.js";

export const TeamView = ({
  title,
  team,
  iconColor,
  onAdd,
  onSelect,
  onDelete,
  onEdit,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const filteredTeam = team.filter(
    (person) =>
      person.isActive !== false &&
      person.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white">
          {title}
        </h2>
        <div className="flex flex-col md:flex-row w-full md:w-auto gap-3">
          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            placeholder="Buscar miembro..."
          />
          <Button onClick={onAdd} icon="UserPlus" color={iconColor}>
            Agregar a {title}
          </Button>
        </div>
      </div>
      {filteredTeam.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 h-64">
          <EmptyState icon="Users" text="No hay miembros en este equipo aún." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeam.map((person) => {
            let mappedColorName =
              LEGACY_COLOR_MAP[person.color] || person.color || "slate";
            const style = PERSON_COLORS[mappedColorName] || PERSON_COLORS.slate;
            return (
              <div
                key={person.id}
                onClick={() => onSelect(person)}
                className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer group relative"
              >
                <div className="absolute top-4 right-4 flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(person);
                    }}
                    aria-label={`Editar ${person.name || "miembro"}`}
                    title="Editar"
                    className="text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 p-3 md:p-2 bg-slate-50 dark:bg-slate-800 rounded-full hover:bg-blue-50 dark:hover:bg-slate-700"
                  >
                    <Icon name="Edit" size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(person);
                    }}
                    aria-label={`Eliminar ${person.name || "miembro"}`}
                    title="Eliminar"
                    className="text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 p-3 md:p-2 bg-slate-50 dark:bg-slate-800 rounded-full hover:bg-red-50 dark:hover:bg-slate-700"
                  >
                    <Icon name="Trash2" size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  {person.photo ? (
                    <img
                      src={person.photo}
                      alt={person.name}
                      className="h-14 w-14 rounded-xl object-cover shadow-sm border border-black/5 dark:border-white/5 shrink-0"
                    />
                  ) : (
                    <div
                      className={`h-14 w-14 ${style.bg} rounded-xl flex items-center justify-center text-2xl font-black ${style.text} shadow-sm border border-black/5 dark:border-white/5 shrink-0`}
                    >
                      {person.name ? person.name.charAt(0).toUpperCase() : "?"}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white pr-16 md:pr-12 truncate">
                      {person.name}
                    </h3>
                    {person.profession && (
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">
                        {person.profession}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {person.email || "Miembro del equipo"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const PersonCalendarDetail = ({
  person,
  tasks,
  title,
  baseColor,
  onBack,
  onAddEvent,
  onEventClick,
}) => {
  let mappedColorName = LEGACY_COLOR_MAP[baseColor] || baseColor;
  const style = PERSON_COLORS[mappedColorName] || PERSON_COLORS.slate;
  const parentLabel = title.includes("Cuentas")
    ? "Account Managers"
    : "Editores";
  return (
    <div className="h-full flex flex-col space-y-6 fade-in">
      <Breadcrumb
        items={[
          { label: parentLabel, onClick: onBack },
          { label: person.name || "Detalle" },
        ]}
      />
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <button
          onClick={onBack}
          aria-label={`Volver a ${parentLabel}`}
          className="p-3 md:p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300"
        >
          <Icon name="ChevronLeft" />
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-sm border border-black/5 dark:border-white/5 ${style.bg} ${style.text}`}
            >
              {person.name ? person.name.charAt(0).toUpperCase() : "?"}
            </div>
            {person.name}
          </h2>
          <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
            {title}
          </span>
        </div>
      </div>
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
        <CalendarGrid
          events={tasks.filter((t) => t.contextId === person.id)}
          baseColor={mappedColorName}
          onAdd={onAddEvent}
          onEventClick={onEventClick}
        />
      </div>
    </div>
  );
};

export const RankingNumberField = ({ label, value, onChange, min, max, step = 1 }) => (
  <label className="block min-w-0">
    <span className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 mb-1">
      {label}
    </span>
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(event) => onChange(toConfigNumber(event.target.value, 0))}
      className="w-full min-h-[42px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
    />
  </label>
);

export const RankingRulesPanel = ({ rankingSettings, currentUserProfile, onSave }) => {
  const [draft, setDraft] = useState(() =>
    sanitizeRankingSettings(rankingSettings),
  );
  const [saving, setSaving] = useState(false);
  const canEdit = userHasPermission(
    currentUserProfile,
    "manage_ranking_settings",
  );

  useEffect(() => {
    setDraft(sanitizeRankingSettings(rankingSettings));
  }, [rankingSettings]);

  if (!canEdit) return null;

  const updateManagerValue = (key, value) =>
    setDraft((current) => ({
      ...current,
      manager: { ...current.manager, [key]: value },
    }));
  const updateManagerMapValue = (group, key, value) =>
    setDraft((current) => ({
      ...current,
      manager: {
        ...current.manager,
        [group]: { ...current.manager[group], [key]: value },
      },
    }));
  const updateEditingValue = (key, value) =>
    setDraft((current) => ({
      ...current,
      editing: { ...current.editing, [key]: value },
    }));
  const updateEditingMapValue = (group, key, value) =>
    setDraft((current) => ({
      ...current,
      editing: {
        ...current.editing,
        [group]: { ...current.editing[group], [key]: value },
      },
    }));

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(sanitizeRankingSettings(draft));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Icon name="Trophy" size={18} className="text-yellow-500" /> Reglas
            de ranking
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Pesos activos para productividad, tiempos, planificacion e ideas.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() =>
              setDraft(sanitizeRankingSettings(DEFAULT_RANKING_SETTINGS))
            }
            className="min-h-[42px] rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Defaults
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="min-h-[42px] rounded-xl bg-purple-600 px-4 text-sm font-black text-white hover:bg-purple-700 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <Icon
              name={saving ? "Loader2" : "Save"}
              size={15}
              className={saving ? "animate-spin" : ""}
            />
            Guardar reglas
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/60 dark:bg-slate-950/40">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">
            Entregas
          </p>
          <div className="grid grid-cols-2 gap-3">
            {Object.keys(draft.manager.taskPoints).map((key) => (
              <RankingNumberField
                key={key}
                label={key.toUpperCase()}
                value={draft.manager.taskPoints[key]}
                onChange={(value) =>
                  updateManagerMapValue("taskPoints", key, value)
                }
              />
            ))}
            <RankingNumberField
              label="Publicado"
              value={draft.manager.publishedBonus}
              onChange={(value) => updateManagerValue("publishedBonus", value)}
            />
            <RankingNumberField
              label="Cumplimiento"
              value={draft.manager.workflowStepPoints}
              onChange={(value) =>
                updateManagerValue("workflowStepPoints", value)
              }
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/60 dark:bg-slate-950/40">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">
            Tiempos
          </p>
          <div className="grid grid-cols-2 gap-3">
            <RankingNumberField
              label="A tiempo"
              value={draft.manager.onTimeBonus}
              onChange={(value) => updateManagerValue("onTimeBonus", value)}
            />
            <RankingNumberField
              label="Temprano"
              value={draft.manager.earlyDeliveryBonus}
              onChange={(value) =>
                updateManagerValue("earlyDeliveryBonus", value)
              }
            />
            <RankingNumberField
              label="Hora temprana"
              value={draft.manager.earlyDeliveryCutoffHour}
              min={0}
              max={23}
              onChange={(value) =>
                updateManagerValue("earlyDeliveryCutoffHour", value)
              }
            />
            <RankingNumberField
              label="Atraso"
              value={draft.manager.overduePenalty}
              onChange={(value) => updateManagerValue("overduePenalty", value)}
            />
            <RankingNumberField
              label="Horas rapidas"
              value={draft.manager.fastTurnaroundHours}
              min={0}
              onChange={(value) =>
                updateManagerValue("fastTurnaroundHours", value)
              }
            />
            <RankingNumberField
              label="Rapidez"
              value={draft.manager.fastTurnaroundBonus}
              onChange={(value) =>
                updateManagerValue("fastTurnaroundBonus", value)
              }
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/60 dark:bg-slate-950/40">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">
            Lote temprano
          </p>
          <div className="grid grid-cols-2 gap-3">
            <RankingNumberField
              label="Cuentas"
              value={draft.manager.batchDifferentClientCount}
              min={1}
              onChange={(value) =>
                updateManagerValue("batchDifferentClientCount", value)
              }
            />
            <RankingNumberField
              label="Entregas"
              value={draft.manager.batchEarlyCompletedCount}
              min={1}
              onChange={(value) =>
                updateManagerValue("batchEarlyCompletedCount", value)
              }
            />
            <RankingNumberField
              label="Bonus lote"
              value={draft.manager.batchEarlyBonus}
              onChange={(value) => updateManagerValue("batchEarlyBonus", value)}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/60 dark:bg-slate-950/40">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">
            Planificacion
          </p>
          <div className="grid grid-cols-2 gap-3">
            <RankingNumberField
              label="Dias antes"
              value={draft.manager.planningLeadDays}
              min={0}
              onChange={(value) =>
                updateManagerValue("planningLeadDays", value)
              }
            />
            <RankingNumberField
              label="Puntos"
              value={draft.manager.planningTaskPoints}
              onChange={(value) =>
                updateManagerValue("planningTaskPoints", value)
              }
            />
            <RankingNumberField
              label="Max"
              value={draft.manager.planningMaxPoints}
              min={0}
              onChange={(value) =>
                updateManagerValue("planningMaxPoints", value)
              }
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/60 dark:bg-slate-950/40">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">
            Ideas
          </p>
          <div className="grid grid-cols-2 gap-3">
            <RankingNumberField
              label="Puntos"
              value={draft.manager.creativityKeywordPoints}
              onChange={(value) =>
                updateManagerValue("creativityKeywordPoints", value)
              }
            />
            <RankingNumberField
              label="Max"
              value={draft.manager.creativityMaxPoints}
              min={0}
              onChange={(value) =>
                updateManagerValue("creativityMaxPoints", value)
              }
            />
          </div>
          <label className="mt-3 block">
            <span className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 mb-1">
              Palabras clave
            </span>
            <textarea
              value={draft.manager.creativityKeywords}
              onChange={(event) =>
                updateManagerValue("creativityKeywords", event.target.value)
              }
              className="w-full min-h-[86px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </label>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/60 dark:bg-slate-950/40">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">
            Sala de Edicion
          </p>
          <div className="grid grid-cols-2 gap-3">
            {Object.keys(draft.editing.hierarchyScores).map((key) => (
              <RankingNumberField
                key={`h-${key}`}
                label={key.toUpperCase()}
                value={draft.editing.hierarchyScores[key]}
                onChange={(value) =>
                  updateEditingMapValue("hierarchyScores", key, value)
                }
              />
            ))}
            {Object.keys(draft.editing.priorityScores).map((key) => (
              <RankingNumberField
                key={`p-${key}`}
                label={key}
                value={draft.editing.priorityScores[key]}
                onChange={(value) =>
                  updateEditingMapValue("priorityScores", key, value)
                }
              />
            ))}
            <RankingNumberField
              label="Edicion temprano"
              value={draft.editing.earlyDeliveryBonus}
              onChange={(value) =>
                updateEditingValue("earlyDeliveryBonus", value)
              }
            />
            <RankingNumberField
              label="Hora temprana"
              value={draft.editing.earlyDeliveryCutoffHour}
              min={0}
              max={23}
              onChange={(value) =>
                updateEditingValue("earlyDeliveryCutoffHour", value)
              }
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export const UsersAccessView = ({
  users,
  managers,
  editors,
  auditLogs,
  currentUserProfile,
  onAdd,
  onEdit,
  onResendVerification,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const filteredUsers = users.filter((item) =>
    `${item.name || ""} ${item.email || ""} ${item.role || ""}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );
  const verifiedUsers = users.filter(
    (item) => getVerificationMeta(item).isVerified,
  ).length;
  const pendingVerificationUsers = users.filter(
    (item) =>
      normalizeEmail(item.email) && !getVerificationMeta(item).isVerified,
  ).length;

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white">
            Usuarios y Accesos
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Permisos por rol, accesos por correo y bitacora de actividad.
          </p>
        </div>
        <div className="flex flex-col md:flex-row w-full md:w-auto gap-3">
          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            placeholder="Buscar usuario..."
          />
          <Button onClick={onAdd} color="purple" icon="UserPlus">
            Nuevo Usuario
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Usuarios Activos"
          value={users.filter((item) => item.isActive !== false).length}
          icon="Users"
          color="purple"
        />
        <StatCard
          title="Correos Verificados"
          value={verifiedUsers}
          icon="ShieldCheck"
          color="emerald"
        />
        <StatCard
          title="Pendientes Verificar"
          value={pendingVerificationUsers}
          icon="Mail"
          color="amber"
        />
        <StatCard
          title="Admins"
          value={
            users.filter(
              (item) =>
                item.isActive !== false &&
                ["super_admin", "operations"].includes(item.role),
            ).length
          }
          icon="ClipboardList"
          color="indigo"
        />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[1.05fr,1.3fr] gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-slate-800 dark:text-white">
              Directorio
            </h3>
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              {getRoleMeta(currentUserProfile?.role).label}
            </span>
          </div>
          <div className="space-y-3 max-h-[540px] overflow-y-auto custom-scroll pr-2">
            {filteredUsers.length === 0 ? (
              <EmptyState
                icon="Users"
                text="No hay usuarios para este filtro."
              />
            ) : (
              filteredUsers.map((record) => {
                const verificationMeta = getVerificationMeta(record);
                const linkedManager = managers.find(
                  (item) => item.id === record.linkedManagerId,
                );
                const linkedEditor = editors.find(
                  (item) => item.id === record.linkedEditorId,
                );
                const linkedLabels = getLinkedProfileLabels(record);

                return (
                  <div
                    key={record.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-start gap-4"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black ${record.isActive === false ? "bg-red-500" : "bg-slate-900 dark:bg-slate-700"}`}
                    >
                      {(record.name || "??").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-2 items-center">
                        <p className="font-bold text-slate-800 dark:text-white truncate">
                          {record.name}
                        </p>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300">
                          {getRoleMeta(record.role).label}
                        </span>
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${
                            verificationMeta.color === "emerald"
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                              : verificationMeta.color === "amber"
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                                : verificationMeta.color === "red"
                                  ? "bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400"
                                  : verificationMeta.color === "blue"
                                    ? "bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
                                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {verificationMeta.label}
                        </span>
                        {record.isActive === false && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400">
                            Inactivo
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-2">
                        {record.email || "Correo pendiente"}
                      </p>
                      {record.emailVerification?.lastError && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1 break-words">
                          {record.emailVerification.lastError}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Ultimo acceso: {record.lastSeenAt || "Sin registro"}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {linkedLabels.map((label) => (
                          <span
                            key={`${record.id}-${label}`}
                            className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-violet-50 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"
                          >
                            {label}
                          </span>
                        ))}
                        {linkedManager && (
                          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                            AM: {linkedManager.name}
                          </span>
                        )}
                        {linkedEditor && (
                          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
                            ED: {linkedEditor.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {normalizeEmail(record.email) &&
                        !verificationMeta.isVerified && (
                          <button
                            onClick={() => onResendVerification(record)}
                            className="p-2 text-slate-500 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Reenviar acceso por correo"
                          >
                            <Icon name="Mail" size={18} />
                          </button>
                        )}
                      <button
                        onClick={() => onEdit(record)}
                        className="p-2 text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Editar usuario"
                      >
                        <Icon name="Edit" size={18} />
                      </button>
                      </div>
                    </div>
                );
              })
            )}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-slate-800 dark:text-white">
              Bitacora de Acciones
            </h3>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {auditLogs.length} registros
            </span>
          </div>
          <div className="space-y-3 max-h-[540px] overflow-y-auto custom-scroll pr-2">
            {auditLogs.length === 0 ? (
              <EmptyState
                icon="ClipboardList"
                text="Aun no hay actividad registrada."
              />
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                        {log.description || `${log.action} · ${log.entityType}`}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300">
                          {log.action}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
                          {log.entityType}
                        </span>
                        {log.status === "error" && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400">
                            Error
                          </span>
                        )}
                        {log.status === "denied" && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                            Denegado
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {log.actor?.name || "Sistema"}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {log.createdAt || ""}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Selector de Account Manager con avatares (foto o iniciales).
export const ManagerPicker = ({
  managers = [],
  value = "",
  onChange,
  legacyColorMap = {},
  buttonClassName = "",
  align = "left",
  placeholder = "Sin asignar",
}) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 240 });
  const [q, setQ] = useState("");
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

  const current = managers.find((m) => m.id === value) || null;

  const toggle = (e) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const width = Math.max(240, r.width);
      let left = align === "right" ? r.right - width : r.left;
      if (left + width > window.innerWidth - 8)
        left = window.innerWidth - width - 8;
      if (left < 8) left = 8;
      setCoords({ top: r.bottom + 6, left, width });
      setQ("");
    }
    setOpen((o) => !o);
  };

  const pick = (e, id) => {
    e.stopPropagation();
    setOpen(false);
    if (id !== value) onChange?.(id);
  };

  const filtered = q
    ? managers.filter((m) =>
        (m.name || "").toLowerCase().includes(q.toLowerCase()),
      )
    : managers;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={buttonClassName}
      >
        <PersonAvatar person={current} size={22} legacyColorMap={legacyColorMap} />
        <span className="truncate">{current ? current.name : placeholder}</span>
        <Icon name="ChevronDown" size={14} className="shrink-0 opacity-60" />
      </button>
      {open && (
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            top: coords.top,
            left: coords.left,
            width: coords.width,
            zIndex: 9999,
          }}
          className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl shadow-black/10 dark:shadow-black/50 overflow-hidden fade-in"
        >
          {managers.length > 6 && (
            <div className="p-2 border-b border-slate-100 dark:border-slate-800">
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar manager..."
                className="w-full text-sm px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 outline-none text-slate-700 dark:text-slate-200"
              />
            </div>
          )}
          <div className="max-h-60 overflow-y-auto custom-scroll py-1">
            <button
              type="button"
              onClick={(e) => pick(e, "")}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13px] font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <PersonAvatar person={null} size={22} /> Sin asignar
            </button>
            {filtered.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={(e) => pick(e, m.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13px] font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 ${m.id === value ? "text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-200"}`}
              >
                <PersonAvatar
                  person={m}
                  size={22}
                  legacyColorMap={legacyColorMap}
                />
                <span className="truncate flex-1">{m.name}</span>
                {m.id === value && (
                  <Icon name="Check" size={15} className="shrink-0" />
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-3 text-xs text-slate-400 text-center">
                Sin resultados
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export const ClientsView = ({
  clients,
  managers = [],
  legacyColorMap = {},
  onAdd,
  onSelect,
  onReassignManager,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const statusFilters = [
    { id: "all", label: "Todos" },
    { id: "Activo", label: "Activos" },
    { id: "Pausado", label: "Pausados" },
    { id: "Inactivo", label: "Inactivos" },
  ];
  const filteredClients = clients.filter((c) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      c.name.toLowerCase().includes(term) ||
      (c.niche || "").toLowerCase().includes(term);
    if (!matchesSearch) return false;
    if (statusFilter !== "all" && (c.status || "Activo") !== statusFilter)
      return false;
    return true;
  });

  return (
    <div className="space-y-5 fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
          Cartera de Clientes
        </h2>
        <div className="flex flex-col md:flex-row w-full md:w-auto gap-3">
          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            placeholder="Buscar cliente o rubro..."
          />
          <Button onClick={onAdd} color="blue" icon="Plus">
            Nuevo Cliente
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto kanban-mobile-scroll">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
          {statusFilters.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`shrink-0 px-3 py-1.5 text-[13px] font-semibold rounded-lg transition-all ${statusFilter === f.id ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="text-xs font-medium text-slate-400 dark:text-slate-500 shrink-0">
          {filteredClients.length} de {clients.length}
        </span>
      </div>

      {filteredClients.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 h-64">
          <EmptyState icon="Briefcase" text="No hay clientes que coincidan." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((c) => {
            const status = getClientStatus(c);
            const manager = managers.find((m) => m.id === c.managerId) || null;
            const inactive = status.id === "Inactivo";
            return (
              <div
                key={c.id}
                onClick={() => onSelect(c)}
                className={`group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600/60 hover:-translate-y-0.5 transition-all cursor-pointer ${inactive ? "opacity-70 hover:opacity-100" : ""}`}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  {c.photo ? (
                    <img
                      src={c.photo}
                      alt={c.name}
                      className="h-14 w-14 rounded-2xl object-cover border border-black/5 dark:border-white/10 shrink-0"
                    />
                  ) : (
                    <div className="h-14 w-14 bg-blue-50 dark:bg-blue-500/15 rounded-2xl flex items-center justify-center text-2xl font-bold text-blue-600 dark:text-blue-400 shrink-0">
                      {c.name ? c.name.charAt(0).toUpperCase() : "C"}
                    </div>
                  )}
                  <span
                    className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full shrink-0 ${status.bg} ${status.text}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                    {status.label}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white truncate">
                  {c.name}
                </h3>
                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate mt-0.5">
                  {c.niche || "Sin rubro"}
                </p>
                {c.package && (
                  <span className="inline-flex items-center gap-1 mt-3 text-[11px] font-semibold text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                    <Icon name="Sparkles" size={11} /> {c.package}
                  </span>
                )}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between gap-2">
                  {onReassignManager ? (
                    <ManagerPicker
                      managers={managers}
                      value={c.managerId || ""}
                      legacyColorMap={legacyColorMap}
                      onChange={(id) => onReassignManager(c, id)}
                      buttonClassName="flex items-center gap-2 min-w-0 max-w-full text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg px-1.5 py-1 -ml-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    />
                  ) : (
                    <span className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 truncate min-w-0">
                      <PersonAvatar
                        person={manager}
                        size={22}
                        legacyColorMap={legacyColorMap}
                      />
                      <span className="truncate">
                        {manager ? manager.name : c.manager || "Sin asignar"}
                      </span>
                    </span>
                  )}
                  {c.instagram && (
                    <span
                      className="text-slate-400 dark:text-slate-500 group-hover:text-pink-500 transition-colors shrink-0"
                      title="Instagram"
                    >
                      <Icon name="Instagram" size={16} />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const ClientDetail = ({
  client,
  managers,
  legacyColorMap = {},
  onReassignManager,
  onBack,
  onUpdate,
  onDelete,
  onEdit,
  onOpenChat,
  chatUnread = 0,
}) => (
  <div className="space-y-6 max-w-5xl mx-auto fade-in">
    <Breadcrumb
      items={[
        { label: "Clientes", onClick: onBack },
        { label: client.name || "Detalle" },
      ]}
    />
    <button
      onClick={onBack}
      className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-bold text-sm uppercase p-2 -ml-2"
    >
      <Icon name="ChevronLeft" size={16} /> Volver a clientes
    </button>
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
      <div className="bg-slate-900 dark:bg-slate-950 p-6 md:p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative group border-b border-slate-800">
        <button
          onClick={onEdit}
          aria-label="Editar cliente"
          className="absolute top-4 right-4 text-slate-500 hover:text-white p-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
        >
          <Icon name="Edit" size={18} />
        </button>

        <div className="flex items-start md:items-center gap-6">
          {client.photo ? (
            <img
              src={client.photo}
              alt={client.name}
              className="h-20 w-20 rounded-2xl object-cover shadow-inner shrink-0 border border-white/10"
            />
          ) : (
            <div className="h-20 w-20 bg-white/10 rounded-2xl flex items-center justify-center text-4xl font-black shadow-inner shrink-0">
              {client.name ? client.name.charAt(0).toUpperCase() : "C"}
            </div>
          )}
          <div>
            <h1 className="text-2xl md:text-3xl font-black">{client.name}</h1>

            <div className="mt-2">
              <ManagerPicker
                managers={managers}
                value={client.managerId || ""}
                legacyColorMap={legacyColorMap}
                onChange={(id) => onReassignManager(client, id)}
                placeholder="Asignar Account Manager..."
                buttonClassName="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 text-white font-bold text-xs transition-all max-w-full"
              />
            </div>
            {onOpenChat && (
              <button
                onClick={onOpenChat}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-blue-700"
              >
                <Icon name="MessageSquare" size={14} /> Abrir chat interno
                {chatUnread > 0 && (
                  <span className="rounded-full bg-white/25 px-1.5 py-0.5 text-[10px] font-black">
                    {chatUnread}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0 mt-4 md:mt-0">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">
            Estado
          </span>
          <div className="flex gap-1 bg-white/10 p-1 rounded-xl">
            {CLIENT_STATUSES.map((s) => {
              const active = (client.status || "Activo") === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => onUpdate(client.id, { status: s.id })}
                  aria-label={`Marcar cliente como ${s.label}`}
                  aria-pressed={active}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${active ? "bg-white text-slate-800 shadow-sm" : "text-white/70 hover:text-white hover:bg-white/10"}`}
                >
                  <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div>
        <div className="p-6 md:p-8 space-y-8">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Icon name="Instagram" size={14} /> Redes
            </h3>
            <div className="flex flex-col md:flex-row gap-2">
              <input
                defaultValue={client.instagram}
                onBlur={(e) =>
                  onUpdate(client.id, { instagram: e.target.value })
                }
                placeholder="Link Instagram..."
                className="flex-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl text-sm px-4 py-3 border outline-none text-slate-800 dark:text-slate-200"
              />
              <a
                href={client.instagram || "#"}
                target="_blank"
                className="bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 px-4 py-3 rounded-xl font-bold text-sm hover:bg-pink-100 dark:hover:bg-pink-500/20 flex items-center justify-center gap-2"
              >
                Ver <Icon name="ExternalLink" size={14} />
              </a>
            </div>
          </div>
          <button
            onClick={onDelete}
            className="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400 text-xs font-bold flex items-center gap-2 p-2 -ml-2"
          >
            <Icon name="Trash2" size={14} /> ELIMINAR CLIENTE
          </button>
        </div>
      </div>
    </div>
  </div>
);

