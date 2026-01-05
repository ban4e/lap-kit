import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import {
    registryItemSchema,
    registryManifestSchema,
    type RegistryItem,
    type RegistryManifest
} from '../schemas/registrySchema';

/** Find project root by looking for the registry directory */
export function findProjectRoot(maxDepth = 10): string | null {
    // Get the directory of this file
    const currentFileUrl = import.meta.url;
    const currentFilePath = fileURLToPath(currentFileUrl);
    let currentDir = path.dirname(currentFilePath);
    let depth = 0;

    while (depth < maxDepth) {
        // Check if registry directory exists in current directory
        const registryPath = path.join(currentDir, 'registry');

        if (fs.existsSync(registryPath) && fs.statSync(registryPath).isDirectory()) {
            return currentDir;
        }

        // Move up one directory
        const parentDir = path.dirname(currentDir);

        // Stop if we've reached the filesystem root
        if (parentDir === currentDir) {
            break;
        }

        currentDir = parentDir;
        depth++;
    }

    return null; // Registry directory not found
}

/** Get registry directory path from CLI package location */
function getLocalRegistryDir(): string | null {
    const projectRoot = findProjectRoot();
    if (!projectRoot) {
        return null;
    }

    const defaultRegistry = path.join(projectRoot, 'registry');

    if (fs.existsSync(defaultRegistry)) {
        return defaultRegistry;
    }

    return null;
}

/** Get registry components from public GitHub repository */
async function getRemoteRegistryComponents(): Promise<RegistryManifest['components']> {
    // Default to GitHub raw URL if no custom registry URL provided
    const baseUrl = 'https://raw.githubusercontent.com/ban4e/lap-kit/main';
    const manifestUrl = `${baseUrl}/registry/manifest/index.json`;

    try {
        const response = await fetch(manifestUrl);
        if (!response.ok) {
            console.warn(`Failed to fetch registry manifest: ${response.status}`);

            return [];
        }

        const manifest = registryManifestSchema.parse(await response.json());

        return manifest.components || [];
    } catch (error) {
        console.error('Error fetching remote registry components:', error);

        return [];
    }
}

/** Get all available components from registry */
export async function getAllRegistryComponents(
    { isLocal }: { isLocal?: boolean | undefined } = { isLocal: false }
): Promise<string[]> {
    if (isLocal) {
        const registryDir = getLocalRegistryDir();

        if (!registryDir) {
            return [];
        }

        const files = fs.readdirSync(registryDir);

        return files.filter((file: string) => file.endsWith('.json')).map((file: string) => file.replace('.json', ''));
    } else {
        return await getRemoteRegistryComponents();
    }
}

/** Read single component registry info from local registry
 * @param componentName - The name of the component to read
 * @returns The component registry info or null if not found
 */
function getLocalComponentRegistry(componentName: string): RegistryItem | null {
    const registryDir = getLocalRegistryDir();

    if (!registryDir) {
        console.warn(`⚠️ Registry directory not found locally`);

        return null;
    }

    const registryPath = path.join(registryDir, `${componentName}.json`);

    if (!fs.existsSync(registryPath)) {
        return null;
    }

    try {
        const content = fs.readFileSync(registryPath, 'utf-8');

        return registryItemSchema.parse(JSON.parse(content));
    } catch (error) {
        console.error(`Error reading local registry for ${componentName}:`, error);

        return null;
    }
}

async function getRemoteComponentRegistry(componentName: string): Promise<RegistryItem | null> {
    const registryFileUrl = `https://raw.githubusercontent.com/ban4e/lap-kit/main/registry/${componentName}.json`;

    try {
        const response = await fetch(registryFileUrl);
        if (!response.ok) {
            console.warn(`Failed to fetch registry component file: ${response.status}`);

            return null;
        }

        return registryItemSchema.parse(await response.json());
    } catch (error) {
        console.error('Error fetching remote registry component file', error);

        return null;
    }
}

/** Read single component registry info */
export async function getComponentRegistry({
    componentName,
    isLocal = false
}: {
    componentName: string;
    isLocal?: boolean | undefined;
}): Promise<RegistryItem | null> {
    if (isLocal) {
        return getLocalComponentRegistry(componentName);
    } else {
        return await getRemoteComponentRegistry(componentName);
    }
}
