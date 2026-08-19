export const normalizeEmail = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase();
export const normalizeNameKey = (value = "") =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
export const normalizeTimeValue = (value = "") => {
  const match = String(value || "")
    .trim()
    .match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return "";
  const [, hours, minutes] = match;
  const normalizedHours = hours.padStart(2, "0");
  if (Number(normalizedHours) > 23 || Number(minutes) > 59) return "";
  return `${normalizedHours}:${minutes}`;
};
export const nowIso = () => new Date().toISOString();
