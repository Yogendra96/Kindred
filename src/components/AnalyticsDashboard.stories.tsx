import { ThemeProvider } from '../theme/ThemeProvider';
import { lightTheme, darkTheme } from '../theme/themes';
import AnalyticsDashboard from './AnalyticsDashboard';
import type {
  MetricCard,
  ChartData,
  PieChartData,
  TimeSeriesData,
} from './AnalyticsDashboard';
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { View } from 'react-native';

const meta: Meta<typeof AnalyticsDashboard> = {
  title: 'Components/AnalyticsDashboard',
  component: AnalyticsDashboard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
A comprehensive analytics dashboard component that displays various metrics, charts, and data visualizations.

## Features
- **Metric Cards**: Display key performance indicators with trends and targets
- **Interactive Charts**: Line charts, bar charts, and pie charts with touch interactions
- **Period Selection**: Switch between different time periods (24H, 7D, 30D, 1Y)
- **Custom Filters**: Add custom filtering options
- **Auto-refresh**: Automatic data refresh at specified intervals
- **Loading States**: Skeleton loaders for better UX
- **Animations**: Smooth entrance animations and interactions
- **Responsive**: Adapts to different screen sizes
- **Accessible**: Full accessibility support

## Use Cases
- Business intelligence dashboards
- App analytics and metrics
- Performance monitoring
- User engagement tracking
- Financial reporting
- Environmental impact tracking
        `,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme === 'dark' ? darkTheme : lightTheme;
      return (
        <ThemeProvider initialTheme={theme}>
          <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <Story />
          </View>
        </ThemeProvider>
      );
    },
  ],
  argTypes: {
    title: {
      control: 'text',
      description: 'Dashboard title',
    },
    isLoading: {
      control: 'boolean',
      description: 'Loading state',
    },
    showComparison: {
      control: 'boolean',
      description: 'Show period comparison selector',
    },
    comparisonPeriod: {
      control: 'select',
      options: ['day', 'week', 'month', 'year'],
      description: 'Default comparison period',
    },
    refreshInterval: {
      control: 'number',
      description: 'Auto-refresh interval in milliseconds',
    },
  },
};

export default meta;
type Story = StoryObj<typeof AnalyticsDashboard>;

// Sample data
const sampleMetrics: MetricCard[] = [
  {
    id: '1',
    title: 'Total Users',
    value: 12450,
    unit: 'users',
    change: 12.5,
    changeType: 'increase',
    icon: '👥',
    color: '#3B82F6',
    target: 15000,
  },
  {
    id: '2',
    title: 'Revenue',
    value: '$45,230',
    change: -2.3,
    changeType: 'decrease',
    icon: '💰',
    color: '#10B981',
  },
  {
    id: '3',
    title: 'Conversion Rate',
    value: '3.2%',
    change: 0.5,
    changeType: 'increase',
    icon: '📈',
    color: '#F59E0B',
  },
  {
    id: '4',
    title: 'Active Sessions',
    value: 892,
    changeType: 'neutral',
    icon: '⚡',
    color: '#8B5CF6',
  },
];

const carbonFootprintMetrics: MetricCard[] = [
  {
    id: '1',
    title: 'Carbon Footprint',
    value: 2.4,
    unit: 'tons CO₂',
    change: -8.2,
    changeType: 'decrease',
    icon: '🌱',
    color: '#22C55E',
    target: 2.0,
  },
  {
    id: '2',
    title: 'Energy Usage',
    value: 1250,
    unit: 'kWh',
    change: -5.1,
    changeType: 'decrease',
    icon: '⚡',
    color: '#F59E0B',
  },
  {
    id: '3',
    title: 'Renewable %',
    value: '68%',
    change: 12.3,
    changeType: 'increase',
    icon: '♻️',
    color: '#10B981',
  },
  {
    id: '4',
    title: 'Offset Credits',
    value: 45,
    unit: 'credits',
    change: 23.5,
    changeType: 'increase',
    icon: '🏆',
    color: '#8B5CF6',
  },
];

const sampleTimeSeriesData: TimeSeriesData[] = [
  { timestamp: '2024-01-01T00:00:00Z', value: 100 },
  { timestamp: '2024-01-02T00:00:00Z', value: 120 },
  { timestamp: '2024-01-03T00:00:00Z', value: 110 },
  { timestamp: '2024-01-04T00:00:00Z', value: 140 },
  { timestamp: '2024-01-05T00:00:00Z', value: 160 },
  { timestamp: '2024-01-06T00:00:00Z', value: 155 },
  { timestamp: '2024-01-07T00:00:00Z', value: 180 },
];

const samplePieChartData: PieChartData[] = [
  {
    name: 'Mobile',
    population: 65,
    color: '#3B82F6',
    legendFontColor: '#374151',
    legendFontSize: 12,
  },
  {
    name: 'Desktop',
    population: 25,
    color: '#10B981',
    legendFontColor: '#374151',
    legendFontSize: 12,
  },
  {
    name: 'Tablet',
    population: 10,
    color: '#F59E0B',
    legendFontColor: '#374151',
    legendFontSize: 12,
  },
];

const sampleBarChartData: ChartData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      data: [20, 45, 28, 80, 99, 43],
      color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
      strokeWidth: 2,
    },
  ],
};

const customFilters = [
  { id: 'filter1', label: 'Last 7 Days', value: '7d' },
  { id: 'filter2', label: 'Last 30 Days', value: '30d' },
  { id: 'filter3', label: 'This Quarter', value: 'quarter' },
  { id: 'filter4', label: 'This Year', value: 'year' },
];

// Stories
export const Default: Story = {
  args: {
    title: 'Analytics Dashboard',
    metrics: sampleMetrics,
    timeSeriesData: sampleTimeSeriesData,
    pieChartData: samplePieChartData,
    barChartData: sampleBarChartData,
    showComparison: true,
    comparisonPeriod: 'week',
  },
};

export const Loading: Story = {
  args: {
    title: 'Analytics Dashboard',
    isLoading: true,
    metrics: [],
  },
};

export const MetricsOnly: Story = {
  args: {
    title: 'Key Metrics',
    metrics: sampleMetrics,
    showComparison: false,
  },
};

export const ChartsOnly: Story = {
  args: {
    title: 'Data Visualization',
    timeSeriesData: sampleTimeSeriesData,
    pieChartData: samplePieChartData,
    barChartData: sampleBarChartData,
    showComparison: true,
  },
};

export const WithCustomFilters: Story = {
  args: {
    title: 'Filtered Analytics',
    metrics: sampleMetrics,
    timeSeriesData: sampleTimeSeriesData,
    customFilters,
    showComparison: true,
  },
};

export const CarbonFootprintDashboard: Story = {
  args: {
    title: 'Environmental Impact',
    metrics: carbonFootprintMetrics,
    timeSeriesData: sampleTimeSeriesData.map(item => ({
      ...item,
      value: item.value * 0.02, // Convert to CO2 values
    })),
    pieChartData: [
      {
        name: 'Transportation',
        population: 45,
        color: '#EF4444',
        legendFontColor: '#374151',
        legendFontSize: 12,
      },
      {
        name: 'Energy',
        population: 30,
        color: '#F59E0B',
        legendFontColor: '#374151',
        legendFontSize: 12,
      },
      {
        name: 'Food',
        population: 15,
        color: '#22C55E',
        legendFontColor: '#374151',
        legendFontSize: 12,
      },
      {
        name: 'Other',
        population: 10,
        color: '#8B5CF6',
        legendFontColor: '#374151',
        legendFontSize: 12,
      },
    ],
    showComparison: true,
    customFilters: [
      { id: 'transport', label: 'Transportation', value: 'transport' },
      { id: 'energy', label: 'Energy Usage', value: 'energy' },
      { id: 'food', label: 'Food & Diet', value: 'food' },
    ],
  },
};

export const BusinessDashboard: Story = {
  args: {
    title: 'Business Intelligence',
    metrics: [
      {
        id: '1',
        title: 'Monthly Revenue',
        value: '$125,430',
        change: 18.2,
        changeType: 'increase',
        icon: '💼',
        color: '#059669',
        target: 150000,
      },
      {
        id: '2',
        title: 'New Customers',
        value: 234,
        unit: 'customers',
        change: 12.5,
        changeType: 'increase',
        icon: '👤',
        color: '#3B82F6',
      },
      {
        id: '3',
        title: 'Churn Rate',
        value: '2.1%',
        change: -0.8,
        changeType: 'decrease',
        icon: '📉',
        color: '#DC2626',
      },
      {
        id: '4',
        title: 'Customer LTV',
        value: '$2,450',
        change: 8.3,
        changeType: 'increase',
        icon: '💎',
        color: '#7C3AED',
      },
    ],
    timeSeriesData: sampleTimeSeriesData.map(item => ({
      ...item,
      value: item.value * 1000, // Scale up for revenue
    })),
    barChartData: {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      datasets: [
        {
          data: [85000, 92000, 108000, 125000],
          color: (opacity = 1) => `rgba(5, 150, 105, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    },
    showComparison: true,
  },
};

