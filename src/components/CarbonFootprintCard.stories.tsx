import CarbonFootprintCard from './CarbonFootprintCard';
const action =
  (name: string) =>
  (...args: any[]) =>
    console.log(name, ...args);
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { View } from 'react-native';

const meta: Meta<typeof CarbonFootprintCard> = {
  title: 'Components/CarbonFootprintCard',
  component: CarbonFootprintCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A card component that displays carbon footprint data with interactive elements and progress tracking.',
      },
    },
  },
  args: {
    onCategoryPress: action('category-press'),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Default: Story = {
  args: {
    totalEmissions: 1250,
    data: {
      transport: 400,
      energy: 500,
      food: 200,
      waste: 150,
    },
  },
};

// Low emissions (good performance)
export const LowEmissions: Story = {
  args: {
    totalEmissions: 450,
    data: {
      transport: 150,
      energy: 100,
      food: 150,
      waste: 50,
    },
  },
};

// High emissions (needs improvement)
export const HighEmissions: Story = {
  args: {
    totalEmissions: 2800,
    data: {
      transport: 1200,
      energy: 800,
      food: 500,
      waste: 300,
    },
  },
};

// Multiple cards showcase
export const MultipleCards: Story = {
  render: () => (
    <View style={{ gap: 16, padding: 16 }}>
      <CarbonFootprintCard
        totalEmissions={850}
        data={{ transport: 200, energy: 300, food: 250, waste: 100 }}
        onCategoryPress={action('category-press-1')}
      />
      <CarbonFootprintCard
        totalEmissions={1500}
        data={{ transport: 600, energy: 400, food: 300, waste: 200 }}
        onCategoryPress={action('category-press-2')}
      />
      <CarbonFootprintCard
        totalEmissions={2800}
        data={{ transport: 1200, energy: 800, food: 500, waste: 300 }}
        onCategoryPress={action('category-press-3')}
      />
    </View>
  ),
};
