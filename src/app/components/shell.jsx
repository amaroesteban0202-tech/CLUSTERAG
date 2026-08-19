import React from "react";
import { Icon } from "./icons.jsx";

export const AgencyLogo = ({ className }) => {
  return (
    <div
      className={`agency-logo relative overflow-hidden rounded-md bg-white ${className}`}
    >
      <img
        src="/src/app/assets/cluster-symbol.webp"
        alt=""
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2"
      />
    </div>
  );
};

export const SIDEBAR_ACCENT_HEX = {
  purple: "var(--primary)",
  blue: "var(--status-blue-text)",
  indigo: "var(--primary)",
  violet: "var(--primary)",
  amber: "var(--status-yellow-text)",
  emerald: "var(--status-green-text)",
  rose: "var(--status-red-text)",
  cyan: "var(--status-blue-text)",
  slate: "var(--text-faint)",
};

export const SidebarNavGroup = ({ label, children }) => {
  if (!children) return null;
  const items = Array.isArray(children)
    ? children.filter(Boolean)
    : [children].filter(Boolean);
  if (items.length === 0) return null;
  return (
    <div className="sidebar-nav-group">
      <div className="sidebar-nav-group-label">{label}</div>
      <div className="sidebar-nav-group-items">{items}</div>
    </div>
  );
};

export const SidebarItem = ({
  active,
  onClick,
  icon,
  label,
  color,
  badge,
  badgeTone = "muted",
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-current={active ? "page" : undefined}
    className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors ${active ? "bg-[var(--primary-soft)] text-[var(--text)] dark:bg-[var(--primary-soft)] dark:text-[var(--text)]" : "text-[var(--text-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text)] dark:text-[var(--text-muted)] dark:hover:bg-[var(--surface-muted)] dark:hover:text-[var(--text)]"}`}
  >
    <span
      className={`absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full transition-all ${active ? "h-5 w-1" : "h-0 w-0"}`}
      style={
        active
          ? { backgroundColor: SIDEBAR_ACCENT_HEX[color] || "var(--primary)" }
          : undefined
      }
    />
    <Icon name={icon} size={18} className="shrink-0 text-[inherit]" />
    <span className="flex-1 truncate text-left text-sm font-medium text-[inherit]">
      {label}
    </span>
    {badge != null && (
      <span
        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
          badgeTone === "urgent"
            ? "bg-[var(--status-red-bg)] text-[var(--status-red-text)]"
            : badgeTone === "accent"
              ? "bg-[var(--primary-soft)] text-[var(--primary)]"
              : "bg-[var(--surface-muted)] text-[var(--text-muted)]"
        }`}
      >
        {badge}
      </span>
    )}
  </button>
);

