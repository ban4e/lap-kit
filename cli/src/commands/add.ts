import * as fs from 'fs';
import * as path from 'path';

import chalk from 'chalk';
import inquirer from 'inquirer';

import { readConfig, writeConfig } from '../utils/config';
import { resolveComponentDependencies, getNpmDependencies, getSharedUtilities } from '../utils/dependencies';
import { copyComponentFiles, copySharedLibs, getSharedLibSubDir } from '../utils/files';
import { generateDependencyInstructions, generatePostInstallInstructions } from '../utils/instructions';
import { getAllRegistryComponents } from '../utils/registry';

import type { RegistryItem } from '../schemas/registrySchema';

export async function addCommand(
    components: string[] = [],
    options: { yes?: boolean; overwrite?: boolean; isLocal?: boolean } = { isLocal: false }
): Promise<void> {
    try {
        console.info(chalk.blue('📦 Adding components...\n'));

        let resultComponents = components;

        // Check if project is initialized
        const config = readConfig();
        if (!config) {
            console.info(chalk.red('❌ Project is not initialized. Run `npx lap-kit init` first.\n'));
            process.exit(1);
        }

        // If no components specified, show interactive selection
        if (resultComponents.length === 0) {
            const availableComponents = await getAllRegistryComponents({ isLocal: options.isLocal });

            if (availableComponents.length === 0) {
                console.info(chalk.red('❌ No components found in registry.\n'));
                process.exit(1);
            }

            const { selected } = await inquirer.prompt<{ selected: string[] }>([
                {
                    type: 'checkbox',
                    name: 'selected',
                    message: 'Select components to install:',
                    choices: availableComponents
                }
            ]);

            resultComponents = selected;
        }

        if (resultComponents.length === 0) {
            console.info(chalk.yellow('No components selected.'));

            return;
        }

        // Resolve all dependencies
        const allComponents: RegistryItem[] = [];
        const componentNames = new Set<string>();

        for (const componentName of resultComponents) {
            const resolved = await resolveComponentDependencies({
                componentName,
                isLocal: options.isLocal
            });

            for (const comp of resolved) {
                if (!componentNames.has(comp.name)) {
                    componentNames.add(comp.name);
                    allComponents.push(comp);
                }
            }
        }

        // Check for existing components
        const existingComponents: string[] = [];
        for (const component of allComponents) {
            const componentPath = path.join(process.cwd(), config.dirs.components, component.name);
            if (fs.existsSync(componentPath)) {
                existingComponents.push(component.name);
            }
        }

        // Prompt for overwrite if needed and not in yes mode
        let shouldOverwrite = options.overwrite || false;
        if (existingComponents.length > 0 && !options.yes && !options.overwrite) {
            const { overwrite } = await inquirer.prompt<{ overwrite: boolean }>([
                {
                    type: 'confirm',
                    name: 'overwrite',
                    message: `Components ${existingComponents.join(', ')} already exist. Overwrite?`,
                    default: false
                }
            ]);
            shouldOverwrite = overwrite;
        }

        // Get npm dependencies from external array
        const npmDeps = getNpmDependencies(allComponents);
        const sharedUtils = getSharedUtilities(allComponents);

        // Show what will be installed
        console.info(chalk.blue('\n📋 Installation summary:\n'));
        console.info(`${chalk.bold('Components:')} ${allComponents.map((c) => c.name).join(', ')}`);
        npmDeps.length > 0 && console.info(`${chalk.bold('NPM packages:')} ${npmDeps.join(', ')}`);
        sharedUtils.length > 0 &&
            console.info(
                `${chalk.bold('Shared utilities:')} ${sharedUtils.map((util) => getSharedLibSubDir(util) + '/' + path.basename(util)).join(', ')}`
            );
        console.info('');

        // Confirm installation (skip if --yes)
        if (!options.yes) {
            const { confirm } = await inquirer.prompt<{ confirm: boolean }>([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: 'Proceed with installation?',
                    default: true
                }
            ]);

            if (!confirm) {
                console.info(chalk.yellow('Cancelled.'));

                return;
            }
        }

        // Install components
        console.info(chalk.blue('\n📥 Installing components...\n'));

        for (const component of allComponents) {
            await copyComponentFiles({
                component,
                config,
                isLocal: options.isLocal,
                isOverwrite: shouldOverwrite
            });
        }

        // Copy shared utilities
        if (sharedUtils.length > 0) {
            console.info(chalk.blue('\n📥 Installing shared utilities...\n'));
            await copySharedLibs({
                paths: sharedUtils,
                config,
                isLocal: options.isLocal
            });
        }

        // Update config with installed components
        if (!config.installedComponents) {
            config.installedComponents = [];
        }
        const newInstalled = resultComponents.filter((c) => !config.installedComponents!.includes(c));
        config.installedComponents.push(...newInstalled);
        writeConfig(config);

        // Show instructions
        console.info(generatePostInstallInstructions());
        console.info(generateDependencyInstructions(npmDeps));
    } catch (error) {
        // Handle user interruption (Ctrl+C) or other errors
        if (error instanceof Error) {
            if (error.message.includes('User force closed') || error.name === 'ExitPromptError') {
                console.info(chalk.yellow('\n⚠️  Cancelled by user'));
                process.exit(0);
            }
        }

        // Handle other errors
        console.error(
            chalk.red('❌ Error during component installation:'),
            error instanceof Error ? error.message : error
        );
        process.exit(1);
    }
}