export const HealthMetrics: Story = {
  args: {
    title: 'Health & Wellness',
    metrics: [
      {
        id: '1',
        title: 'Daily Steps',
        value: 8420,
        unit: 'steps',
        change: 5.2,
        changeType: 'increase',
        icon: '👟',
        color: '#22C55E',
        target: 10000,
      },
      {
        id: '2',
        title: 'Calories Burned',
        value: 2150,
        unit: 'cal',
        change: 3.1,
        changeType: 'increase',
        icon: '🔥',
        color: '#F59E0B',
      },
      {
        id: '3',
        title: 'Sleep Quality',
        value: '85%',
        change: -2.5,
        changeType: 'decrease',
        icon: '😴',
        color: '#8B5CF6',
      },
      {
        id: '4',
        title: 'Heart Rate',
        value: 72,
        unit: 'bpm',
        changeType: 'neutral',
        icon: '❤️',
        color: '#EF4444',
      },
    ],
    timeSeriesData: sampleTimeSeriesData.map(item => ({
      ...item,
      value: item.value * 50, // Scale for steps
    })),
    pieChartData: [
      {
        name: 'Active',
        population: 35,
        color: '#22C55E',
        legendFontColor: '#374151',
        legendFontSize: 12,
      },
      {
        name: 'Light Activity',
        population: 45,
        color: '#F59E0B',
        legendFontColor: '#374151',
        legendFontSize: 12,
      },
      {
        name: 'Sedentary',
        population: 20,
        color: '#EF4444',
        legendFontColor: '#374151',
        legendFontSize: 12,
      },
    ],
    showComparison: true,
  },
};

