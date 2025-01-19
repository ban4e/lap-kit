import * as path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import dynamicImport from 'vite-plugin-dynamic-import';
import svgr from 'vite-plugin-svgr';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
    plugins: [
        react(),
        svgr({
            // see details https://github.com/pd4d10/vite-plugin-svgr/issues/90#issuecomment-1781264477
            include: '**/*.svg',
            exclude: ''
        }),
        dynamicImport()
    ],
    resolve: {
        alias: [
            { find: '@', replacement: path.resolve(__dirname, 'src') },
            { find: '@assets', replacement: path.resolve(__dirname, 'src/app/assets') }
        ]
    },
    css: {
        devSourcemap: true,
        modules: {
            generateScopedName: mode === 'development' ? '[name]__[local]' : '_[local]_[hash:base64:2]'
        }
    }
}));
