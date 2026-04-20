import { cpSync, existsSync, mkdirSync, rmSync, copyFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

const resetDir = (targetDir) => {
    rmSync(targetDir, { recursive: true, force: true });
    mkdirSync(targetDir, { recursive: true });
};

const copyIntoPublic = (relativePath) => {
    const sourcePath = path.join(rootDir, relativePath);
    const targetPath = path.join(publicDir, relativePath);
    if (!existsSync(sourcePath)) {
        throw new Error(`No se encontro el recurso estatico requerido: ${relativePath}`);
    }

    mkdirSync(path.dirname(targetPath), { recursive: true });
    if (existsSync(sourcePath) && path.extname(sourcePath)) {
        copyFileSync(sourcePath, targetPath);
        return;
    }

    cpSync(sourcePath, targetPath, { recursive: true });
};

resetDir(publicDir);
copyIntoPublic('index.html');
copyIntoPublic('app-config.js');
copyIntoPublic('favicon.svg');
copyIntoPublic('src');

console.info('Static assets preparados en public/.');
