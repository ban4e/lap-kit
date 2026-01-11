import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { DEFAULT_LIB_PATH } from './config';

import type { Config } from '../schemas/configSchema';
import type { RegistryItem } from '../schemas/registrySchema';

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

/** Fetch a file from the remote GitHub repository  */
export async function fetchRemoteFile(filePath: string): Promise<Response> {
    const baseUrl = 'https://raw.githubusercontent.com/ban4e/lap-kit/main';
    const fileUrl = `${baseUrl}/${filePath}`;

    try {
        const response = await fetch(fileUrl);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;
    } catch (error) {
        // Re-throw with more context
        throw new Error(`Failed to fetch ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export function readLocalFile(filePath: string) {
    if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ File ${filePath} not found locally`);

        return null;
    }

    try {
        return fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
        console.error(`Error reading ${filePath} locally:`, error);

        return null;
    }
}

/** Ensure directory exists */
function ensureDirectory(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

/**
 * Transform import paths from @/shared/* to user's alias pattern
 */
function transformImports(content: string, config: Config): string {
    let transformed = content;

    // Transform @/shared/ui/* to user's components alias
    const componentsAlias = config.aliases.components;
    transformed = transformed.replace(/from\s+['"]@\/shared\/ui\/([^'"]+)['"]/g, `from '${componentsAlias}/$1'`);

    // Transform @/shared/lib/utils to user's lib alias
    const libAlias = config.aliases.lib;
    transformed = transformed.replace(/from\s+['"]@\/shared\/lib\/utils['"]/g, `from '${libAlias}/utils'`);

    // Transform @/shared/lib/hooks/* to user's lib alias
    transformed = transformed.replace(/from\s+['"]@\/shared\/lib\/hooks\/([^'"]+)['"]/g, `from '${libAlias}/hooks/$1'`);

    // Transform @/shared/lib/types/* to user's lib alias
    transformed = transformed.replace(/from\s+['"]@\/shared\/lib\/types\/([^'"]+)['"]/g, `from '${libAlias}/types/$1'`);

    // Transform @/shared/lib/* (general) to user's lib alias
    transformed = transformed.replace(/from\s+['"]@\/shared\/lib\/([^'"]+)['"]/g, `from '${libAlias}/$1'`);

    return transformed;
}

/** Copy component files to target directory */
export async function copyComponentFiles({
    component,
    config,
    isLocal = false,
    isOverwrite = false
}: {
    component: RegistryItem;
    config: Config;
    isLocal?: boolean | undefined;
    isOverwrite?: boolean | undefined;
}): Promise<void> {
    const projectRoot = isLocal ? findProjectRoot() : null;
    if (isLocal && !projectRoot) {
        throw new Error('Could not determine project root for local files');
    }

    const componentDir = path.join(process.cwd(), config.dirs.components, component.name);
    ensureDirectory(componentDir);

    for (const file of component.files) {
        const fileName = path.basename(file);
        const targetPath = path.join(componentDir, fileName);

        // Check if file exists
        if (fs.existsSync(targetPath) && !isOverwrite) {
            console.info(`⚠️ Skipping ${fileName} (already exists, use --overwrite to replace)`);
            continue;
        }

        // Ensure target directory exists
        ensureDirectory(path.dirname(targetPath));

        // Get file content
        let content: string;
        if (isLocal) {
            const sourcePath = path.join(projectRoot!, file);
            if (!fs.existsSync(sourcePath)) {
                console.warn(`⚠️ Source file not found: ${sourcePath}`);
                continue;
            }
            content = fs.readFileSync(sourcePath, 'utf-8');
        } else {
            try {
                const response = await fetchRemoteFile(file);
                content = await response.text();
            } catch (error) {
                console.warn(`⚠️ Failed to fetch remote file ${file}:`, error);
                continue;
            }
        }

        // Transform imports if it's a TypeScript/JavaScript file
        if (file.match(/\.(ts|tsx|js|jsx)$/)) {
            content = transformImports(content, config);
        }

        // Write file
        fs.writeFileSync(targetPath, content, 'utf-8');
        console.info(`✅ Copied ${fileName}`);
    }
}

/** Extract subdirectory path from shared lib file path */
export function getSharedLibSubDir(filePath: string): string {
    if (!filePath.startsWith(DEFAULT_LIB_PATH)) {
        console.warn(`⚠️ Unexpected shared lib path: ${filePath}`);
        process.exit(1);
    }

    // Get relative path from base: "src/shared/lib/hooks/usePulse.ts" -> "hooks/usePulse.ts"
    const relativePath = path.relative(DEFAULT_LIB_PATH, filePath);

    // Get directory: "hooks/usePulse.ts" -> "hooks"
    return path.dirname(relativePath);
}

/** Copy shared library files to target directory */
export async function copySharedLibs({
    paths,
    config,
    isLocal = false
}: {
    paths: string[];
    config: Config;
    isLocal?: boolean | undefined;
}): Promise<void> {
    const projectRoot = isLocal ? findProjectRoot() : null;
    if (isLocal && !projectRoot) {
        throw new Error('Could not determine project root for local files');
    }

    const libDir = path.join(process.cwd(), config.dirs.lib);
    ensureDirectory(libDir);

    for (const filePath of paths) {
        // Determine target subdirectory from filepath
        // e.g. "src/shared/lib/hooks/usePulse.ts" -> "hooks"
        const subDir = getSharedLibSubDir(filePath);
        const fileName = path.basename(filePath);

        const targetDir = path.join(libDir, subDir);
        const targetPath = path.join(targetDir, fileName);

        // Always skip if shared utility already exists (never overwrite)
        if (fs.existsSync(targetPath)) {
            console.info(`ℹ️ Shared lib ${fileName} already exists, skipping`);
            continue;
        }

        // Ensure target directory exists
        ensureDirectory(targetDir);

        // Get file content
        let content: string;
        if (isLocal) {
            const sourcePath = path.join(projectRoot!, filePath);
            if (!fs.existsSync(sourcePath)) {
                console.warn(`⚠️ Source file not found: ${sourcePath}`);
                continue;
            }
            content = fs.readFileSync(sourcePath, 'utf-8');
        } else {
            try {
                const response = await fetchRemoteFile(filePath);
                content = await response.text();
            } catch (error) {
                console.warn(`⚠️ Failed to fetch remote file ${filePath}:`, error);
                continue;
            }
        }

        // Transform imports if it's a TypeScript/JavaScript file
        if (filePath.match(/\.(ts|tsx|js|jsx)$/)) {
            content = transformImports(content, config);
        }

        // Write file
        fs.writeFileSync(targetPath, content, 'utf-8');
        console.info(`✅ Copied shared lib ${fileName} to ${config.dirs.lib}/${subDir}/`);
    }
}
