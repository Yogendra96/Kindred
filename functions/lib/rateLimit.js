"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRateLimit = checkRateLimit;
// @ts-nocheck
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
const DEFAULT_CONFIG = {
    maxOps: 30,
    windowMs: 60000, // 1 minute
};
/**
 * Per-user rate limiter backed by Firestore.
 * Tracks operation count in a subcollection under the user document.
 * Returns true if the operation is allowed, false if rate limited.
 */
async function checkRateLimit(userId, config = DEFAULT_CONFIG) {
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
        const data = doc.data();
        const windowStart = data.windowStart;
        const count = data.count;
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
//# sourceMappingURL=rateLimit.js.map