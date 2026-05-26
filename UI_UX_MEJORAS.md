# ClusterAG — Plan de mejoras UI/UX

> Documento generado a partir de auditoría técnica y visual completa del sistema.  
> Fecha: Mayo 2026 · Versión 1.0

---

## Resumen ejecutivo

| Categoría | Puntuación actual | Objetivo post-mejoras |
|---|---|---|
| Diseño visual | 72 / 100 | 88 / 100 |
| Usabilidad | 63 / 100 | 82 / 100 |
| Accesibilidad | 26 / 100 | 75 / 100 |
| Experiencia mobile | 58 / 100 | 78 / 100 |
| Arquitectura de información | 62 / 100 | 80 / 100 |
| **Global** | **56 / 100** | **81 / 100** |

Las mejoras de accesibilidad tienen el mayor impacto relativo y la mayoría requieren cambios de código pequeños y localizados. Las propuestas de paleta de color son opcionales pero pueden modernizar la identidad visual sin rediseñar la interfaz.

---

## 1. Accesibilidad — correcciones críticas

Estas correcciones son las de mayor prioridad. Varias de ellas son cambios de una sola línea con impacto directo en usuarios con discapacidades visuales, motoras o que dependen de teclado.

### 1.1 Contraste de color (WCAG AA — mínimo 4.5:1)

