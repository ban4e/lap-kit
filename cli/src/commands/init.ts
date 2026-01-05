import * as fs from 'fs';
import * as path from 'path';

import chalk from 'chalk';
import inquirer from 'inquirer';

import {
    writeConfig,
    DEFAULT_COMPONENTS_ALIAS,
    DEFAULT_COMPONENTS_PATH,
    DEFAULT_CONFIG_FILE,
    DEFAULT_LIB_ALIAS,
    DEFAULT_LIB_PATH
} from '../utils/config';

export async function initCommand(): Promise<void> {
    try {
        console.info(chalk.blue('🐾 Initializing lap-kit...\n'));

        // Check if components.json already exists
        const configPath = path.join(process.cwd(), DEFAULT_CONFIG_FILE);
        if (fs.existsSync(configPath)) {
            const { overwrite } = await inquirer.prompt<{ overwrite: boolean }>([
                {
                    type: 'confirm',
                    name: 'overwrite',
                    message: 'components.json already exists. Overwrite?',
                    default: false
                }
            ]);

            if (!overwrite) {
                console.info(chalk.yellow('Cancelled.'));

                return;
            }
        }

        // Prompt for configuration
        const paths = await inquirer.prompt<{
            componentsDir: string;
            componentsAlias: string;
            libDir: string;
            libAlias: string;
        }>([
            {
                type: 'input',
                name: 'componentsDir',
                message: 'Where should components be installed?',
                default: DEFAULT_COMPONENTS_PATH
            },
            {
                type: 'input',
                name: 'componentsAlias',
                message: 'What alias should be used for components folder?',
                default: DEFAULT_COMPONENTS_ALIAS
            },
            {
                type: 'input',
                name: 'libDir',
                message: 'Where should utilities be installed?',
                default: DEFAULT_LIB_PATH
            },
            {
                type: 'input',
                name: 'libAlias',
                message: 'What alias should be used for utilities folder?',
                default: DEFAULT_LIB_ALIAS
            }
        ]);

        // Create config
        const config = {
            // TODO: add type Config
            aliases: {
                components: paths.componentsAlias,
                lib: paths.libAlias
            },
            dirs: {
                components: paths.componentsDir,
                lib: paths.libDir
            },
            installedComponents: []
        };

        // Write config
        writeConfig(config);
        console.info(chalk.green('\n✅ Created components.json\n'));

        // Show instructions
        // console.log(generatePathAliasInstructions(config));

        console.info(chalk.blue('\n💡 Tip: Now run `npx lap-kit add <component>` to install components\n'));
    } catch (error) {
        // Handle user interruption (Ctrl+C) or other errors
        if (error instanceof Error) {
            if (error.message.includes('User force closed') || error.name === 'ExitPromptError') {
                console.info(chalk.yellow('\n⚠️  Cancelled by user'));
                process.exit(0);
            }
        }

        // Handle other errors
        console.error(chalk.red('❌ Error during initialization:'), error instanceof Error ? error.message : error);
        process.exit(1);
    }
}
