import { RangeSlider } from '@/shared/ui/RangeSlider/RangeSlider';

import type { Meta, StoryObj } from '@storybook/react';

// In a CSF file, this is the default export
const meta = { component: RangeSlider } satisfies Meta<typeof RangeSlider>;
export default meta;

const mockRange = { min: 0, max: 100 };
const createOrientationsArr = <T extends readonly Parameters<typeof RangeSlider>[0]['orientation'][]>(arr: T) => arr;
const ORIENTATIONS = createOrientationsArr(['horizontal', 'vertical']);

export const Single: StoryObj<typeof RangeSlider> = {
    argTypes: {
        orientation: {
            options: ORIENTATIONS,
            control: 'select'
        },
        start: {
            control: { type: 'range', min: 0, max: 100, step: 1 }
        }
    },
    args: {
        connect: 'lower',
        orientation: 'horizontal',
        start: 50,
        step: 1,
        tooltips: [{ to: (val: number) => Number.parseInt(val.toString(), 10) }]
    },
    parameters: {
        controls: { include: ['orientation', 'start', 'step'] }
    },
    render: (args) => (
        <div
            key={args.orientation} // to force re-render
            className={args.orientation === 'horizontal' ? 'w-[240px] pt-10' : 'h-[240px] pl-10'}
        >
            <RangeSlider {...args} range={mockRange} />
        </div>
    )
};

export const Multi: StoryObj<typeof RangeSlider> = {
    argTypes: {
        orientation: {
            options: ORIENTATIONS,
            control: 'select'
        }
    },
    args: {
        connect: true,
        orientation: 'horizontal',
        start: [25, 75],
        step: 1,
        tooltips: [
            { to: (val: number) => Number.parseInt(val.toString(), 10) },
            { to: (val: number) => Number.parseInt(val.toString(), 10) }
        ]
    },
    parameters: {
        controls: { include: ['orientation', 'start', 'step'] }
    },
    render: (args) => (
        <div
            key={args.orientation} // to force re-render
            className={args.orientation === 'horizontal' ? 'w-[240px] pt-10' : 'h-[240px] pl-10'}
        >
            <RangeSlider {...args} range={mockRange} />
        </div>
    )
};
