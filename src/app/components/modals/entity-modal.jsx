import React, { useId } from "react";
import { Icon } from "../icons.jsx";
import { Button, Input, PhotoUploader } from "../ui.jsx";
import { useDialogA11y } from "../../hooks/useDialogA11y.js";
import {
  EDITING_HIERARCHY_OPTIONS,
  ROLE_DEFINITIONS,
} from "../../constants/app.constants.js";
import { EDITING_STATUS_OPTIONS } from "../../constants/editing.js";
import { getHondurasTodayStr } from "../../utils/date.js";
import { getEditingHierarchyId } from "../../utils/task-helpers.js";
import { normalizeEditingWorkflowStatus } from "../../utils/kpi.js";

export const Modal = ({
  config,
  onClose,
  clients,
  managers,
  editors,
  managementUsers,
  actions,
}) => {
  const { type, data, isEdit } = config;
  const dialogRef = useDialogA11y(config.isOpen, onClose);
  const dialogTitleId = useId();
  if (!config.isOpen) return null;

  const eventTitleMatch =
    type === "event" && data?.title
      ? data.title.match(/^(\d{2}:\d{2})\s*-\s*(.*)$/)
      : null;
  const eventDefaultTime = eventTitleMatch ? eventTitleMatch[1] : "";
  const eventDefaultTitle =
    type === "event"
      ? eventTitleMatch
        ? eventTitleMatch[2]
        : data?.title || ""
      : "";
  const normalizeEventTitle = (title = "") =>
    title.replace(/^\d{2}:\d{2}\s*-\s*/, "").trim();
  const buildEventTitle = (title = "", time = "") => {
    const cleanTitle = normalizeEventTitle(title);
    if (time && cleanTitle) return `${time} - ${cleanTitle}`;
    return cleanTitle;
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target));

    if (isEdit) {
      if (type === "client")
        actions.updateClient(data.id, {
          name: fd.name || "",
          niche: fd.niche || "",
          package: fd.package || "",
          instagram: fd.instagram || "",
          managerId: fd.managerId || "",
          photo: fd.photo || "",
        });
      if (type === "manager")
        actions.updateManager(data.id, {
          name: fd.name || "",
          email: fd.email || "",
          profession: fd.profession || "",
          photo: fd.photo || "",
        });
      if (type === "editor")
        actions.updateEditor(data.id, {
          name: fd.name || "",
          email: fd.email || "",
          profession: fd.profession || "",
          photo: fd.photo || "",
        });
      if (type === "event")
        actions.updateEvent(data.id, {
          title: buildEventTitle(fd.title, fd.time),
          date: fd.date || data.date || "",
        });
      if (type === "accountTask")
        actions.updateAccountTask(data.id, {
          title: fd.title || "",
          time: fd.time || data.time || "",
          contextId: fd.manager || data.contextId || "",
          clientId: fd.clientId || "",
          notes: fd.notes || "",
        });
      if (type === "editingTask")
        actions.updateEditingTask(data.id, {
          title: fd.title || "",
          priority: fd.priority || "normal",
          hierarchy: fd.hierarchy || "p2",
          status: fd.status || data.status || "editar",
          notes: fd.notes || "",
          contextId: fd.editor || data.contextId || "",
          clientId: fd.clientId || "",
        });
      if (type === "managementTask")
        actions.updateManagementTask(data.id, {
          date: fd.date || data.date || "",
          title: fd.title || "",
          time: fd.time || data.time || "",
          contextId: fd.member || data.contextId || "",
          clientId: fd.clientId || "",
          category: fd.category || "seguimiento",
          notes: fd.notes || "",
          notificationsEnabled: fd.notificationsEnabled === "on",
        });
      if (type === "user")
        actions.updateUserRecord(data.id, {
          name: fd.name || "",
          email: fd.email || "",
          role: fd.role || "viewer",
          isActive: fd.isActive === "true",
          profession: fd.profession || "",
          photo: fd.photo || "",
        });
    } else {
      if (type === "client")
        actions.addClient({
          name: fd.name || "",
          niche: fd.niche || "",
          package: fd.package || "",
          instagram: fd.instagram || "",
          managerId: fd.managerId || "",
          photo: fd.photo || "",
        });
      if (type === "manager")
        actions.addManager({
          name: fd.name || "",
          email: fd.email || "",
          profession: fd.profession || "",
          photo: fd.photo || "",
          assignedAccounts: [],
        });
      if (type === "editor")
        actions.addEditor({
          name: fd.name || "",
          email: fd.email || "",
          profession: fd.profession || "",
          photo: fd.photo || "",
        });
      if (type === "event")
        actions.addEvent({
          date: data.date,
          title: buildEventTitle(fd.title, fd.time),
          type: data.type,
        });
      if (type === "accountTask")
        actions.addAccountTask({
          date: data.date,
          title: fd.title || "",
          time: fd.time || "",
          contextId: fd.manager || data.contextId || "",
          clientId: fd.clientId || "",
          notes: fd.notes || "",
        });
      if (type === "editingTask")
        actions.addEditingTask({
          date: data.date,
          title: fd.title || "",
          priority: fd.priority || "normal",
          hierarchy: fd.hierarchy || "p2",
          status: fd.status || "editar",
          notes: fd.notes || "",
          contextId: fd.editor || data.contextId || "",
          clientId: fd.clientId || "",
        });
      if (type === "managementTask")
        actions.addManagementTask({
          date: fd.date || data.date || "",
          title: fd.title || "",
          time: fd.time || "",
          contextId: fd.member || data.contextId || "",
          clientId: fd.clientId || "",
          category: fd.category || "seguimiento",
          notes: fd.notes || "",
          notificationsEnabled: fd.notificationsEnabled === "on",
        });
      if (type === "user")
        actions.addUserRecord({
          name: fd.name || "",
          email: fd.email || "",
          role: fd.role || "viewer",
          isActive: fd.isActive === "true",
          profession: fd.profession || "",
          photo: fd.photo || "",
        });
    }
  };

  const titles = {
    client: "Cliente",
    manager: "Account Manager",
    editor: "Editor",
    event: "Produccion",
    accountTask: "Tarea de Account",
    editingTask: "Tarea de Edicion",
    managementTask: "Tarea de Gestion",
    user: "Usuario",
  };
  const selectClassName =
    "w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none";
  const textareaClassName =
    "w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-500 dark:placeholder:text-slate-500 h-24 text-sm";
  const submitColor = ["editingTask", "editor"].includes(type)
    ? "rose"
    : type === "accountTask"
      ? "indigo"
      : type === "managementTask"
        ? "violet"
        : type === "manager" || type === "client"
          ? "blue"
          : "purple";

  let displayDate = "";
  if (data?.date && typeof data.date === "string") {
    const [y, m, d] = data.date.split("-");
    displayDate = new Date(y, m - 1, d).toLocaleDateString("es-HN", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-[90] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        tabIndex={-1}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 outline-none"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950 shrink-0">
          <h3
            id={dialogTitleId}
            className="font-bold text-lg text-slate-800 dark:text-white"
          >
            {isEdit ? "Editar " : "Nuevo "}
            {titles[type]}
          </h3>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400"
          >
            <Icon name="X" size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scroll">
          <form onSubmit={onSubmit} className="space-y-4">
            {["event", "accountTask", "editingTask", "managementTask"].includes(
              type,
            ) &&
              !isEdit && (
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 mb-2">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                    Para el día
                  </p>
                  <p className="text-lg font-black text-slate-800 dark:text-white capitalize">
                    {displayDate}
                  </p>
                </div>
              )}

            {type === "client" && (
              <>
                <PhotoUploader
                  defaultValue={data?.photo}
                  label="Logo / Foto del cliente"
                />
                <Input
                  name="name"
                  placeholder="Nombre"
                  defaultValue={data?.name}
                  required
                />
                <Input
                  name="niche"
                  placeholder="Rubro"
                  defaultValue={data?.niche}
                  required
                />
                <Input
                  name="package"
                  placeholder="Paquete"
                  defaultValue={data?.package}
                  required
                />
                <Input
                  name="instagram"
                  placeholder="Link Instagram"
                  defaultValue={data?.instagram}
                />
                <select
                  name="managerId"
                  defaultValue={data?.managerId}
                  className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="">Asignar Manager (Opcional)</option>
                  {managers
                    .filter((manager) => manager.isActive !== false)
                    .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                    ))}
                </select>
              </>
            )}

            {type === "manager" && (
              <>
                <PhotoUploader defaultValue={data?.photo} />
                <Input
                  name="name"
                  placeholder="Nombre Completo"
                  defaultValue={data?.name}
                  required
                />
                <Input
                  name="profession"
                  placeholder="Profesión / Cargo (ej. Account Manager)"
                  defaultValue={data?.profession}
                />
                <Input
                  name="email"
                  type="email"
                  placeholder="Correo"
                  defaultValue={data?.email}
                  required
                />
              </>
            )}

            {type === "editor" && (
              <>
                <PhotoUploader defaultValue={data?.photo} />
                <Input
                  name="name"
                  placeholder="Nombre del Editor"
                  defaultValue={data?.name}
                  required
                />
                <Input
                  name="profession"
                  placeholder="Profesión / Cargo (ej. Editor de video)"
                  defaultValue={data?.profession}
                />
                <Input
                  name="email"
                  type="email"
                  placeholder="Correo"
                  defaultValue={data?.email}
                  required
                />
              </>
            )}

            {type === "event" && (
              <>
                <Input
                  name="title"
                  placeholder="Nombre Producción"
                  defaultValue={eventDefaultTitle}
                  required
                  autoFocus
                />
                {/* Al crear, el dia lo fija el calendario; al editar es la unica
                    forma de reprogramar la produccion a otra fecha. */}
                {isEdit && (
                  <Input
                    name="date"
                    type="date"
                    label="Fecha"
                    defaultValue={data?.date || ""}
                    required
                  />
                )}
                <Input
                  name="time"
                  type="time"
                  label="Hora (Opcional)"
                  defaultValue={eventDefaultTime}
                />
              </>
            )}

            {type === "accountTask" && (
              <>
                <Input
                  name="title"
                  placeholder="¿Qué hay que hacer/publicar?"
                  defaultValue={data?.title}
                  required
                  autoFocus
                />

                <select
                  name="clientId"
                  defaultValue={data?.clientId || ""}
                  className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="">Sin cliente (Tarea interna)</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <Input
                  name="time"
                  type="time"
                  label="Hora (Opcional)"
                  defaultValue={data?.time || ""}
                />

                <select
                  name="manager"
                  required
                  defaultValue={data?.contextId || ""}
                  className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="">Selecciona Manager...</option>
                  {managers
                    .filter((manager) => manager.isActive !== false)
                    .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                    ))}
                </select>

                <textarea
                  name="notes"
                  placeholder="Notas, copies, ideas..."
                  defaultValue={data?.notes}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-500 dark:placeholder:text-slate-500 h-24 text-sm"
                ></textarea>
              </>
            )}

            {type === "editingTask" && (
              <>
                <Input
                  name="title"
                  placeholder="Título del Video/Diseño"
                  defaultValue={data?.title}
                  required
                  autoFocus
                />

                <select
                  name="clientId"
                  defaultValue={data?.clientId || ""}
                  className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="">Sin cliente (Tarea interna)</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <select
                  name="priority"
                  required
                  defaultValue={data?.priority || "normal"}
                  className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-purple-500 outline-none font-bold text-slate-700 dark:text-slate-200"
                >
                  <option
                    value="normal"
                    className="text-amber-600 dark:text-amber-400"
                  >
                    Prioridad normal
                  </option>
                  <option
                    value="urgente"
                    className="text-red-600 dark:text-red-400"
                  >
                    Urgente
                  </option>
                  <option
                    value="recurrente"
                    className="text-emerald-600 dark:text-emerald-400"
                  >
                    Recurrente
                  </option>
                </select>

                <select
                  name="hierarchy"
                  required
                  defaultValue={
                    data?.hierarchy || getEditingHierarchyId(data || {})
                  }
                  className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-purple-500 outline-none font-bold text-slate-700 dark:text-slate-200"
                >
                  {EDITING_HIERARCHY_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <select
                  name="status"
                  required
                  defaultValue={normalizeEditingWorkflowStatus(
                    data?.status || "editar",
                  )}
                  className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-purple-500 outline-none font-bold text-slate-700 dark:text-slate-200"
                >
                  {EDITING_STATUS_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <select
                  name="editor"
                  required
                  defaultValue={data?.contextId || ""}
                  className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="">Selecciona Editor...</option>
                  {editors
                    .filter((editor) => editor.isActive !== false)
                    .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                    ))}
                </select>

                <textarea
                  name="notes"
                  placeholder="Notas, links a drive..."
                  defaultValue={data?.notes}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-500 dark:placeholder:text-slate-500 h-24 text-sm"
                ></textarea>
              </>
            )}

            {type === "managementTask" && (
              <>
                <Input
                  name="title"
                  placeholder="Titulo de la gestion"
                  defaultValue={data?.title}
                  required
                  autoFocus
                />

                <Input
                  name="date"
                  type="date"
                  label="Fecha limite *"
                  defaultValue={data?.date || getHondurasTodayStr()}
                  required
                />

                <select
                  name="clientId"
                  defaultValue={data?.clientId || ""}
                  className={`${selectClassName} font-bold`}
                >
                  <option value="">Sin cliente asociado</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <Input
                  name="time"
                  type="time"
                  label="Hora limite *"
                  defaultValue={data?.time || ""}
                  required
                />

                <select
                  name="member"
                  required
                  defaultValue={data?.contextId || ""}
                  className={selectClassName}
                >
                  <option value="">
                    {managementUsers.length > 0
                      ? "Selecciona integrante..."
                      : "Cargando integrantes..."}
                  </option>
                  {managementUsers
                    .filter((member) => member.isActive !== false)
                    .map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                      {member.email ? ` (${member.email})` : ""}
                    </option>
                    ))}
                </select>

                <select
                  name="category"
                  defaultValue={data?.category || "seguimiento"}
                  className={`${selectClassName} font-bold`}
                >
                  <option value="seguimiento">Seguimiento</option>
                  <option value="coordinacion">Coordinacion</option>
                  <option value="aprobacion">Aprobacion</option>
                  <option value="soporte">Soporte</option>
                </select>

                <textarea
                  name="notes"
                  placeholder="Detalle de la gestion, acuerdos o proximos pasos..."
                  defaultValue={data?.notes}
                  className={textareaClassName}
                ></textarea>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 cursor-pointer">
                  <input
                    type="checkbox"
                    name="notificationsEnabled"
                    defaultChecked={data?.notificationsEnabled !== false}
                    className="w-4 h-4 accent-violet-600"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      Recordar por correo
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Envia avisos al asignado 8 horas antes, al vencer y cada
                      24 horas si sigue abierta.
                    </p>
                  </div>
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 -mt-2">
                  El integrante asignado debe tener correo para que esta
                  automatizacion funcione.
                </p>
              </>
            )}

            {type === "user" && (
              <>
                <PhotoUploader defaultValue={data?.photo} />
                <Input
                  name="name"
                  placeholder="Nombre completo"
                  defaultValue={data?.name}
                  required
                  autoFocus
                />
                <Input
                  name="profession"
                  placeholder="Profesión / Cargo"
                  defaultValue={data?.profession}
                />
                <Input
                  name="email"
                  type="email"
                  placeholder="Correo autorizado"
                  defaultValue={data?.email}
                  required
                />

                <select
                  name="role"
                  defaultValue={data?.role || "viewer"}
                  className={`${selectClassName} font-bold`}
                >
                  {Object.entries(ROLE_DEFINITIONS).map(
                    ([roleId, roleMeta]) => (
                      <option key={roleId} value={roleId}>
                        {roleMeta.label}
                      </option>
                    ),
                  )}
                </select>

                <select
                  name="isActive"
                  defaultValue={data?.isActive === false ? "false" : "true"}
                  className={`${selectClassName} font-bold`}
                >
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </>
            )}

            <Button type="submit" full color={submitColor}>
              {isEdit ? "Guardar Cambios" : "Crear"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
