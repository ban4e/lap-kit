import chalk from 'chalk';

/** Generate dependency installation instructions */
export function generateDependencyInstructions(dependencies: string[]): string {
    if (dependencies.length === 0) {
        return '';
    }

    return [
        '',
        `📦 ${chalk.bgBlue('Do not forget to install the dependencies:')}`,
        '',
        `   ${chalk.bold(`npm install ${dependencies.join(' ')}`)}`,
        '   -------- or --------',
        `   ${chalk.bold(`pnpm add ${dependencies.join(' ')}`)}`,
        ''
    ].join('\n');
}

/** Generate post-installation instructions */
export function generatePostInstallInstructions(): string {
    return ['', `✨ ${chalk.bgGreen('Component installed successfully!')}`].join('\n');
}
