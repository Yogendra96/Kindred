// @ts-nocheck
/* eslint-disable */
/**
 * OfflineQueueService Unit Tests
 *
 * Tests: enqueue, deduplication, drain, retry/drop, max depth, conflict strategy.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Import after mock
const { offlineQueueService } = require('../OfflineQueueService');

describe('OfflineQueueService', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

    // Reset service internal state
    await offlineQueueService.clear();
    // Force reload
    (offlineQueueService as any).isLoaded = false;
    (offlineQueueService as any).queue = [];
    (offlineQueueService as any).drainCallbacks = [];
  });

  // ── Enqueue ──────────────────────────────────────────────────────────────

  it('enqueues an action and persists to disk', async () => {
    const id = await offlineQueueService.enqueue('LOG_ACTIVITY', {
      category: 'transport',
      co2kg: 2.5,
      date: '2025-01-01',
    });

    expect(id).toBeTruthy();
    expect(AsyncStorage.setItem).toHaveBeenCalled();

    const stats = await offlineQueueService.getStats();
    expect(stats.pending).toBe(1);
  });

  it('assigns MERGE strategy for LOG_ACTIVITY', async () => {
    await offlineQueueService.enqueue('LOG_ACTIVITY', { co2kg: 1 });
    const queue = offlineQueueService.getQueue();
    expect(queue[0].conflictStrategy).toBe('MERGE');
  });

  it('assigns LAST_WRITE_WINS strategy for UPDATE_GOAL', async () => {
    await offlineQueueService.enqueue('UPDATE_GOAL', { target: 5 });
    const queue = offlineQueueService.getQueue();
    expect(queue[0].conflictStrategy).toBe('LAST_WRITE_WINS');
  });

  // ── Deduplication ─────────────────────────────────────────────────────────

  it('drops exact duplicate within 2 seconds', async () => {
    const payload = { co2kg: 1.5, date: '2025-01-01' };
    await offlineQueueService.enqueue('UPDATE_FOOTPRINT', payload);
    await offlineQueueService.enqueue('UPDATE_FOOTPRINT', payload); // dupe

    const stats = await offlineQueueService.getStats();
    expect(stats.pending).toBe(1); // only one kept
  });

  it('keeps two actions with different payloads', async () => {
    await offlineQueueService.enqueue('LOG_ACTIVITY', { co2kg: 1 });
    await offlineQueueService.enqueue('LOG_ACTIVITY', { co2kg: 2 }); // different payload

    const stats = await offlineQueueService.getStats();
    expect(stats.pending).toBe(2);
  });

  // ── Drain ─────────────────────────────────────────────────────────────────

  it('drains all actions when handler succeeds', async () => {
    await offlineQueueService.enqueue('LOG_ACTIVITY', { co2kg: 1 });
    await offlineQueueService.enqueue('UPDATE_GOAL', { target: 5 });

    const handler = jest.fn().mockResolvedValue(undefined);
    offlineQueueService.onDrain(handler);

    const result = await offlineQueueService.drain();

    expect(result.success).toBe(2);
    expect(result.failed).toBe(0);
    expect(handler).toHaveBeenCalledTimes(2);

    const stats = await offlineQueueService.getStats();
    expect(stats.pending).toBe(0);
  });

  it('keeps failed actions and increments retryCount', async () => {
    await offlineQueueService.enqueue('LOG_ACTIVITY', { co2kg: 1 });

    const handler = jest.fn().mockRejectedValue(new Error('Network error'));
    offlineQueueService.onDrain(handler);

    const result = await offlineQueueService.drain();

    expect(result.failed).toBe(1);
    expect(result.success).toBe(0);

    const queue = offlineQueueService.getQueue();
    expect(queue[0].retryCount).toBe(1);
  });

  it('drops actions after MAX_RETRIES', async () => {
    await offlineQueueService.enqueue('LOG_ACTIVITY', { co2kg: 1 });

    // Manually set retryCount to MAX_RETRIES - 1
    (offlineQueueService as any).queue[0].retryCount = 4;

    const handler = jest.fn().mockRejectedValue(new Error('Still failing'));
    offlineQueueService.onDrain(handler);

    const result = await offlineQueueService.drain();

    expect(result.dropped).toBe(1);
    expect(result.failed).toBe(0);

    const stats = await offlineQueueService.getStats();
    expect(stats.pending).toBe(0); // dropped = removed
  });

  // ── Max Depth ─────────────────────────────────────────────────────────────

  it('evicts oldest entries when queue exceeds MAX_QUEUE_DEPTH', async () => {
    const MAX = 500;

    // Fill to MAX + 10
    for (let i = 0; i < MAX + 10; i++) {
      // Bypass dedup by using unique payloads
      (offlineQueueService as any).queue.push({
        id: `test-${i}`,
        type: 'LOG_ACTIVITY',
        payload: { co2kg: i },
        timestamp: Date.now() - (MAX + 10 - i) * 1000, // older first
        retryCount: 0,
        conflictStrategy: 'MERGE',
      });
    }

    // Trigger another enqueue to hit the cap check
    await offlineQueueService.enqueue('UPDATE_GOAL', { target: 99 });

    const stats = await offlineQueueService.getStats();
    expect(stats.pending).toBeLessThanOrEqual(MAX);
  });

  // ── Clear ─────────────────────────────────────────────────────────────────

  it('clear() empties the queue and removes from disk', async () => {
    await offlineQueueService.enqueue('LOG_ACTIVITY', { co2kg: 1 });
    await offlineQueueService.clear();

    const stats = await offlineQueueService.getStats();
    expect(stats.pending).toBe(0);
    expect(AsyncStorage.removeItem).toHaveBeenCalled();
  });
});
