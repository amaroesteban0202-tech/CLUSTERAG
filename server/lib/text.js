export const normalizeEmail = (value = '') => String(value || '').trim().toLowerCase();

export const normalizeNameKey = (value = '') => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

export const slugifyKey = (value = '') => normalizeNameKey(value).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
