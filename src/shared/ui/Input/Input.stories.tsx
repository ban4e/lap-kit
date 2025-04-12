import { Icon } from '@/shared/ui/Icon';

import { Input } from './Input';

import type { Meta, StoryObj } from '@storybook/react';

// In a CSF file, this is the default export
const meta = { component: Input } satisfies Meta<typeof Input>;
export default meta;

const CheckIcon = <Icon className="fill-success" name="check" />;
const UserIcon = <Icon className="fill-current" name="user" />;
const icons = {
    CheckIcon,
    UserIcon
};

const createMasksArr = <T extends readonly Parameters<typeof Input>[0]['mask'][]>(arr: T) => arr;
const MASKS = createMasksArr(['numeric']);

const createViewsArr = <T extends readonly Parameters<typeof Input>[0]['view'][]>(arr: T) => arr;
const VIEWS = createViewsArr(['outlined', 'filled', 'clear']);

export const Default: StoryObj<typeof Input> = {
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
            options: MASKS,
            control: 'select'
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
        view: 'outlined'
    },
    parameters: {
        controls: { include: ['suffix', 'prefix', 'disabled', 'error', 'label', 'mask', 'view'] }
    },
    render: (args) => (
        <div className="w-[240px]">
            <Input {...args} />
        </div>
    )
};
