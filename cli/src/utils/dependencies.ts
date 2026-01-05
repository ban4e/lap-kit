import { getComponentRegistry } from './registry';
import { type RegistryItem } from '../schemas/registrySchema';

/**
 * Resolve all dependencies for a component recursively
 * Supports nested dependencies.registry array structure
 */
export async function resolveComponentDependencies({
    componentName,
    visited = new Set(),
    isLocal = false
}: {
    componentName: string;
    visited?: Set<string>;
    isLocal?: boolean | undefined;
}): Promise<RegistryItem[]> {
    // Prevent circular dependencies
    if (visited.has(componentName)) {
        return [];
    }

    visited.add(componentName);

    // Get component registry
    const component = await getComponentRegistry({ componentName, isLocal });
    if (!component) {
        console.warn(`⚠️  Component '${componentName}' not found in registry`);

        return [];
    }

    const allDependencies: RegistryItem[] = [component];

    // Resolve registry dependencies recursively from dependencies.registry array
    for (const depName of component.dependencies.registry) {
        const depComponents = await resolveComponentDependencies({
            componentName: depName,
            visited: new Set(visited),
            isLocal
        });
        allDependencies.push(...depComponents);
    }

    // Sort to ensure consistent order (main component first, then dependencies)
    return allDependencies.sort((a, b) => {
        if (a.name === componentName) return -1;
        if (b.name === componentName) return 1;

        return a.name.localeCompare(b.name);
    });
}

/**
 * Get all npm dependencies from resolved components
 * Reads from dependencies.external array
 */
export function getNpmDependencies(components: RegistryItem[]): string[] {
    const deps = new Set<string>();

    for (const component of components) {
        for (const dep of component.dependencies.external) {
            deps.add(dep);
        }
    }

    return Array.from(deps).sort();
}

/**
 * Get all shared utilities from resolved components
 * Reads from dependencies.shared array
 */
export function getSharedUtilities(components: RegistryItem[]): string[] {
    const utils = new Set<string>();

    for (const component of components) {
        for (const util of component.dependencies.shared) {
            utils.add(util);
        }
    }

    return Array.from(utils).sort();
}
