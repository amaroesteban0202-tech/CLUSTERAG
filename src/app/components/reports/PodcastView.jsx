import React from "react";
import { UnifiedModuleKanbanView } from "./UnifiedModuleKanbanView.jsx";

export const PodcastView = ({
  events = [],
  accountTasks = [],
  editingTasks = [],
  managers = [],
  editors = [],
  currentUserProfile = null,
  onAddTask,
  canCreateTask = false,
  onTaskClick,
  onEventClick,
  onChangeAccountStatus,
  onChangeEditingStatus,
  onChangeEventStatus,
}) => (
  <UnifiedModuleKanbanView
    moduleKey="podcast"
    moduleTitle="Podcast"
    moduleEyebrow="Contenido"
    moduleDescription="Seguimiento visual de episodios, grabaciones y publicaciones con el mismo flujo operativo de las salas principales."
    searchPlaceholder="Buscar podcast..."
    statIcon="Microphone"
    statTone="rose"
    events={events}
    accountTasks={accountTasks}
    editingTasks={editingTasks}
    managers={managers}
    editors={editors}
    currentUserProfile={currentUserProfile}
    onAddTask={onAddTask}
    canCreateTask={canCreateTask}
    addButtonLabel="Nueva Tarea"
    onTaskClick={onTaskClick}
    onEventClick={onEventClick}
    onChangeAccountStatus={onChangeAccountStatus}
    onChangeEditingStatus={onChangeEditingStatus}
    onChangeEventStatus={onChangeEventStatus}
  />
);
