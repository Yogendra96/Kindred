import React from 'react';

import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/react';

import { Button } from './Button';

// Mock the Button component if it doesn't exist yet
const MockButton = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  ...props
}) => {
  const baseStyles = {
    padding:
      size === 'small'
        ? '8px 16px'
        : size === 'large'
          ? '16px 32px'
          : '12px 24px',
    borderRadius: '8px',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    fontSize: size === 'small' ? '14px' : size === 'large' ? '18px' : '16px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    minWidth: '120px',
  };

  const variantStyles = {
    primary: {
      backgroundColor: '#4CAF50',
      color: 'white',
    },
    secondary: {
      backgroundColor: 'transparent',
      color: '#4CAF50',
      border: '2px solid #4CAF50',
    },
    danger: {
      backgroundColor: '#f44336',
      color: 'white',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: '#666',
      border: '1px solid #ddd',
    },
  };

  return (
    <button
      style={{
        ...baseStyles,
        ...variantStyles[variant],
      }}
      onClick={onPress}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div
          style={{
            width: '16px',
            height: '16px',
            border: '2px solid currentColor',
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
      )}
      {icon && !loading && <span>{icon}</span>}
      {title}
    </button>
  );
};

// Use the actual Button component or the mock
const ButtonComponent = Button || MockButton;

const meta: Meta<typeof ButtonComponent> = {
  title: 'Components/Button',
  component: ButtonComponent,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A versatile button component with multiple variants, sizes, and states.',
      },
    },
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Button text content',
    },
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger', 'ghost'],
      description: 'Button visual style variant',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Button size',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable button interaction',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading state',
    },
    icon: {
      control: 'text',
      description: 'Icon to display (emoji or icon name)',
    },
    onPress: {
      action: 'pressed',
      description: 'Function called when button is pressed',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Default: Story = {
  args: {
    title: 'Button',
    onPress: action('button-clicked'),
  },
};

// Variant stories
export const Primary: Story = {
  args: {
    title: 'Primary Button',
    variant: 'primary',
    onPress: action('primary-clicked'),
  },
};

export const Secondary: Story = {
  args: {
    title: 'Secondary Button',
    variant: 'secondary',
    onPress: action('secondary-clicked'),
  },
};

export const Danger: Story = {
  args: {
    title: 'Delete',
    variant: 'danger',
    onPress: action('danger-clicked'),
  },
};

export const Ghost: Story = {
  args: {
    title: 'Ghost Button',
    variant: 'ghost',
    onPress: action('ghost-clicked'),
  },
};

// Size stories
export const Small: Story = {
  args: {
    title: 'Small',
    size: 'small',
    onPress: action('small-clicked'),
  },
};

export const Medium: Story = {
  args: {
    title: 'Medium',
    size: 'medium',
    onPress: action('medium-clicked'),
  },
};

export const Large: Story = {
  args: {
    title: 'Large',
    size: 'large',
    onPress: action('large-clicked'),
  },
};

// State stories
export const Disabled: Story = {
  args: {
    title: 'Disabled',
    disabled: true,
    onPress: action('disabled-clicked'),
  },
};

export const Loading: Story = {
  args: {
    title: 'Loading...',
    loading: true,
    onPress: action('loading-clicked'),
  },
};

// With icon stories
export const WithIcon: Story = {
  args: {
    title: 'Add Activity',
    icon: '➕',
    onPress: action('icon-clicked'),
  },
};

export const SaveButton: Story = {
  args: {
    title: 'Save',
    icon: '💾',
    variant: 'primary',
    onPress: action('save-clicked'),
  },
};

export const ShareButton: Story = {
  args: {
    title: 'Share',
    icon: '📤',
    variant: 'secondary',
    onPress: action('share-clicked'),
  },
};

// All variants showcase
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      <ButtonComponent
        title='Primary'
        variant='primary'
        onPress={action('primary')}
      />
      <ButtonComponent
        title='Secondary'
        variant='secondary'
        onPress={action('secondary')}
      />
      <ButtonComponent
        title='Danger'
        variant='danger'
        onPress={action('danger')}
      />
      <ButtonComponent
        title='Ghost'
        variant='ghost'
        onPress={action('ghost')}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All button variants displayed together for comparison.',
      },
    },
  },
};

// All sizes showcase
export const AllSizes: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      <ButtonComponent title='Small' size='small' onPress={action('small')} />
      <ButtonComponent
        title='Medium'
        size='medium'
        onPress={action('medium')}
      />
      <ButtonComponent title='Large' size='large' onPress={action('large')} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All button sizes displayed together for comparison.',
      },
    },
  },
};

// Interactive playground
export const Playground: Story = {
  args: {
    title: 'Playground Button',
    variant: 'primary',
    size: 'medium',
    disabled: false,
    loading: false,
    icon: '',
    onPress: action('playground-clicked'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive playground to test different button configurations.',
      },
    },
  },
};

// Carbon tracking specific buttons
export const CarbonTrackingButtons: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        maxWidth: '300px',
      }}
    >
      <ButtonComponent
        title='Add Activity'
        icon='🚶'
        variant='primary'
        onPress={action('add-activity')}
      />
      <ButtonComponent
        title='Scan Product'
        icon='📱'
        variant='secondary'
        onPress={action('scan-product')}
      />
      <ButtonComponent
        title='View Report'
        icon='📊'
        variant='ghost'
        onPress={action('view-report')}
      />
      <ButtonComponent
        title='Share Achievement'
        icon='🏆'
        variant='primary'
        size='small'
        onPress={action('share-achievement')}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Button examples specific to carbon tracking features.',
      },
    },
  },
};

// Accessibility story
export const Accessibility: Story = {
  args: {
    title: 'Accessible Button',
    onPress: action('accessible-clicked'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Button with proper accessibility attributes and keyboard navigation support.',
      },
    },
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
          {
            id: 'keyboard-navigation',
            enabled: true,
          },
        ],
      },
    },
  },
};

// Dark theme story
export const DarkTheme: Story = {
  args: {
    title: 'Dark Theme Button',
    onPress: action('dark-theme-clicked'),
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Button appearance in dark theme.',
      },
    },
  },
};
