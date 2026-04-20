import { COLLECTION_PERMISSIONS, ROLE_DEFINITIONS } from '../constants/permissions.js';

export const getRoleMeta = (role = '') => ROLE_DEFINITIONS[role] || ROLE_DEFINITIONS.viewer;

export const hasPermission = (userRecord, permission) => {
    if (!permission) return true;
    if (!userRecord || userRecord.isActive === false) return false;
    const permissions = getRoleMeta(userRecord.role).permissions || [];
    return permissions.includes('*') || permissions.includes(permission);
};

export const getCollectionPermission = (collectionName, action) => COLLECTION_PERMISSIONS[collectionName]?.[action] || null;
