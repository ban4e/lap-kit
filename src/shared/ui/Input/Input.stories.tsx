import Input from './Input';

import type { Meta, StoryObj } from '@storybook/react';

// In a CSF file, this is the default export
const meta = { component: Input } satisfies Meta<typeof Input>;
export default meta;

export const Overview: StoryObj<typeof Input> = {
    argTypes: {
        disabled: {
            control: 'boolean'
        },
        error: {
            control: 'text'
        },
        label: {
            control: 'text'
        },
        mask: {
            control: 'select'
        },
        view: {
            control: 'select'
        }
    },
    args: {
        disabled: false,
        error: '',
        label: 'Very long overflowed label text',
        view: 'outlined'
    },
    parameters: {
        controls: { include: ['disabled', 'error', 'label', 'mask', 'view'] }
    },
    render: (args) => (
        <div className="w-[240px]">
            <Input {...args} />
        </div>
    )
};
