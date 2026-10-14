import { getFirestore, FieldValue, Transaction } from 'firebase-admin/firestore';

export interface RateLimitConfig {
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
 * Per-user, per-operation rate limiter backed by Firestore.
 * Tracks operation count in `users/{userId}/_rateLimits/{opKey}`.
 * Returns true if the operation is allowed, false if rate limited.
 */
export async function checkRateLimit(
  userId: string,
  opKeyOrConfig: string | RateLimitConfig = 'operations',
  maybeConfig?: RateLimitConfig,
): Promise<boolean> {
  let opKey = 'operations';
  let config: RateLimitConfig = DEFAULT_CONFIG;

  if (typeof opKeyOrConfig === 'string') {
    opKey = opKeyOrConfig;
    if (maybeConfig) {
      config = maybeConfig;
    }
  } else if (typeof opKeyOrConfig === 'object' && opKeyOrConfig !== null) {
    config = opKeyOrConfig;
  }

  const db = getFirestore();
  const rateRef = db.collection('users').doc(userId).collection('_rateLimits').doc(opKey);

  const result = await db.runTransaction(async (transaction: Transaction) => {
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
    const windowStart = (data.windowStart as number) || now;
    const count = (data.count as number) || 0;

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
      count: FieldValue.increment(1),
    });
    return true;
  });

  return result;
}
