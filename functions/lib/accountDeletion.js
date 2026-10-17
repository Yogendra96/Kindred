'use strict';
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== 'default') __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
Object.defineProperty(exports, '__esModule', { value: true });
exports.deleteUserAccount = exports.onUserDeleted = void 0;
exports.purgeUserData = purgeUserData;
const functions = __importStar(require('firebase-functions/v1'));
const app_1 = require('firebase-admin/app');
const auth_1 = require('firebase-admin/auth');
const firestore_1 = require('firebase-admin/firestore');
if (!(0, app_1.getApps)().length) {
  (0, app_1.initializeApp)();
}
/**
 * Purges all Firestore and auxiliary data associated with a user ID.
 * Uses recursiveDelete to purge the root user document and all subcollections
 * (transactions, activities, offsets, etc.) atomically.
 */
async function purgeUserData(uid, customDb) {
  const db = customDb || (0, firestore_1.getFirestore)();
  const userRef = db.collection('users').doc(uid);
  // 1. Delete user document and subcollections
  if (typeof db.recursiveDelete === 'function') {
    await db.recursiveDelete(userRef);
  } else {
    // Fallback for client SDK instances (e.g. unit test environments)
    const subcollections = ['activities', 'transactions', 'offsets'];
    for (const sub of subcollections) {
      const snap = await userRef.collection(sub).get();
      if (!snap.empty) {
        const batch = db.batch();
        snap.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }
    }
    await userRef.delete();
  }
  // 2. Clean up any pending email verification records matching this user
  const verifications = await db.collection('emailVerifications').where('userId', '==', uid).get();
  if (!verifications.empty) {
    const batch = db.batch();
    verifications.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }
  // 3. Clean up rate limit tracking entries for this user
  const rateLimits = await db.collection('_rateLimits').where('userId', '==', uid).get();
  if (!rateLimits.empty) {
    const rlBatch = db.batch();
    rateLimits.forEach(doc => rlBatch.delete(doc.ref));
    await rlBatch.commit();
  }
  return { deletedSubcollections: true };
}
/**
 * Triggered automatically whenever a Firebase Auth user is deleted
 * (e.g. from the client SDK via currentUser.delete(), or via Firebase Admin / Console).
 */
exports.onUserDeleted = functions.auth.user().onDelete(async user => {
  const { uid } = user;
  console.log(`[onUserDeleted] Purging all user data for UID: ${uid}`);
  try {
    await purgeUserData(uid);
    console.log(`[onUserDeleted] Successfully purged all Firestore data for UID: ${uid}`);
  } catch (error) {
    console.error(`[onUserDeleted] Failed to purge user data for UID: ${uid}:`, error);
    throw error;
  }
});
/**
 * Callable endpoint for clients that prefer to trigger deletion server-side
 * before destroying client credentials.
 */
exports.deleteUserAccount = functions.https.onCall(async (_data, context) => {
  if (!context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be signed in to delete your account.',
    );
  }
  const uid = context.auth.uid;
  console.log(`[deleteUserAccount] Initiating server-side account deletion for UID: ${uid}`);
  try {
    // 1. Purge Firestore data first
    await purgeUserData(uid);
    // 2. Delete the Firebase Auth record
    const auth = (0, auth_1.getAuth)();
    await auth.deleteUser(uid);
    console.log(`[deleteUserAccount] Completed account deletion for UID: ${uid}`);
    return { success: true, message: 'Account and all personal data deleted successfully.' };
  } catch (error) {
    console.error(`[deleteUserAccount] Account deletion failed for UID: ${uid}:`, error);
    throw new functions.https.HttpsError(
      'internal',
      error?.message || 'Failed to delete account. Please try again or contact support.',
    );
  }
});
//# sourceMappingURL=accountDeletion.js.map
