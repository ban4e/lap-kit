import { Icon } from '@/shared/ui/Icon';

import Select from './Select';

import type { Meta, StoryObj } from '@storybook/react';

// In a CSF file, this is the default export
const meta = { component: Select } satisfies Meta<typeof Select>;
export default meta;

const CheckIcon = <Icon className="fill-success" name="check" />;
const UserIcon = <Icon className="fill-current" name="user" />;
const icons = {
    CheckIcon,
    UserIcon
};

const mockOptions = [
    { value: 'chocolate', label: 'Chocolate' },
    { value: 'strawberry', label: 'Strawberry' },
    { value: 'vanilla', label: 'Vanilla' }
];

export const Overview: StoryObj<typeof Select> = {
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
        prefix: {
            control: 'text'
        },
        suffix: {
            options: Object.keys(icons),
            mapping: icons,
            control: {
                type: 'select',
                labels: {
                    CheckIcon: 'check',
                    UserIcon: 'user'
                }
            }
        },
        view: {
            control: 'select'
        }
    },
    args: {
        suffix: 'UserIcon',
        prefix: '',
        disabled: false,
        error: '',
        label: 'Very long overflowed label text',
        view: 'outlined'
    },
    parameters: {
        controls: { include: ['suffix', 'prefix', 'disabled', 'error', 'label', 'view'] }
    },
    render: (args) => (
        <div className="w-[240px]">
            <Select {...args} options={mockOptions} />
        </div>
    )
};
