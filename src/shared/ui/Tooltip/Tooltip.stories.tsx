import { Placement } from '@floating-ui/react';
import { useLayoutEffect, useState } from 'react';

import { Tooltip } from './Tooltip';

import type { Meta, StoryObj } from '@storybook/react';

// In a CSF file, this is the default export
const meta = { component: Tooltip } satisfies Meta<typeof Tooltip>;
export default meta;

const createPlacementsArr = <T extends readonly Placement[]>(arr: T) => arr;
const PLACEMENTS = createPlacementsArr([
    'top',
    'bottom',
    'left',
    'right',
    'top-start',
    'top-end',
    'bottom-start',
    'bottom-end',
    'left-start',
    'left-end',
    'right-start',
    'right-end'
]);

const createThemesArr = <T extends readonly Parameters<typeof Tooltip>[0]['theme'][]>(arr: T) => arr;
const THEMES = createThemesArr(['primary', 'primary-invert']);

export const Default: StoryObj<typeof Tooltip> = {
    argTypes: {
        children: {
            control: 'text'
        },
        trigger: {
            options: ['hover', 'focus', 'click'],
            control: {
                type: 'select'
            }
        },
        placement: {
            options: PLACEMENTS,
            control: {
                type: 'select'
            }
        },
        theme: {
            options: THEMES,
            control: {
                type: 'select'
            }
        }
    },
    args: {
        children: 'Tooltip content',
        delay: 150,
        trigger: 'hover',
        placement: 'bottom',
        offset: 5,
        theme: 'primary',
        withArrow: true,
        boundary: document.body
    },
    parameters: {
        controls: { exclude: ['boundary', 'flipOptions', 'hideOptions'] }
    },
    render: ({ children, ...args }) => (
        <div>
            <Tooltip {...args}>
                <Tooltip.Trigger />
                <Tooltip.Content>{children}</Tooltip.Content>
            </Tooltip>
        </div>
    )
};

export const ScrollExample: StoryObj<typeof Tooltip> = {
    parameters: {
        actions: { disable: true },
        controls: { disable: true }
    },
    render: () => {
        const Wrapper = () => {
            const [boundaryEl, setBoundaryEl] = useState<HTMLDivElement | null>(null);
            useLayoutEffect(() => {
                const el: HTMLDivElement | null = document.querySelector('#tooltips-container');
                setBoundaryEl(el);
            }, []);

            return (
                <div className="h-60 w-60 overflow-scroll" id="tooltips-container">
                    <div className="h-96 w-96">
                        <div>
                            <Tooltip autoOpen hideOptions={{ padding: 15 }}>
                                <Tooltip.Trigger />
                                <Tooltip.Content>{'Tooltip content'}</Tooltip.Content>
                            </Tooltip>
                        </div>
                        <div className="flex h-28 pl-32">
                            <Tooltip autoOpen boundary={boundaryEl || undefined}>
                                <Tooltip.Trigger />
                                <Tooltip.Content>{'Tooltip content'}</Tooltip.Content>
                            </Tooltip>
                        </div>
                    </div>
                </div>
            );
        };

        return <Wrapper />;
    }
};