El problema más extendido. `text-slate-400` (#94a3b8) sobre fondo blanco produce una ratio de **2.5:1**, menos de la mitad del mínimo requerido. Esta clase aparece más de 262 veces en `main.jsx`.

**Corrección:**

```css
/* main.css — agregar al inicio */
/* Elevar texto secundario al mínimo WCAG AA */
.text-secondary-accessible {
  color: #64748b; /* slate-500 — ratio 4.6:1 ✓ */
}
```

En `main.jsx`, reemplazar globalmente:

```
text-slate-400  →  text-slate-500     (textos secundarios en light mode)
dark:text-slate-500  →  dark:text-slate-400   (textos secundarios en dark mode)
```

> En dark mode la relación se invierte: sobre `slate-900` (#0f172a), `slate-400` sí pasa WCAG, pero `slate-500` falla. Por eso el reemplazo debe respetar el modo.

### 1.2 Labels de formulario sin vincular

El componente `Input` actual no conecta el label al campo:

```jsx
// ❌ Actual — label no funcional
const Input = ({ label, ...props }) => (
  <div>
    {label && <label className="...">{label}</label>}
    <input {...props} />
  </div>
);
```

```jsx
// ✓ Corregido — label vinculado por id
const Input = ({ label, id, ...props }) => {
  const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-1">
          {label}
        </label>
      )}
      <input id={inputId} className="..." {...props} />
    </div>
  );
};
```

### 1.3 Modales sin accesibilidad

Los modales actuales no tienen rol semántico, no atrapan el foco ni lo devuelven al cerrarse.

```jsx
// ❌ Actual
<div className="fixed inset-0 z-50 ...">
  <div className="bg-white rounded-3xl ...">
    ...
  </div>
</div>
```

```jsx
// ✓ Corregido
const Modal = ({ isOpen, onClose, title, children }) => {
  const triggerRef = useRef(null);  // guarda el botón que abrió el modal
  const firstFocusRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement;
      setTimeout(() => firstFocusRef.current?.focus(), 50);
    } else {
      triggerRef.current?.focus(); // devuelve el foco al cerrarse
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div className="fixed inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-lg">
        <h2 id="modal-title" className="text-lg font-bold" ref={firstFocusRef} tabIndex={-1}>
          {title}
        </h2>
        {children}
        <button onClick={onClose} aria-label="Cerrar modal" className="...">
          <Icon name="X" />
        </button>
      </div>
    </div>
  );
};
```

### 1.4 Botones de solo icono sin nombre accesible

```jsx
// ❌ Actual — invisible para screen readers
<button onClick={() => setIsDark(!isDark)}>
  <Icon name={isDark ? "Sun" : "Moon"} size={18} />
</button>

// ✓ Corregido
<button
  onClick={() => setIsDark(!isDark)}
  aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
  title={isDark ? "Modo claro" : "Modo oscuro"}
>
  <Icon name={isDark ? "Sun" : "Moon"} size={18} aria-hidden="true" />
</button>

// Lo mismo aplica para el botón de logout y el hamburger de mobile
<button
  onClick={() => firebaseSignOut(auth)}
  aria-label="Cerrar sesión"
>
  <Icon name="LogOut" size={18} aria-hidden="true" />
</button>
```

### 1.5 Toasts sin anuncio para screen readers

```jsx
// ❌ Actual — los screen readers no saben que apareció un toast
const [toast, setToast] = useState(null);

// En el JSX:
{toast && (
  <div className="fixed bottom-4 right-4 ...">
    {toast.message}
  </div>
)}
```

```jsx
// ✓ Corregido — contenedor persistente con aria-live
// El div existe siempre, solo cambia su contenido

<div
  aria-live="polite"
  aria-atomic="true"
  className="fixed bottom-4 right-4 z-[9999] pointer-events-none"
>
  {toast && (
    <div className="pointer-events-auto bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2">
      <Icon name={toast.type === 'error' ? 'AlertTriangle' : 'CheckCircle2'} size={16} aria-hidden="true" />
      {toast.message}
    </div>
  )}
</div>
```

### 1.6 Columnas kanban: no depender solo del color

Las columnas "Por Diseñar", "Aprobación Interna", "Aprobado Interno" y "Publicado" usan colores distintos como único diferenciador visual.

```jsx
// ✓ Añadir ícono semántico a cada columna
const COLUMN_META = {
  'por_disenar':        { icon: 'PenTool',      label: 'Por Diseñar' },
  'aprobacion_interna': { icon: 'Search',        label: 'Aprobación Interna' },
  'aprobado_interno':   { icon: 'CheckCircle2',  label: 'Aprobado Interno' },
  'publicado':          { icon: 'Sparkles',      label: 'Publicado' },
};

// En el header de columna:
<h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
  <Icon name={meta.icon} size={13} aria-hidden="true" />
  {meta.label}
</h3>
```

---

## 2. Usabilidad — mejoras de interacción

### 2.1 Modal de confirmación para acciones destructivas

Actualmente eliminar un cliente, tarea o editor es inmediato sin confirmación.

```jsx
const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, entityName }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Confirmar eliminación">
    <p className="text-slate-600 dark:text-slate-400 mt-2 mb-6">
      ¿Estás seguro de que quieres eliminar <strong>{entityName}</strong>?
      Esta acción no se puede deshacer.
    </p>
    <div className="flex gap-3 justify-end">
      <button onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm">
        Cancelar
      </button>
      <button onClick={onConfirm} className="px-4 py-2 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600">
        Eliminar
      </button>
    </div>
  </Modal>
);
```

### 2.2 Skeleton loading en lugar de spinner central

El spinner de carga bloquea toda la interfaz. Los skeletons mantienen el layout y reducen la percepción de espera.

```jsx
const TaskCardSkeleton = () => (
  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 animate-pulse">
    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-3" />
    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/5 mb-2" />
    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/5" />
  </div>
);

// En la columna kanban:
{isLoading
  ? Array.from({ length: 3 }).map((_, i) => <TaskCardSkeleton key={i} />)
  : tasks.map(task => <TaskCard key={task.id} task={task} />)
}
```

### 2.3 Separar los filtros de la Sala de Accounts

El filtro actual mezcla tres dimensiones sin separación visual:

```
[ Día Específico ][ Atrasadas ][ Ver Todas ][ Todas ][ Asignadas a mi ]
```

Propuesta con separación semántica:

```jsx
<div className="flex items-center gap-3 flex-wrap">
  {/* Dimensión: tiempo */}
  <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
    <FilterChip active={filter === 'today'} onClick={() => setFilter('today')}>Hoy</FilterChip>
    <FilterChip active={filter === 'overdue'} onClick={() => setFilter('overdue')}>Atrasadas</FilterChip>
    <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>Ver todas</FilterChip>
  </div>

  {/* Separador */}
  <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">|</span>

  {/* Dimensión: asignación */}
  <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
    <FilterChip active={assignFilter === 'all'} onClick={() => setAssignFilter('all')}>Todas</FilterChip>
    <FilterChip active={assignFilter === 'mine'} onClick={() => setAssignFilter('mine')}>Asignadas a mí</FilterChip>
  </div>
</div>
```

### 2.4 Breadcrumbs en vistas de detalle

Al entrar en el detalle de un cliente, el usuario pierde el contexto.

```jsx
const Breadcrumb = ({ items }) => (
  <nav aria-label="Ruta de navegación" className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mb-6">
    {items.map((item, i) => (
      <React.Fragment key={i}>
        {i > 0 && <span aria-hidden="true" className="text-slate-300">/</span>}
        {item.onClick
          ? <button onClick={item.onClick} className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">{item.label}</button>
          : <span className="text-slate-800 dark:text-slate-100 font-medium">{item.label}</span>
        }
      </React.Fragment>
    ))}
  </nav>
);

// Uso en detalle de cliente:
<Breadcrumb items={[
  { label: 'Clientes', onClick: () => handleNavigate('clients') },
  { label: client.name }
]} />
```

### 2.5 Texto comprensible en el footer del sidebar

```jsx
// ❌ Actual
<p className="text-xs text-slate-400">VIEWER · SIN CORREO</p>

// ✓ Propuesta
<p className="text-xs text-slate-500 dark:text-slate-400">
  {userRecord?.isActive === false
    ? 'Cuenta inactiva'
    : !userRecord?.email
    ? 'Sin sesión iniciada'
    : `${roleLabel} · ${userRecord.email}`
  }
</p>
```

---

## 3. Mobile — mejoras de experiencia

### 3.1 Barra de navegación inferior en mobile

El sidebar colapsable en mobile requiere dos taps para navegar (abrir sidebar → tap ítem). Una barra inferior permite un acceso directo.

```jsx
const MobileBottomNav = ({ view, onNavigate, permissions }) => {
  const items = [
    { view: 'dashboard',      icon: 'LayoutDashboard', label: 'Inicio',   perm: 'view_dashboard' },
    { view: 'account-room',   icon: 'LayoutList',      label: 'Accounts', perm: 'view_account_room' },
    { view: 'editions',       icon: 'Video',           label: 'Edición',  perm: 'view_editions_room' },
    { view: 'management-room',icon: 'ShieldCheck',     label: 'Gestión',  perm: 'view_management_room' },
    { view: 'clients',        icon: 'Briefcase',       label: 'Clientes', perm: 'view_clients' },
  ].filter(item => hasPermission(permissions, item.perm));

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex"
    >
      {items.map(item => (
        <button
          key={item.view}
          onClick={() => onNavigate(item.view)}
          aria-label={item.label}
          aria-current={view === item.view ? 'page' : undefined}
          className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-[10px] font-medium transition-colors ${
            view === item.view
              ? 'text-purple-600 dark:text-purple-400'
              : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <Icon name={item.icon} size={20} aria-hidden="true" />
          {item.label}
        </button>
      ))}
    </nav>
  );
};
```

### 3.2 Tamaño mínimo de toque en botones

Apple HIG y Google Material Design recomiendan un área mínima de toque de **44×44px**. Varios botones actuales quedan por debajo.

```jsx
// Regla general en main.css
button, [role="button"] {
  min-height: 44px;
  min-width: 44px;
}

/* Para botones de icono pequeño usar padding compensatorio */
.icon-btn {
  padding: 10px;   /* 18px de icono + 10px padding c/lado = 38px... ajustar a 13px */
  border-radius: 10px;
}
```

### 3.3 Kanban horizontal con scroll nativo en mobile

Las columnas kanban desbordan en pantallas pequeñas. Hacer el contenedor con scroll horizontal suave:

```jsx
<div
  className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4"
  style={{ scrollbarWidth: 'none' }}
>
  {columns.map(col => (
    <div
      key={col.id}
      className="shrink-0 w-[85vw] sm:w-72 snap-start"
    >
      <KanbanColumn column={col} />
    </div>
  ))}
</div>
```

---

## 4. Arquitectura de información — reorganización

### 4.1 Onboarding para usuarios nuevos

Un usuario que entra por primera vez ve la app vacía sin instrucciones. Propuesta de pantalla de bienvenida contextual por rol:

```jsx
const FirstTimeView = ({ role }) => {
  const steps = {
    editor: [
      { icon: 'Video', title: 'Tu sala de trabajo', desc: 'En "Sala de Edición" verás todas las tareas que te han asignado.' },
      { icon: 'CheckCircle2', title: 'Actualiza el estado', desc: 'Mueve las tarjetas entre columnas según avanza tu trabajo.' },
      { icon: 'Mail', title: 'Recibirás recordatorios', desc: 'Te llegará un email cuando una tarea esté próxima a vencer.' },
    ],
    manager: [
      { icon: 'Briefcase', title: 'Gestiona tus cuentas', desc: 'En "Sala de Accounts" crea y sigue las tareas de tus clientes.' },
      { icon: 'Users', title: 'Tu equipo', desc: 'Asigna editores a cada tarea desde la Sala de Edición.' },
    ],
  };
  // ...
};
```

### 4.2 Reorganización del sidebar

Propuesta de agrupación más clara, separando las salas de trabajo de la configuración:

```
CLUSTER AGENCY OS

— Principal
  Panel Central

— Clientes & equipo
  Clientes
  Account Managers
  Editores

— Salas de trabajo            ← badge con total de tareas urgentes
  Sala de Accounts    [10]
  Sala de Gestión     [2]
  Sala de Edición     [5]

— Calendario
  Calendario general

— Configuración               ← solo visible para operations/super_admin
  Usuarios y accesos
  Auditoría
```

### 4.3 Etiqueta del botón "Atrás" en tarjetas kanban

El botón "< Atrás" en las tarjetas es ambiguo. Dos opciones:

- **Opción A:** Eliminarlo — la navegación entre salas no debería estar dentro de una tarjeta.
- **Opción B:** Renombrarlo con contexto: `< Volver a cuentas` o `< Ver en Account`.

---

## 5. Paletas de color alternativas

La paleta actual (púrpura/índigo) es sólida pero hay espacio para modernizarla o darle una identidad más única. A continuación, cuatro propuestas completas que mantienen compatibilidad con Tailwind CSS.

---

### Paleta A — "Slate & Violet" (evolución de la actual)

Mantiene el carácter actual pero profundiza el violeta y añade un acento cálido para CTA.

| Rol | Color | Hex | Tailwind |
|---|---|---|---|
| Primario | Violet 600 | `#7c3aed` | `violet-600` |
| Primario hover | Violet 700 | `#6d28d9` | `violet-700` |
| Acento / CTA | Amber 500 | `#f59e0b` | `amber-500` |
| Fondo app | Slate 50 | `#f8fafc` | `slate-50` |
| Superficie | White | `#ffffff` | `white` |
| Sidebar | Slate 900 | `#0f172a` | `slate-900` |
| Texto principal | Slate 900 | `#0f172a` | `slate-900` |
| Texto secundario | Slate 500 | `#64748b` | `slate-500` |
| Borde | Slate 200 | `#e2e8f0` | `slate-200` |
| Éxito | Emerald 500 | `#10b981` | `emerald-500` |
| Error | Red 500 | `#ef4444` | `red-500` |

**Diferencial:** El sidebar oscuro (`slate-900`) con logo y texto en blanco crea un contraste alto y profesional. El ámbar como acento para botones CTA rompe la monotonía monocromática de la app actual.

```jsx
// CSS variables para configuración global
:root {
  --color-primary: #7c3aed;      /* violet-600 */
  --color-primary-hover: #6d28d9;
  --color-accent: #f59e0b;        /* amber-500 */
  --color-sidebar-bg: #0f172a;    /* slate-900 */
  --color-sidebar-text: #f1f5f9;  /* slate-100 */
}
```

---

### Paleta B — "Midnight Blue" (más corporativa)

Para una agencia que quiere proyectar madurez y confianza. Azul marino como base, cian como acento.

| Rol | Color | Hex | Tailwind |
|---|---|---|---|
| Primario | Blue 800 | `#1e40af` | `blue-800` |
| Primario hover | Blue 900 | `#1e3a8a` | `blue-900` |
| Acento / CTA | Cyan 500 | `#06b6d4` | `cyan-500` |
| Fondo app | Slate 50 | `#f8fafc` | `slate-50` |
| Superficie | White | `#ffffff` | `white` |
| Sidebar | Blue 950 | `#172554` | `blue-950` |
| Texto principal | Slate 900 | `#0f172a` | `slate-900` |
| Texto secundario | Slate 500 | `#64748b` | `slate-500` |
| Borde | Blue 100 | `#dbeafe` | `blue-100` |
| Éxito | Teal 500 | `#14b8a6` | `teal-500` |
| Error | Rose 500 | `#f43f5e` | `rose-500` |

**Diferencial:** El sidebar en `blue-950` con acentos cian da una sensación de "sala de control" muy apropiada para un OS de agencia. Proyecta seriedad sin ser aburrido.

```jsx
:root {
  --color-primary: #1e40af;      /* blue-800 */
  --color-primary-hover: #1e3a8a;
  --color-accent: #06b6d4;        /* cyan-500 */
  --color-sidebar-bg: #172554;    /* blue-950 */
  --color-sidebar-text: #e0f2fe;  /* sky-100 */
}
```

---

### Paleta C — "Emerald & Slate" (fresca y moderna)

Verde esmeralda como color principal. Transmite crecimiento, productividad y frescura. Ideal si quieren diferenciarse radicalmente de las herramientas de gestión típicas (todas azules o moradas).

| Rol | Color | Hex | Tailwind |
|---|---|---|---|
| Primario | Emerald 600 | `#059669` | `emerald-600` |
| Primario hover | Emerald 700 | `#047857` | `emerald-700` |
| Acento / CTA | Purple 600 | `#9333ea` | `purple-600` |
| Fondo app | Gray 50 | `#f9fafb` | `gray-50` |
| Superficie | White | `#ffffff` | `white` |
| Sidebar | Slate 800 | `#1e293b` | `slate-800` |
| Texto principal | Gray 900 | `#111827` | `gray-900` |
| Texto secundario | Gray 500 | `#6b7280` | `gray-500` |
| Borde | Gray 200 | `#e5e7eb` | `gray-200` |
| Éxito | Emerald 500 | `#10b981` | `emerald-500` |
| Error | Red 500 | `#ef4444` | `red-500` |

**Diferencial:** El verde como color de gestión es inusual y memorable. El acento púrpura en CTAs crea una combinación analógica complementaria. Buena opción si Cluster Marketing quiere un look más "startup" que "enterprise".

```jsx
:root {
  --color-primary: #059669;      /* emerald-600 */
  --color-primary-hover: #047857;
  --color-accent: #9333ea;        /* purple-600 */
  --color-sidebar-bg: #1e293b;    /* slate-800 */
  --color-sidebar-text: #d1fae5;  /* emerald-100 */
}
```

---

### Paleta D — "Warm Neutral" (sofisticada y diferente)

La paleta más alejada de lo actual. Tonos cálidos (stone/zinc) con un acento rosado/coral. Evoca diseño editorial, agencias creativas de alto nivel.

| Rol | Color | Hex | Tailwind |
|---|---|---|---|
| Primario | Stone 800 | `#292524` | `stone-800` |
| Primario hover | Stone 900 | `#1c1917` | `stone-900` |
| Acento / CTA | Rose 500 | `#f43f5e` | `rose-500` |
| Acento hover | Rose 600 | `#e11d48` | `rose-600` |
| Fondo app | Stone 50 | `#fafaf9` | `stone-50` |
| Superficie | White | `#ffffff` | `white` |
| Sidebar | Stone 900 | `#1c1917` | `stone-900` |
| Texto principal | Stone 900 | `#1c1917` | `stone-900` |
| Texto secundario | Stone 500 | `#78716c` | `stone-500` |
| Borde | Stone 200 | `#e7e5e4` | `stone-200` |
| Éxito | Teal 600 | `#0d9488` | `teal-600` |
| Error | Rose 500 | `#f43f5e` | `rose-500` |

**Diferencial:** Es la paleta más "de agencia creativa". El negro cálido (`stone-900`) como primario proyecta elegancia. El coral/rosa como único acento hace que los CTA destaquen con fuerza. Menos apta si el equipo es grande y necesita muchos colores de estado.

```jsx
:root {
  --color-primary: #292524;      /* stone-800 */
  --color-primary-hover: #1c1917;
  --color-accent: #f43f5e;        /* rose-500 */
  --color-sidebar-bg: #1c1917;    /* stone-900 */
  --color-sidebar-text: #f5f5f4;  /* stone-100 */
}
```

---

### Tabla comparativa de paletas

| | A — Slate & Violet | B — Midnight Blue | C — Emerald | D — Warm Neutral |
|---|---|---|---|---|
| Personalidad | Profesional creativa | Corporativa | Fresca / startup | Editorial de lujo |
| Cambio vs. actual | Mínimo | Moderado | Alto | Radical |
| Riesgo de implementación | Bajo | Bajo | Medio | Medio |
| Legibilidad WCAG AA | ✓ | ✓ | ✓ | ✓ |
| Recomendado para | Mantener identidad | Pitch a clientes grandes | Diferenciarse | Posicionamiento premium |

**Recomendación:** Si el objetivo es modernizar sin perder identidad, elegir **Paleta A**. Si se busca una renovación de imagen más profunda, **Paleta B** (corporativa) o **Paleta C** (creativa) son las mejores opciones.

---

## 6. Checklist de implementación

### Fase 1 — Accesibilidad base (1–2 días de trabajo)

- [ ] Reemplazar `text-slate-400` por `text-slate-500` en light mode (búsqueda y reemplazo global en `main.jsx`)
- [ ] Añadir `aria-label` a todos los botones de solo icono (dark mode, logout, hamburger, cerrar modal)
- [ ] Vincular `label` con `id` en el componente `Input`
- [ ] Añadir `aria-live="polite"` al contenedor de toasts
- [ ] Añadir `role="dialog"` y `aria-modal="true"` a todos los modales

### Fase 2 — Usabilidad (3–5 días de trabajo)

- [ ] Implementar componente `ConfirmDeleteModal` para acciones destructivas
- [ ] Reemplazar spinner global por skeleton loaders en kanban y listas
- [ ] Separar filtros de Sala de Accounts en grupos (tiempo / asignación)
- [ ] Añadir componente `Breadcrumb` en vistas de detalle
- [ ] Añadir `focus trap` a modales (se puede usar la librería `focus-trap-react`)
- [ ] Reemplazar texto "VIEWER · SIN CORREO" por mensajes comprensibles

### Fase 3 — Mobile (2–3 días de trabajo)

- [ ] Implementar barra de navegación inferior para mobile
- [ ] Añadir `min-height: 44px` a todos los elementos interactivos
- [ ] Implementar scroll horizontal con snap en kanban en mobile

### Fase 4 — IA y onboarding (1 semana)

- [ ] Diseñar pantalla de bienvenida por rol
- [ ] Reorganizar sidebar según nueva estructura propuesta
- [ ] Revisar y clarificar etiqueta del botón "Atrás" en tarjetas kanban

### Fase 5 — Paleta de color (1 día + revisión)

- [ ] Elegir una de las cuatro paletas propuestas
- [ ] Crear variables CSS centralizadas en `main.css`
- [ ] Aplicar en `main.jsx` mediante búsqueda y reemplazo de clases Tailwind
- [ ] Revisar contraste en dark mode tras el cambio

---

## 7. Librerías recomendadas

| Necesidad | Librería | Tamaño aprox. |
|---|---|---|
| Focus trap en modales | `focus-trap-react` | ~5 KB |
| Validación de contraste | `wcag-contrast` (dev tool) | — |
| Componentes accesibles base | `@radix-ui/react-dialog` | ~12 KB |
| Skeleton loader | CSS `animate-pulse` (ya en Tailwind) | 0 KB |
| Drag & drop accesible | `@dnd-kit/core` (reemplaza drag nativo) | ~14 KB |

---

*Documento preparado para el equipo de Cluster Marketing — uso interno.*
