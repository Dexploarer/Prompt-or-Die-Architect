import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DocViewer } from '../DocViewer';

const sample = {
  title: 'Ride Share Application Plan',
  summary: 'A comprehensive plan covering auth, ride requests, matching, tracking, and admin ops.',
  sections: [
    { heading: 'Executive Summary', content: 'Build a ride-hailing platform for passengers, drivers, and admins.' },
    { heading: 'Core Functionalities', content: 'Ride requests, driver matching, real-time tracking, payments, admin dashboard.' }
  ],
  backlog: [
    { id: 'A-1', title: 'Passenger Signup', priority: 'High', est: 'M', assignees: ['FD','BD'] },
    { id: 'A-2', title: 'Driver Matching', priority: 'High', est: 'C', assignees: ['BD','DS'] }
  ],
  risks: ['Regulatory compliance', 'Payment disputes', 'GPS accuracy'],
  open_questions: ['Preferred regions for launch?', 'Driver background check provider?']
};

const meta: Meta<typeof DocViewer> = {
  title: 'Components/DocViewer',
  component: DocViewer,
  args: {
    json: JSON.stringify(sample, null, 2),
  },
};

export default meta;

type Story = StoryObj<typeof DocViewer>;

export const Default: Story = {};
