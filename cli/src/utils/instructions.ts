import chalk from 'chalk';

import { readStylesVars, type TailwindInfo } from './palette';

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

/** Generate Tailwind installation instructions */
export function generateTailwindInstallInstructions(): string {
    return [
        '',
        `${chalk.bgYellow('⚠️ Tailwind CSS not detected')}`,
        '',
        `To use lap-kit components, you need to install Tailwind CSS. Installation instructions can be found at ${chalk.blue('https://tailwindcss.com/docs/installation')}`,
        '',
        'After Tailwind CSS installation follow the palette setup instructions below.'
    ].join('\n');
}

/** Generate palette integration instructions */
export function generatePaletteInstructions({ twInfo }: { twInfo: TailwindInfo }): string {
    const instructions: string[] = [
        '',
        `${chalk.bgBlue('🎨 Color Palette Setup')}`,
        '',
        '1. Update your Tailwind config to use the palette from lap-kit.config.json:'
    ];

    const colorsInstruction = [
        `   Then in the ${chalk.bold('theme.colors')} section:`,
        `   ${chalk.gray('colors: {')}`,
        `     ${chalk.gray('...lapkitConfig.palette,')}`,
        `     ${chalk.gray('// your other colors')}`,
        `   ${chalk.gray('}')}`
    ];

    if (twInfo.configPath && twInfo.configExtension) {
        const configName = `tailwind.config.${twInfo.configExtension}`;
        const requireSyntax = twInfo.configExtension === 'cjs';

        if (requireSyntax) {
            instructions.push(
                '',
                `   In ${chalk.bold(configName)}, add:`,
                '',
                `   ${chalk.gray('const')} lapkitConfig = ${chalk.gray('require')}('./lap-kit.config.json');`,
                '',
                ...colorsInstruction
            );
        } else {
            instructions.push(
                '',
                `   In ${chalk.bold(configName)}, add:`,
                '',
                `   ${chalk.gray('import')} lapkitConfig ${chalk.gray('from')} './lap-kit.config.json';`,
                '',
                ...colorsInstruction
            );
        }
    } else {
        instructions.push(
            '',
            `   Create ${chalk.bold('tailwind.config.js')} and add:`,
            '',
            `   ${chalk.gray('import')} lapkitConfig ${chalk.gray('from')} './lap-kit.config.json';`,
            '',
            ...colorsInstruction
        );
    }

    return instructions.join('\n');
}

/** Generate CSS variables setup instructions */
export async function generateCssVariablesInstructions(
    { isLocal }: { isLocal?: boolean | undefined } = { isLocal: false }
): Promise<string> {
    const cssContent = await readStylesVars({ isLocal });

    if (!cssContent) {
        return '';
    }

    // Extract the CSS variables section (the @layer base section)
    // Handle nested braces by counting opening and closing braces
    const layerStart = cssContent.indexOf('@layer base');
    if (layerStart === -1) {
        return '';
    }

    const afterLayer = cssContent.substring(layerStart);
    const openBrace = afterLayer.indexOf('{');
    if (openBrace === -1) {
        return '';
    }

    // Find matching closing brace by counting braces
    let braceCount = 0;
    let endIndex = openBrace;
    for (let i = openBrace; i < afterLayer.length; i++) {
        if (afterLayer[i] === '{') {
            braceCount++;
        } else if (afterLayer[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
                endIndex = i;
                break;
            }
        }
    }

    const cssVariables = afterLayer.substring(openBrace + 1, endIndex).trim();

    return [
        '',
        '2. Add CSS variables to your main CSS file:',
        '',
        `   Add the following to your main CSS file (e.g., ${chalk.bold('index.css')} or ${chalk.bold('globals.css')}):`,
        '',
        chalk.gray('   @layer base {'),
        ...cssVariables
            .split('\n')
            .map((line) => (line.trim() ? `   ${chalk.gray(line)}` : ''))
            .filter((line) => line),
        chalk.gray('   }'),
        '',
        `⬆️  ${chalk.green('Follow the instructions above to set up color variables')}`
    ].join('\n');
}

/** Generate complete Tailwind setup instructions */
export async function generateTailwindSetupInstructions({
    twInfo,
    isLocal = false
}: {
    twInfo: TailwindInfo;
    isLocal?: boolean | undefined;
}): Promise<string> {
    const instructions: string[] = [];

    if (!twInfo.isInstalled) {
        instructions.push(generateTailwindInstallInstructions());
    }

    instructions.push(generatePaletteInstructions({ twInfo }));
    const cssInstructions = await generateCssVariablesInstructions({ isLocal });
    instructions.push(cssInstructions);

    return instructions.join('\n');
}
