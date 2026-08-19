import { normalizeEmail, normalizeNameKey } from "./text.js";
import { DEFAULT_MANAGEMENT_TEAM } from "../constants/app.constants.js";

export const MANAGEMENT_DIRECTORY = DEFAULT_MANAGEMENT_TEAM.map((member) => ({
  ...member,
  directoryKey: normalizeNameKey(member.name),
}));
export const getManagementDirectoryKey = (value = "") => {
  const sourceName = typeof value === "string" ? value : value?.name || "";
  const normalized = normalizeNameKey(sourceName);
  if (!normalized) return "";
  const exactMatch = MANAGEMENT_DIRECTORY.find(
    (member) => normalized === member.directoryKey,
  );
  if (exactMatch) return exactMatch.directoryKey;
  const aliasMatch = MANAGEMENT_DIRECTORY.find((member) =>
    normalized.startsWith(`${member.directoryKey} `),
  );
  return aliasMatch?.directoryKey || "";
};
export const getManagementDirectoryMeta = (value = "") => {
  const key = getManagementDirectoryKey(value);
  return (
    MANAGEMENT_DIRECTORY.find((member) => member.directoryKey === key) || null
  );
};
export const getResolvedManagementEmail = (record = {}) => {
  const directEmail = normalizeEmail(record.email);
  if (directEmail) return directEmail;
  return normalizeEmail(getManagementDirectoryMeta(record)?.email);
};
export const buildRecoveredManagerId = (name = "") => {
  const key = normalizeNameKey(name)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return key ? `recovered_manager_${key}` : "";
};
export const findDirectoryMemberByName = (name = "") => {
  const key = normalizeNameKey(name);
  return (
    MANAGEMENT_DIRECTORY.find((member) => member.directoryKey === key) || null
  );
};
export const getUserRolePriority = (role = "") => {
  const priorities = {
    super_admin: 500,
    operations: 400,
    management: 350,
    manager: 300,
    editor: 250,
    viewer: 100,
  };
  return priorities[role] || 200;
};
export const getVerificationPriority = (record = {}) => {
  if (
    record.emailVerified === true ||
    record.emailVerification?.status === "verified"
  )
    return 5;
  if (record.emailVerification?.status === "sent") return 4;
  if (record.emailVerification?.status === "pending") return 3;
  if (record.emailVerification?.status === "error") return 2;
  if (normalizeEmail(record.email)) return 1;
  return 0;
};
export const getUserRecordScore = (record = {}, referenceCount = 0) =>
  referenceCount * 1000 +
  (normalizeEmail(record.email) ? 220 : 0) +
  (record.authUid ? 180 : 0) +
  (record.isActive === false ? 0 : 20) +
  (record.seeded ? 5 : 10) +
  getVerificationPriority(record) * 25 +
  getUserRolePriority(record.role);
