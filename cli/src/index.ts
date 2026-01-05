#!/usr/bin/env node
/**Lap-Kit CLI component installer */
import { Command } from 'commander';

import { addCommand } from './commands/add';
import { initCommand } from './commands/init';

const program = new Command();

program.name('lap-kit').description('CLI for installing Lap Kit components').version('0.0.1');

program.command('init').description('Initialize your project and create config file').action(initCommand);

program
    .command('add')
    .description('Add components to your project')
    .argument('[components...]', 'Component names to add')
    .option('-y, --yes', 'Skip confirmation prompts')
    .option('--overwrite', 'Overwrite existing files')
    .option('--isLocal', 'Use local registry instead of remote')
    .action(addCommand);

// Handle no arguments
program.action(() => {
    program.help();
});

program.parse();
