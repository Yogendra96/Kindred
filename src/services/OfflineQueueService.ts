// @ts-nocheck
/* eslint-disable */
/**
 * OfflineQueueService
 *
 * Stores write actions locally when the device is offline.
 * When connectivity is restored, the queue drains in FIFO order,
 * replaying actions against the remote API / Firestore.
 *
 * Strategy:
 *  - Idempotency: each action carries a UUID so replaying it twice is safe.
 *  - Conflict resolution: MERGE for history entries (both kept), LAST_WRITE_WINS
 *    for single-value fields (footprint totals, goals).
 *  - Max queue depth: 500. Oldest entries are evicted when the cap is exceeded.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActionType =
  | 'LOG_ACTIVITY'
  | 'UPDATE_FOOTPRINT'
  | 'UPDATE_GOAL'
  | 'UPDATE_PROFILE'
  | 'LOG_OFFSET_PURCHASE'
  | 'UPDATE_SETTINGS';

export type ConflictStrategy = 'MERGE' | 'LAST_WRITE_WINS';

export interface QueuedAction {
  id: string; // UUID — idempotency key
  type: ActionType;
  payload: Record<string, unknown>;
  timestamp: number; // ms since epoch
  retryCount: number;
  conflictStrategy: ConflictStrategy;
  metadata?: Record<string, unknown>;
}

export interface QueueStats {
  pending: number;
  failedCount: number;
  oldestActionAge: number | null; // ms
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = '@Kindred:offlineQueue:v1';
const MAX_QUEUE_DEPTH = 500;
const MAX_RETRIES = 5;

// Merge-strategy action types — for these, we append rather than overwrite
const MERGE_TYPES: ActionType[] = ['LOG_ACTIVITY', 'LOG_OFFSET_PURCHASE'];

// ─── Utilities ────────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ─── Service ──────────────────────────────────────────────────────────────────

class OfflineQueueService {
  private queue: QueuedAction[] = [];
  private isLoaded = false;
  private drainCallbacks: Array<(action: QueuedAction) => Promise<void>> = [];

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  /** Load persisted queue from disk on startup */
  async load(): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.queue = JSON.parse(raw) as QueuedAction[];
      }
      this.isLoaded = true;
    } catch (e) {
      console.warn('[OfflineQueue] Failed to load queue from disk:', e);
      this.queue = [];
      this.isLoaded = true;
    }
  }

  private async persist(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch (e) {
      console.warn('[OfflineQueue] Failed to persist queue:', e);
    }
  }

  // ── Enqueue ────────────────────────────────────────────────────────────────

  /**
   * Add a new action to the queue.
   * Returns the action ID so callers can track its state.
   */
  async enqueue(
    type: ActionType,
    payload: Record<string, unknown>,
    metadata?: Record<string, unknown>,
  ): Promise<string> {
    if (!this.isLoaded) await this.load();

    const id = generateId();
    const action: QueuedAction = {
      id,
      type,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
      conflictStrategy: MERGE_TYPES.includes(type) ? 'MERGE' : 'LAST_WRITE_WINS',
      metadata,
    };

    // Deduplication: if we already have the exact same type+payload combo
    // from within the last 2 seconds, skip (handles double-tap etc.)
    const isDuplicate = this.queue.some(
      existing =>
        existing.type === type &&
        JSON.stringify(existing.payload) === JSON.stringify(payload) &&
        Date.now() - existing.timestamp < 2000,
    );

    if (isDuplicate) {
      console.log('[OfflineQueue] Duplicate action dropped:', type);
      return id;
    }

    this.queue.push(action);

    // Enforce max depth — evict oldest
    if (this.queue.length > MAX_QUEUE_DEPTH) {
      const evicted = this.queue.splice(0, this.queue.length - MAX_QUEUE_DEPTH);
      console.warn(`[OfflineQueue] Queue cap exceeded. Evicted ${evicted.length} old actions.`);
    }

    await this.persist();
    console.log(`[OfflineQueue] Enqueued: ${type} (id=${id})`);
    return id;
  }

  // ── Drain ──────────────────────────────────────────────────────────────────

  /**
   * Register a handler that will be called for each action during drain.
   * The handler should return a resolved promise on success, or throw on failure.
   */
  onDrain(handler: (action: QueuedAction) => Promise<void>): void {
    this.drainCallbacks.push(handler);
  }

  /**
   * Process all pending actions in FIFO order.
   * Failed actions get their retryCount incremented; after MAX_RETRIES they are dropped.
   */
  async drain(): Promise<{ success: number; failed: number; dropped: number }> {
    if (!this.isLoaded) await this.load();

    if (this.queue.length === 0) {
      return { success: 0, failed: 0, dropped: 0 };
    }

    let success = 0;
    let failed = 0;
    let dropped = 0;

    const remaining: QueuedAction[] = [];

    for (const action of this.queue) {
      let handled = false;

      for (const handler of this.drainCallbacks) {
        try {
          await handler(action);
          handled = true;
          success++;
          console.log(`[OfflineQueue] Synced: ${action.type} (id=${action.id})`);
          break;
        } catch (e) {
          console.warn(`[OfflineQueue] Handler failed for ${action.type}:`, e);
        }
      }

      if (!handled) {
        const updated = { ...action, retryCount: action.retryCount + 1 };
        if (updated.retryCount >= MAX_RETRIES) {
          console.error(
            `[OfflineQueue] Action dropped after ${MAX_RETRIES} retries:`,
            action.type,
            action.id,
          );
          dropped++;
        } else {
          remaining.push(updated);
          failed++;
        }
      }
    }

    this.queue = remaining;
    await this.persist();

    console.log(
      `[OfflineQueue] Drain complete — success: ${success}, failed: ${failed}, dropped: ${dropped}`,
    );
    return { success, failed, dropped };
  }

  // ── Stats & Inspection ─────────────────────────────────────────────────────

  async getStats(): Promise<QueueStats> {
    if (!this.isLoaded) await this.load();
    const oldest = this.queue[0];
    return {
      pending: this.queue.length,
      failedCount: this.queue.filter(a => a.retryCount > 0).length,
      oldestActionAge: oldest ? Date.now() - oldest.timestamp : null,
    };
  }

  getQueue(): QueuedAction[] {
    return [...this.queue];
  }

  async clear(): Promise<void> {
    this.queue = [];
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
}

// Singleton export
export const offlineQueueService = new OfflineQueueService();
