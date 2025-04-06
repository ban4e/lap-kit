import '../src/app/assets/styles/index.css';
import { withThemeByDataAttribute } from '@storybook/addon-themes';
import { Description, Stories, Subtitle, Title } from '@storybook/blocks';
import React from 'react';

import type { Preview } from '@storybook/react';

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

const preview: Preview = {
    // ...rest of preview
    //👇 Enables auto-generated documentation for all stories
    tags: ['autodocs'],
    parameters: {
        docs: {
            page: () => (
                <>
                    <Title />
                    <Subtitle />
                    <Description />
                    <Stories />
                </>
            )
        }
    }
};

export default preview;