export const buildOrganizationTaskAssignees = (
  primaryMembers = [],
  organizationMembers = [],
  linkedProfileField = "",
) => {
  const organizationById = new Map(
    organizationMembers.map((member) => [member.id, member]),
  );
  const organizationByEmail = new Map(
    organizationMembers
      .map((member) => [normalizeEmail(member.email), member])
      .filter(([email]) => email),
  );
  const organizationByLinkedProfile = new Map(
    linkedProfileField
      ? organizationMembers
          .map((member) => [member[linkedProfileField], member])
          .filter(([profileId]) => profileId)
      : [],
  );

  const primaryOptions = primaryMembers.map((member) => {
    const linkedMember =
      organizationById.get(member.userId) ||
      organizationByLinkedProfile.get(member.id) ||
      organizationByEmail.get(normalizeEmail(member.email));
    return {
      ...member,
      email: normalizeEmail(linkedMember?.email || member.email),
      assigneeUserId: linkedMember?.id || member.userId || member.id,
      isActive: linkedMember?.isActive ?? member.isActive ?? true,
    };
  });
  const representedPrimaryIds = new Set(primaryOptions.map((member) => member.id));
  const representedUserIds = new Set(
    primaryOptions.map((member) => member.assigneeUserId).filter(Boolean),
  );
  const representedEmails = new Set(
    primaryOptions.map((member) => normalizeEmail(member.email)).filter(Boolean),
  );

  const organizationOptions = organizationMembers
    .filter((member) => member.isActive !== false)
    .filter(
      (member) =>
        !representedPrimaryIds.has(member.id) &&
        !representedUserIds.has(member.id) &&
        !representedEmails.has(normalizeEmail(member.email)) &&
        (!linkedProfileField ||
          !representedPrimaryIds.has(member[linkedProfileField])),
    )
    .map((member) => ({
      ...member,
      assigneeUserId: member.id,
      isOrganizationMember: true,
    }));

  return [...primaryOptions, ...organizationOptions].sort((left, right) =>
    String(left.name || "").localeCompare(String(right.name || ""), "es", {
      sensitivity: "base",
    }),
  );
};
export const findCurrentUserTaskAssignee = (profile, assignees = []) => {
  if (!profile || profile.isActive === false) return null;
  const profileIds = new Set(
    [profile.id, profile.linkedManagerId, profile.linkedEditorId].filter(Boolean),
  );
  const profileEmail = normalizeEmail(profile.email);
  return (
    assignees.find(
      (assignee) =>
        assignee.isActive !== false &&
        (profileIds.has(assignee.id) ||
          profileIds.has(assignee.assigneeUserId) ||
          (profileEmail && normalizeEmail(assignee.email) === profileEmail)),
    ) || null
  );
};
export const buildDuplicateUserGroups = (users = []) => {
  const userById = new Map(users.map((item) => [item.id, item]));
  const adjacency = new Map(users.map((item) => [item.id, new Set()]));
  const buckets = new Map();

  const addToken = (token, userId) => {
    if (!token) return;
    if (!buckets.has(token)) buckets.set(token, []);
    buckets.get(token).push(userId);
  };

  users.forEach((item) => {
    const email = normalizeEmail(item.email);
    if (email) addToken(`email:${email}`, item.id);
    if (item.role === "management") {
      const managementKey =
        item.managementKey || getManagementDirectoryKey(item);
      if (managementKey) addToken(`management:${managementKey}`, item.id);
    }
  });

  buckets.forEach((ids) => {
    if (ids.length < 2) return;
    const [firstId, ...restIds] = ids;
    restIds.forEach((otherId) => {
      adjacency.get(firstId)?.add(otherId);
      adjacency.get(otherId)?.add(firstId);
    });
  });

  const visited = new Set();
  const groups = [];
  users.forEach((item) => {
    if (visited.has(item.id)) return;
    const stack = [item.id];
    const component = [];
    while (stack.length > 0) {
      const currentId = stack.pop();
      if (!currentId || visited.has(currentId)) continue;
      visited.add(currentId);
      component.push(userById.get(currentId));
      adjacency.get(currentId)?.forEach((nextId) => {
        if (!visited.has(nextId)) stack.push(nextId);
      });
    }
    if (component.length > 1) groups.push(component.filter(Boolean));
  });

  return groups;
};
export const chooseCanonicalUserRecord = (group = [], referenceCounts = new Map()) =>
  [...group].sort((left, right) => {
    const scoreDelta =
      getUserRecordScore(right, referenceCounts.get(right.id) || 0) -
      getUserRecordScore(left, referenceCounts.get(left.id) || 0);
    if (scoreDelta !== 0) return scoreDelta;
    const leftCreatedAt = String(left.createdAt || "");
    const rightCreatedAt = String(right.createdAt || "");
    const createdAtDelta = leftCreatedAt.localeCompare(rightCreatedAt);
    if (createdAtDelta !== 0) return createdAtDelta;
    return String(left.id || "").localeCompare(String(right.id || ""));
  })[0] || null;
export const getVerificationMeta = (record) => {
  const safeRecord = record || {};
  if (!normalizeEmail(safeRecord.email))
    return { label: "Sin correo", color: "slate", isVerified: false };
  if (
    safeRecord.emailVerified === true ||
    safeRecord.emailVerification?.status === "verified"
  )
    return { label: "Verificado", color: "emerald", isVerified: true };
  if (safeRecord.emailVerification?.status === "error")
    return { label: "Error de envio", color: "red", isVerified: false };
  if (safeRecord.emailVerification?.status === "sent")
    return { label: "Verificacion enviada", color: "amber", isVerified: false };
  if (safeRecord.emailVerification?.status === "pending")
    return { label: "Pendiente verificar", color: "amber", isVerified: false };
  return { label: "Con correo", color: "blue", isVerified: false };
};
export const getLinkedProfileLabels = (record) => {
  const safeRecord = record || {};
  const labels = [];
  if (safeRecord.linkedManagerId) labels.push("Manager");
  if (safeRecord.linkedEditorId) labels.push("Editor");
  if (safeRecord.role === "management") labels.push("Gestion");
  return labels;
};

