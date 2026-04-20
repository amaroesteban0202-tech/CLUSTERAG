import { createApp } from './app.js';
import { env } from './config/env.js';

const app = await createApp();

app.listen(env.port, () => {
    console.info(`ClusterAG backend escuchando en http://127.0.0.1:${env.port}`);
});
