/**
 * useClimateNotifications.ts — Climate polling + challenge notifications
 * with full structured logging and exception handling.
 */
import { useEffect, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import logger from '../services/LoggerService';
import { ErrorHandler } from '../utils/errorHandler';
import { getClimateNotifications } from '../services/ClimateNotificationsService';
import type { ClimateAlert } from '../services/ClimateNotificationsService';

const TAG = 'useClimateNotifications';
const log = logger.withTag(TAG);

// ─── Challenge Notification Helpers ──────────────────────────────────────────

export interface ChallengeAlert {
  id: string;
  title: string;
  body: string;
  type: 'challenge_complete' | 'challenge_reminder' | 'streak_milestone';
}

/** Deliver a single challenge notification — swap Alert.alert for Notifee when available */
export const sendChallengeNotification = (alert: ChallengeAlert): void => {
  log.info('sending challenge notification', {
    id: alert.id,
    type: alert.type,
  });
  Alert.alert(alert.title, alert.body, [{ text: 'View 🏆' }]);
};

export const notifyStreak = (streakDays: number): void => {
  if (streakDays % 7 !== 0) return;
  log.info('streak milestone reached', { streakDays });
  sendChallengeNotification({
    id: `streak_${streakDays}`,
    title: `🔥 ${streakDays}-Day Streak!`,
    body: `You've logged your carbon for ${streakDays} days in a row. Incredible!`,
    type: 'streak_milestone',
  });
};

export const notifyChallengeComplete = (
  challengeName: string,
  reward: string,
): void => {
  log.info('challenge completed', { challengeName, reward });
  sendChallengeNotification({
    id: `challenge_${Date.now()}`,
    title: '🏆 Challenge Complete!',
    body: `You finished "${challengeName}". Reward: ${reward}`,
    type: 'challenge_complete',
  });
};

export const notifyDailyReminder = (): void => {
  log.info('sending daily reminder');
  sendChallengeNotification({
    id: `reminder_${Date.now()}`,
    title: '🌿 Daily Eco Check-in',
    body: "Don't forget to log today's activities and keep your streak alive!",
    type: 'challenge_reminder',
  });
};

// ─── Climate Alert Delivery ───────────────────────────────────────────────────

const deliverClimateAlert = (alert: ClimateAlert): void => {
  log.info('delivering climate alert', { id: alert.id, title: alert.title });
  // Real: swap for Notifee / PushNotification
  Alert.alert(alert.title, alert.body, [{ text: 'Got it ✓' }]);
};

// ─── Main Hook ────────────────────────────────────────────────────────────────

interface Options {
  lat?: number;
  lng?: number;
  pollIntervalMs?: number;
}

export const useClimateNotifications = ({
  lat = 40.7128,
  lng = -74.006,
  pollIntervalMs = 30 * 60 * 1000,
}: Options = {}): void => {
  const seenIds = useRef<Set<string>>(new Set());
  const service = getClimateNotifications();

  const poll = useCallback(async () => {
    const stopPerf = log.perf('poll');
    log.debug('polling climate alerts', { lat, lng });

    try {
      const alerts = await service.checkAll(lat, lng);
      log.info('climate poll complete', { alertCount: alerts.length });

      for (const alert of alerts) {
        if (!seenIds.current.has(alert.id)) {
          seenIds.current.add(alert.id);
          deliverClimateAlert(alert);
        }
      }
    } catch (err) {
      // Non-critical — log but don't surface to user
      ErrorHandler.handle(err, TAG);
    } finally {
      stopPerf();
    }
  }, [lat, lng, service]);

  useEffect(() => {
    log.info('hook mounted', { pollIntervalMs });
    const initTimer = setTimeout(poll, 5_000);
    const interval = setInterval(poll, pollIntervalMs);
    return () => {
      log.info('hook unmounted — clearing timers');
      clearTimeout(initTimer);
      clearInterval(interval);
    };
  }, [poll, pollIntervalMs]);
};

export default useClimateNotifications;
