import { Toggle } from './Toggle';

import type { Meta, StoryObj } from '@storybook/react';

// In a CSF file, this is the default export
const meta = { component: Toggle } satisfies Meta<typeof Toggle>;
export default meta;

export const Default: StoryObj<typeof Toggle> = {
    argTypes: {
        disabled: {
            control: 'boolean'
        },
        error: {
            control: 'text'
        },
        children: {
            control: 'text'
        },
        type: {
            control: 'select'
        }
    },
    args: {
        children: 'Toggle label',
        type: 'checkbox',
        disabled: false,
        error: ''
    },
    parameters: {
        controls: { include: ['children', 'type', 'disabled', 'error'] }
    },
    render: (args) => <Toggle {...args} />
};
