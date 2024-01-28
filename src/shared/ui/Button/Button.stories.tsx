import { Icon } from '@/shared/ui/Icon';

import Button, { THEMES } from './Button';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Button> = {
    component: Button
};

export default meta;
export const Overview: StoryObj<typeof Button> = {
    argTypes: {
        theme: {
            options: Object.values(THEMES),
            control: { type: 'select' }
        },
        children: {
            control: 'text'
        }
    },
    args: {
        theme: THEMES.PRIMARY,
        children: 'My Button'
    },
    render: (args) => <Button {...args}>{args.children}</Button>
};

export const Examples: StoryObj<typeof Button> = {
    render: () => (
        <div className="grid auto-cols-max grid-flow-col gap-4">
            <div>
                <h3 className="mb-4">Primary</h3>
                <div className="grid grid-flow-row auto-rows-max gap-2">
                    <Button>Button</Button>
                    <Button>
                        Button <Icon className="ml-1 fill-current" name="check" width={14} />
                    </Button>
                </div>
            </div>
            <div>
                <h3 className="mb-4">Secondary</h3>
                <div className="grid grid-flow-row auto-rows-max gap-2">
                    <Button theme="secondary">Button</Button>
                    <Button theme="secondary">
                        Button <Icon className="ml-1 fill-current" name="check" width={14} />
                    </Button>
                </div>
            </div>
        </div>
    )
};
