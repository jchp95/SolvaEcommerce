import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import plugin from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
import { env } from 'process';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
    // Solo generar/usar certs cuando levantás el dev server local
    const isDev = command === 'serve' && !env.CI && !env.VERCEL && mode !== 'production';

    // Variables que usabas para backend .NET
    const target = env.ASPNETCORE_HTTPS_PORT
        ? `https://localhost:${env.ASPNETCORE_HTTPS_PORT}`
        : env.ASPNETCORE_URLS
            ? env.ASPNETCORE_URLS.split(';')[0]
            : 'https://localhost:7091';

    // Preparar configuración del server solo en dev
    let serverConfig = undefined;

    if (isDev) {
        const baseFolder =
            env.APPDATA !== undefined && env.APPDATA !== ''
                ? `${env.APPDATA}/ASP.NET/https`
                : `${env.HOME}/.aspnet/https`;

        const certificateName = "tiendaonline.client";
        const certFilePath = path.join(baseFolder, `${certificateName}.pem`);
        const keyFilePath = path.join(baseFolder, `${certificateName}.key`);

        if (!fs.existsSync(baseFolder)) {
            fs.mkdirSync(baseFolder, { recursive: true });
        }

        if (!fs.existsSync(certFilePath) || !fs.existsSync(keyFilePath)) {
            const res = child_process.spawnSync(
                'dotnet',
                [
                    'dev-certs',
                    'https',
                    '--export-path',
                    certFilePath,
                    '--format',
                    'Pem',
                    '--no-password',
                ],
                { stdio: 'inherit' }
            );

            if (res.status !== 0) {
                throw new Error("Could not create certificate.");
            }
        }

        // Config del dev server (solo se aplica en `vite serve`)
        serverConfig = {
            port: 14419,                 // fija el puerto que usas y que permitiste en CORS
            https: {
                key: fs.readFileSync(keyFilePath),
                cert: fs.readFileSync(certFilePath),
            },
            proxy: {
                // PROXY DE TU API
                '/api': {
                    target: 'http://localhost:5256',  // o 'https://localhost:7091'
                    changeOrigin: true,
                    secure: false
                },
                // PROXY PARA ARCHIVOS ESTÁTICOS (uploads)
                '/uploads': {
                    target: 'http://localhost:5256',
                    changeOrigin: true,
                    secure: false
                },
                // lo que ya tenías
                '^/weatherforecast': {
                    target,
                    secure: false
                }
            }
        };
    }

    return {
        plugins: [plugin()],
        resolve: {
            alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
        },
        // En build (Vercel) esto queda undefined y no ejecuta nada de certs
        server: serverConfig
    };
});
