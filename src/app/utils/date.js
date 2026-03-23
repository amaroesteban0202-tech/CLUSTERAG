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
