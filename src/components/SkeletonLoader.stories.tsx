// @ts-nocheck
/* eslint-disable */
import SkeletonLoader from './SkeletonLoader';
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';

const meta: Meta<typeof SkeletonLoader> = {
  title: 'Components/SkeletonLoader',
  component: SkeletonLoader,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A versatile skeleton loader component with multiple variants for different loading states. Supports customizable animations, colors, and layouts.',
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: [
        'base',
        'text',
        'circle',
        'image',
        'card',
        'list',
        'grid',
        'chart',
      ],
      description: 'The type of skeleton loader to display',
    },
    width: {
      control: { type: 'number' },
      description: 'Width of the skeleton loader',
    },
    height: {
      control: { type: 'number' },
      description: 'Height of the skeleton loader',
    },
    borderRadius: {
      control: { type: 'number' },
      description: 'Border radius of the skeleton loader',
    },
    animationSpeed: {
      control: { type: 'range', min: 500, max: 3000, step: 100 },
      description: 'Speed of the shimmer animation in milliseconds',
    },
    shimmerColors: {
      control: { type: 'object' },
      description: 'Array of colors for the shimmer gradient',
    },
    lines: {
      control: { type: 'number', min: 1, max: 10 },
      description: 'Number of lines for text variant',
    },
    items: {
      control: { type: 'number', min: 1, max: 20 },
      description: 'Number of items for list and grid variants',
    },
    columns: {
      control: { type: 'number', min: 1, max: 5 },
      description: 'Number of columns for grid variant',
    },
    spacing: {
      control: { type: 'number' },
      description: 'Spacing between skeleton elements',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SkeletonLoader>;

// Basic skeleton loader
export const Base: Story = {
  args: {
    variant: 'base',
    width: 200,
    height: 20,
  },
};

// Text skeleton with multiple lines
export const Text: Story = {
  args: {
    variant: 'text',
    lines: 3,
    width: 300,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Text skeleton loader with multiple lines of varying widths to simulate paragraph text.',
      },
    },
  },
};

// Circle skeleton for avatars
export const Circle: Story = {
  args: {
    variant: 'circle',
    width: 60,
    height: 60,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Circular skeleton loader perfect for user avatars and profile pictures.',
      },
    },
  },
};

// Image skeleton
export const Image: Story = {
  args: {
    variant: 'image',
    width: 300,
    height: 200,
  },
  parameters: {
    docs: {
      description: {
        story: 'Rectangular skeleton loader for images with rounded corners.',
      },
    },
  },
};

// Card skeleton
export const Card: Story = {
  args: {
    variant: 'card',
    width: 300,
  },
  parameters: {
    docs: {
      description: {
        story: 'Complete card skeleton with image, title, and content areas.',
      },
    },
  },
};

// List skeleton
export const List: Story = {
  args: {
    variant: 'list',
    items: 5,
  },
  parameters: {
    docs: {
      description: {
        story:
          'List skeleton with multiple items, each containing avatar and text lines.',
      },
    },
  },
};

// Grid skeleton
export const Grid: Story = {
  args: {
    variant: 'grid',
    items: 6,
    columns: 2,
  },
  parameters: {
    docs: {
      description: {
        story: 'Grid skeleton layout with configurable columns and items.',
      },
    },
  },
};

// Chart skeleton
export const Chart: Story = {
  args: {
    variant: 'chart',
    width: 350,
    height: 200,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Chart skeleton with bars and axis lines to simulate data visualization.',
      },
    },
  },
};

// Custom colors
export const CustomColors: Story = {
  args: {
    variant: 'base',
    width: 200,
    height: 20,
    shimmerColors: ['#E1E9EE', '#F2F8FC', '#E1E9EE'],
  },
  parameters: {
    docs: {
      description: {
        story: 'Skeleton loader with custom shimmer colors.',
      },
    },
  },
};

// Slow animation
export const SlowAnimation: Story = {
  args: {
    variant: 'base',
    width: 200,
    height: 20,
    animationSpeed: 2000,
  },
  parameters: {
    docs: {
      description: {
        story: 'Skeleton loader with slower animation speed.',
      },
    },
  },
};

// Fast animation
export const FastAnimation: Story = {
  args: {
    variant: 'base',
    width: 200,
    height: 20,
    animationSpeed: 800,
  },
  parameters: {
    docs: {
      description: {
        story: 'Skeleton loader with faster animation speed.',
      },
    },
  },
};

// Large text block
export const LargeTextBlock: Story = {
  args: {
    variant: 'text',
    lines: 8,
    width: 400,
  },
  parameters: {
    docs: {
      description: {
        story: 'Large text block skeleton for article content.',
      },
    },
  },
};

