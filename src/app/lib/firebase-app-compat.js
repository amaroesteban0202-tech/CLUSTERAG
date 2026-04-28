const apps = [];

export const initializeApp = (config = {}) => {
    const app = { config };
    apps.push(app);
    return app;
};

export const getApps = () => apps;

export const getApp = () => {
    if (apps.length === 0) return initializeApp({});
    return apps[0];
};
