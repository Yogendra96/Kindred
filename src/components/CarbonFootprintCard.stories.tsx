import React from 'react';

import { View } from 'react-native';

import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/react';

import { CarbonFootprintCard } from './CarbonFootprintCard';

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
  argTypes: {
    totalEmissions: {
      control: { type: 'number', min: 0, max: 10000, step: 10 },
      description: 'Total carbon emissions in kg CO2',
    },
    dailyEmissions: {
      control: { type: 'number', min: 0, max: 100, step: 1 },
      description: 'Daily carbon emissions in kg CO2',
    },
    weeklyGoal: {
      control: { type: 'number', min: 0, max: 500, step: 10 },
      description: 'Weekly carbon reduction goal in kg CO2',
    },
    progress: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Progress towards goal as percentage',
    },
    trend: {
      control: { type: 'select' },
      options: ['up', 'down', 'stable'],
      description: 'Emission trend direction',
    },
    period: {
      control: { type: 'select' },
      options: ['daily', 'weekly', 'monthly', 'yearly'],
      description: 'Time period for data display',
    },
    showDetails: {
      control: { type: 'boolean' },
      description: 'Whether to show detailed breakdown',
    },
    interactive: {
      control: { type: 'boolean' },
      description: 'Whether the card is interactive',
    },
    theme: {
      control: { type: 'select' },
      options: ['light', 'dark', 'eco'],
      description: 'Card theme variant',
    },
    onPress: {
      action: 'card-pressed',
      description: 'Function called when card is pressed',
    },
    onGoalPress: {
      action: 'goal-pressed',
      description: 'Function called when goal section is pressed',
    },
  },
  args: {
    onPress: action('card-press'),
    onGoalPress: action('goal-press'),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Default: Story = {
  args: {
    totalEmissions: 1250,
    dailyEmissions: 15.5,
    weeklyGoal: 100,
    progress: 65,
    trend: 'down',
    period: 'weekly',
    showDetails: true,
    interactive: true,
    theme: 'light',
  },
};

// Low emissions (good performance)
export const LowEmissions: Story = {
  args: {
    totalEmissions: 450,
    dailyEmissions: 8.2,
    weeklyGoal: 60,
    progress: 85,
    trend: 'down',
    period: 'weekly',
    showDetails: true,
    interactive: true,
    theme: 'eco',
  },
};

// High emissions (needs improvement)
export const HighEmissions: Story = {
  args: {
    totalEmissions: 2800,
    dailyEmissions: 35.7,
    weeklyGoal: 200,
    progress: 25,
    trend: 'up',
    period: 'weekly',
    showDetails: true,
    interactive: true,
    theme: 'light',
  },
};

// Goal achieved
export const GoalAchieved: Story = {
  args: {
    totalEmissions: 850,
    dailyEmissions: 12.1,
    weeklyGoal: 85,
    progress: 100,
    trend: 'down',
    period: 'weekly',
    showDetails: true,
    interactive: true,
    theme: 'eco',
  },
};

// Stable trend
export const StableTrend: Story = {
  args: {
    totalEmissions: 1500,
    dailyEmissions: 21.4,
    weeklyGoal: 150,
    progress: 50,
    trend: 'stable',
    period: 'weekly',
    showDetails: true,
    interactive: true,
    theme: 'light',
  },
};

// Monthly view
export const MonthlyView: Story = {
  args: {
    totalEmissions: 5200,
    dailyEmissions: 18.6,
    weeklyGoal: 400,
    progress: 70,
    trend: 'down',
    period: 'monthly',
    showDetails: true,
    interactive: true,
    theme: 'light',
  },
};

// Yearly view
export const YearlyView: Story = {
  args: {
    totalEmissions: 18500,
    dailyEmissions: 20.1,
    weeklyGoal: 1200,
    progress: 45,
    trend: 'up',
    period: 'yearly',
    showDetails: true,
    interactive: true,
    theme: 'light',
  },
};

// Compact view (no details)
export const CompactView: Story = {
  args: {
    totalEmissions: 1250,
    dailyEmissions: 15.5,
    weeklyGoal: 100,
    progress: 65,
    trend: 'down',
    period: 'weekly',
    showDetails: false,
    interactive: true,
    theme: 'light',
  },
};

// Non-interactive
export const NonInteractive: Story = {
  args: {
    totalEmissions: 1250,
    dailyEmissions: 15.5,
    weeklyGoal: 100,
    progress: 65,
    trend: 'down',
    period: 'weekly',
    showDetails: true,
    interactive: false,
    theme: 'light',
  },
};

// Dark theme
export const DarkTheme: Story = {
  args: {
    totalEmissions: 1250,
    dailyEmissions: 15.5,
    weeklyGoal: 100,
    progress: 65,
    trend: 'down',
    period: 'weekly',
    showDetails: true,
    interactive: true,
    theme: 'dark',
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

// Eco theme
export const EcoTheme: Story = {
  args: {
    totalEmissions: 850,
    dailyEmissions: 12.1,
    weeklyGoal: 85,
    progress: 90,
    trend: 'down',
    period: 'weekly',
    showDetails: true,
    interactive: true,
    theme: 'eco',
  },
};

// Multiple cards showcase
export const MultipleCards: Story = {
  render: () => (
    <View style={{ gap: 16, padding: 16 }}>
      <CarbonFootprintCard
        totalEmissions={850}
        dailyEmissions={12.1}
        weeklyGoal={85}
        progress={90}
        trend='down'
        period='weekly'
        showDetails
        interactive
        theme='eco'
        onPress={action('eco-card-press')}
        onGoalPress={action('eco-goal-press')}
      />
      <CarbonFootprintCard
        totalEmissions={1500}
        dailyEmissions={21.4}
        weeklyGoal={150}
        progress={50}
        trend='stable'
        period='weekly'
        showDetails
        interactive
        theme='light'
        onPress={action('light-card-press')}
        onGoalPress={action('light-goal-press')}
      />
      <CarbonFootprintCard
        totalEmissions={2800}
        dailyEmissions={35.7}
        weeklyGoal={200}
        progress={25}
        trend='up'
        period='weekly'
        showDetails
        interactive
        theme='light'
        onPress={action('warning-card-press')}
        onGoalPress={action('warning-goal-press')}
      />
    </View>
  ),
};

// Loading state
export const LoadingState: Story = {
  args: {
    totalEmissions: 0,
    dailyEmissions: 0,
    weeklyGoal: 0,
    progress: 0,
    trend: 'stable',
    period: 'weekly',
    showDetails: true,
    interactive: false,
    theme: 'light',
    loading: true,
  },
};

// Error state
export const ErrorState: Story = {
  args: {
    totalEmissions: 0,
    dailyEmissions: 0,
    weeklyGoal: 0,
    progress: 0,
    trend: 'stable',
    period: 'weekly',
    showDetails: true,
    interactive: true,
    theme: 'light',
    error: 'Failed to load carbon footprint data',
  },
};
