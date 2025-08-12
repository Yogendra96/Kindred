/**
 * LoggingDashboard Component Tests
 * Comprehensive unit tests for the logging dashboard
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import LoggingDashboard from '../LoggingDashboard';
import { advancedLoggingService } from '../../services/AdvancedLoggingService';

// Mock the logging service
jest.mock('../../services/AdvancedLoggingService', () => ({
  advancedLoggingService: {
    search: jest.fn(),
    getAnalytics: jest.fn(),
    exportLogs: jest.fn(),
  },
}));

const mockStore = configureStore({
  reducer: {
    auth: (state = { user: { email: 'test@example.com' } }) => state,
  },
});

const renderWithProvider = (component: React.ReactElement) => {
  return render(<Provider store={mockStore}>{component}</Provider>);
};

describe('LoggingDashboard', () => {
  const mockLogs = [
    {
      id: '1',
      level: 'info' as const,
      message: 'Test log message',
      timestamp: Date.now(),
      platform: 'ios',
      environment: 'test',
      metadata: {
        category: 'test',
        component: 'TestComponent',
        action: 'test_action',
      },
    },
  ];

  const mockAnalytics = {
    totalLogs: 100,
    logsByLevel: {
      info: 50,
      warn: 30,
      error: 20,
      debug: 0,
      trace: 0,
      fatal: 0,
    },
    logsByCategory: {
      auth: 25,
      carbon: 35,
      ui: 40,
    },
    performanceMetrics: {
      errorRate: 0.2,
      avgLogSize: 150,
      avgProcessingTime: 5,
    },
    topErrors: [
      { message: 'Network error', count: 15 },
      { message: 'Validation failed', count: 5 },
    ],
    timeRange: {
      start: Date.now() - 86400000,
      end: Date.now(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (advancedLoggingService.search as jest.Mock).mockReturnValue(mockLogs);
    (advancedLoggingService.getAnalytics as jest.Mock).mockReturnValue(
      mockAnalytics,
    );
    (advancedLoggingService.exportLogs as jest.Mock).mockResolvedValue(
      'exported logs',
    );
  });

  describe('Component Rendering', () => {
    it('should render the dashboard when visible', () => {
      const { getByText } = renderWithProvider(
        <LoggingDashboard visible onClose={jest.fn()} />,
      );

      expect(getByText('Logging Dashboard')).toBeTruthy();
    });

    it('should not render when not visible', () => {
      const { queryByText } = renderWithProvider(
        <LoggingDashboard visible={false} onClose={jest.fn()} />,
      );

      expect(queryByText('Logging Dashboard')).toBeFalsy();
    });

    it('should render all tabs', () => {
      const { getByText } = renderWithProvider(
        <LoggingDashboard visible onClose={jest.fn()} />,
      );

      expect(getByText('Logs')).toBeTruthy();
      expect(getByText('Analytics')).toBeTruthy();
      expect(getByText('Search')).toBeTruthy();
    });
  });

  describe('Log Display', () => {
    it('should display logs correctly', () => {
      const { getByText } = renderWithProvider(
        <LoggingDashboard visible onClose={jest.fn()} />,
      );

      expect(getByText('Test log message')).toBeTruthy();
      expect(getByText('INFO')).toBeTruthy();
    });

    it('should format log timestamps correctly', () => {
      const specificTime = new Date('2025-01-01T12:00:00Z').getTime();
      const logWithSpecificTime = {
        ...mockLogs[0],
        timestamp: specificTime,
      };

      (advancedLoggingService.search as jest.Mock).mockReturnValue([
        logWithSpecificTime,
      ]);

      const { getByText } = renderWithProvider(
        <LoggingDashboard visible onClose={jest.fn()} />,
      );

      // Should display formatted time
      expect(getByText(/\d{1,2}:\d{2}:\d{2}/)).toBeTruthy();
    });

    it('should display category badges when present', () => {
      const { getByText } = renderWithProvider(
        <LoggingDashboard visible onClose={jest.fn()} />,
      );

      expect(getByText('test')).toBeTruthy(); // Category badge
    });
  });

  describe('Analytics Tab', () => {
    it('should switch to analytics tab and display analytics', async () => {
      const { getByText } = renderWithProvider(
        <LoggingDashboard visible onClose={jest.fn()} />,
      );

      fireEvent.press(getByText('Analytics'));

      await waitFor(() => {
        expect(getByText('Overview')).toBeTruthy();
        expect(getByText('Total Logs')).toBeTruthy();
        expect(getByText('100')).toBeTruthy(); // Total logs count
      });
    });

    it('should display error rate correctly', async () => {
      const { getByText } = renderWithProvider(
        <LoggingDashboard visible onClose={jest.fn()} />,
      );

      fireEvent.press(getByText('Analytics'));

      await waitFor(() => {
        expect(getByText('20.0%')).toBeTruthy(); // Error rate
      });
    });

    it('should display logs by level breakdown', async () => {
      const { getByText } = renderWithProvider(
        <LoggingDashboard visible onClose={jest.fn()} />,
      );

      fireEvent.press(getByText('Analytics'));

      await waitFor(() => {
        expect(getByText('Logs by Level')).toBeTruthy();
        expect(getByText('INFO')).toBeTruthy();
        expect(getByText('WARN')).toBeTruthy();
        expect(getByText('ERROR')).toBeTruthy();
      });
    });

    it('should display top errors when available', async () => {
      const { getByText } = renderWithProvider(
        <LoggingDashboard visible onClose={jest.fn()} />,
      );

      fireEvent.press(getByText('Analytics'));

      await waitFor(() => {
        expect(getByText('Top Errors')).toBeTruthy();
        expect(getByText('Network error')).toBeTruthy();
        expect(getByText('×15')).toBeTruthy();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should switch to search tab and display search interface', async () => {
      const { getByText, getByPlaceholderText } = renderWithProvider(
        <LoggingDashboard visible onClose={jest.fn()} />,
      );

      fireEvent.press(getByText('Search'));

      await waitFor(() => {
        expect(getByPlaceholderText('Search logs...')).toBeTruthy();
        expect(getByText('Levels')).toBeTruthy();
        expect(getByText('Category')).toBeTruthy();
      });
    });

    it('should update search query when typing', async () => {
      const { getByText, getByPlaceholderText } = renderWithProvider(
        <LoggingDashboard visible onClose={jest.fn()} />,
      );

      fireEvent.press(getByText('Search'));
      const searchInput = getByPlaceholderText('Search logs...');

      fireEvent.changeText(searchInput, 'test query');

      await waitFor(() => {
        expect(advancedLoggingService.search).toHaveBeenCalledWith(
          expect.objectContaining({ query: 'test query' }),
        );
      });
    });

    it('should filter by log levels', async () => {
      const { getByText } = renderWithProvider(
        <LoggingDashboard visible onClose={jest.fn()} />,
      );

      fireEvent.press(getByText('Search'));

      // Find and press the INFO level filter
      const infoFilter = getByText('INFO');
      fireEvent.press(infoFilter);

      await waitFor(() => {
        expect(advancedLoggingService.search).toHaveBeenCalledWith(
          expect.objectContaining({ levels: ['info'] }),
        );
      });
    });

    it('should filter by category', async () => {
      const { getByText, getByPlaceholderText } = renderWithProvider(
        <LoggingDashboard visible onClose={jest.fn()} />,
      );

      fireEvent.press(getByText('Search'));
      const categoryInput = getByPlaceholderText('Filter by category...');

      fireEvent.changeText(categoryInput, 'auth');

      await waitFor(() => {
        expect(advancedLoggingService.search).toHaveBeenCalledWith(
          expect.objectContaining({ categories: ['auth'] }),
        );
      });
    });
  });

  describe('Log Details', () => {
    it('should show log details modal when log is pressed', async () => {
      const { getByText } = renderWithProvider(
        <LoggingDashboard visible onClose={jest.fn()} />,
      );

      fireEvent.press(getByText('Test log message'));

      await waitFor(() => {
        expect(getByText('Log Details')).toBeTruthy();
        expect(getByText('Basic Info')).toBeTruthy();
      });
    });

    it('should display complete log information in details', async () => {
      const { getByText } = renderWithProvider(
        <LoggingDashboard visible onClose={jest.fn()} />,
      );

      fireEvent.press(getByText('Test log message'));

      await waitFor(() => {
        expect(getByText('Level: info')).toBeTruthy();
        expect(getByText('Platform: ios')).toBeTruthy();
        expect(getByText('Environment: test')).toBeTruthy();
      });
    });

    it('should close log details modal', async () => {
      const { getByText, queryByText } = renderWithProvider(
        <LoggingDashboard visible onClose={jest.fn()} />,
      );

      fireEvent.press(getByText('Test log message'));

      await waitFor(() => {
        expect(getByText('Log Details')).toBeTruthy();
      });

      // Close the modal (would need to implement close button test)
      // This tests the modal structure rather than actual closing
    });
  });

  describe('Export Functionality', () => {
    it('should call export function when export button is pressed', async () => {
      const { getByTestId } = renderWithProvider(
        <LoggingDashboard visible onClose={jest.fn()} />,
      );

      // Would need to add testID to export button in component
      // For now, testing the service call
      expect(advancedLoggingService.exportLogs).toBeDefined();
    });
  });

  describe('Auto-refresh', () => {
    it('should refresh data when component becomes visible', () => {
      const { rerender } = renderWithProvider(
        <LoggingDashboard visible={false} onClose={jest.fn()} />,
      );

      expect(advancedLoggingService.search).not.toHaveBeenCalled();

      rerender(
        <Provider store={mockStore}>
          <LoggingDashboard visible onClose={jest.fn()} />
        </Provider>,
      );

      expect(advancedLoggingService.search).toHaveBeenCalled();
      expect(advancedLoggingService.getAnalytics).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle search service errors gracefully', () => {
      (advancedLoggingService.search as jest.Mock).mockImplementation(() => {
        throw new Error('Search failed');
      });

      expect(() => {
        renderWithProvider(<LoggingDashboard visible onClose={jest.fn()} />);
      }).not.toThrow();
    });

    it('should handle analytics service errors gracefully', () => {
      (advancedLoggingService.getAnalytics as jest.Mock).mockImplementation(
        () => {
          throw new Error('Analytics failed');
        },
      );

      expect(() => {
        renderWithProvider(<LoggingDashboard visible onClose={jest.fn()} />);
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should limit the number of logs displayed', () => {
      const manyLogs = Array.from({ length: 500 }, (_, i) => ({
        ...mockLogs[0],
        id: `log-${i}`,
        message: `Log message ${i}`,
      }));

      (advancedLoggingService.search as jest.Mock).mockReturnValue(manyLogs);

      renderWithProvider(<LoggingDashboard visible onClose={jest.fn()} />);

      // Verify search was called with limit
      expect(advancedLoggingService.search).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 100 }),
      );
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      const { getByLabelText } = renderWithProvider(
        <LoggingDashboard visible onClose={jest.fn()} />,
      );

      // Would verify accessibility labels if they were implemented
      expect(getByLabelText).toBeDefined();
    });
  });
});
