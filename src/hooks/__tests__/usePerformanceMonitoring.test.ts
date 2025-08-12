/**
 * @fileoverview Unit tests for usePerformanceMonitoring hook
 */

import { act, renderHook } from '@testing-library/react-native';

import {
  useAsyncPerformance,
  useLifecyclePerformance,
  usePerformanceMonitoring,
} from '../usePerformanceMonitoring';

// Mock performance.now
const mockPerformanceNow = jest.fn();
Object.defineProperty(global, 'performance', {
  writable: true,
  value: {
    now: mockPerformanceNow,
    memory: {
      usedJSHeapSize: 50 * 1024 * 1024, // 50MB
    },
  },
});

// Mock setInterval and clearInterval
const mockSetInterval = jest.fn();
const mockClearInterval = jest.fn();
global.setInterval = mockSetInterval;
global.clearInterval = mockClearInterval;

describe('usePerformanceMonitoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformanceNow.mockReturnValue(1000);
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => usePerformanceMonitoring());

    expect(result.current.renderTime).toBe(0);
    expect(result.current.averageRenderTime).toBe(0);
    expect(result.current.memoryUsage).toBe(0);
    expect(result.current.renderCount).toBe(0);
    expect(result.current.isSlowRender).toBe(false);
  });

  it('should track render performance', () => {
    mockPerformanceNow
      .mockReturnValueOnce(1000) // Start time
      .mockReturnValueOnce(1020); // End time (20ms render)

    const { result, rerender } = renderHook(() =>
      usePerformanceMonitoring({
        threshold: 16,
      }),
    );

    act(() => {
      rerender();
    });

    expect(result.current.renderTime).toBe(20);
    expect(result.current.renderCount).toBe(1);
    expect(result.current.isSlowRender).toBe(true);
  });

  it('should call onSlowOperation callback for slow renders', () => {
    const onSlowOperation = jest.fn();
    mockPerformanceNow.mockReturnValueOnce(1000).mockReturnValueOnce(1025); // 25ms render

    const { rerender } = renderHook(() =>
      usePerformanceMonitoring({
        threshold: 16,
        onSlowOperation,
      }),
    );

    act(() => {
      rerender();
    });

    expect(onSlowOperation).toHaveBeenCalledWith(25, 'render');
  });

  it('should track memory usage when enabled', () => {
    mockSetInterval.mockImplementation(callback => {
      callback();
      return 123;
    });

    const { result } = renderHook(() =>
      usePerformanceMonitoring({
        enableMemoryTracking: true,
      }),
    );

    expect(result.current.memoryUsage).toBe(50); // 50MB
    expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 5000);
  });

  it('should call onMemoryWarning for high memory usage', () => {
    const onMemoryWarning = jest.fn();

    // Mock high memory usage
    Object.defineProperty(global.performance, 'memory', {
      value: {
        usedJSHeapSize: 60 * 1024 * 1024, // 60MB (above 50MB threshold)
      },
    });

    mockSetInterval.mockImplementation(callback => {
      callback();
      return 123;
    });

    renderHook(() =>
      usePerformanceMonitoring({
        enableMemoryTracking: true,
        onMemoryWarning,
      }),
    );

    expect(onMemoryWarning).toHaveBeenCalledWith(60);
  });

  it('should start and end custom timing operations', () => {
    mockPerformanceNow
      .mockReturnValueOnce(1000) // Start time
      .mockReturnValueOnce(1500); // End time

    const { result } = renderHook(() => usePerformanceMonitoring());

    act(() => {
      result.current.startTiming('test-operation');
    });

    act(() => {
      const duration = result.current.endTiming('test-operation');
      expect(duration).toBe(500);
    });
  });

  it('should call onSlowOperation for slow custom operations', () => {
    const onSlowOperation = jest.fn();
    mockPerformanceNow.mockReturnValueOnce(1000).mockReturnValueOnce(1050); // 50ms

    const { result } = renderHook(() =>
      usePerformanceMonitoring({
        threshold: 30,
        onSlowOperation,
      }),
    );

    act(() => {
      result.current.startTiming('slow-operation');
    });

    act(() => {
      result.current.endTiming('slow-operation');
    });

    expect(onSlowOperation).toHaveBeenCalledWith(50, 'slow-operation');
  });

  it('should reset all metrics', () => {
    const { result, rerender } = renderHook(() => usePerformanceMonitoring());

    // Trigger some renders to populate data
    act(() => {
      rerender();
      rerender();
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.renderTime).toBe(0);
    expect(result.current.averageRenderTime).toBe(0);
    expect(result.current.renderCount).toBe(0);
    expect(result.current.isSlowRender).toBe(false);
  });

  it('should handle missing start time for endTiming', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    const { result } = renderHook(() => usePerformanceMonitoring());

    act(() => {
      const duration = result.current.endTiming('non-existent-operation');
      expect(duration).toBe(0);
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'No start time found for operation: non-existent-operation',
    );
    consoleSpy.mockRestore();
  });

  it('should disable tracking when enableRenderTracking is false', () => {
    const { result, rerender } = renderHook(() =>
      usePerformanceMonitoring({
        enableRenderTracking: false,
      }),
    );

    act(() => {
      rerender();
    });

    expect(result.current.renderTime).toBe(0);
    expect(result.current.renderCount).toBe(0);
  });

  it('should cleanup memory monitoring interval on unmount', () => {
    const intervalId = 123;
    mockSetInterval.mockReturnValue(intervalId);

    const { unmount } = renderHook(() =>
      usePerformanceMonitoring({
        enableMemoryTracking: true,
      }),
    );

    unmount();

    expect(mockClearInterval).toHaveBeenCalledWith(intervalId);
  });
});

