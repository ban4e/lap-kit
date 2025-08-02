import path from 'path';

import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config';

export default defineConfig((configEnv) =>
    mergeConfig(
        viteConfig(configEnv),
        defineConfig({
            plugins: [
                react(),
                svgr({
                    svgrOptions: {
                        ref: true,
                        svgo: false,
                        titleProp: true,
                        exportType: 'named'
                    },
                    include: '**/*.svg',
                    exclude: ''
                })
            ],
            test: {
                globals: true, // Makes `describe`, `test`, `expect` globally available
                environment: 'jsdom',
                setupFiles: './src/__tests__/setupTests.ts',
                alias: [
                    // mocks SVG imports
                    { find: /.*\.svg$/, replacement: path.resolve(__dirname, './src/__mocks__/svgMock.tsx') }
                ],
                coverage: {
                    provider: 'v8',
                    reportsDirectory: './coverage',
                    reporter: ['text', 'json', 'html'],
                    all: true,
                    include: ['src/**/*.{ts,tsx}'],
                    exclude: [
                        '**/*.stories.{ts,tsx}',
                        '**/*.test.{ts,tsx}',
                        '**/__mocks__/**',
                        '**/__tests__/**',
                        '**/*.d.ts'
                    ]
                }
            }
        })
    )
);
