import * as fs from 'fs';
import * as path from 'path';

import { fetchRemoteFile, findProjectRoot, readLocalFile } from './files';
import {
    registryItemSchema,
    registryManifestSchema,
    type RegistryItem,
    type RegistryManifest
} from '../schemas/registrySchema';

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
    const manifestPath = '/registry/manifest/index.json';

    try {
        const response = await fetchRemoteFile(manifestPath);
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

    try {
        const content = readLocalFile(registryPath);

        return content ? registryItemSchema.parse(JSON.parse(content)) : null;
    } catch (error) {
        console.error(`Error reading local registry for ${componentName}:`, error);

        return null;
    }
}

async function getRemoteComponentRegistry(componentName: string): Promise<RegistryItem | null> {
    const registryFilePath = `/registry/${componentName}.json`;

    try {
        const response = await fetchRemoteFile(registryFilePath);

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
