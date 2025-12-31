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
        if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            const content = fs.readFileSync(file, 'utf-8');
            const deps = parseDependencies(content);

            deps.forEach((dep) => {
                if (isExternalPackage(dep)) {
                    !PEER_DEPS.includes(dep) && dependencies.external.add(dep);
                } else if (isSharedUtility(dep)) {
                    dependencies.shared.add(dep);
                } else if (isRegistryComponent(dep)) {
                    // i.e. @/shared/ui/FieldContainer => FieldContainer
                    dependencies.registry.add(dep.replace('@/shared/ui/', ''));
                }
            });
        }
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
