import React from "react";
import { UnifiedModuleKanbanView } from "./UnifiedModuleKanbanView.jsx";

export const ProductionView = ({
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
    moduleKey="production"
    moduleTitle="Producción"
    moduleEyebrow="Operación"
    moduleDescription="Vista consolidada del pipeline de producción para detectar cuellos de botella y cerrar entregas con rapidez."
    searchPlaceholder="Buscar production..."
    statIcon="MonitorPlay"
    statTone="cyan"
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
