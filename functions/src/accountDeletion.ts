import * as functions from 'firebase-functions/v1';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp();
}

/**
 * Purges all Firestore and auxiliary data associated with a user ID.
 * Uses recursiveDelete to purge the root user document and all subcollections
 * (transactions, activities, offsets, etc.) atomically.
 */
export async function purgeUserData(
  uid: string,
  customDb?: any,
): Promise<{ deletedSubcollections: boolean }> {
  const db = customDb || getFirestore();
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
        snap.forEach((doc: any) => batch.delete(doc.ref));
        await batch.commit();
      }
    }
    await userRef.delete();
  }

  // 2. Clean up any pending email verification records matching this user
  const verifications = await db.collection('emailVerifications').where('userId', '==', uid).get();
  if (!verifications.empty) {
    const batch = db.batch();
    verifications.forEach((doc: any) => batch.delete(doc.ref));
    await batch.commit();
  }

  // 3. Clean up rate limit tracking entries for this user
  const rateLimits = await db.collection('_rateLimits').where('userId', '==', uid).get();
  if (!rateLimits.empty) {
    const rlBatch = db.batch();
    rateLimits.forEach((doc: any) => rlBatch.delete(doc.ref));
    await rlBatch.commit();
  }

  return { deletedSubcollections: true };
}

/**
 * Triggered automatically whenever a Firebase Auth user is deleted
 * (e.g. from the client SDK via currentUser.delete(), or via Firebase Admin / Console).
 */
export const onUserDeleted = functions.auth.user().onDelete(async user => {
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
export const deleteUserAccount = functions.https.onCall(async (_data, context) => {
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
    const auth = getAuth();
    await auth.deleteUser(uid);

    console.log(`[deleteUserAccount] Completed account deletion for UID: ${uid}`);
    return { success: true, message: 'Account and all personal data deleted successfully.' };
  } catch (error: any) {
    console.error(`[deleteUserAccount] Account deletion failed for UID: ${uid}:`, error);
    throw new functions.https.HttpsError(
      'internal',
      error?.message || 'Failed to delete account. Please try again or contact support.',
    );
  }
});
