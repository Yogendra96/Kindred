import React from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { HapticFeedbackService } from '../../../services/HapticFeedbackService';
import { Button } from '../Button';

// Mock the HapticFeedbackService
jest.mock('../../../services/HapticFeedbackService', () => ({
  HapticFeedbackService: {
    triggerSuccess: jest.fn(),
  },
}));

const mockHapticFeedback =
  HapticFeedbackService.triggerSuccess as jest.MockedFunction<
    typeof HapticFeedbackService.triggerSuccess
  >;

describe('Button Component', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders correctly with default props', () => {
      const { getByText } = render(
        <Button title='Test Button' onPress={mockOnPress} />,
      );

      expect(getByText('Test Button')).toBeTruthy();
    });

    it('renders with custom title', () => {
      const { getByText } = render(
        <Button title='Custom Title' onPress={mockOnPress} />,
      );

      expect(getByText('Custom Title')).toBeTruthy();
    });

    it('renders with testID', () => {
      const { getByTestId } = render(
        <Button title='Test' onPress={mockOnPress} testID='test-button' />,
      );

      expect(getByTestId('test-button')).toBeTruthy();
    });
  });

  describe('Variants', () => {
    it('renders primary variant correctly', () => {
      const { getByText } = render(
        <Button title='Primary' onPress={mockOnPress} variant='primary' />,
      );

      const button = getByText('Primary').parent;
      expect(button).toHaveStyle({ backgroundColor: '#4CAF50' });
    });

    it('renders secondary variant correctly', () => {
      const { getByText } = render(
        <Button title='Secondary' onPress={mockOnPress} variant='secondary' />,
      );

      const button = getByText('Secondary').parent;
      expect(button).toHaveStyle({ backgroundColor: '#2196F3' });
    });

    it('renders danger variant correctly', () => {
      const { getByText } = render(
        <Button title='Danger' onPress={mockOnPress} variant='danger' />,
      );

      const button = getByText('Danger').parent;
      expect(button).toHaveStyle({ backgroundColor: '#F44336' });
    });

    it('renders ghost variant correctly', () => {
      const { getByText } = render(
        <Button title='Ghost' onPress={mockOnPress} variant='ghost' />,
      );

      const button = getByText('Ghost').parent;
      expect(button).toHaveStyle({
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#E0E0E0',
      });
    });

    it('renders outline variant correctly', () => {
      const { getByText } = render(
        <Button title='Outline' onPress={mockOnPress} variant='outline' />,
      );

      const button = getByText('Outline').parent;
      expect(button).toHaveStyle({
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#4CAF50',
      });
    });
  });

  describe('Sizes', () => {
    it('renders small size correctly', () => {
      const { getByText } = render(
        <Button title='Small' onPress={mockOnPress} size='small' />,
      );

      const button = getByText('Small').parent;
      expect(button).toHaveStyle({
        paddingHorizontal: 16,
        paddingVertical: 8,
        minHeight: 36,
      });
    });

    it('renders medium size correctly', () => {
      const { getByText } = render(
        <Button title='Medium' onPress={mockOnPress} size='medium' />,
      );

      const button = getByText('Medium').parent;
      expect(button).toHaveStyle({
        paddingHorizontal: 24,
        paddingVertical: 12,
        minHeight: 48,
      });
    });

    it('renders large size correctly', () => {
      const { getByText } = render(
        <Button title='Large' onPress={mockOnPress} size='large' />,
      );

      const button = getByText('Large').parent;
      expect(button).toHaveStyle({
        paddingHorizontal: 32,
        paddingVertical: 16,
        minHeight: 56,
      });
    });
  });

  describe('States', () => {
    it('renders disabled state correctly', () => {
      const { getByText } = render(
        <Button title='Disabled' onPress={mockOnPress} disabled />,
      );

      const button = getByText('Disabled').parent;
      expect(button).toHaveStyle({ opacity: 0.6 });
    });

    it('renders loading state correctly', () => {
      const { getByText } = render(
        <Button title='Loading' onPress={mockOnPress} loading />,
      );

      expect(getByText('Loading...')).toBeTruthy();
      // ActivityIndicator should be present
      const button = getByText('Loading...').parent;
      expect(button).toBeTruthy();
    });

    it('renders full width correctly', () => {
      const { getByText } = render(
        <Button title='Full Width' onPress={mockOnPress} fullWidth />,
      );

      const button = getByText('Full Width').parent;
      expect(button).toHaveStyle({ width: '100%' });
    });
  });

  describe('Interactions', () => {
    it('calls onPress when pressed', () => {
      const { getByText } = render(
        <Button title='Press Me' onPress={mockOnPress} />,
      );

      fireEvent.press(getByText('Press Me'));
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('triggers haptic feedback when pressed', async () => {
      const { getByText } = render(
        <Button title='Haptic' onPress={mockOnPress} hapticFeedback />,
      );

      fireEvent.press(getByText('Haptic'));

      await waitFor(() => {
        expect(mockHapticFeedback).toHaveBeenCalledTimes(1);
      });
    });

    it('does not trigger haptic feedback when disabled', () => {
      const { getByText } = render(
        <Button
          title='Disabled'
          onPress={mockOnPress}
          hapticFeedback={false}
        />,
      );

      fireEvent.press(getByText('Disabled'));
      expect(mockHapticFeedback).not.toHaveBeenCalled();
    });

    it('does not call onPress when disabled', () => {
      const { getByText } = render(
        <Button title='Disabled' onPress={mockOnPress} disabled />,
      );

      fireEvent.press(getByText('Disabled'));
      expect(mockOnPress).not.toHaveBeenCalled();
    });

    it('does not call onPress when loading', () => {
      const { getByText } = render(
        <Button title='Loading' onPress={mockOnPress} loading />,
      );

      fireEvent.press(getByText('Loading...'));
      expect(mockOnPress).not.toHaveBeenCalled();
    });
  });

  describe('Icons', () => {
    const MockIcon = () => <div data-testid='mock-icon'>Icon</div>;

    it('renders icon on the left by default', () => {
      const { getByTestId } = render(
        <Button title='With Icon' onPress={mockOnPress} icon={<MockIcon />} />,
      );

      expect(getByTestId('mock-icon')).toBeTruthy();
    });

    it('renders icon on the right when specified', () => {
      const { getByTestId } = render(
        <Button
          title='With Icon'
          onPress={mockOnPress}
          icon={<MockIcon />}
          iconPosition='right'
        />,
      );

      expect(getByTestId('mock-icon')).toBeTruthy();
    });
  });

  describe('Custom Styles', () => {
    it('applies custom button style', () => {
      const customStyle = { backgroundColor: 'red' };
      const { getByText } = render(
        <Button
          title='Custom Style'
          onPress={mockOnPress}
          style={customStyle}
        />,
      );

      const button = getByText('Custom Style').parent;
      expect(button).toHaveStyle(customStyle);
    });

    it('applies custom text style', () => {
      const customTextStyle = { fontSize: 20 };
      const { getByText } = render(
        <Button
          title='Custom Text'
          onPress={mockOnPress}
          textStyle={customTextStyle}
        />,
      );

      const text = getByText('Custom Text');
      expect(text).toHaveStyle(customTextStyle);
    });
  });

  describe('Accessibility', () => {
    it('is accessible by default', () => {
      const { getByText } = render(
        <Button title='Accessible' onPress={mockOnPress} />,
      );

      const button = getByText('Accessible').parent;
      expect(button).toBeTruthy();
    });

    it('has correct accessibility state when disabled', () => {
      const { getByText } = render(
        <Button title='Disabled' onPress={mockOnPress} disabled />,
      );

      const button = getByText('Disabled').parent;
      expect(button.props.disabled).toBe(true);
    });
  });
});
