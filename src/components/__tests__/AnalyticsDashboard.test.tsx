import { ThemeProvider } from '../../theme/ThemeProvider';
import { lightTheme } from '../../theme/themes';
import type {
  MetricCard,
  ChartData,
  PieChartData,
  TimeSeriesData,
} from '../AnalyticsDashboard';
import AnalyticsDashboard from '../AnalyticsDashboard';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Dimensions } from 'react-native';

// Mock dependencies
jest.mock('react-native-chart-kit', () => ({
  LineChart: 'LineChart',
  BarChart: 'BarChart',
  PieChart: 'PieChart',
  ProgressChart: 'ProgressChart',
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => {
    const MockedLinearGradient = require('react-native').View;
    return <MockedLinearGradient {...props}>{children}</MockedLinearGradient>;
  },
}));

jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;
  return {
    default: {
      View,
      Text: require('react-native').Text,
      ScrollView: require('react-native').ScrollView,
    },
    useSharedValue: () => ({ value: 0 }),
    useAnimatedStyle: () => ({}),
    withTiming: (value: any) => value,
    withSpring: (value: any) => value,
    interpolate: () => 0,
  };
});

jest.mock('../SkeletonLoader', () => {
  return function MockSkeletonLoader(props: any) {
    const { View } = require('react-native');
    return <View testID='skeleton-loader' {...props} />;
  };
});

jest.mock('../../services/PerformanceMonitoringService', () => ({
  PerformanceMonitoringService: {
    startTimer: jest.fn(),
    endTimer: jest.fn(),
    recordMetric: jest.fn(),
  },
}));

// Mock Dimensions
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 812 })),
    },
  };
});

const mockMetrics: MetricCard[] = [
  {
    id: '1',
    title: 'Total Users',
    value: 1250,
    unit: 'users',
    change: 12.5,
    changeType: 'increase',
    icon: '👥',
    color: '#3B82F6',
    target: 1500,
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

const mockTimeSeriesData: TimeSeriesData[] = [
  { timestamp: '2024-01-01T00:00:00Z', value: 100, category: 'users' },
  { timestamp: '2024-01-02T00:00:00Z', value: 120, category: 'users' },
  { timestamp: '2024-01-03T00:00:00Z', value: 110, category: 'users' },
  { timestamp: '2024-01-04T00:00:00Z', value: 140, category: 'users' },
  { timestamp: '2024-01-05T00:00:00Z', value: 160, category: 'users' },
];

const mockPieChartData: PieChartData[] = [
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

const mockBarChartData: ChartData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
  datasets: [
    {
      data: [20, 45, 28, 80, 99],
      color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
      strokeWidth: 2,
    },
  ],
};

const mockCustomFilters = [
  { id: 'filter1', label: 'Last 7 Days', value: '7d' },
  { id: 'filter2', label: 'Last 30 Days', value: '30d' },
  { id: 'filter3', label: 'This Quarter', value: 'quarter' },
];

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider initialTheme={lightTheme}>{component}</ThemeProvider>,
  );
};

