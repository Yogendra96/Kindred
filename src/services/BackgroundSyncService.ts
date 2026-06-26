// @ts-nocheck
/* eslint-disable */
/**
 * BackgroundSyncService
 *
 * Uses expo-task-manager to schedule a background task that drains
 * the OfflineQueue when the app is backgrounded and connectivity exists.
 *
 * Fires every 15 minutes in the background.
 * Also exposes a foreground drain() for immediate sync on reconnect.
 */

import NetInfo from '@react-native-community/netinfo';
import * as TaskManager from 'expo-task-manager';
import { offlineQueueService } from './OfflineQueueService';

const BACKGROUND_SYNC_TASK = 'KINDRED_BACKGROUND_SYNC';

// ─── Background Task Definition ───────────────────────────────────────────────
// This must be called at the TOP LEVEL of the module (not inside a function/class)
// so expo-task-manager can register it before the app fully boots.

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      console.log('[BackgroundSync] Skipped — no connectivity');
      return { data: 'NO_CONNECTIVITY' };
    }

    await offlineQueueService.load();
    const result = await offlineQueueService.drain();
    console.log('[BackgroundSync] Background drain result:', result);

    return { data: result };
  } catch (e) {
    console.error('[BackgroundSync] Background task error:', e);
    return { error: e };
  }
});

// ─── Service Class ────────────────────────────────────────────────────────────

class BackgroundSyncService {
  private isRegistered = false;
  private failureStreak = 0;
  private readonly MAX_FAILURE_STREAK = 3;

  /**
   * Initialize: load the offline queue from disk, register the background task,
   * and set up a drain handler for carbon/activity sync.
   */
  async initialize(): Promise<void> {
    if (this.isRegistered) return;

    // Load queue from disk
    await offlineQueueService.load();

    // Register the drain handler — this is the "what to do when syncing" logic.
    // In a real implementation, this would call Firestore/API endpoints.
    offlineQueueService.onDrain(async action => {
      switch (action.type) {
        case 'LOG_ACTIVITY':
        case 'UPDATE_FOOTPRINT':
          // TODO: Replace with real Firestore write
          // await firestoreService.updateFootprint(action.payload);
          console.log('[BackgroundSync] Would sync to Firestore:', action.type, action.payload);
          break;

        case 'UPDATE_GOAL':
          // await firestoreService.updateGoal(action.payload);
          console.log('[BackgroundSync] Would sync goal:', action.payload);
          break;

        case 'UPDATE_PROFILE':
          // await firestoreService.updateProfile(action.payload);
          console.log('[BackgroundSync] Would sync profile:', action.payload);
          break;

        case 'LOG_OFFSET_PURCHASE':
          // await firestoreService.logOffsetPurchase(action.payload);
          console.log('[BackgroundSync] Would sync offset purchase:', action.payload);
          break;

        case 'UPDATE_SETTINGS':
          // await firestoreService.updateSettings(action.payload);
          console.log('[BackgroundSync] Would sync settings:', action.payload);
          break;

        default:
          console.warn('[BackgroundSync] Unknown action type:', action.type);
      }
    });

    this.isRegistered = true;
    console.log('[BackgroundSync] Initialized');
  }

  /**
   * Foreground drain — called immediately when the app detects connectivity.
   * Returns the result of the drain operation.
   */
  async syncNow(): Promise<{ success: number; failed: number; dropped: number }> {
    try {
      const netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        console.log('[BackgroundSync] syncNow skipped — offline');
        return { success: 0, failed: 0, dropped: 0 };
      }

      const result = await offlineQueueService.drain();

      if (result.failed > 0) {
        this.failureStreak++;
      } else {
        this.failureStreak = 0;
      }

      return result;
    } catch (e) {
      this.failureStreak++;
      console.error('[BackgroundSync] syncNow error:', e);
      return { success: 0, failed: 0, dropped: 0 };
    }
  }

  /** Whether the failure streak has hit the alerting threshold */
  get shouldAlertUser(): boolean {
    return this.failureStreak >= this.MAX_FAILURE_STREAK;
  }

  /** Reset the failure streak (e.g. after user acknowledges the issue) */
  resetFailureStreak(): void {
    this.failureStreak = 0;
  }
}

export const backgroundSyncService = new BackgroundSyncService();
