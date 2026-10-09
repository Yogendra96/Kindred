// @ts-nocheck
import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import sgMail from '@sendgrid/mail';
import { checkRateLimit } from './rateLimit';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'no-reply@kindred.app';

admin.initializeApp();
const db = admin.firestore();

// -------------------------------------------------------------------------- //
// 1. Transaction Aggregation
// -------------------------------------------------------------------------- //
export const onTransactionCreated = functions.firestore
  .document('users/{userId}/transactions/{txId}')
  .onCreate(async (snap, context) => {
    const { userId } = context.params;
    const tx = snap.data();

    const userRef = db.collection('users').doc(userId);
    
    return db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      const userData = userDoc.data() || {};
      
      let balanceCents = userData.wallet?.balanceCents || 0;
      let totalEarnedCents = userData.wallet?.totalEarnedCents || 0;

      if (tx.type === 'EARN') {
        balanceCents += tx.amountCents;
        totalEarnedCents += tx.amountCents;
      } else if (tx.type === 'SPEND') {
        balanceCents -= tx.amountCents;
      }

      transaction.set(userRef, {
        wallet: {
          balanceCents,
          totalEarnedCents,
        }
      }, { merge: true });
    });
  });

// -------------------------------------------------------------------------- //
// 2. Activity Aggregation (SDG, ESG, and Corporate Score)
// -------------------------------------------------------------------------- //
export const onActivityLogged = functions.firestore
  .document('users/{userId}/history/{historyId}')
  .onCreate(async (snap, context) => {
    const { userId } = context.params;
    const activity = snap.data();

    // In a real app, you would inspect `activity.type` or `activity.footprint`
    // and route the points to specific SDG buckets (sdg7, sdg11, etc.)
    // For MVP, we will extract the total points awarded and increment them.
    const pointsAwarded = activity.points || 0;
    if (pointsAwarded <= 0) return null;

    const userRef = db.collection('users').doc(userId);

    return db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      const userData = userDoc.data() || {};

      // 2a. Update User's ESG / SDG Mock Metrics
      let currentTotalScore = userData.sdg?.esg?.total || 0;
      // Convert points to a mock ESG increment for the demo
      currentTotalScore = Math.min(100, currentTotalScore + (pointsAwarded / 1000));

      const updatedSdg = {
        esg: {
          total: currentTotalScore
        }
      };

      transaction.set(userRef, { sdg: updatedSdg }, { merge: true });

      // 2b. Corporate Aggregation
      const corporate = userData.corporate;
      if (corporate && corporate.isLinked && corporate.isVerified && corporate.companyDomain) {
        const companyRef = db.collection('companies').doc(corporate.companyDomain);
        transaction.set(companyRef, {
          name: corporate.linkedCompany,
          points: admin.firestore.FieldValue.increment(pointsAwarded),
          lastActive: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }
    });
  });

// -------------------------------------------------------------------------- //
// 3. Work Email Verification Flow
// -------------------------------------------------------------------------- //
export const requestWorkEmailVerification = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  // Rate limiting: max 5 email verification requests per minute
  const allowed = await checkRateLimit(context.auth.uid, { maxOps: 5, windowMs: 60_000 });
  if (!allowed) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Too many requests. Please try again later.',
    );
  }

  const { email, companyName } = data;
  if (!email || !email.includes('@')) {
    throw new functions.https.HttpsError('invalid-argument', 'Valid email required.');
  }

  const domain = email.split('@')[1];
  
  // Generate a random 6 digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // Store it in Firestore temporarily (expires in 10 mins)
  const verificationRef = db.collection('verifications').doc(context.auth.uid);
  await verificationRef.set({
    code,
    email,
    companyName,
    domain,
    expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 10 * 60 * 1000)
  });

  // Send the verification code by email (SendGrid when configured, console fallback for local dev)
  if (SENDGRID_API_KEY) {
    await sgMail.send({
      to: email,
      from: FROM_EMAIL,
      subject: 'Your Kindred verification code',
      text: `Your Kindred corporate email verification code is: ${code}. It expires in 10 minutes.`,
      html: `<p>Your Kindred corporate email verification code is:</p>
             <h2 style="letter-spacing: 4px; font-size: 32px; margin: 16px 0;">${code}</h2>
             <p>This code expires in 10 minutes. If you did not request this, you can ignore this email.</p>`,
    });
  } else {
    console.log(`[MOCK EMAIL] To: ${email} -> Your Kindred verification code is: ${code}`);
  }

  return { success: true, message: 'Verification code sent.' };
});

