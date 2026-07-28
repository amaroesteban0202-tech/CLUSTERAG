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
  ["personal KPI rail", app.includes("KPI personales") && app.includes("Cumplimiento") && app.includes("Vencidas")],
  ["personal dashboard task scope", app.includes("personalTasks") && app.includes("isTaskAssignedToProfile") && app.includes("monthlyPersonalTasks")],
  ["dashboard period is visible", app.includes("dashboardPeriod.label") && app.includes("Progreso personal")],
  ["dashboard charts use comparison bars", !app.includes("buildRingSegments") && app.includes("pd-week-total") && app.includes("pd-week-completed")],
  ["dashboard workload navigates", app.includes('Accounts: "account-room"') && app.includes('Edición: "editions"') && app.includes("onNavigate(room)")],
  ["personal tasks open details", app.includes("onOpenTask(task, task._taskType)") && app.includes('_taskType: "managementTask"')],
  ["task rooms stay viewport sized", css.includes("height: calc(100vh - 7rem)") && app.includes("task-room min-h-0")],
  ["kanban columns scroll independently", app.includes("overflow-y-auto overscroll-contain") && app.includes("lg:h-full lg:min-h-0")],
  ["task cards are keyboard accessible", app.includes('aria-label={`Abrir tarea ${title}`}') && app.includes('event.key === "Enter"')],
  ["task detail scrolls continuously on mobile", app.includes("task-detail-body custom-scroll") && css.includes("touch-action: pan-y") && app.includes("lg:overflow-hidden")],
  ["task cards expose status selector", app.includes("statusControl = null") && app.includes('aria-label={`Cambiar estado de ${title}`}') && app.includes('className="mb-2.5 block"')],
  ["task rooms default to current month", app.includes("Este mes") && app.includes("isDateWithinPeriod(t.date, currentMonthPeriod)") && app.includes("isDateWithinPeriod(task.date, currentMonthPeriod)")],
  ["history is explicit", app.includes('setFilterMode("history")') && app.includes("Histórico completo")],
  ["animated vector login", app.includes("LoginVectorArtwork") && app.includes("login-vector-orbit") && css.includes("@keyframes loginNodeFloat")],
  ["login respects reduced motion", css.includes("prefers-reduced-motion") && css.includes("animation-duration: 0.01ms")],
  ["login prioritizes form on mobile", app.includes("login-form-panel order-1") && app.includes("login-art-panel order-2")],
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
