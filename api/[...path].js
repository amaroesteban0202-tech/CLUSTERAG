let appPromise = null;

const getApp = async () => {
    if (!appPromise) {
        appPromise = import('../app.js').then((module) => module.default);
    }
    return appPromise;
};

export default async function handler(req, res) {
    try {
        const app = await getApp();
        return app(req, res);
    } catch (error) {
        console.error('No se pudo inicializar la funcion de Vercel:', error);
        res.status(500).json({
            error: {
                message: error?.message || 'No se pudo inicializar el backend.',
                code: error?.code || 'vercel/bootstrap-failed'
            }
        });
    }
}