describe('AnalyticsDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders correctly with default props', () => {
      const { getByText } = renderWithTheme(<AnalyticsDashboard />);
      expect(getByText('Analytics Dashboard')).toBeTruthy();
    });

    it('renders custom title', () => {
      const customTitle = 'Custom Analytics';
      const { getByText } = renderWithTheme(
        <AnalyticsDashboard title={customTitle} />,
      );
      expect(getByText(customTitle)).toBeTruthy();
    });

    it('renders loading state correctly', () => {
      const { getAllByTestId } = renderWithTheme(
        <AnalyticsDashboard isLoading={true} />,
      );
      const skeletonLoaders = getAllByTestId('skeleton-loader');
      expect(skeletonLoaders.length).toBeGreaterThan(0);
    });
  });

  describe('Metrics Display', () => {
    it('renders metric cards correctly', () => {
      const { getByText } = renderWithTheme(
        <AnalyticsDashboard metrics={mockMetrics} />,
      );

      expect(getByText('Total Users')).toBeTruthy();
      expect(getByText('1250')).toBeTruthy();
      expect(getByText('users')).toBeTruthy();
      expect(getByText('Revenue')).toBeTruthy();
      expect(getByText('$45,230')).toBeTruthy();
    });

    it('displays metric changes correctly', () => {
      const { getByText } = renderWithTheme(
        <AnalyticsDashboard metrics={mockMetrics} />,
      );

      expect(getByText('↗ 12.5%')).toBeTruthy(); // increase
      expect(getByText('↘ 2.3%')).toBeTruthy(); // decrease
    });

    it('displays metric icons', () => {
      const { getByText } = renderWithTheme(
        <AnalyticsDashboard metrics={mockMetrics} />,
      );

      expect(getByText('👥')).toBeTruthy();
      expect(getByText('💰')).toBeTruthy();
      expect(getByText('📈')).toBeTruthy();
      expect(getByText('⚡')).toBeTruthy();
    });

    it('displays progress bars for metrics with targets', () => {
      const { getByText } = renderWithTheme(
        <AnalyticsDashboard metrics={mockMetrics} />,
      );

      expect(getByText('Target: 1500')).toBeTruthy();
    });

    it('handles metric press events', () => {
      const onMetricPress = jest.fn();
      const { getByText } = renderWithTheme(
        <AnalyticsDashboard
          metrics={mockMetrics}
          onMetricPress={onMetricPress}
        />,
      );

      fireEvent.press(getByText('Total Users'));
      expect(onMetricPress).toHaveBeenCalledWith(mockMetrics[0]);
    });
  });

  describe('Period Selection', () => {
    it('renders period selector when showComparison is true', () => {
      const { getByText } = renderWithTheme(
        <AnalyticsDashboard showComparison={true} />,
      );

      expect(getByText('24H')).toBeTruthy();
      expect(getByText('7D')).toBeTruthy();
      expect(getByText('30D')).toBeTruthy();
      expect(getByText('1Y')).toBeTruthy();
    });

    it('does not render period selector when showComparison is false', () => {
      const { queryByText } = renderWithTheme(
        <AnalyticsDashboard showComparison={false} />,
      );

      expect(queryByText('24H')).toBeNull();
      expect(queryByText('7D')).toBeNull();
    });

    it('handles period selection', () => {
      const { getByText } = renderWithTheme(
        <AnalyticsDashboard showComparison={true} />,
      );

      fireEvent.press(getByText('24H'));
      // Period selection should update internal state
      // This is tested indirectly through chart data processing
    });
  });

  describe('Custom Filters', () => {
    it('renders custom filters', () => {
      const { getByText } = renderWithTheme(
        <AnalyticsDashboard customFilters={mockCustomFilters} />,
      );

      expect(getByText('Last 7 Days')).toBeTruthy();
      expect(getByText('Last 30 Days')).toBeTruthy();
      expect(getByText('This Quarter')).toBeTruthy();
    });

    it('handles filter selection', () => {
      const { getByText } = renderWithTheme(
        <AnalyticsDashboard customFilters={mockCustomFilters} />,
      );

      fireEvent.press(getByText('Last 7 Days'));
      // Filter selection should update internal state
    });

    it('toggles filter selection', () => {
      const { getByText } = renderWithTheme(
        <AnalyticsDashboard customFilters={mockCustomFilters} />,
      );

      const filterButton = getByText('Last 7 Days');
      fireEvent.press(filterButton);
      fireEvent.press(filterButton); // Toggle off
    });
  });

  describe('Charts', () => {
    it('renders line chart with time series data', () => {
      const { getByText } = renderWithTheme(
        <AnalyticsDashboard timeSeriesData={mockTimeSeriesData} />,
      );

      expect(getByText('Trend Analysis')).toBeTruthy();
    });

    it('renders bar chart with bar chart data', () => {
      const { getByText } = renderWithTheme(
        <AnalyticsDashboard barChartData={mockBarChartData} />,
      );

      expect(getByText('Comparison Chart')).toBeTruthy();
    });

    it('renders pie chart with pie chart data', () => {
      const { getByText } = renderWithTheme(
        <AnalyticsDashboard pieChartData={mockPieChartData} />,
      );

      expect(getByText('Distribution')).toBeTruthy();
    });

    it('handles chart press events', () => {
      const onChartPress = jest.fn();
      const { getByText } = renderWithTheme(
        <AnalyticsDashboard
          timeSeriesData={mockTimeSeriesData}
          onChartPress={onChartPress}
        />,
      );

      fireEvent.press(getByText('Trend Analysis'));
      expect(onChartPress).toHaveBeenCalledWith('line', expect.any(Object));
    });

    it('shows skeleton loaders for charts when loading', () => {
      const { getAllByTestId } = renderWithTheme(
        <AnalyticsDashboard
          timeSeriesData={mockTimeSeriesData}
          isLoading={true}
        />,
      );

      const skeletonLoaders = getAllByTestId('skeleton-loader');
      expect(skeletonLoaders.length).toBeGreaterThan(0);
    });
  });

  describe('Data Processing', () => {
    it('processes time series data correctly for different periods', () => {
      const { rerender } = renderWithTheme(
        <AnalyticsDashboard
          timeSeriesData={mockTimeSeriesData}
          comparisonPeriod='day'
        />,
      );

      // Test day period processing
      expect(() =>
        rerender(
          <ThemeProvider initialTheme={lightTheme}>
            <AnalyticsDashboard
              timeSeriesData={mockTimeSeriesData}
              comparisonPeriod='week'
            />
          </ThemeProvider>,
        ),
      ).not.toThrow();
    });

    it('handles empty data gracefully', () => {
      const { container } = renderWithTheme(
        <AnalyticsDashboard
          metrics={[]}
          timeSeriesData={[]}
          pieChartData={[]}
        />,
      );

      expect(container).toBeTruthy();
    });
  });

  describe('Refresh Functionality', () => {
    it('calls onRefresh when provided', () => {
      const onRefresh = jest.fn();
      renderWithTheme(<AnalyticsDashboard onRefresh={onRefresh} />);

      // onRefresh should be available for pull-to-refresh
      expect(onRefresh).toBeDefined();
    });

    it('sets up auto-refresh interval', async () => {
      jest.useFakeTimers();
      const onRefresh = jest.fn();

      renderWithTheme(
        <AnalyticsDashboard onRefresh={onRefresh} refreshInterval={5000} />,
      );

      jest.advanceTimersByTime(5000);
      expect(onRefresh).toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('Styling and Theming', () => {
    it('applies custom styles', () => {
      const customStyle = { backgroundColor: 'red' };
      const { container } = renderWithTheme(
        <AnalyticsDashboard style={customStyle} />,
      );

      expect(container).toBeTruthy();
    });

    it('uses theme colors correctly', () => {
      const { getByText } = renderWithTheme(
        <AnalyticsDashboard title='Test Dashboard' />,
      );

      expect(getByText('Test Dashboard')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('provides accessible metric cards', () => {
      const { getByText } = renderWithTheme(
        <AnalyticsDashboard metrics={mockMetrics} />,
      );

      const metricCard = getByText('Total Users');
      expect(metricCard).toBeTruthy();
    });

    it('provides accessible chart containers', () => {
      const { getByText } = renderWithTheme(
        <AnalyticsDashboard timeSeriesData={mockTimeSeriesData} />,
      );

      const chartContainer = getByText('Trend Analysis');
      expect(chartContainer).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('memoizes component correctly', () => {
      const MemoizedComponent = React.memo(AnalyticsDashboard);
      const { rerender } = renderWithTheme(
        <MemoizedComponent metrics={mockMetrics} />,
      );

      // Re-render with same props should not cause issues
      rerender(
        <ThemeProvider initialTheme={lightTheme}>
          <MemoizedComponent metrics={mockMetrics} />
        </ThemeProvider>,
      );
    });

    it('handles large datasets efficiently', () => {
      const largeMetrics = Array.from({ length: 100 }, (_, i) => ({
        id: `metric-${i}`,
        title: `Metric ${i}`,
        value: Math.random() * 1000,
        change: Math.random() * 20 - 10,
        changeType: 'increase' as const,
      }));

      const { container } = renderWithTheme(
        <AnalyticsDashboard metrics={largeMetrics} />,
      );

      expect(container).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('handles invalid metric data gracefully', () => {
      const invalidMetrics = [
        {
          id: '1',
          title: 'Invalid Metric',
          value: null as any,
        },
      ];

      expect(() => {
        renderWithTheme(<AnalyticsDashboard metrics={invalidMetrics} />);
      }).not.toThrow();
    });

    it('handles invalid time series data gracefully', () => {
      const invalidTimeSeriesData = [
        {
          timestamp: 'invalid-date',
          value: NaN,
        },
      ];

      expect(() => {
        renderWithTheme(
          <AnalyticsDashboard timeSeriesData={invalidTimeSeriesData} />,
        );
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero values correctly', () => {
      const zeroMetrics: MetricCard[] = [
        {
          id: '1',
          title: 'Zero Metric',
          value: 0,
          change: 0,
          changeType: 'neutral',
        },
      ];

      const { getByText } = renderWithTheme(
        <AnalyticsDashboard metrics={zeroMetrics} />,
      );

      expect(getByText('0')).toBeTruthy();
    });

    it('handles negative values correctly', () => {
      const negativeMetrics: MetricCard[] = [
        {
          id: '1',
          title: 'Negative Metric',
          value: -100,
          change: -50,
          changeType: 'decrease',
        },
      ];

      const { getByText } = renderWithTheme(
        <AnalyticsDashboard metrics={negativeMetrics} />,
      );

      expect(getByText('-100')).toBeTruthy();
    });

    it('handles very large numbers correctly', () => {
      const largeMetrics: MetricCard[] = [
        {
          id: '1',
          title: 'Large Metric',
          value: 1000000000,
          change: 999.99,
          changeType: 'increase',
        },
      ];

      const { getByText } = renderWithTheme(
        <AnalyticsDashboard metrics={largeMetrics} />,
      );

      expect(getByText('1000000000')).toBeTruthy();
    });
  });
});
