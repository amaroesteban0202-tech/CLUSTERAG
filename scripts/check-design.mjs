import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const app = read("src/app/main.jsx");
const css = read("src/styles/main.css");
const html = read("index.html");

const checks = [
  ["Phosphor icons", app.includes("@phosphor-icons/react") && html.includes("@phosphor-icons/react")],
  ["Newsreader editorial type", css.includes('font-family: "Newsreader"') && html.includes("Newsreader")],
  ["warm canvas token", css.includes("--canvas: #f7f6f3")],
  ["flat surfaces", css.includes(".surface") && css.includes("box-shadow: none")],
  ["consolidated team navigation", app.includes('label="Equipo"')],
  ["consolidated calendar navigation", app.includes('label="Calendario"')],
  ["compact KPI table", app.includes("Cumplimiento") && app.includes("Pendientes") && app.includes("KPI")],
  ["monthly dashboard task scope", app.includes("monthlyEditingTasks") && app.includes("monthlyAccountTasks") && app.includes("monthlyManagementTasks")],
  ["dashboard period is visible", app.includes("dashboardPeriod.label") && app.includes("Resumen mensual")],
  ["dashboard charts use comparison bars", !app.includes("buildRingSegments") && !app.includes("strokeDasharray")],
  ["dashboard cards navigate", app.includes('onClick={() => onNavigate("account-room")}') && app.includes('onClick={() => onNavigate("editions")}')],
  ["urgent tasks open details", app.includes("onOpenTask(t, t._taskType)") && app.includes('_taskType: "managementTask"')],
  ["task rooms stay viewport sized", css.includes("height: calc(100vh - 7rem)") && app.includes("task-room min-h-0")],
  ["kanban columns scroll independently", app.includes("overflow-y-auto overscroll-contain") && app.includes("md:h-full md:min-h-0")],
  ["task cards are keyboard accessible", app.includes('aria-label={`Abrir tarea ${title}`}') && app.includes('event.key === "Enter"')],
  ["task rooms default to current month", app.includes("Este mes") && app.includes("isDateWithinPeriod(t.date, currentMonthPeriod)") && app.includes("isDateWithinPeriod(task.date, currentMonthPeriod)")],
  ["history is explicit", app.includes('setFilterMode("history")') && app.includes("Histórico completo")],
  ["charcoal theme is the default", app.includes('localStorage.setItem("cluster_theme", "dark")') && html.includes("2026-07-charcoal-default")],
  ["company logo asset", fs.existsSync(path.join(root, "src/app/assets/cluster-symbol.webp")) && app.includes("cluster-symbol.webp")],
  ["two-font system", css.includes('font-family: Arial, sans-serif') && css.includes('font-family: "Newsreader"') && !/SF Mono|Geist Mono|Consolas/.test(css)],
  ["no gradient source styles", !/\b(?:linear|radial)-gradient\b|\bbg-gradient-/i.test(`${app}\n${css}`)],
  ["no Lucide dependency", !`${app}\n${html}`.includes("lucide-react")],
];

const failed = checks.filter(([, passed]) => !passed);
for (const [label, passed] of checks) {
  console.log(`${passed ? "PASS" : "FAIL"} ${label}`);
}

if (failed.length) process.exit(1);