export const FirstTimeView = ({ role, roleLabel, onNavigate, onDismiss }) => {
  const normalizedRole = [
    "editor",
    "manager",
    "management",
    "operations",
    "super_admin",
  ].includes(role)
    ? role
    : "viewer";
  const introByRole = {
    editor: {
      eyebrow: "Bienvenida · Editor",
      title: "Tu sala de edición te espera",
      body: "Empieza por las tareas asignadas, actualiza estados y mantén tu correo activo para los recordatorios.",
    },
    manager: {
      eyebrow: "Bienvenida · Account Manager",
      title: "Organiza cuentas y publicaciones",
      body: "Carga clientes, planifica en Sala de Accounts y sigue la carga del equipo en el calendario.",
    },
    management: {
      eyebrow: "Bienvenida · Gestión",
      title: "Centraliza el seguimiento interno",
      body: "Usa Sala de Gestión para plazos con responsable y cruza vencimientos en el calendario.",
    },
    operations: {
      eyebrow: "Bienvenida · Operaciones",
      title: "Prepara el espacio para el equipo",
      body: "Configura accesos, carga la cartera y revisa el panel cuando ya haya actividad.",
    },
    super_admin: {
      eyebrow: "Bienvenida · Super Admin",
      title: "Configura ClusterAG desde cero",
      body: "Define usuarios, clientes y revisa el panel central cuando el equipo empiece a operar.",
    },
    viewer: {
      eyebrow: "Bienvenida",
      title: "Explora el espacio de trabajo",
      body: "Consulta el resumen, las salas y el calendario según los permisos de tu rol.",
    },
  };
  const stepsByRole = {
    editor: [
      {
        icon: "Video",
        title: "Sala de Edición",
        desc: "Revisa tus tareas asignadas y avanza cada pieza por estado.",
        view: "editions",
      },
      {
        icon: "CheckCircle2",
        title: "Estados claros",
        desc: "Mueve las tarjetas cuando una pieza pase a revisión, aprobación o publicación.",
        view: "editions",
      },
      {
        icon: "Mail",
        title: "Recordatorios",
        desc: "Te llegará un aviso cuando una tarea esté próxima a vencer o vencida.",
        view: "general-calendar",
      },
    ],
    manager: [
      {
        icon: "Briefcase",
        title: "Gestiona tus cuentas",
        desc: "Crea la cartera y asigna cada cliente a su responsable.",
        view: "clients",
      },
      {
        icon: "LayoutList",
        title: "Sala de Accounts",
        desc: "Planifica publicaciones y tareas por fecha, estado y responsable.",
        view: "account-room",
      },
      {
        icon: "Users",
        title: "Tu equipo",
        desc: "Asigna editores desde la Sala de Edición cuando una pieza lo requiera.",
        view: "editions",
      },
    ],
    management: [
      {
        icon: "ShieldCheck",
        title: "Sala de Gestión",
        desc: "Centraliza seguimientos internos con fecha, hora y responsable.",
        view: "management-room",
      },
      {
        icon: "Briefcase",
        title: "Clientes",
        desc: "Asocia tareas de gestión a clientes cuando aplique.",
        view: "clients",
      },
      {
        icon: "CalendarDays",
        title: "Calendario",
        desc: "Revisa vencimientos y movimiento del equipo.",
        view: "general-calendar",
      },
    ],
    operations: [
      {
        icon: "Users",
        title: "Usuarios y accesos",
        desc: "Carga managers, editores y usuarios autorizados.",
        view: "control-center",
      },
      {
        icon: "Briefcase",
        title: "Clientes",
        desc: "Prepara la estructura base de cuentas antes de operar.",
        view: "clients",
      },
      {
        icon: "LayoutDashboard",
        title: "Panel Central",
        desc: "Monitorea volumen, atrasos y avance global.",
        view: "dashboard",
      },
    ],
    super_admin: [
      {
        icon: "Users",
        title: "Accesos",
        desc: "Configura roles activos y correos verificados.",
        view: "control-center",
      },
      {
        icon: "Briefcase",
        title: "Clientes",
        desc: "Crea la primera cartera y asigna responsables.",
        view: "clients",
      },
      {
        icon: "LayoutDashboard",
        title: "Panel Central",
        desc: "Revisa salud operativa cuando ya exista actividad.",
        view: "dashboard",
      },
    ],
    viewer: [
      {
        icon: "LayoutDashboard",
        title: "Panel Central",
        desc: "Aquí verás el resumen cuando el equipo empiece a cargar datos.",
        view: "dashboard",
      },
      {
        icon: "LayoutList",
        title: "Salas de trabajo",
        desc: "Consulta tareas por fecha y estado.",
        view: "account-room",
      },
      {
        icon: "CalendarDays",
        title: "Calendario",
        desc: "Abre el calendario para ubicar actividad por día.",
        view: "general-calendar",
      },
    ],
  };
  const intro = introByRole[normalizedRole] || introByRole.viewer;
  const steps = stepsByRole[normalizedRole] || stepsByRole.viewer;

  return (
    <div className="min-h-full flex items-center fade-in">
      <section className="w-full max-w-5xl mx-auto">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-widest text-[var(--primary)] mb-3">
              {intro.eyebrow}
              {roleLabel ? ` · ${roleLabel}` : ""}
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-[var(--text)] leading-tight">
              {intro.title}
            </h2>
            <p className="mt-3 text-sm md:text-base text-[var(--text-muted)] leading-7">
              {intro.body}
            </p>
          </div>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="min-h-[44px] shrink-0 rounded-xl border border-[var(--border)] px-4 text-sm font-bold text-[var(--text-muted)] hover:bg-[var(--surface-subtle)]"
            >
              Ir al panel
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map((step) => (
            <button
              key={step.title}
              type="button"
              onClick={() => onNavigate(step.view)}
              className="group min-h-[180px] text-left rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-5 hover:border-[var(--primary)] hover:shadow-lg transition-all"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
                <Icon name={step.icon} size={20} />
              </div>
              <h3 className="text-base font-black text-[var(--text)]">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                {step.desc}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-[var(--primary)]">
                Abrir <Icon name="ArrowRight" size={13} />
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export const MobileBottomNav = ({ view, onNavigate, currentUserProfile, canAccessView }) => {
  const items = [
    { view: "dashboard", icon: "LayoutDashboard", label: "Inicio" },
    { view: "performance", icon: "BarChart3", label: "Rendimiento" },
    { view: "account-room", icon: "LayoutList", label: "Accounts" },
    { view: "editions", icon: "Video", label: "Edición" },
    { view: "management-room", icon: "ShieldCheck", label: "Gestión" },
    { view: "clients", icon: "Briefcase", label: "Clientes" },
  ]
    .filter((item) =>
      typeof canAccessView === "function"
        ? canAccessView(currentUserProfile, item.view)
        : true,
    )
    .slice(0, 6);

  if (items.length === 0) return null;

  const isItemActive = (itemView) =>
    view === itemView || (itemView === "clients" && view === "client-detail");

  return (
    <nav
      aria-label="Navegación principal"
      className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(15,23,42,0.08)]"
    >
      {items.map((item) => {
        const active = isItemActive(item.view);
        return (
          <button
            key={item.view}
            onClick={() => onNavigate(item.view)}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            className={`flex-1 min-w-0 min-h-[64px] flex flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-bold transition-colors ${
              active
                ? "text-[var(--text)] dark:text-white"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Icon name={item.icon} size={20} />
            <span className="truncate max-w-full">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export const LoginVectorArtwork = () => (
  <svg
    viewBox="0 0 620 540"
    className="login-vector h-full w-full"
    role="img"
    aria-label="Equipo conectado alrededor de un flujo de trabajo"
  >
    <g fill="none" stroke="currentColor">
      <circle cx="310" cy="252" r="174" strokeWidth="1" opacity="0.18" />
      <circle
        cx="310"
        cy="252"
        r="126"
        strokeWidth="1.5"
        strokeDasharray="6 12"
        className="login-vector-orbit"
        opacity="0.42"
      />
      <path
        d="M175 184 C236 112 382 112 444 184 M175 320 C240 390 382 390 444 320"
        strokeWidth="1.5"
        opacity="0.3"
      />
      <path d="M205 252 H415 M310 142 V362" strokeWidth="1" opacity="0.2" />
    </g>

    <g className="login-vector-node login-vector-node-one">
      <circle cx="174" cy="184" r="42" fill="var(--status-blue-bg)" />
      <circle cx="174" cy="171" r="12" fill="var(--status-blue-text)" />
      <path d="M149 207 C153 187 195 187 199 207" fill="var(--status-blue-text)" />
    </g>
    <g className="login-vector-node login-vector-node-two">
      <circle cx="446" cy="184" r="42" fill="var(--status-green-bg)" />
      <circle cx="446" cy="171" r="12" fill="var(--status-green-text)" />
      <path d="M421 207 C425 187 467 187 471 207" fill="var(--status-green-text)" />
    </g>
    <g className="login-vector-node login-vector-node-three">
      <circle cx="174" cy="320" r="42" fill="var(--status-yellow-bg)" />
      <rect x="151" y="299" width="46" height="42" rx="7" fill="var(--status-yellow-text)" />
      <path d="M160 311 H188 M160 321 H183 M160 331 H176" stroke="var(--status-yellow-bg)" strokeWidth="3" strokeLinecap="round" />
    </g>
    <g className="login-vector-node login-vector-node-four">
      <circle cx="446" cy="320" r="42" fill="var(--status-red-bg)" />
      <rect x="424" y="300" width="44" height="40" rx="8" fill="var(--status-red-text)" />
      <path d="M435 320 L443 328 L458 311" fill="none" stroke="var(--status-red-bg)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </g>

    <g className="login-vector-core">
      <circle cx="310" cy="252" r="76" fill="var(--surface-muted)" />
      <circle cx="310" cy="252" r="57" fill="var(--text)" />
      <path
        d="M278 257 L302 280 L344 226"
        fill="none"
        stroke="var(--canvas)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>

    <circle cx="310" cy="126" r="6" fill="var(--status-blue-text)" className="login-vector-pulse" />
    <circle cx="436" cy="252" r="6" fill="var(--status-green-text)" className="login-vector-pulse login-vector-delay" />
    <circle cx="310" cy="378" r="6" fill="var(--status-yellow-text)" className="login-vector-pulse login-vector-delay-two" />
  </svg>
);

export const LoginScreen = ({
  onGoogleSignIn,
  isSigningIn,
  email,
  onEmailChange,
  onEmailSubmit,
  isSendingLoginLink,
  isDark,
  onToggleTheme,
}) => (
  <div className="login-screen min-h-screen bg-[var(--canvas)] text-[var(--text)] dark:bg-[var(--canvas)] dark:text-[var(--text)]">
    <header className="absolute inset-x-0 top-0 z-20 flex min-h-[76px] items-center justify-between px-5 sm:px-8 lg:px-12">
      <div className="flex items-center gap-3">
        <AgencyLogo className="h-9 w-9" />
        <div>
          <p className="brand-name text-base font-bold leading-none text-[var(--text)] dark:text-[var(--text)]">
            CLUSTER
          </p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] dark:text-[var(--text-muted)]">
            Agency OS
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onToggleTheme}
        aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        className="quiet-action touch-target h-11 w-11 p-0"
      >
        <Icon name={isDark ? "Sun" : "Moon"} size={17} />
      </button>
    </header>

    <main className="flex min-h-screen items-center justify-center px-4 pb-4 pt-24 sm:px-6 lg:px-10">
      <section className="login-frame grid w-full max-w-[1120px] overflow-hidden rounded-2xl border border-[var(--border)] bg-white dark:border-white/10 dark:bg-[var(--surface)] lg:grid-cols-[1.08fr_0.92fr]" aria-labelledby="login-title">
        <div className="login-art-panel order-2 relative min-h-[280px] overflow-hidden border-t border-[var(--border)] bg-[var(--surface-muted)] dark:border-white/10 dark:bg-[var(--surface)] lg:order-1 lg:min-h-[600px] lg:border-r lg:border-t-0">
          <div className="pointer-events-none absolute inset-x-0 top-4 h-[72%] opacity-90 lg:h-[76%]">
            <LoginVectorArtwork />
          </div>
          <div className="relative z-10 flex h-full min-h-[280px] flex-col justify-between p-6 sm:p-8 lg:min-h-[600px] lg:p-10">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] dark:text-[var(--text-muted)]">
              <span className="h-2 w-2 rounded-full bg-[var(--status-green-text)] login-vector-pulse" />
              Operación conectada
            </div>
            <div className="max-w-md">
              <p className="eyebrow mb-3">Todo el equipo, una sola vista</p>
              <h2 className="editorial-title text-3xl text-[var(--text)] dark:text-[var(--text)] sm:text-4xl lg:text-5xl">
                El trabajo fluye cuando todo está conectado.
              </h2>
              <div className="mt-5 hidden flex-wrap gap-2 sm:flex">
                {["Clientes", "Producción", "Equipo"].map((label) => (
                  <span key={label} className="rounded-full border border-[var(--border)] bg-white/70 px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)] dark:border-white/10 dark:bg-[var(--surface-raised)] dark:text-[var(--text-muted)]">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="login-form-panel order-1 flex items-center p-6 sm:p-10 lg:order-2 lg:p-12">
          <div className="w-full max-w-[390px] mx-auto">
            <div className="mb-8">
              <p className="eyebrow mb-2">Acceso seguro</p>
              <h1 id="login-title" className="editorial-title text-[40px] leading-tight text-[var(--text)] dark:text-[var(--text)]">
                Bienvenido de nuevo
              </h1>
              <p className="mt-3 text-sm leading-6 text-[var(--text-muted)] dark:text-[var(--text-muted)]">
                Entra a tu espacio para gestionar clientes, tareas y producción.
              </p>
            </div>

            <button
              onClick={onGoogleSignIn}
              disabled={isSigningIn || isSendingLoginLink}
              className="quiet-action w-full justify-center px-4 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSigningIn ? (
                <Icon name="Loader2" size={17} className="animate-spin" />
              ) : (
                <span className="text-base font-bold text-blue-600" aria-hidden="true">G</span>
              )}
              Continuar con Google
            </button>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-[var(--surface-muted)] dark:bg-[var(--surface-muted)]" />
              <span className="text-xs text-[var(--text-muted)] dark:text-[var(--text-muted)]">O usa tu correo</span>
              <div className="h-px flex-1 bg-[var(--surface-muted)] dark:bg-[var(--surface-muted)]" />
            </div>

            <form onSubmit={onEmailSubmit} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-[var(--text)] dark:text-[var(--text)]">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Icon name="Mail" size={17} className="pointer-events-none absolute left-3.5 top-3.5 text-[var(--text-faint)]" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(event) => onEmailChange(event.target.value)}
                    placeholder="nombre@empresa.com"
                    autoComplete="email"
                    className="min-h-[46px] w-full rounded-md border border-[var(--border)] bg-white pl-11 pr-4 text-sm text-[var(--text)] outline-none transition placeholder:text-slate-400 focus:border-[var(--focus)] focus:ring-2 focus:ring-black/10 dark:border-[var(--border-strong)] dark:bg-[var(--surface)] dark:text-[var(--text)]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSigningIn || isSendingLoginLink}
                className="primary-action w-full justify-center px-4 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Icon name={isSendingLoginLink ? "Loader2" : "Send"} size={17} className={isSendingLoginLink ? "animate-spin" : ""} />
                {isSendingLoginLink ? "Enviando enlace" : "Enviar enlace de acceso"}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[var(--text-muted)] dark:text-[var(--text-muted)]">
              <Icon name="ShieldCheck" size={15} />
              Acceso exclusivo para cuentas autorizadas
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
);
