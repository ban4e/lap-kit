import { Icon } from './Icon';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Icon> = {
    component: Icon
};

export default meta;
type Story = StoryObj<typeof Icon>;

export const Default: Story = {
    render: () => <Icon name="check" />
};
