import '../src/app/assets/styles/index.css';
import { withThemeByDataAttribute } from '@storybook/addon-themes';

export const decorators = [
    withThemeByDataAttribute({
        themes: {
            light: 'light',
            dark: 'dark'
        },
        defaultTheme: 'light',
        attributeName: 'data-mode'
    })
];
