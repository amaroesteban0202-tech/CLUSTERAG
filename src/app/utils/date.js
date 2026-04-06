export const getHondurasDateString = (dateObj = new Date()) => {
    const formatter = new Intl.DateTimeFormat('es-HN', {
        timeZone: 'America/Tegucigalpa',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    const parts = formatter.formatToParts(dateObj);
    const y = parts.find((p) => p.type === 'year').value;
    const m = parts.find((p) => p.type === 'month').value;
    const d = parts.find((p) => p.type === 'day').value;
    return `${y}-${m}-${d}`;
};

export const getHondurasTodayStr = () => getHondurasDateString(new Date());

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
const padDateSegment = (value) => String(value).padStart(2, '0');

export const normalizeDateOnlyString = (value = '') => {
    if (typeof value !== 'string') return '';
    const trimmedValue = value.trim();
    if (!trimmedValue) return '';

    const directMatch = trimmedValue.match(DATE_ONLY_PATTERN);
    if (directMatch) {
        const [, year, month, day] = directMatch;
        return `${year}-${padDateSegment(month)}-${padDateSegment(day)}`;
    }

    const parsedDate = new Date(trimmedValue);
    if (Number.isNaN(parsedDate.getTime())) return '';
    return getHondurasDateString(parsedDate);
};

export const compareDateOnlyStrings = (leftValue = '', rightValue = '') => {
    const normalizedLeft = normalizeDateOnlyString(leftValue);
    const normalizedRight = normalizeDateOnlyString(rightValue);
    if (!normalizedLeft && !normalizedRight) return 0;
    if (!normalizedLeft) return -1;
    if (!normalizedRight) return 1;
    return normalizedLeft.localeCompare(normalizedRight);
};

export const isDateBeforeDateString = (value = '', referenceValue = getHondurasTodayStr()) => (
    compareDateOnlyStrings(value, referenceValue) < 0
);

const dateOnlyStringToUtcTimestamp = (value = '') => {
    const normalizedValue = normalizeDateOnlyString(value);
    if (!normalizedValue) return null;
    const [year, month, day] = normalizedValue.split('-').map(Number);
    return Date.UTC(year, month - 1, day);
};

export const getDateOnlyDiffDays = (leftValue = '', rightValue = getHondurasTodayStr()) => {
    const leftTimestamp = dateOnlyStringToUtcTimestamp(leftValue);
    const rightTimestamp = dateOnlyStringToUtcTimestamp(rightValue);
    if (leftTimestamp === null || rightTimestamp === null) return 0;
    return Math.round((leftTimestamp - rightTimestamp) / 86400000);
};

export const resolveStoredTaskRoomDate = (currentDate = '', savedAt = '', today = getHondurasTodayStr()) => {
    const normalizedToday = normalizeDateOnlyString(today) || getHondurasTodayStr();
    const normalizedCurrentDate = normalizeDateOnlyString(currentDate) || normalizedToday;
    const normalizedSavedAt = normalizeDateOnlyString(savedAt);
    const isPastDate = compareDateOnlyStrings(normalizedCurrentDate, normalizedToday) < 0;
    const isStaleState = !normalizedSavedAt || compareDateOnlyStrings(normalizedSavedAt, normalizedToday) < 0;
    return isPastDate && isStaleState ? normalizedToday : normalizedCurrentDate;
};
