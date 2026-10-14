'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.checkRateLimit = checkRateLimit;
const firestore_1 = require('firebase-admin/firestore');
const DEFAULT_CONFIG = {
  maxOps: 30,
  windowMs: 60000, // 1 minute
};
/**
 * Per-user, per-operation rate limiter backed by Firestore.
 * Tracks operation count in `users/{userId}/_rateLimits/{opKey}`.
 * Returns true if the operation is allowed, false if rate limited.
 */
async function checkRateLimit(userId, opKeyOrConfig = 'operations', maybeConfig) {
  let opKey = 'operations';
  let config = DEFAULT_CONFIG;
  if (typeof opKeyOrConfig === 'string') {
    opKey = opKeyOrConfig;
    if (maybeConfig) {
      config = maybeConfig;
    }
  } else if (typeof opKeyOrConfig === 'object' && opKeyOrConfig !== null) {
    config = opKeyOrConfig;
  }
  const db = (0, firestore_1.getFirestore)();
  const rateRef = db.collection('users').doc(userId).collection('_rateLimits').doc(opKey);
  const result = await db.runTransaction(async transaction => {
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
    const data = doc.data();
    const windowStart = data.windowStart || now;
    const count = data.count || 0;
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
      count: firestore_1.FieldValue.increment(1),
    });
    return true;
  });
  return result;
}
//# sourceMappingURL=rateLimit.js.map
