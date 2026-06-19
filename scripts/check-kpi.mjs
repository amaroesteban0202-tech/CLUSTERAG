import assert from "node:assert/strict";
import {
  buildManagerKpiStats,
  getMeasuredCompletionIso,
  isEditingDelivered,
  normalizeEditingWorkflowStatus,
  rankPendingEditingTasks,
} from "../src/app/utils/kpi.js";

const period = { start: "2026-06-01", end: "2026-06-30" };
const managers = [{ id: "manager-1", name: "Account" }];
const tasks = [
  {
    id: "done",
    contextId: "manager-1",
    date: "2026-06-10",
    status: "publicado",
    completedAt: "2026-06-10T15:00:00.000Z",
  },
  {
    id: "pending",
    contextId: "manager-1",
    date: "2026-06-11",
    status: "por_disenar",
  },
];
const [kpi] = buildManagerKpiStats({
  managers,
  accountTasks: tasks,
  rankingPeriod: period,
  today: "2026-06-19",
});

assert.equal(kpi.score, 64);
assert.equal(kpi.onTimePercent, 100);
assert.equal(
  getMeasuredCompletionIso({ status: "publicado", updatedAt: "2026-06-10T15:00:00Z" }),
  "",
);

const ranked = rankPendingEditingTasks(
  [
    { id: "published", status: "publicado", date: "2026-06-01" },
    { id: "review", status: "revision_interna", date: "2026-06-17" },
    { id: "later", status: "editar", date: "2026-06-20", hierarchy: "p1" },
    { id: "overdue", status: "correccion", date: "2026-06-18", hierarchy: "p3" },
  ],
  "2026-06-19",
);
assert.deepEqual(
  ranked.map((task) => task.id),
  ["overdue", "later"],
);
assert.equal(normalizeEditingWorkflowStatus("correccion"), "en_edicion");
assert.equal(isEditingDelivered({ status: "revision_interna" }), true);
assert.equal(
  isEditingDelivered({ status: "en_edicion", editorCompletedAt: "2026-06-18T12:00:00Z" }),
  true,
);

const makeAccountTasks = ({ managerId, total, completed, onTime }) =>
  Array.from({ length: total }, (_, index) => ({
    id: `${managerId}-${index}`,
    contextId: managerId,
    date: "2026-06-10",
    hierarchy: "p2",
    status: index < completed ? "publicado" : "por_disenar",
    ...(index < completed
      ? {
          completedAt:
            index < onTime
              ? "2026-06-10T15:00:00.000Z"
              : "2026-06-11T15:00:00.000Z",
        }
      : {}),
  }));
const unequalLoadStats = buildManagerKpiStats({
  managers: [
    { id: "heavy", name: "Carga alta" },
    { id: "light", name: "Carga baja" },
  ],
  accountTasks: [
    ...makeAccountTasks({ managerId: "heavy", total: 10, completed: 9, onTime: 9 }),
    ...makeAccountTasks({ managerId: "light", total: 5, completed: 5, onTime: 4 }),
  ],
  rankingPeriod: period,
  today: "2026-06-19",
});
assert.equal(unequalLoadStats[0].id, "heavy");
assert.ok(unequalLoadStats[0].score > unequalLoadStats[1].score);

console.log("KPI y ranking medibles: OK");
