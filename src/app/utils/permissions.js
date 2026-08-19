import { ROLE_DEFINITIONS } from "../../../shared/roles.js";

export const VIEW_PERMISSIONS = {
  dashboard: "view_dashboard",
  clients: "view_clients",
  "client-detail": "view_clients",
  chat: "view_client_chat",
  managers: "view_managers",
  "manager-detail": "view_managers",
  editors: "view_editors",
  "editor-detail": "view_editors",
  "account-room": "view_account_room",
  editions: "view_editions_room",
  "management-room": "view_management_room",
  "general-calendar": "view_general_calendar",
  calendar: "view_calendar",
  "control-center": "view_users",
  reports: "view_dashboard",
  performance: "view_dashboard",
  podcast: "view_dashboard",
  production: "view_dashboard",
};

export const getRoleMeta = (role) => ROLE_DEFINITIONS[role] || ROLE_DEFINITIONS.viewer;

export const userHasPermission = (profile, permission) => {
  if (!permission) return true;
  if (!profile || profile.isActive === false) return false;
  const permissions = getRoleMeta(profile.role).permissions || [];
  return permissions.includes("*") || permissions.includes(permission);
};

export const canAccessView = (profile, view) =>
  userHasPermission(profile, VIEW_PERMISSIONS[view]);
