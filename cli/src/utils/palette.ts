import * as fs from 'fs';
import * as path from 'path';

import { findProjectRoot, fetchRemoteFile, readLocalFile } from './files';
import { paletteSchema, type Palette } from '../schemas/registrySchema';

export type TailwindInfo = {
    isInstalled: boolean;
    configPath: string | null;
    configExtension: 'js' | 'cjs' | 'ts' | 'mjs' | null;
};

const PALETTE_FILE = 'palette.json';
const STYLES_FILE = 'src/app/assets/styles/common/tailwind.css';

function readLocalPaletteFile() {
    try {
        const projectRoot = findProjectRoot();
        if (!projectRoot) {
            console.warn(`⚠️ Project root directory not found locally`);

            return null;
        }

        const filePath = path.join(projectRoot, PALETTE_FILE);
        const content = readLocalFile(filePath);

        return content ? paletteSchema.parse(JSON.parse(content)) : null;
    } catch (error) {
        console.error(`Error parsing ${PALETTE_FILE}:`, error);

        return null;
    }
}

async function readRemotePaletteFile() {
    try {
        const response = await fetchRemoteFile(PALETTE_FILE);

        return paletteSchema.parse(await response.json());
    } catch (error) {
        console.error('Error fetching remote palette file', error);

        return null;
    }
}

/** Read palette.json from lap-kit project root (local or remote) */
export async function readPaletteFile(
    { isLocal }: { isLocal?: boolean | undefined } = { isLocal: false }
): Promise<Palette | null> {
    if (isLocal) {
        return readLocalPaletteFile();
    } else {
        return await readRemotePaletteFile();
    }
}

function readLocalStylesVars() {
    try {
        const projectRoot = findProjectRoot();
        if (!projectRoot) {
            console.warn(`⚠️ Project root directory not found locally`);

            return null;
        }

        const filePath = path.join(projectRoot, STYLES_FILE);
        const content = readLocalFile(filePath);

        return content ? (JSON.parse(content) as string) : null;
    } catch (error) {
        console.error(`Error parsing ${PALETTE_FILE}:`, error);

        return null;
    }
}

async function readRemoteStylesVars() {
    try {
        const response = await fetchRemoteFile(STYLES_FILE);

        return await response.text();
    } catch (error) {
        console.error('Error fetching remote palette file', error);

        return null;
    }
}

/** Read CSS variables from tailwind.css in lap-kit project (local or remote) */
export async function readStylesVars(
    { isLocal }: { isLocal?: boolean | undefined } = { isLocal: false }
): Promise<string | null> {
    if (isLocal) {
        return readLocalStylesVars();
    } else {
        return readRemoteStylesVars();
    }
}

/** Detect if Tailwind CSS is installed by checking package.json */
export function detectTailwind(projectRoot: string = process.cwd()): boolean {
    const packageJsonPath = path.join(projectRoot, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
        return false;
    }

    try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as {
            dependencies?: Record<string, string>;
            devDependencies?: Record<string, string>;
        };

        return !!(packageJson.dependencies?.tailwindcss || packageJson.devDependencies?.tailwindcss);
    } catch {
        return false;
    }
}

/**
 * Find existing Tailwind config file
 */
export function detectTailwindConfig(projectRoot: string = process.cwd()): {
    path: string | null;
    extension: 'js' | 'cjs' | 'ts' | 'mjs' | null;
} {
    const configFiles = [
        { name: 'tailwind.config.js', extension: 'js' as const },
        { name: 'tailwind.config.cjs', extension: 'cjs' as const },
        { name: 'tailwind.config.ts', extension: 'ts' as const },
        { name: 'tailwind.config.mjs', extension: 'mjs' as const }
    ];

    for (const configFile of configFiles) {
        const configPath = path.join(projectRoot, configFile.name);

        if (fs.existsSync(configPath)) {
            return { path: configPath, extension: configFile.extension };
        }
    }

    return { path: null, extension: null };
}

/** Target project Tailwind config info */
export function getTailwindInfo(projectRoot: string = process.cwd()): TailwindInfo {
    const isInstalled = detectTailwind(projectRoot);
    const { path: configPath, extension: configExtension } = detectTailwindConfig(projectRoot);

    return {
        isInstalled,
        configPath,
        configExtension
    };
}
