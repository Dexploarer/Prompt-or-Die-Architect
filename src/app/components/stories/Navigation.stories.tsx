import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Navigation } from '../Navigation';

const meta: Meta<typeof Navigation> = {
  title: 'Components/Navigation',
  component: Navigation,
  parameters: {
    nextjs: {
      appDirectory: true,
    },
  },
};

export default meta;

type Story = StoryObj<typeof Navigation>;

export const Default: Story = {};

Default.storyName = 'Default';
