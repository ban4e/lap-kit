import * as path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
    plugins: [react()],
    resolve: { alias: [{ find: '@', replacement: path.resolve(__dirname, 'src') }] },
    css: {
        devSourcemap: true,
        modules: {
            localsConvention: 'camelCase',
            generateScopedName: mode === 'development' ? '[name]__[local]' : '_[local]_[hash:base64:2]'
        }
    }
}));