export const verifyWorkEmailCode = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  const { code } = data;
  const verificationRef = db.collection('verifications').doc(context.auth.uid);
  const doc = await verificationRef.get();

  if (!doc.exists) {
    throw new functions.https.HttpsError('not-found', 'No verification request found.');
  }

  const vData = doc.data()!;
  
  if (Date.now() > vData.expiresAt.toMillis()) {
    throw new functions.https.HttpsError('deadline-exceeded', 'Code expired.');
  }

  if (vData.code !== code) {
    throw new functions.https.HttpsError('invalid-argument', 'Incorrect code.');
  }

  // Update user's corporate status
  const userRef = db.collection('users').doc(context.auth.uid);
  await userRef.set({
    corporate: {
      linkedCompany: vData.companyName,
      companyDomain: vData.domain,
      isLinked: true,
      isVerified: true
    }
  }, { merge: true });

  // Cleanup
  await verificationRef.delete();

  return { success: true, companyName: vData.companyName };
});

// -------------------------------------------------------------------------- //
// 4. AdMob Rewarded Ad Server-Side Verification
// -------------------------------------------------------------------------- //
export const onAdRewardVerified = functions.https.onCall(async (_data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  // App Check enforcement (blocks non-app requests in production)
  if (process.env.NODE_ENV === 'production' && !context.app) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'The function must be called from a verified app.',
    );
  }

  // Rate limiting: max 10 ad reward claims per minute
  const allowed = await checkRateLimit(context.auth.uid, { maxOps: 10, windowMs: 60_000 });
  if (!allowed) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Too many requests. Please try again later.',
    );
  }

  const { uid } = context.auth;
  const amountCents = 50; // $0.50 per ad watch

  // Create a transaction record for the ad reward
  const txRef = db.collection('users').doc(uid).collection('transactions').doc();
  await txRef.set({
    type: 'EARN',
    amountCents,
    source: 'rewarded_ad',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true, amountCents };
});

// -------------------------------------------------------------------------- //
// 4. Gift Card Redemption (Tremendous)
// -------------------------------------------------------------------------- //
export const redeemGiftCard = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  // App Check enforcement (blocks non-app requests in production)
  if (process.env.NODE_ENV === 'production' && !context.app) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'The function must be called from a verified app.',
    );
  }

  // Rate limiting: max 3 gift card redemptions per minute
  const allowed = await checkRateLimit(context.auth.uid, { maxOps: 3, windowMs: 60_000 });
  if (!allowed) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Too many requests. Please try again later.',
    );
  }

  const uid = context.auth.uid;
  const { amountCents, recipientEmail } = data;

  if (typeof amountCents !== 'number' || !Number.isInteger(amountCents) || amountCents < 500) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Minimum gift card amount is $5.00 (500 cents).',
    );
  }

  const userRef = db.collection('users').doc(uid);

  return db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    const userData = userDoc.data() || {};

    const balanceCents = userData.wallet?.balanceCents || 0;

    if (balanceCents < amountCents) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Insufficient balance.',
      );
    }

    const txRef = db.collection('users').doc(uid).collection('transactions').doc();
    transaction.set(txRef, {
      type: 'SPEND',
      amountCents,
      recipientEmail: recipientEmail || null,
      description: 'Gift card redemption',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // NOTE: Actual Tremendous API call is mocked for now
    console.log(
      `[MOCK TREMENDOUS] Order created: amountCents=${amountCents}, recipientEmail=${recipientEmail || uid}`,
    );

    return { success: true, message: 'Gift card ordered' };
  });
});
