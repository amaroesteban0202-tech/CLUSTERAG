import React, { useState } from "react";
import { Icon } from "../icons.jsx";
import {
  compareDateOnlyStrings,
  getHondurasTodayStr,
  normalizeDateOnlyString,
} from "../../utils/date.js";
import { isEditingDelivered } from "../../utils/kpi.js";
import { ReportStatCard } from "./shared.jsx";

export const ReportsView = ({
  accountTasks,
  editingTasks,
  managementTasks,
  clients,
  managers,
  editors,
  users = [],
}) => {
  const todayStr = getHondurasTodayStr();
  const now = new Date();
  const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const [fromDate, setFromDate] = useState(firstOfMonth);
  const [toDate, setToDate] = useState(todayStr);
  const [activeTab, setActiveTab] = useState("content");
  const hasAutoExpandedRangeRef = useRef(false);

  const inRange = (dateStr) => {
    if (!dateStr) return false;
    return (
      compareDateOnlyStrings(dateStr, fromDate) >= 0 &&
      compareDateOnlyStrings(dateStr, toDate) <= 0
    );
  };

  const filteredAccountTasks = accountTasks.filter((t) => inRange(t.date));
  const filteredEditingTasks = editingTasks.filter((t) => inRange(t.date));
  const filteredManagementTasks = managementTasks.filter((t) =>
    inRange(t.date),
  );

  useEffect(() => {
    if (hasAutoExpandedRangeRef.current) return;
    const allTaskDates = [...accountTasks, ...editingTasks, ...managementTasks]
      .map((task) => normalizeDateOnlyString(task.date))
      .filter(Boolean)
      .sort();
    if (allTaskDates.length === 0) return;
    const hasCurrentRangeData = allTaskDates.some(inRange);
    if (hasCurrentRangeData) {
      hasAutoExpandedRangeRef.current = true;
      return;
    }
    setFromDate(allTaskDates[0]);
    setToDate(todayStr);
    hasAutoExpandedRangeRef.current = true;
  }, [accountTasks, editingTasks, managementTasks]);

  const managerById = new Map(managers.map((item) => [item.id, item]));
  const editorById = new Map(editors.map((item) => [item.id, item]));
  const userById = new Map(users.map((item) => [item.id, item]));
  const userByManagerId = new Map(
    users
      .filter((item) => item.linkedManagerId)
      .map((item) => [item.linkedManagerId, item]),
  );
  const userByEditorId = new Map(
    users
      .filter((item) => item.linkedEditorId)
      .map((item) => [item.linkedEditorId, item]),
  );
  const performancePeopleByKey = new Map();
  const roleLabelByKey = {
    super_admin: "Admin",
    operations: "Operaciones",
    management: "Gestion",
    manager: "Manager",
    editor: "Editor",
    viewer: "Viewer",
  };
  const addPerformancePerson = (key, data = {}) => {
    if (!key) return null;
    const current = performancePeopleByKey.get(key) || {
      id: key,
      name: "",
      email: "",
      roles: [],
    };
    const roles = [...current.roles];
    if (data.roleLabel && !roles.includes(data.roleLabel))
      roles.push(data.roleLabel);
    const nextPerson = {
      id: key,
      name: current.name || data.name || data.email || "Usuario sin nombre",
      email: current.email || data.email || "",
      roles,
      managerId: current.managerId || data.managerId || "",
      editorId: current.editorId || data.editorId || "",
    };
    performancePeopleByKey.set(key, nextPerson);
    return nextPerson;
  };
  users.forEach((item) =>
    addPerformancePerson(item.id, {
      name: item.name,
      email: item.email,
      roleLabel: roleLabelByKey[item.role] || item.role || "Usuario",
      managerId: item.linkedManagerId || "",
      editorId: item.linkedEditorId || "",
    }),
  );
  managers.forEach((item) => {
    const linkedUser =
      userByManagerId.get(item.id) ||
      (item.userId ? userById.get(item.userId) : null);
    addPerformancePerson(linkedUser?.id || item.userId || item.id, {
      name: item.name || linkedUser?.name,
      email: item.email || linkedUser?.email,
      roleLabel: "Manager",
      managerId: item.id,
    });
  });
  editors.forEach((item) => {
    const linkedUser =
      userByEditorId.get(item.id) ||
      (item.userId ? userById.get(item.userId) : null);
    addPerformancePerson(linkedUser?.id || item.userId || item.id, {
      name: item.name || linkedUser?.name,
      email: item.email || linkedUser?.email,
      roleLabel: "Editor",
      editorId: item.id,
    });
  });
  const resolveManagerPerformanceKey = (managerId = "", directUserId = "") => {
    const manager =
      managerById.get(managerId) ||
      (directUserId
        ? managers.find((item) => item.userId === directUserId)
        : null);
    const linkedUser = manager
      ? userByManagerId.get(manager.id) ||
        (manager.userId ? userById.get(manager.userId) : null)
      : null;
    const directUser = directUserId ? userById.get(directUserId) : null;
    const key =
      directUser?.id ||
      directUserId ||
      linkedUser?.id ||
      manager?.userId ||
      manager?.id ||
      managerId;
    addPerformancePerson(key, {
      name: manager?.name || directUser?.name || linkedUser?.name,
      email: manager?.email || directUser?.email || linkedUser?.email,
      roleLabel: "Manager",
      managerId: manager?.id || managerId,
    });
    return key;
  };
  const resolveEditorPerformanceKey = (editorId = "", directUserId = "") => {
    const editor =
      editorById.get(editorId) ||
      (directUserId
        ? editors.find((item) => item.userId === directUserId)
        : null);
    const linkedUser = editor
      ? userByEditorId.get(editor.id) ||
        (editor.userId ? userById.get(editor.userId) : null)
      : null;
    const directUser = directUserId ? userById.get(directUserId) : null;
    const key =
      directUser?.id ||
      directUserId ||
      linkedUser?.id ||
      editor?.userId ||
      editor?.id ||
      editorId;
    addPerformancePerson(key, {
      name: editor?.name || directUser?.name || linkedUser?.name,
      email: editor?.email || directUser?.email || linkedUser?.email,
      roleLabel: "Editor",
      editorId: editor?.id || editorId,
    });
    return key;
  };
  const resolveManagementPerformanceKey = (userId = "") => {
    const record = userById.get(userId);
    const key = record?.id || userId;
    addPerformancePerson(key, {
      name: record?.name,
      email: record?.email,
      roleLabel: roleLabelByKey[record?.role] || "Gestion",
      managerId: record?.linkedManagerId || "",
      editorId: record?.linkedEditorId || "",
    });
    return key;
  };
  const getTaskAssigneeKeys = (task, type) => {
    const storedAssignees =
      type === "editing" &&
      isEditingDelivered(task) &&
      Array.isArray(task.editorAssigneesAtCompletion)
        ? task.editorAssigneesAtCompletion
        : task.assignees;
    const explicitAssignees = Array.isArray(storedAssignees)
      ? storedAssignees.filter(Boolean)
      : [];
    const keys = new Set();
    if (type === "account")
      explicitAssignees.forEach((id) =>
        keys.add(resolveManagerPerformanceKey(id, "")),
      );
    if (type === "editing")
      explicitAssignees.forEach((id) =>
        keys.add(resolveEditorPerformanceKey(id, "")),
      );
    if (type === "management")
      explicitAssignees.forEach((id) =>
        keys.add(resolveManagementPerformanceKey(id)),
      );
    if (keys.size === 0 && type === "account")
      keys.add(
        resolveManagerPerformanceKey(task.contextId, task.assigneeUserId),
      );
    if (keys.size === 0 && type === "editing")
      keys.add(
        resolveEditorPerformanceKey(
          task.editorOwnerAtCompletionId || task.contextId,
          task.editorAssigneeUserAtCompletionId || task.assigneeUserId,
        ),
      );
    if (keys.size === 0 && type === "management")
      keys.add(
        resolveManagementPerformanceKey(task.assigneeUserId || task.contextId),
      );
    return [...keys].filter(Boolean);
  };
  const dailyPerformanceByKey = new Map();
  const addDailyPerformanceTask = (task, type) => {
    const date = normalizeDateOnlyString(
      type === "editing" && isEditingDelivered(task)
        ? task.editorDueDateAtCompletion || task.date
        : task.date,
    );
    if (!date) return;
    const areaKey =
      type === "account"
        ? "account"
        : type === "editing"
          ? "editing"
          : "management";
    const isDone =
      type === "account"
        ? task.status === "publicado"
        : type === "editing"
          ? isEditingDelivered(task)
          : task.status === "cerrado";
    getTaskAssigneeKeys(task, type).forEach((personKey) => {
      const person =
        performancePeopleByKey.get(personKey) ||
        addPerformancePerson(personKey, {});
      const rowKey = `${date}:${person.id}`;
      const current = dailyPerformanceByKey.get(rowKey) || {
        date,
        userId: person.id,
        name: person.name,
        email: person.email,
        roles: person.roles,
        total: 0,
        done: 0,
        pending: 0,
        areas: { account: 0, editing: 0, management: 0 },
      };
      current.name = person.name || current.name;
      current.email = person.email || current.email;
      current.roles = person.roles;
      current.total += 1;
      current.done += isDone ? 1 : 0;
      current.pending += isDone ? 0 : 1;
      current.areas[areaKey] += 1;
      dailyPerformanceByKey.set(rowKey, current);
    });
  };
  filteredAccountTasks.forEach((task) =>
    addDailyPerformanceTask(task, "account"),
  );
  filteredEditingTasks.forEach((task) =>
    addDailyPerformanceTask(task, "editing"),
  );
  filteredManagementTasks.forEach((task) =>
    addDailyPerformanceTask(task, "management"),
  );
  const dailyPerformanceStats = [...dailyPerformanceByKey.values()].sort(
    (left, right) =>
      compareDateOnlyStrings(right.date, left.date) ||
      right.total - left.total ||
      left.name.localeCompare(right.name),
  );
  const dailyPerformanceTotals = dailyPerformanceStats.reduce(
    (acc, row) => ({
      total: acc.total + row.total,
      done: acc.done + row.done,
      pending: acc.pending + row.pending,
    }),
    { total: 0, done: 0, pending: 0 },
  );
  const dailyUserCount = new Set(dailyPerformanceStats.map((row) => row.userId))
    .size;
  const dailyDateCount = new Set(dailyPerformanceStats.map((row) => row.date))
    .size;

  const accountPublished = filteredAccountTasks.filter(
    (t) => t.status === "publicado",
  ).length;
  const editingPublished = filteredEditingTasks.filter(
    (t) => t.status === "publicado",
  ).length;
  const totalContentPieces =
    filteredAccountTasks.length + filteredEditingTasks.length;
  const totalPublished = accountPublished + editingPublished;

  const managerStats = managers
    .map((m) => {
      const mTasks = filteredAccountTasks.filter((t) => t.contextId === m.id);
      return {
        ...m,
        total: mTasks.length,
        published: mTasks.filter((t) => t.status === "publicado").length,
        approved: mTasks.filter((t) => t.status === "aprobado_internamente")
          .length,
        inProgress: mTasks.filter(
          (t) => !["publicado", "aprobado_internamente"].includes(t.status),
        ).length,
      };
    })
    .filter((m) => m.total > 0)
    .sort((a, b) => b.total - a.total);

  const editorStats = editors
    .map((e) => {
      const eTasks = filteredEditingTasks.filter((t) => t.contextId === e.id);
      return {
        ...e,
        total: eTasks.length,
        published: eTasks.filter((t) => t.status === "publicado").length,
        approved: eTasks.filter((t) => t.status === "aprobado").length,
        inProgress: eTasks.filter(
          (t) => !["publicado", "aprobado"].includes(t.status),
        ).length,
      };
    })
    .filter((e) => e.total > 0)
    .sort((a, b) => b.total - a.total);

  const tabs = [
    { id: "content", label: "Piezas de Contenido" },
    { id: "daily", label: "Diario por Usuario" },
    { id: "managers", label: "Por Manager" },
    { id: "editors", label: "Por Editor" },
    { id: "management", label: "Gestión" },
  ];

  const rowStyle = (i) =>
    i % 2 !== 0 ? "bg-slate-50/50 dark:bg-slate-950/30" : "";

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white">
          Reportes
        </h2>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5">
            <span className="text-xs font-black text-slate-500 uppercase">
              Desde
            </span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="text-sm font-bold text-slate-700 dark:text-slate-200 bg-transparent outline-none"
            />
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5">
            <span className="text-xs font-black text-slate-500 uppercase">
              Hasta
            </span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="text-sm font-bold text-slate-700 dark:text-slate-200 bg-transparent outline-none"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ReportStatCard
          label="Total Piezas"
          value={totalContentPieces}
          color="purple"
          icon="BarChart3"
          sub="accounts + edición"
        />
        <ReportStatCard
          label="Publicadas"
          value={totalPublished}
          color="emerald"
          icon="CheckCircle2"
          sub={`${Math.round(totalContentPieces > 0 ? (totalPublished / totalContentPieces) * 100 : 0)}% del total`}
        />
        <ReportStatCard
          label="Sala Accounts"
          value={filteredAccountTasks.length}
          color="indigo"
          icon="LayoutList"
          sub={`${accountPublished} publicadas`}
        />
        <ReportStatCard
          label="Sala Edición"
          value={filteredEditingTasks.length}
          color="amber"
          icon="Video"
          sub={`${editingPublished} publicadas`}
        />
      </div>

      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? "border-purple-500 text-purple-600 dark:text-purple-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "content" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="font-black text-slate-800 dark:text-white mb-5 flex items-center gap-2">
              <Icon name="LayoutList" size={18} className="text-indigo-500" />{" "}
              Sala de Accounts
            </h3>
            <div className="space-y-3">
              {[
                { label: "Por Diseñar", status: "por_disenar", color: "slate" },
                {
                  label: "Aprobación Interna",
                  status: "aprobacion_interna",
                  color: "blue",
                },
                {
                  label: "Aprobado Internamente",
                  status: "aprobado_internamente",
                  color: "emerald",
                },
                { label: "Publicado", status: "publicado", color: "indigo" },
              ].map((row) => {
                const count = filteredAccountTasks.filter(
                  (t) => t.status === row.status,
                ).length;
                const pct =
                  filteredAccountTasks.length > 0
                    ? Math.round((count / filteredAccountTasks.length) * 100)
                    : 0;
                return (
                  <div key={row.status}>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`w-2 h-2 rounded-full bg-${row.color}-500 shrink-0`}
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-300 flex-1">
                        {row.label}
                      </span>
                      <span className="font-black text-slate-800 dark:text-white">
                        {count}
                      </span>
                      <span className="text-xs text-slate-500 w-8 text-right">
                        {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-${row.color}-500 rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                <span className="text-sm font-bold text-slate-500">Total</span>
                <span className="font-black text-slate-800 dark:text-white">
                  {filteredAccountTasks.length}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="font-black text-slate-800 dark:text-white mb-5 flex items-center gap-2">
              <Icon name="Video" size={18} className="text-amber-500" /> Sala de
              Edición
            </h3>
            <div className="space-y-3">
              {[
                { label: "Por Editar", status: "editar", color: "slate" },
                { label: "En Edición", status: "en_edicion", color: "amber" },
                {
                  label: "Revisión Interna",
                  status: "revision_interna",
                  color: "blue",
                },
                { label: "Aprobado", status: "aprobado", color: "emerald" },
                { label: "Publicado", status: "publicado", color: "indigo" },
              ].map((row) => {
                const count = filteredEditingTasks.filter(
                  (t) => t.status === row.status,
                ).length;
                const pct =
                  filteredEditingTasks.length > 0
                    ? Math.round((count / filteredEditingTasks.length) * 100)
                    : 0;
                return (
                  <div key={row.status}>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`w-2 h-2 rounded-full bg-${row.color}-500 shrink-0`}
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-300 flex-1">
                        {row.label}
                      </span>
                      <span className="font-black text-slate-800 dark:text-white">
                        {count}
                      </span>
                      <span className="text-xs text-slate-500 w-8 text-right">
                        {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-${row.color}-500 rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                <span className="text-sm font-bold text-slate-500">Total</span>
                <span className="font-black text-slate-800 dark:text-white">
                  {filteredEditingTasks.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "daily" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ReportStatCard
              label="Usuarios Activos"
              value={dailyUserCount}
              color="violet"
              icon="Users"
              sub={`${dailyDateCount} dias con actividad`}
            />
            <ReportStatCard
              label="Tareas del Rango"
              value={dailyPerformanceTotals.total}
              color="indigo"
              icon="LayoutList"
              sub="accounts + edicion + gestion"
            />
            <ReportStatCard
              label="Finalizadas"
              value={dailyPerformanceTotals.done}
              color="emerald"
              icon="CheckCircle2"
              sub={`${Math.round(dailyPerformanceTotals.total > 0 ? (dailyPerformanceTotals.done / dailyPerformanceTotals.total) * 100 : 0)}% completado`}
            />
            <ReportStatCard
              label="Pendientes"
              value={dailyPerformanceTotals.pending}
              color="amber"
              icon="Clock"
              sub="abiertas en el rango"
            />
          </div>

          <p className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
            En Edicion, la tarea cuenta como finalizada para el editor al pasar
            a Revision Interna. La espera de aprobacion del cliente no reduce
            su desempeno.
          </p>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {dailyPerformanceStats.length === 0 ? (
              <div className="p-16 text-center text-slate-500 font-bold">
                Sin desempeno diario en este rango de fechas
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                      <th className="text-left p-4 text-xs font-black uppercase tracking-widest text-slate-500">
                        Fecha
                      </th>
                      <th className="text-left p-4 text-xs font-black uppercase tracking-widest text-slate-500">
                        Usuario
                      </th>
                      <th className="text-left p-4 text-xs font-black uppercase tracking-widest text-slate-500">
                        Rol
                      </th>
                      <th className="text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500">
                        Areas
                      </th>
                      <th className="text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500">
                        Total
                      </th>
                      <th className="text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500">
                        Finalizadas
                      </th>
                      <th className="text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500">
                        Pendientes
                      </th>
                      <th className="text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500">
                        Desempeno
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyPerformanceStats.map((row, i) => {
                      const pct =
                        row.total > 0
                          ? Math.round((row.done / row.total) * 100)
                          : 0;
                      const performanceColor =
                        pct >= 80
                          ? "bg-emerald-500"
                          : pct >= 50
                            ? "bg-amber-500"
                            : "bg-red-500";
                      return (
                        <tr
                          key={`${row.date}-${row.userId}`}
                          className={`border-b border-slate-50 dark:border-slate-800/50 ${rowStyle(i)}`}
                        >
                          <td className="p-4 font-mono text-sm font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                            {row.date}
                          </td>
                          <td className="p-4">
                            <p className="font-bold text-slate-800 dark:text-white">
                              {row.name}
                            </p>
                            {row.email && (
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {row.email}
                              </p>
                            )}
                          </td>
                          <td className="p-4 text-sm text-slate-500 dark:text-slate-400">
                            {row.roles?.length
                              ? row.roles.join(" / ")
                              : "Usuario"}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              {row.areas.account > 0 && (
                                <span className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-black">
                                  Account {row.areas.account}
                                </span>
                              )}
                              {row.areas.editing > 0 && (
                                <span className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-black">
                                  Edicion {row.areas.editing}
                                </span>
                              )}
                              {row.areas.management > 0 && (
                                <span className="px-2 py-1 rounded-lg bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[11px] font-black">
                                  Gestion {row.areas.management}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-center font-black text-slate-800 dark:text-white">
                            {row.total}
                          </td>
                          <td className="p-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                            {row.done}
                          </td>
                          <td className="p-4 text-center text-slate-500 dark:text-slate-400">
                            {row.pending}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${performanceColor}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="w-10 text-right text-sm font-black text-slate-800 dark:text-white">
                                {pct}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "managers" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {managerStats.length === 0 ? (
            <div className="p-16 text-center text-slate-500 font-bold">
              Sin datos en este rango de fechas
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                  <th className="text-left p-4 text-xs font-black uppercase tracking-widest text-slate-500">
                    Manager
                  </th>
                  <th className="text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500">
                    Total
                  </th>
                  <th className="text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500">
                    En Proceso
                  </th>
                  <th className="text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500">
                    Aprobadas
                  </th>
                  <th className="text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500">
                    Publicadas
                  </th>
                </tr>
              </thead>
              <tbody>
                {managerStats.map((m, i) => (
                  <tr
                    key={m.id}
                    className={`border-b border-slate-50 dark:border-slate-800/50 ${rowStyle(i)}`}
                  >
                    <td className="p-4 font-bold text-slate-800 dark:text-white">
                      {m.name}
                    </td>
                    <td className="p-4 text-center font-black text-slate-800 dark:text-white">
                      {m.total}
                    </td>
                    <td className="p-4 text-center text-slate-500 dark:text-slate-400">
                      {m.inProgress}
                    </td>
                    <td className="p-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                      {m.approved}
                    </td>
                    <td className="p-4 text-center font-bold text-indigo-600 dark:text-indigo-400">
                      {m.published}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "editors" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {editorStats.length === 0 ? (
            <div className="p-16 text-center text-slate-500 font-bold">
              Sin datos en este rango de fechas
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                  <th className="text-left p-4 text-xs font-black uppercase tracking-widest text-slate-500">
                    Editor
                  </th>
                  <th className="text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500">
                    Total
                  </th>
                  <th className="text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500">
                    En Proceso
                  </th>
                  <th className="text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500">
                    Aprobadas
                  </th>
                  <th className="text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500">
                    Publicadas
                  </th>
                </tr>
              </thead>
              <tbody>
                {editorStats.map((e, i) => (
                  <tr
                    key={e.id}
                    className={`border-b border-slate-50 dark:border-slate-800/50 ${rowStyle(i)}`}
                  >
                    <td className="p-4 font-bold text-slate-800 dark:text-white">
                      {e.name}
                    </td>
                    <td className="p-4 text-center font-black text-slate-800 dark:text-white">
                      {e.total}
                    </td>
                    <td className="p-4 text-center text-slate-500 dark:text-slate-400">
                      {e.inProgress}
                    </td>
                    <td className="p-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                      {e.approved}
                    </td>
                    <td className="p-4 text-center font-bold text-indigo-600 dark:text-indigo-400">
                      {e.published}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "management" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="font-black text-slate-800 dark:text-white mb-5 flex items-center gap-2">
              <Icon name="ShieldCheck" size={18} className="text-violet-500" />{" "}
              Sala de Gestión
            </h3>
            <div className="space-y-3">
              {[
                { label: "Pendiente", status: "pendiente", color: "slate" },
                { label: "En Proceso", status: "en_proceso", color: "violet" },
                { label: "En Espera", status: "en_espera", color: "amber" },
                { label: "Cerrado", status: "cerrado", color: "emerald" },
              ].map((row) => {
                const count = filteredManagementTasks.filter(
                  (t) => t.status === row.status,
                ).length;
                const pct =
                  filteredManagementTasks.length > 0
                    ? Math.round((count / filteredManagementTasks.length) * 100)
                    : 0;
                return (
                  <div key={row.status}>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`w-2 h-2 rounded-full bg-${row.color}-500 shrink-0`}
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-300 flex-1">
                        {row.label}
                      </span>
                      <span className="font-black text-slate-800 dark:text-white">
                        {count}
                      </span>
                      <span className="text-xs text-slate-500 w-8 text-right">
                        {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-${row.color}-500 rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                <span className="text-sm font-bold text-slate-500">Total</span>
                <span className="font-black text-slate-800 dark:text-white">
                  {filteredManagementTasks.length}
                </span>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-4">
            <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2">
              <Icon name="Flame" size={18} className="text-orange-500" />{" "}
              Resumen
            </h3>
            <ReportStatCard
              label="Tareas Abiertas"
              value={
                filteredManagementTasks.filter((t) => t.status !== "cerrado")
                  .length
              }
              color="violet"
              icon="Circle"
            />
            <ReportStatCard
              label="Tareas Cerradas"
              value={
                filteredManagementTasks.filter((t) => t.status === "cerrado")
                  .length
              }
              color="emerald"
              icon="CheckCircle2"
            />
          </div>
        </div>
      )}
    </div>
  );
};