describe('useAsyncPerformance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformanceNow.mockReturnValue(1000);
  });

  it('should measure async operation duration', async () => {
    mockPerformanceNow
      .mockReturnValueOnce(1000) // Start
      .mockReturnValueOnce(1250); // End

    const { result } = renderHook(() => useAsyncPerformance());

    const testOperation = () => Promise.resolve('test-result');
    const onComplete = jest.fn();

    const actualResult = await result.current(
      'test-op',
      testOperation,
      onComplete,
    );

    expect(actualResult).toBe('test-result');
    expect(onComplete).toHaveBeenCalledWith(250);
  });

  it('should handle async operation errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockPerformanceNow.mockReturnValueOnce(1000).mockReturnValueOnce(1100);

    const { result } = renderHook(() => useAsyncPerformance());

    const errorOperation = () => Promise.reject(new Error('Test error'));

    await expect(result.current('error-op', errorOperation)).rejects.toThrow(
      'Test error',
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      'Operation error-op failed after 100ms:',
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });
});

describe('useLifecyclePerformance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformanceNow.mockReturnValue(1000);
  });

  it('should measure mount time', () => {
    mockPerformanceNow
      .mockReturnValueOnce(1000) // Initial mount start
      .mockReturnValueOnce(1050); // Mount completion

    const { result } = renderHook(() => useLifecyclePerformance());

    expect(result.current.mountTime).toBe(50);
  });

  it('should measure update time', () => {
    mockPerformanceNow
      .mockReturnValueOnce(1000) // Mount
      .mockReturnValueOnce(1020) // Update start
      .mockReturnValueOnce(1035); // Update end

    const { result, rerender } = renderHook(() => useLifecyclePerformance());

    act(() => {
      rerender();
    });

    expect(result.current.updateTime).toBe(15);
  });

  it('should initialize with zero values', () => {
    const { result } = renderHook(() => useLifecyclePerformance());

    expect(result.current.updateTime).toBe(0);
    expect(result.current.unmountTime).toBe(0);
  });
});
