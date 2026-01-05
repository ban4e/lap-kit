import * as fs from 'fs';
import * as path from 'path';

import { configSchema, type Config } from '../schemas/configSchema';

export const DEFAULT_CONFIG_FILE = 'lap-kit.config.json';
export const DEFAULT_COMPONENTS_PATH = 'src/shared/ui';
export const DEFAULT_COMPONENTS_ALIAS = '@/src/shared/lib';
export const DEFAULT_LIB_PATH = 'src/shared/lib';
export const DEFAULT_LIB_ALIAS = '@/src/shared/lib';

/**
 * Default configuration values
 */
export function getDefaultConfig(): Config {
    return {
        aliases: {
            components: DEFAULT_COMPONENTS_ALIAS,
            lib: DEFAULT_LIB_ALIAS
        },
        dirs: {
            components: DEFAULT_COMPONENTS_PATH,
            lib: DEFAULT_LIB_PATH
        },
        installedComponents: []
    };
}

/** Read config file from destination project */
export function readConfig(projectRoot: string = process.cwd()): Config | null {
    const configPath = path.join(projectRoot, DEFAULT_CONFIG_FILE);

    if (!fs.existsSync(configPath)) {
        return null;
    }

    try {
        const content = fs.readFileSync(configPath, 'utf-8');

        return configSchema.parse(JSON.parse(content));
    } catch (error) {
        console.error(`Error reading ${DEFAULT_CONFIG_FILE}:`, error);

        return null;
    }
}

/** Write config file to destination project */
export function writeConfig(config: Config, projectRoot: string = process.cwd()): void {
    const configPath = path.join(projectRoot, DEFAULT_CONFIG_FILE);
    const content = JSON.stringify(config, null, 2) + '\n';
    fs.writeFileSync(configPath, content, 'utf-8');
}
