/**
 * Accessibility utilities for WCAG 2.1 AA compliance
 * Supports screen readers, high contrast, and keyboard navigation
 */
import { AccessibilityInfo, Platform } from 'react-native';

import { loggingService } from '../services/LoggingService';

export interface AccessibilityConfig {
  readonly announceScreenChanges: boolean;
  readonly announceFormErrors: boolean;
  readonly highContrast: boolean;
  readonly reducedMotion: boolean;
  readonly screenReaderEnabled: boolean;
  readonly fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  readonly voiceControl: boolean;
}

export interface AccessibilityAuditResult {
  readonly elementId: string;
  readonly severity: 'error' | 'warning' | 'info';
  readonly rule: string;
  readonly description: string;
  readonly suggestions: readonly string[];
}

class AccessibilityService {
  private config: AccessibilityConfig = {
    announceScreenChanges: true,
    announceFormErrors: true,
    highContrast: false,
    reducedMotion: false,
    screenReaderEnabled: false,
    fontSize: 'medium',
    voiceControl: false,
  };

  private auditResults: AccessibilityAuditResult[] = [];

  async initialize(): Promise<void> {
    try {
      // Detect accessibility settings
      const screenReaderEnabled =
        await AccessibilityInfo.isScreenReaderEnabled();
      const reducedMotionEnabled =
        await AccessibilityInfo.isReduceMotionEnabled();

      this.config = {
        ...this.config,
        screenReaderEnabled,
        reducedMotion: reducedMotionEnabled,
      };

      // Set up accessibility event listeners
      AccessibilityInfo.addEventListener(
        'screenReaderChanged',
        this.handleScreenReaderChange,
      );
      AccessibilityInfo.addEventListener(
        'reduceMotionChanged',
        this.handleReducedMotionChange,
      );

      loggingService.info('Accessibility Service initialized', {
        screenReaderEnabled,
        reducedMotionEnabled,
        platform: Platform.OS,
      });
    } catch (error) {
      loggingService.error('Failed to initialize accessibility service', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private handleScreenReaderChange = (enabled: boolean): void => {
    this.config = { ...this.config, screenReaderEnabled: enabled };
    loggingService.info('Screen reader status changed', { enabled });
  };

  private handleReducedMotionChange = (enabled: boolean): void => {
    this.config = { ...this.config, reducedMotion: enabled };
    loggingService.info('Reduced motion status changed', { enabled });
  };

  /**
   * Announce text to screen readers
   */
  announceForAccessibility(
    message: string,
    priority: 'low' | 'high' = 'high',
  ): void {
    if (!this.config.screenReaderEnabled) return;

    try {
      // Cross-platform accessibility announcement
      AccessibilityInfo.announceForAccessibility(message);

      loggingService.debug('Accessibility announcement', { message, priority });
    } catch (error) {
      loggingService.warn('Failed to announce for accessibility', {
        message,
        error,
      });
    }
  }

  /**
   * Announce navigation changes
   */
  announceNavigationChange(screenName: string, description?: string): void {
    if (!this.config.announceScreenChanges) return;

    const message = description
      ? `Navigated to ${screenName}. ${description}`
      : `Navigated to ${screenName}`;

    this.announceForAccessibility(message);
  }

  /**
   * Announce form validation errors
   */
  announceFormError(fieldName: string, errorMessage: string): void {
    if (!this.config.announceFormErrors) return;

    const message = `Error in ${fieldName}: ${errorMessage}`;
    this.announceForAccessibility(message, 'high');
  }

  /**
   * Get recommended font scale based on accessibility settings
   */
  getFontScale(): number {
    const baseScales = {
      small: 0.85,
      medium: 1.0,
      large: 1.15,
      'extra-large': 1.3,
    };

    return baseScales[this.config.fontSize];
  }

  /**
   * Get accessible color contrast ratios
   */
  getContrastColors(isDark = false): Record<string, string> {
    if (this.config.highContrast) {
      return isDark
        ? {
            background: '#000000',
            surface: '#1a1a1a',
            primary: '#ffffff',
            secondary: '#e0e0e0',
            accent: '#ffff00',
            text: '#ffffff',
            textSecondary: '#e0e0e0',
            border: '#ffffff',
            error: '#ff6b6b',
            warning: '#ffd93d',
            success: '#6bcf7f',
          }
        : {
            background: '#ffffff',
            surface: '#f5f5f5',
            primary: '#000000',
            secondary: '#333333',
            accent: '#0066cc',
            text: '#000000',
            textSecondary: '#333333',
            border: '#000000',
            error: '#d32f2f',
            warning: '#f57c00',
            success: '#388e3c',
          };
    }

    // Standard contrast ratios (4.5:1 for normal text, 3:1 for large text)
    return isDark
      ? {
          background: '#121212',
          surface: '#1e1e1e',
          primary: '#bb86fc',
          secondary: '#03dac6',
          accent: '#cf6679',
          text: '#ffffff',
          textSecondary: '#b3b3b3',
          border: '#373737',
          error: '#cf6679',
          warning: '#ffb74d',
          success: '#81c784',
        }
      : {
          background: '#ffffff',
          surface: '#f8f9fa',
          primary: '#6200ea',
          secondary: '#018786',
          accent: '#b00020',
          text: '#000000',
          textSecondary: '#666666',
          border: '#e0e0e0',
          error: '#b00020',
          warning: '#f57c00',
          success: '#388e3c',
        };
  }

  /**
   * Validate accessibility compliance for a component
   */
  auditComponent(
    componentProps: Record<string, unknown>,
  ): AccessibilityAuditResult[] {
    const results: AccessibilityAuditResult[] = [];

    // Check for accessible labels
    if (!componentProps.accessibilityLabel && !componentProps.children) {
      results.push({
        elementId: String(componentProps.testID ?? 'unknown'),
        severity: 'error',
        rule: 'WCAG 1.3.1',
        description: 'Interactive element missing accessibility label',
        suggestions: [
          'Add accessibilityLabel prop',
          'Ensure meaningful text content',
          'Use accessibilityHint for additional context',
        ],
      });
    }

    // Check for accessibility roles
    if (componentProps.onPress && !componentProps.accessibilityRole) {
      results.push({
        elementId: String(componentProps.testID ?? 'unknown'),
        severity: 'warning',
        rule: 'WCAG 4.1.2',
        description: 'Interactive element missing accessibility role',
        suggestions: [
          'Add accessibilityRole="button" for buttons',
          'Add accessibilityRole="link" for navigation',
          'Use appropriate semantic roles',
        ],
      });
    }

    // Check for sufficient touch target size (44x44 minimum)
    const style = componentProps.style as Record<string, unknown>;
    if (
      style &&
      ((typeof style.width === 'number' && style.width < 44) ||
        (typeof style.height === 'number' && style.height < 44))
    ) {
      results.push({
        elementId: String(componentProps.testID ?? 'unknown'),
        severity: 'warning',
        rule: 'WCAG 2.5.5',
        description: 'Touch target size below recommended 44x44 points',
        suggestions: [
          'Increase minimum touch target to 44x44 points',
          'Add padding to increase effective touch area',
          'Use hitSlop prop for React Native components',
        ],
      });
    }

    return results;
  }

  /**
   * Generate accessibility report
   */
  generateAccessibilityReport(): {
    summary: {
      totalIssues: number;
      errorCount: number;
      warningCount: number;
      complianceScore: number;
    };
    issues: AccessibilityAuditResult[];
    recommendations: string[];
  } {
    const errorCount = this.auditResults.filter(
      r => r.severity === 'error',
    ).length;
    const warningCount = this.auditResults.filter(
      r => r.severity === 'warning',
    ).length;
    const totalIssues = this.auditResults.length;

    // Calculate compliance score (0-100)
    const maxScore = 100;
    const errorPenalty = errorCount * 20;
    const warningPenalty = warningCount * 5;
    const complianceScore = Math.max(
      0,
      maxScore - errorPenalty - warningPenalty,
    );

    const recommendations = [
      'Implement comprehensive screen reader testing',
      'Add keyboard navigation support for all interactive elements',
      'Ensure color contrast ratios meet WCAG AA standards',
      'Provide alternative text for all images and icons',
      'Test with real assistive technologies',
      'Implement focus management for modal dialogs',
      'Add skip navigation links for complex layouts',
      'Ensure form validation errors are announced',
    ];

    return {
      summary: {
        totalIssues,
        errorCount,
        warningCount,
        complianceScore,
      },
      issues: this.auditResults,
      recommendations,
    };
  }

  /**
   * Get current accessibility configuration
   */
  getAccessibilityConfig(): AccessibilityConfig {
    return { ...this.config };
  }

  /**
   * Update accessibility configuration
   */
  updateAccessibilityConfig(updates: Partial<AccessibilityConfig>): void {
    this.config = { ...this.config, ...updates };
    loggingService.info('Accessibility configuration updated', updates);
  }

  /**
   * Clean up accessibility service
   */
  cleanup(): void {
    // Note: React Native AccessibilityInfo doesn't have removeEventListener
    // Listeners are automatically cleaned up when the app unmounts

    this.auditResults = [];
    loggingService.info('Accessibility Service cleaned up');
  }
}

// Create and export singleton instance
export const accessibilityService = new AccessibilityService();

// Utility functions for common accessibility patterns
export const AccessibilityUtils = {
  /**
   * Create accessibility props for touchable elements
   */
  createTouchableProps(
    label: string,
    hint?: string,
    role: 'button' | 'link' = 'button',
  ) {
    return {
      accessible: true,
      accessibilityLabel: label,
      accessibilityHint: hint,
      accessibilityRole: role,
      accessibilityState: {},
    };
  },

  /**
   * Create accessibility props for text inputs
   */
  createTextInputProps(
    label: string,
    isRequired = false,
    errorMessage?: string,
  ) {
    return {
      accessible: true,
      accessibilityLabel: label,
      accessibilityHint: isRequired ? 'Required field' : undefined,
      accessibilityRequired: isRequired,
      accessibilityInvalid: !!errorMessage,
      accessibilityErrorMessage: errorMessage,
    };
  },

  /**
   * Create accessibility props for images
   */
  createImageProps(altText: string, isDecorative = false) {
    return isDecorative
      ? {
          accessible: false,
          accessibilityElementsHidden: true,
        }
      : {
          accessible: true,
          accessibilityLabel: altText,
          accessibilityRole: 'image',
        };
  },

  /**
   * Validate color contrast ratio
   */
  validateColorContrast(
    foreground: string,
    background: string,
  ): {
    ratio: number;
    passesAA: boolean;
    passesAAA: boolean;
  } {
    // Simplified contrast calculation - in production, use a proper library
    const getLuminance = (color: string): number => {
      // Convert hex to RGB and calculate relative luminance
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;

      const sRGB = [r, g, b].map(c =>
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4),
      );

      return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
    };

    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

    return {
      ratio,
      passesAA: ratio >= 4.5,
      passesAAA: ratio >= 7,
    };
  },
};

export default accessibilityService;
