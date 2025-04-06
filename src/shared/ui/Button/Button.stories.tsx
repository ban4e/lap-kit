import React from 'react';

import { Icon } from '@/shared/ui/Icon';

import Button, { FILLS, THEMES } from './Button';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Button> = {
    component: Button
};

export default meta;
export const Default: StoryObj<typeof Button> = {
    argTypes: {
        theme: {
            options: Object.values(THEMES),
            control: { type: 'select' }
        },
        fill: {
            options: Object.values(FILLS),
            control: { type: 'select' }
        },
        children: {
            control: 'text'
        }
    },
    args: {
        theme: THEMES.PRIMARY,
        fill: FILLS.SOLID,
        children: 'My Button'
    },
    render: (args) => <Button {...args}>{args.children}</Button>
};

export const Examples: StoryObj<typeof Button> = {
    render: () => (
        <div className="grid auto-cols-max grid-flow-row gap-4 text-foreground">
            {Object.values(THEMES).map((theme) => (
                <div key={theme}>
                    <h3 className="mb-2 capitalize">{theme}</h3>
                    <div className="grid grid-flow-col auto-rows-max gap-2">
                        {Object.values(FILLS).map((fill) => (
                            <React.Fragment key={fill}>
                                <Button fill={fill} theme={theme}>
                                    Button <Icon className="ml-1 fill-current" name="check" width={14} />
                                </Button>
                                <Button disabled fill={fill} theme={theme}>
                                    Button <Icon className="ml-1 fill-current" name="check" width={14} />
                                </Button>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
};