// Profile card layout
export const ProfileCard: Story = {
  render: () => (
    <View style={styles.profileCard}>
      <SkeletonLoader variant='circle' width={80} height={80} />
      <View style={styles.profileInfo}>
        <SkeletonLoader variant='text' lines={1} width={150} />
        <SkeletonLoader variant='text' lines={1} width={100} />
        <SkeletonLoader variant='text' lines={2} width={200} />
      </View>
    </View>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Custom profile card layout combining circle and text skeletons.',
      },
    },
  },
};

// Article layout
export const ArticleLayout: Story = {
  render: () => (
    <ScrollView style={styles.article}>
      <SkeletonLoader variant='image' width={350} height={200} />
      <View style={styles.articleContent}>
        <SkeletonLoader variant='text' lines={1} width={250} />
        <SkeletonLoader variant='text' lines={5} width={350} />
        <SkeletonLoader variant='image' width={300} height={150} />
        <SkeletonLoader variant='text' lines={3} width={350} />
      </View>
    </ScrollView>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Article layout with header image, title, and content blocks.',
      },
    },
  },
};

// Dashboard layout
export const DashboardLayout: Story = {
  render: () => (
    <ScrollView style={styles.dashboard}>
      <View style={styles.dashboardHeader}>
        <SkeletonLoader variant='circle' width={50} height={50} />
        <View style={styles.headerText}>
          <SkeletonLoader variant='text' lines={1} width={120} />
          <SkeletonLoader variant='text' lines={1} width={80} />
        </View>
      </View>

      <View style={styles.statsGrid}>
        <SkeletonLoader variant='card' width={160} />
        <SkeletonLoader variant='card' width={160} />
      </View>

      <SkeletonLoader variant='chart' width={350} height={200} />

      <SkeletonLoader variant='list' items={4} />
    </ScrollView>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete dashboard layout with header, stats, chart, and list.',
      },
    },
  },
};

// Social feed layout
export const SocialFeedLayout: Story = {
  render: () => (
    <ScrollView style={styles.socialFeed}>
      {[1, 2, 3].map(item => (
        <View key={item} style={styles.feedItem}>
          <View style={styles.feedHeader}>
            <SkeletonLoader variant='circle' width={40} height={40} />
            <View style={styles.feedUserInfo}>
              <SkeletonLoader variant='text' lines={1} width={100} />
              <SkeletonLoader variant='text' lines={1} width={60} />
            </View>
          </View>
          <SkeletonLoader variant='text' lines={2} width={300} />
          <SkeletonLoader variant='image' width={300} height={200} />
          <View style={styles.feedActions}>
            <SkeletonLoader variant='base' width={60} height={20} />
            <SkeletonLoader variant='base' width={60} height={20} />
            <SkeletonLoader variant='base' width={60} height={20} />
          </View>
        </View>
      ))}
    </ScrollView>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Social media feed layout with multiple post skeletons.',
      },
    },
  },
};

// E-commerce product grid
export const ProductGrid: Story = {
  render: () => (
    <View style={styles.productGrid}>
      {[1, 2, 3, 4, 5, 6].map(item => (
        <View key={item} style={styles.productCard}>
          <SkeletonLoader variant='image' width={150} height={150} />
          <View style={styles.productInfo}>
            <SkeletonLoader variant='text' lines={1} width={120} />
            <SkeletonLoader variant='text' lines={1} width={80} />
            <SkeletonLoader
              variant='base'
              width={60}
              height={25}
              borderRadius={12}
            />
          </View>
        </View>
      ))}
    </View>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'E-commerce product grid with image, title, price, and button skeletons.',
      },
    },
  },
};

// Dark theme
export const DarkTheme: Story = {
  args: {
    variant: 'card',
    width: 300,
    shimmerColors: ['#2A2A2A', '#3A3A3A', '#2A2A2A'],
  },
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'Skeleton loader with dark theme colors.',
      },
    },
  },
};

// Accessibility showcase
export const AccessibilityShowcase: Story = {
  render: () => (
    <View style={styles.accessibilityDemo}>
      <SkeletonLoader
        variant='text'
        lines={3}
        width={300}
        accessibilityLabel='Loading article content'
        accessibilityHint='Please wait while the content loads'
      />
    </View>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Skeleton loader with accessibility labels and hints for screen readers.',
      },
    },
  },
};

const styles = StyleSheet.create({
  profileCard: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  article: {
    flex: 1,
  },
  articleContent: {
    padding: 16,
  },
  dashboard: {
    flex: 1,
    padding: 16,
  },
  dashboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    marginLeft: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  socialFeed: {
    flex: 1,
  },
  feedItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  feedUserInfo: {
    marginLeft: 12,
  },
  feedActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
  },
  productCard: {
    width: '48%',
    marginBottom: 16,
  },
  productInfo: {
    marginTop: 8,
  },
  accessibilityDemo: {
    padding: 16,
  },
});