export const MinimalDashboard: Story = {
  args: {
    title: 'Simple Overview',
    metrics: [
      {
        id: '1',
        title: 'Total Views',
        value: 1250,
        change: 8.5,
        changeType: 'increase',
        color: '#3B82F6',
      },
      {
        id: '2',
        title: 'Engagement',
        value: '4.2%',
        change: 1.2,
        changeType: 'increase',
        color: '#10B981',
      },
    ],
    showComparison: false,
  },
};

export const WithAutoRefresh: Story = {
  args: {
    title: 'Real-time Dashboard',
    metrics: sampleMetrics,
    timeSeriesData: sampleTimeSeriesData,
    refreshInterval: 5000, // 5 seconds
    showComparison: true,
  },
};

export const EmptyState: Story = {
  args: {
    title: 'No Data Available',
    metrics: [],
    timeSeriesData: [],
    pieChartData: [],
    showComparison: true,
  },
};

export const InteractiveDemo: Story = {
  args: {
    title: 'Interactive Dashboard',
    metrics: sampleMetrics,
    timeSeriesData: sampleTimeSeriesData,
    pieChartData: samplePieChartData,
    barChartData: sampleBarChartData,
    customFilters,
    showComparison: true,
    onMetricPress: metric => {
      // console.log('Metric pressed:', metric);
    },
    onChartPress: (chartType, data) => {
      // console.log('Chart pressed:', chartType, data);
    },
    onRefresh: () => {
      // console.log('Dashboard refreshed');
    },
  },
};

export const LargeDataset: Story = {
  args: {
    title: 'Performance Test',
    metrics: Array.from({ length: 20 }, (_, i) => ({
      id: `metric-${i}`,
      title: `Metric ${i + 1}`,
      value: Math.floor(Math.random() * 10000),
      change: Math.random() * 40 - 20,
      changeType: Math.random() > 0.5 ? 'increase' : 'decrease',
      icon: ['📊', '📈', '📉', '💹', '🎯'][Math.floor(Math.random() * 5)],
      color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][
        Math.floor(Math.random() * 5)
      ],
    })) as MetricCard[],
    timeSeriesData: Array.from({ length: 30 }, (_, i) => ({
      timestamp: new Date(
        Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
      ).toISOString(),
      value: Math.floor(Math.random() * 1000),
    })),
    showComparison: true,
  },
};

// Accessibility story
export const AccessibilityFocused: Story = {
  args: {
    title: 'Accessible Dashboard',
    metrics: sampleMetrics.map(metric => ({
      ...metric,
      // Add accessibility labels
    })),
    timeSeriesData: sampleTimeSeriesData,
    showComparison: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
This story demonstrates the accessibility features of the AnalyticsDashboard:
- Screen reader support
- Keyboard navigation
- High contrast support
- Semantic markup
- ARIA labels and descriptions
        `,
      },
    },
  },
};
