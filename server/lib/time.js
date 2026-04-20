export const nowIso = () => new Date().toISOString();

export const addMinutesToIso = (minutes, baseDate = new Date()) => {
    const date = new Date(baseDate);
    date.setMinutes(date.getMinutes() + minutes);
    return date.toISOString();
};

export const addHoursToIso = (hours, baseDate = new Date()) => {
    const date = new Date(baseDate);
    date.setHours(date.getHours() + hours);
    return date.toISOString();
};

export const isIsoExpired = (value = '') => {
    if (!value) return true;
    return new Date(value).getTime() <= Date.now();
};
