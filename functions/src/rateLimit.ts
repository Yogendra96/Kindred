// @ts-nocheck
import * as admin from 'firebase-admin';

const db = admin.firestore();

interface RateLimitConfig {
  /** Max operations allowed in the window */
  maxOps: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxOps: 30,
  windowMs: 60_000, // 1 minute
};

/**
 * Per-user rate limiter backed by Firestore.
 * Tracks operation count in a subcollection under the user document.
 * Returns true if the operation is allowed, false if rate limited.
 */
export async function checkRateLimit(
  userId: string,
  config: RateLimitConfig = DEFAULT_CONFIG,
): Promise<boolean> {
  const rateRef = db
    .collection('users')
    .doc(userId)
    .collection('_rateLimits')
    .doc('operations');

  const result = await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(rateRef);
    const now = Date.now();

    if (!doc.exists) {
      // First operation — create the tracker
      transaction.set(rateRef, {
        count: 1,
        windowStart: now,
      });
      return true;
    }

    const data = doc.data()!;
    const windowStart = data.windowStart as number;
    const count = data.count as number;

    if (now - windowStart > config.windowMs) {
      // Window expired — reset
      transaction.set(rateRef, {
        count: 1,
        windowStart: now,
      });
      return true;
    }

    if (count >= config.maxOps) {
      // Rate limited
      return false;
    }

    // Increment
    transaction.update(rateRef, {
      count: admin.firestore.FieldValue.increment(1),
    });
    return true;
  });

  return result;
}
