/**
 * @fileoverview Carbon Storage Service for offline persistence
 *
 * This service provides local storage capabilities for carbon activities
 * and emission data using AsyncStorage. It handles offline storage,
 * data synchronization, and local cache management.
 *
 * @version 1.0.0
 * @author Kindred Development Team
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { loggingService } from './LoggingService';

export interface CarbonActivity {
  id: string;
  type: 'transport' | 'energy' | 'food';
  description: string;
  emissions: {
    carbon_footprint_kg: number;
    equivalent_trees_planted: number;
    offset_cost_usd: number;
    emission_factor_id?: string;
    activity_uuid?: string;
    confidence?: number;
    breakdown?: {
      direct: number;
      indirect: number;
      lifecycle?: number;
    };
  };
  data: any;
  timestamp: string;
  synced: boolean;
}

export interface CarbonStorageData {
  activities: CarbonActivity[];
  lastSync: string;
  totalEmissions: {
    transport: number;
    energy: number;
    food: number;
    total: number;
  };
  version: string;
}

export class CarbonStorageService {
  private static readonly STORAGE_KEY = '@kindred:carbon_activities';
  private static readonly CACHE_KEY = '@kindred:carbon_cache';
  private static readonly VERSION = '1.0.0';
  private static readonly MAX_ACTIVITIES = 1000; // Maximum activities to store locally
  private static readonly SYNC_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  private logger = loggingService;

  /**
   * Save carbon activities to local storage
   */
  async saveActivities(activities: CarbonActivity[]): Promise<void> {
    try {
      const storageData: CarbonStorageData = {
        activities: activities.slice(0, CarbonStorageService.MAX_ACTIVITIES),
        lastSync: new Date().toISOString(),
        totalEmissions: this.calculateTotalEmissions(activities),
        version: CarbonStorageService.VERSION,
      };

      await AsyncStorage.setItem(
        CarbonStorageService.STORAGE_KEY,
        JSON.stringify(storageData)
      );

      this.logger.debug('Carbon activities saved to local storage', {
        count: activities.length,
        totalEmissions: storageData.totalEmissions.total,
      });
    } catch (error) {
      this.logger.error('Failed to save carbon activities', {
        error: error instanceof Error ? error.message : 'Unknown error',
        count: activities.length,
      });
      throw new Error(`Failed to save activities: ${error}`);
    }
  }

  /**
   * Load carbon activities from local storage
   */
  async loadActivities(): Promise<CarbonActivity[]> {
    try {
      const data = await AsyncStorage.getItem(CarbonStorageService.STORAGE_KEY);
      
      if (!data) {
        this.logger.debug('No stored carbon activities found');
        return [];
      }

      const storageData: CarbonStorageData = JSON.parse(data);
      
      // Check version compatibility
      if (storageData.version !== CarbonStorageService.VERSION) {
        this.logger.warn('Storage version mismatch, clearing data', {
          stored: storageData.version,
          current: CarbonStorageService.VERSION,
        });
        await this.clearActivities();
        return [];
      }

      this.logger.debug('Carbon activities loaded from local storage', {
        count: storageData.activities.length,
        lastSync: storageData.lastSync,
        totalEmissions: storageData.totalEmissions.total,
      });

      return storageData.activities;
    } catch (error) {
      this.logger.error('Failed to load carbon activities', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      // Clear corrupted data
      await this.clearActivities();
      return [];
    }
  }

  /**
   * Add a new carbon activity to storage
   */
  async addActivity(activity: CarbonActivity): Promise<void> {
    try {
      const existingActivities = await this.loadActivities();
      
      // Check if activity already exists (prevent duplicates)
      const exists = existingActivities.some(a => a.id === activity.id);
      if (exists) {
        this.logger.warn('Activity already exists, skipping', {
          id: activity.id,
          type: activity.type,
        });
        return;
      }

      const updatedActivities = [activity, ...existingActivities];
      await this.saveActivities(updatedActivities);

      this.logger.info('New carbon activity added to storage', {
        id: activity.id,
        type: activity.type,
        emissions: activity.emissions.carbon_footprint_kg,
      });
    } catch (error) {
      this.logger.error('Failed to add carbon activity', {
        error: error instanceof Error ? error.message : 'Unknown error',
        activityId: activity.id,
        activityType: activity.type,
      });
      throw error;
    }
  }

  /**
   * Update activity sync status
   */
  async updateActivitySyncStatus(activityId: string, synced: boolean): Promise<void> {
    try {
      const activities = await this.loadActivities();
      const activity = activities.find(a => a.id === activityId);
      
      if (!activity) {
        this.logger.warn('Activity not found for sync status update', {
          id: activityId,
        });
        return;
      }

      activity.synced = synced;
      await this.saveActivities(activities);

      this.logger.debug('Activity sync status updated', {
        id: activityId,
        synced,
      });
    } catch (error) {
      this.logger.error('Failed to update activity sync status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        activityId,
        synced,
      });
      throw error;
    }
  }

  /**
   * Get unsynced activities
   */
  async getUnsyncedActivities(): Promise<CarbonActivity[]> {
    try {
      const activities = await this.loadActivities();
      const unsynced = activities.filter(a => !a.synced);

      this.logger.debug('Retrieved unsynced activities', {
        count: unsynced.length,
        totalActivities: activities.length,
      });

      return unsynced;
    } catch (error) {
      this.logger.error('Failed to get unsynced activities', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  /**
   * Clear old activities (older than specified days)
   */
  async clearOldActivities(daysToKeep: number = 90): Promise<void> {
    try {
      const activities = await this.loadActivities();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const filtered = activities.filter(
        activity => new Date(activity.timestamp) > cutoffDate
      );

      const removedCount = activities.length - filtered.length;
      
      if (removedCount > 0) {
        await this.saveActivities(filtered);
        
        this.logger.info('Old carbon activities cleared', {
          removed: removedCount,
          remaining: filtered.length,
          cutoffDate: cutoffDate.toISOString(),
        });
      }
    } catch (error) {
      this.logger.error('Failed to clear old activities', {
        error: error instanceof Error ? error.message : 'Unknown error',
        daysToKeep,
      });
      throw error;
    }
  }

  /**
   * Clear all stored carbon activities
   */
  async clearActivities(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CarbonStorageService.STORAGE_KEY);
      this.logger.info('All carbon activities cleared from storage');
    } catch (error) {
      this.logger.error('Failed to clear carbon activities', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalActivities: number;
    syncedActivities: number;
    unsyncedActivities: number;
    totalEmissions: number;
    lastSync: string | null;
    storageSize: number; // in bytes
  }> {
    try {
      const data = await AsyncStorage.getItem(CarbonStorageService.STORAGE_KEY);
      
      if (!data) {
        return {
          totalActivities: 0,
          syncedActivities: 0,
          unsyncedActivities: 0,
          totalEmissions: 0,
          lastSync: null,
          storageSize: 0,
        };
      }

      const storageData: CarbonStorageData = JSON.parse(data);
      const syncedCount = storageData.activities.filter(a => a.synced).length;

      return {
        totalActivities: storageData.activities.length,
        syncedActivities: syncedCount,
        unsyncedActivities: storageData.activities.length - syncedCount,
        totalEmissions: storageData.totalEmissions.total,
        lastSync: storageData.lastSync,
        storageSize: new Blob([data]).size,
      };
    } catch (error) {
      this.logger.error('Failed to get storage stats', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      return {
        totalActivities: 0,
        syncedActivities: 0,
        unsyncedActivities: 0,
        totalEmissions: 0,
        lastSync: null,
        storageSize: 0,
      };
    }
  }

  /**
   * Check if sync is needed (based on time and unsynced activities)
   */
  async shouldSync(): Promise<boolean> {
    try {
      const stats = await this.getStorageStats();
      
      // Sync if there are unsynced activities
      if (stats.unsyncedActivities > 0) {
        return true;
      }

      // Sync if it's been more than SYNC_INTERVAL since last sync
      if (stats.lastSync) {
        const lastSyncTime = new Date(stats.lastSync).getTime();
        const now = Date.now();
        
        if (now - lastSyncTime > CarbonStorageService.SYNC_INTERVAL) {
          return true;
        }
      }

      return false;
    } catch (error) {
      this.logger.error('Failed to check sync status', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Export activities data for backup/debugging
   */
  async exportActivities(): Promise<string> {
    try {
      const data = await AsyncStorage.getItem(CarbonStorageService.STORAGE_KEY);
      return data || '{}';
    } catch (error) {
      this.logger.error('Failed to export activities', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Import activities data from backup
   */
  async importActivities(data: string): Promise<void> {
    try {
      // Validate JSON format
      const storageData: CarbonStorageData = JSON.parse(data);
      
      if (!storageData.activities || !Array.isArray(storageData.activities)) {
        throw new Error('Invalid import data format');
      }

      await AsyncStorage.setItem(CarbonStorageService.STORAGE_KEY, data);
      
      this.logger.info('Activities imported successfully', {
        count: storageData.activities.length,
      });
    } catch (error) {
      this.logger.error('Failed to import activities', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Calculate total emissions from activities
   */
  private calculateTotalEmissions(activities: CarbonActivity[]): {
    transport: number;
    energy: number;
    food: number;
    total: number;
  } {
    const totals = {
      transport: 0,
      energy: 0,
      food: 0,
      total: 0,
    };

    for (const activity of activities) {
      const emissions = activity.emissions.carbon_footprint_kg;
      totals[activity.type] += emissions;
      totals.total += emissions;
    }

    return totals;
  }
}

// Export singleton instance
export const carbonStorageService = new CarbonStorageService();
export default carbonStorageService;