// TODO: 1. Add reusable custom docs template
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
    stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
    addons: [
        '@storybook/addon-links',
        '@storybook/addon-essentials',
        '@storybook/addon-themes',
        'storybook-addon-pseudo-states'
    ],
    framework: {
        name: '@storybook/react-vite',
        options: {}
    },
    docs: {
        defaultName: 'Overview',
        autodocs: 'tag'
    }
};

export default config;
