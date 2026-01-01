import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const UI_COMPONENTS_PATH = '/src/shared/ui/';
const PEER_DEPS = ['react'];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __rootDir = path.join(__dirname, '..');

/** Analyze component source code and extract dependencies */
function analyzeComponent(componentName: string) {
    try {
        const componentDir = path.join(__rootDir, UI_COMPONENTS_PATH, componentName);

        if (!fs.existsSync(componentDir)) {
            throw new Error(`Component directory not found: ${componentDir}`);
        }

        // Find all files in component directory
        const files = findRegistryFiles({ dir: componentDir });
        const dependencies = {
            external: new Set(),
            registry: new Set(),
            shared: new Set()
        };

        for (const file of files) {
            const fileDeps = findFileDeps(file);
            dependencies.external = new Set([...dependencies.external, ...fileDeps.external]);
            dependencies.registry = new Set([...dependencies.registry, ...fileDeps.registry]);
            dependencies.shared = new Set([...dependencies.shared, ...fileDeps.shared]);
        }

        return {
            name: componentName,
            dependencies: {
                external: Array.from(dependencies.external).sort(),
                registry: Array.from(dependencies.registry).sort(),
                shared: Array.from(dependencies.shared).sort()
            },
            files
        };
    } catch (error) {
        if (error instanceof Error) {
            console.error(`❌ Failed to analyze component ${componentName}:`, error.message);
        } else {
            console.error(`❌ Failed to analyze component ${componentName}:`, String(error));
        }

        process.exit(1);
    }
}

const analysisCache = new Map<string, { external: Set<string>; shared: Set<string> }>();
function findFileDeps(file: string): { external: Set<string>; registry: Set<string>; shared: Set<string> } {
    // Check cache first
    if (analysisCache.has(file)) {
        return {
            external: new Set(analysisCache.get(file)!.external),
            registry: new Set(),
            shared: new Set(analysisCache.get(file)!.shared)
        };
    }

    const dependencies = {
        external: new Set<string>(),
        registry: new Set<string>(),
        shared: new Set<string>()
    };

    if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const content = fs.readFileSync(file, 'utf-8');
        const deps = parseDependencies(content);

        deps.forEach((dep) => {
            if (isExternalPackage(dep)) {
                !PEER_DEPS.includes(dep) && dependencies.external.add(dep);
            } else if (isSharedUtility(dep)) {
                const resolvedPath = resolveAliasPath(dep);
                dependencies.shared.add(resolvedPath);

                // Recursively analyze shared deps, but they'll be cached
                const sharedDeps = findFileDeps(resolvedPath);
                dependencies.external = new Set([...dependencies.external, ...sharedDeps.external]);
                dependencies.shared = new Set([...dependencies.shared, ...sharedDeps.shared]);
            } else if (isRegistryComponent(dep)) {
                dependencies.registry.add(dep.replace('@/shared/ui/', ''));
            }
        });
    }

    // Cache the result (only external and shared, since registry is component-specific)
    analysisCache.set(file, {
        external: new Set(dependencies.external),
        shared: new Set(dependencies.shared)
    });

    return dependencies;
}

/** Find all files inside registry dir */
function findRegistryFiles({ dir, relativePath = '' }: { dir: string; relativePath?: string }): string[] {
    const result: string[] = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const relPath = path.join(relativePath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            findRegistryFiles({
                dir: fullPath,
                relativePath: relPath
            });
        } else if (!/\.(stories|test)/.test(item)) {
            result.push(path.relative(__rootDir, fullPath));
        }
    }

    return result;
}

/** Parse import statements from file content */
function parseDependencies(content: string) {
    const deps = [];
    const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;

    let match;
    while ((match = importRegex.exec(content)) !== null) {
        deps.push(match[1]);
    }

    return deps;
}

/** Check if a path already has a file extension */
function hasFileExtension(filePath: string): boolean {
    return /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(filePath);
}

function getViteAliases(): Record<string, string> {
    const viteConfigPath = path.join(__rootDir, 'vite.config.ts');
    const viteConfigContent = fs.readFileSync(viteConfigPath, 'utf-8');

    const aliases: Record<string, string> = {};

    // Match alias definitions: { find: '@', replacement: path.resolve(__dirname, 'src') }
    const aliasRegex = /{ find: ['"]([^'"]+)['"], replacement: path\.resolve\(__dirname, ['"]([^'"]+)['"]\) }/g;

    let match;
    while ((match = aliasRegex.exec(viteConfigContent)) !== null) {
        const alias = match[1]; // e.g., '@'
        const replacement = match[2]; // e.g., 'src'
        aliases[alias] = replacement;
    }

    return aliases;
}

/** Resolve alias paths to actual file paths using Vite config */
function resolveAliasPath(importPath: string): string {
    const aliases = getViteAliases();

    // Check if path starts with an alias
    for (const [alias, replacement] of Object.entries(aliases)) {
        if (importPath.startsWith(alias)) {
            // Replace alias with replacement
            const resolved = importPath.replace(alias, replacement);

            // If import already has extension, use it as-is
            if (hasFileExtension(resolved)) {
                return resolved;
            }

            // Try different extensions in priority order
            const extensions = ['.ts', '.tsx', '.js', '.jsx'];
            const fullPath = path.join(__rootDir, resolved);

            for (const ext of extensions) {
                if (fs.existsSync(fullPath + ext)) {
                    return resolved + ext;
                }
            }

            throw new Error(`File not found: ${fullPath}`);
        }
    }

    // Return as-is if no alias found
    return importPath;
}

/** Determine if import is from npm package */
function isExternalPackage(importPath: string) {
    return !importPath.startsWith('@/') && !importPath.startsWith('./') && !importPath.startsWith('../');
}

/** Determine if import is from shared utilities */
function isSharedUtility(importPath: string) {
    return importPath.startsWith('@/shared/') && !importPath.startsWith('@/shared/ui/');
}

/** Determine if import is from another registry component */
function isRegistryComponent(importPath: string) {
    return importPath.startsWith('@/shared/ui/');
}

/**
 * Generate registry for single component
 */
function generateRegistry(componentName: string) {
    console.info(`Generating registry for ${componentName}...`);

    try {
        const registry = analyzeComponent(componentName);
        const registryPath = path.join(__dirname, `${componentName}.json`);

        fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
        console.info(`✅ Generated ${registryPath}`);
    } catch (error) {
        if (error instanceof Error) {
            console.error(`❌ Failed to generate registry for ${componentName}:`, error.message);
        } else {
            console.error(`❌ Failed to generate registry for ${componentName}:`, String(error));
        }
    }
}

/** Generate registries for all components */
function generateAllRegistries() {
    const componentsDir = path.join(__rootDir, UI_COMPONENTS_PATH);
    const components = fs
        .readdirSync(componentsDir, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

    console.info(`Found ${components.length} components: ${components.join(', ')}`);

    for (const component of components) {
        generateRegistry(component);
    }
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];

if (command === '--all') {
    generateAllRegistries();
} else if (command) {
    generateRegistry(command);
} else {
    console.info('Usage:');
    console.info('  node registry/autoGenerate.ts button');
    console.info('  node registry/autoGenerate.ts --all');
}
