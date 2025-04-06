import { Icon } from '@/shared/ui/Icon';

import { Select } from './Select';

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

const createViewsArr = <T extends readonly Parameters<typeof Select>[0]['view'][]>(arr: T) => arr;
const VIEWS = createViewsArr(['outlined', 'filled', 'clear']);

export const Default: StoryObj<typeof Select> = {
    argTypes: {
        disabled: {
            control: 'boolean'
        },
        error: {
            control: 'text'
        },
        isMulti: {
            control: 'boolean'
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
            options: VIEWS,
            control: 'select'
        }
    },
    args: {
        suffix: 'UserIcon',
        prefix: '',
        disabled: false,
        error: '',
        label: 'Very long overflowed label text',
        view: 'outlined',
        isMulti: false
    },
    parameters: {
        controls: { include: ['suffix', 'prefix', 'disabled', 'isMulti', 'error', 'label', 'view'] }
    },
    render: (args) => (
        <div
            key={args.view} // force re-render
            className="w-[240px]"
        >
            <Select {...args} options={mockOptions} />
        </div>
    )
};
