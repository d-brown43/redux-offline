import React from 'react';
// also exported from '@storybook/react' if you can deal with breaking changes in 6.1
import { Story, Meta } from '@storybook/react/types-6-0';

import TestHarness from '../components/TestHarness';

export default {
  title: 'OfflineQueue/TestHarness',
  component: TestHarness,
} as Meta;

const Template: Story = (args) => <TestHarness {...args} />;

export const Primary = Template.bind({});

Primary.args = {};
