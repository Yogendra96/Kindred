import SkeletonLoader from '../SkeletonLoader';
import { render } from '@testing-library/react-native';
import React from 'react';
import { View } from 'react-native';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');

  // The mock for `call` immediately calls the callback which is incorrect
  // So we override it with a no-op
  Reanimated.default.call = () => {};

  return {
    ...Reanimated,
    useSharedValue: jest.fn(() => ({ value: 0 })),
    useAnimatedStyle: jest.fn(() => ({})),
    withRepeat: jest.fn(animation => animation),
    withTiming: jest.fn(value => value),
    Easing: {
      inOut: jest.fn(),
      ease: jest.fn(),
    },
  };
});

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children, ...props }: any) => (
      <View {...props} testID='linear-gradient'>
        {children}
      </View>
    ),
  };
});

describe('SkeletonLoader', () => {
  describe('Base Variant', () => {
    it('renders base skeleton with default props', () => {
      const { getByTestId } = render(<SkeletonLoader variant='base' />);

      const skeleton = getByTestId('skeleton-loader');
      expect(skeleton).toBeTruthy();
    });

    it('renders base skeleton with custom dimensions', () => {
      const { getByTestId } = render(
        <SkeletonLoader
          variant='base'
          width={200}
          height={50}
          testID='custom-skeleton'
        />,
      );

      const skeleton = getByTestId('custom-skeleton');
      expect(skeleton).toBeTruthy();
    });

    it('applies custom border radius', () => {
      const { getByTestId } = render(
        <SkeletonLoader
          variant='base'
          borderRadius={10}
          testID='rounded-skeleton'
        />,
      );

      const skeleton = getByTestId('rounded-skeleton');
      expect(skeleton).toBeTruthy();
    });
  });

  describe('Text Variant', () => {
    it('renders text skeleton with default lines', () => {
      const { getByTestId } = render(<SkeletonLoader variant='text' />);

      const skeleton = getByTestId('skeleton-loader');
      expect(skeleton).toBeTruthy();
    });

    it('renders text skeleton with custom number of lines', () => {
      const { getByTestId } = render(
        <SkeletonLoader
          variant='text'
          lines={5}
          testID='multi-line-skeleton'
        />,
      );

      const skeleton = getByTestId('multi-line-skeleton');
      expect(skeleton).toBeTruthy();
    });

    it('renders text skeleton with custom width', () => {
      const { getByTestId } = render(
        <SkeletonLoader
          variant='text'
          width={300}
          testID='wide-text-skeleton'
        />,
      );

      const skeleton = getByTestId('wide-text-skeleton');
      expect(skeleton).toBeTruthy();
    });
  });

  describe('Circle Variant', () => {
    it('renders circle skeleton', () => {
      const { getByTestId } = render(<SkeletonLoader variant='circle' />);

      const skeleton = getByTestId('skeleton-loader');
      expect(skeleton).toBeTruthy();
    });

    it('renders circle skeleton with custom size', () => {
      const { getByTestId } = render(
        <SkeletonLoader
          variant='circle'
          width={80}
          height={80}
          testID='large-circle-skeleton'
        />,
      );

      const skeleton = getByTestId('large-circle-skeleton');
      expect(skeleton).toBeTruthy();
    });
  });

  describe('Image Variant', () => {
    it('renders image skeleton', () => {
      const { getByTestId } = render(<SkeletonLoader variant='image' />);

      const skeleton = getByTestId('skeleton-loader');
      expect(skeleton).toBeTruthy();
    });

    it('renders image skeleton with custom dimensions', () => {
      const { getByTestId } = render(
        <SkeletonLoader
          variant='image'
          width={300}
          height={200}
          testID='custom-image-skeleton'
        />,
      );

      const skeleton = getByTestId('custom-image-skeleton');
      expect(skeleton).toBeTruthy();
    });
  });

  describe('Card Variant', () => {
    it('renders card skeleton', () => {
      const { getByTestId } = render(<SkeletonLoader variant='card' />);

      const skeleton = getByTestId('skeleton-loader');
      expect(skeleton).toBeTruthy();
    });

    it('renders card skeleton with custom width', () => {
      const { getByTestId } = render(
        <SkeletonLoader
          variant='card'
          width={350}
          testID='wide-card-skeleton'
        />,
      );

      const skeleton = getByTestId('wide-card-skeleton');
      expect(skeleton).toBeTruthy();
    });
  });

  describe('List Variant', () => {
    it('renders list skeleton with default items', () => {
      const { getByTestId } = render(<SkeletonLoader variant='list' />);

      const skeleton = getByTestId('skeleton-loader');
      expect(skeleton).toBeTruthy();
    });

    it('renders list skeleton with custom number of items', () => {
      const { getByTestId } = render(
        <SkeletonLoader variant='list' items={8} testID='long-list-skeleton' />,
      );

      const skeleton = getByTestId('long-list-skeleton');
      expect(skeleton).toBeTruthy();
    });

    it('renders list skeleton with custom spacing', () => {
      const { getByTestId } = render(
        <SkeletonLoader
          variant='list'
          spacing={20}
          testID='spaced-list-skeleton'
        />,
      );

      const skeleton = getByTestId('spaced-list-skeleton');
      expect(skeleton).toBeTruthy();
    });
  });

  describe('Grid Variant', () => {
    it('renders grid skeleton with default configuration', () => {
      const { getByTestId } = render(<SkeletonLoader variant='grid' />);

      const skeleton = getByTestId('skeleton-loader');
      expect(skeleton).toBeTruthy();
    });

    it('renders grid skeleton with custom columns and items', () => {
      const { getByTestId } = render(
        <SkeletonLoader
          variant='grid'
          columns={3}
          items={9}
          testID='custom-grid-skeleton'
        />,
      );

      const skeleton = getByTestId('custom-grid-skeleton');
      expect(skeleton).toBeTruthy();
    });

    it('renders grid skeleton with custom spacing', () => {
      const { getByTestId } = render(
        <SkeletonLoader
          variant='grid'
          spacing={15}
          testID='spaced-grid-skeleton'
        />,
      );

      const skeleton = getByTestId('spaced-grid-skeleton');
      expect(skeleton).toBeTruthy();
    });
  });

  describe('Chart Variant', () => {
    it('renders chart skeleton', () => {
      const { getByTestId } = render(<SkeletonLoader variant='chart' />);

      const skeleton = getByTestId('skeleton-loader');
      expect(skeleton).toBeTruthy();
    });

    it('renders chart skeleton with custom dimensions', () => {
      const { getByTestId } = render(
        <SkeletonLoader
          variant='chart'
          width={400}
          height={250}
          testID='large-chart-skeleton'
        />,
      );

      const skeleton = getByTestId('large-chart-skeleton');
      expect(skeleton).toBeTruthy();
    });
  });

  describe('Animation Properties', () => {
    it('accepts custom animation speed', () => {
      const { getByTestId } = render(
        <SkeletonLoader
          variant='base'
          animationSpeed={2000}
          testID='slow-skeleton'
        />,
      );

      const skeleton = getByTestId('slow-skeleton');
      expect(skeleton).toBeTruthy();
    });

    it('accepts custom shimmer colors', () => {
      const customColors = ['#E1E9EE', '#F2F8FC', '#E1E9EE'];

      const { getByTestId } = render(
        <SkeletonLoader
          variant='base'
          shimmerColors={customColors}
          testID='custom-color-skeleton'
        />,
      );

      const skeleton = getByTestId('custom-color-skeleton');
      expect(skeleton).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('has default accessibility properties', () => {
      const { getByTestId } = render(<SkeletonLoader variant='base' />);

      const skeleton = getByTestId('skeleton-loader');
      expect(skeleton).toBeTruthy();
      expect(skeleton.props.accessibilityRole).toBe('progressbar');
    });

    it('accepts custom accessibility label', () => {
      const { getByTestId } = render(
        <SkeletonLoader
          variant='base'
          accessibilityLabel='Loading content'
          testID='accessible-skeleton'
        />,
      );

      const skeleton = getByTestId('accessible-skeleton');
      expect(skeleton).toBeTruthy();
      expect(skeleton.props.accessibilityLabel).toBe('Loading content');
    });

    it('accepts custom accessibility hint', () => {
      const { getByTestId } = render(
        <SkeletonLoader
          variant='base'
          accessibilityHint='Please wait while content loads'
          testID='hinted-skeleton'
        />,
      );

      const skeleton = getByTestId('hinted-skeleton');
      expect(skeleton).toBeTruthy();
      expect(skeleton.props.accessibilityHint).toBe(
        'Please wait while content loads',
      );
    });
  });

  describe('Custom Styling', () => {
    it('accepts custom container style', () => {
      const customStyle = { margin: 10, padding: 5 };

      const { getByTestId } = render(
        <SkeletonLoader
          variant='base'
          style={customStyle}
          testID='styled-skeleton'
        />,
      );

      const skeleton = getByTestId('styled-skeleton');
      expect(skeleton).toBeTruthy();
    });

    it('merges custom styles with default styles', () => {
      const { getByTestId } = render(
        <SkeletonLoader
          variant='base'
          style={{ backgroundColor: 'red' }}
          testID='red-skeleton'
        />,
      );

      const skeleton = getByTestId('red-skeleton');
      expect(skeleton).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero lines for text variant', () => {
      const { getByTestId } = render(
        <SkeletonLoader variant='text' lines={0} testID='no-lines-skeleton' />,
      );

      const skeleton = getByTestId('no-lines-skeleton');
      expect(skeleton).toBeTruthy();
    });

    it('handles zero items for list variant', () => {
      const { getByTestId } = render(
        <SkeletonLoader variant='list' items={0} testID='no-items-skeleton' />,
      );

      const skeleton = getByTestId('no-items-skeleton');
      expect(skeleton).toBeTruthy();
    });

    it('handles zero columns for grid variant', () => {
      const { getByTestId } = render(
        <SkeletonLoader
          variant='grid'
          columns={0}
          testID='no-columns-skeleton'
        />,
      );

      const skeleton = getByTestId('no-columns-skeleton');
      expect(skeleton).toBeTruthy();
    });

    it('handles very large dimensions', () => {
      const { getByTestId } = render(
        <SkeletonLoader
          variant='base'
          width={1000}
          height={500}
          testID='large-skeleton'
        />,
      );

      const skeleton = getByTestId('large-skeleton');
      expect(skeleton).toBeTruthy();
    });

    it('handles very small dimensions', () => {
      const { getByTestId } = render(
        <SkeletonLoader
          variant='base'
          width={1}
          height={1}
          testID='tiny-skeleton'
        />,
      );

      const skeleton = getByTestId('tiny-skeleton');
      expect(skeleton).toBeTruthy();
    });
  });

  describe('Component Composition', () => {
    it('can be used within other components', () => {
      const TestWrapper = () => (
        <View testID='wrapper'>
          <SkeletonLoader variant='base' testID='nested-skeleton' />
        </View>
      );

      const { getByTestId } = render(<TestWrapper />);

      const wrapper = getByTestId('wrapper');
      const skeleton = getByTestId('nested-skeleton');

      expect(wrapper).toBeTruthy();
      expect(skeleton).toBeTruthy();
    });

    it('can render multiple skeletons', () => {
      const { getByTestId } = render(
        <View>
          <SkeletonLoader variant='circle' testID='skeleton-1' />
          <SkeletonLoader variant='text' testID='skeleton-2' />
          <SkeletonLoader variant='image' testID='skeleton-3' />
        </View>,
      );

      expect(getByTestId('skeleton-1')).toBeTruthy();
      expect(getByTestId('skeleton-2')).toBeTruthy();
      expect(getByTestId('skeleton-3')).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('renders efficiently with many items', () => {
      const startTime = Date.now();

      const { getByTestId } = render(
        <SkeletonLoader
          variant='list'
          items={100}
          testID='performance-skeleton'
        />,
      );

      const endTime = Date.now();
      const renderTime = endTime - startTime;

      const skeleton = getByTestId('performance-skeleton');
      expect(skeleton).toBeTruthy();

      // Ensure rendering doesn't take too long (adjust threshold as needed)
      expect(renderTime).toBeLessThan(1000);
    });

    it('handles rapid re-renders', () => {
      const { rerender, getByTestId } = render(
        <SkeletonLoader
          variant='base'
          width={100}
          testID='rerender-skeleton'
        />,
      );

      // Rapidly change props
      for (let i = 0; i < 10; i++) {
        rerender(
          <SkeletonLoader
            variant='base'
            width={100 + i * 10}
            testID='rerender-skeleton'
          />,
        );
      }

      const skeleton = getByTestId('rerender-skeleton');
      expect(skeleton).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('handles invalid variant gracefully', () => {
      // TypeScript would catch this, but testing runtime behavior
      const { getByTestId } = render(
        <SkeletonLoader variant={'invalid' as any} testID='invalid-skeleton' />,
      );

      const skeleton = getByTestId('invalid-skeleton');
      expect(skeleton).toBeTruthy();
    });

    it('handles negative dimensions', () => {
      const { getByTestId } = render(
        <SkeletonLoader
          variant='base'
          width={-100}
          height={-50}
          testID='negative-skeleton'
        />,
      );

      const skeleton = getByTestId('negative-skeleton');
      expect(skeleton).toBeTruthy();
    });

    it('handles undefined props gracefully', () => {
      const { getByTestId } = render(
        <SkeletonLoader
          variant='base'
          width={undefined}
          height={undefined}
          testID='undefined-props-skeleton'
        />,
      );

      const skeleton = getByTestId('undefined-props-skeleton');
      expect(skeleton).toBeTruthy();
    });
  });
});
