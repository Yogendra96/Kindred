import * as functions from 'firebase-functions/v1';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp, Transaction } from 'firebase-admin/firestore';
import sgMail from '@sendgrid/mail';
import { checkRateLimit } from './rateLimit';
import { executeCashfreeUpiTransfer, isValidUPI } from './payouts/cashfree';
import { executeXoxodayOrder } from './payouts/xoxoday';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'no-reply@kindred.app';

if (!getApps().length) {
  initializeApp();
}
const db = getFirestore();

// -------------------------------------------------------------------------- //
// 1. Transaction Aggregation
// -------------------------------------------------------------------------- //
export const onTransactionCreated = functions.firestore
  .document('users/{userId}/transactions/{txId}')
  .onCreate(async (snap, context) => {
    const { userId } = context.params;
    const tx = snap.data();
    if (!tx) return;

    // If transaction was already deducted atomically (such as in payoutToUPI / redeemVoucher), skip deducting again
    if (tx.settled) {
      return;
    }

    const userRef = db.collection('users').doc(userId);

    return db.runTransaction(async (transaction: Transaction) => {
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

      transaction.set(
        userRef,
        {
          wallet: {
            balanceCents,
            totalEarnedCents,
          },
        },
        { merge: true },
      );
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
    if (!activity) return null;

    const pointsAwarded = activity.points || 0;
    if (pointsAwarded <= 0) return null;

    const userRef = db.collection('users').doc(userId);

    return db.runTransaction(async (transaction: Transaction) => {
      const userDoc = await transaction.get(userRef);
      const userData = userDoc.data() || {};

      let currentTotalScore = userData.sdg?.esg?.total || 0;
      currentTotalScore = Math.min(100, currentTotalScore + pointsAwarded / 1000);

      const updatedSdg = {
        esg: {
          total: currentTotalScore,
        },
      };

      transaction.set(userRef, { sdg: updatedSdg }, { merge: true });

      const corporate = userData.corporate;
      if (corporate && corporate.isLinked && corporate.isVerified && corporate.companyDomain) {
        const companyRef = db.collection('companies').doc(corporate.companyDomain);
        transaction.set(
          companyRef,
          {
            name: corporate.linkedCompany,
            points: FieldValue.increment(pointsAwarded),
            lastActive: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
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
  const allowed = await checkRateLimit(context.auth.uid, 'email_verification', {
    maxOps: 5,
    windowMs: 60_000,
  });
  if (!allowed) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Too many requests. Please try again later.',
    );
  }

  const { email, companyName } = data || {};
  if (!email || !email.includes('@')) {
    throw new functions.https.HttpsError('invalid-argument', 'Valid email required.');
  }

  const domain = email.split('@')[1];

  // Generate a random 6 digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // Store in Firestore temporarily (expires in 10 mins)
  const verificationRef = db.collection('verifications').doc(context.auth.uid);
  await verificationRef.set({
    code,
    email,
    companyName,
    domain,
    expiresAt: Timestamp.fromMillis(Date.now() + 10 * 60 * 1000),
  });

  // Send the verification code by email
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

  const { code } = data || {};
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
  await userRef.set(
    {
      corporate: {
        linkedCompany: vData.companyName,
        companyDomain: vData.domain,
        isLinked: true,
        isVerified: true,
      },
    },
    { merge: true },
  );

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
  const allowed = await checkRateLimit(context.auth.uid, 'ad_reward', {
    maxOps: 10,
    windowMs: 60_000,
  });
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
    createdAt: FieldValue.serverTimestamp(),
  });

  return { success: true, amountCents };
});

// -------------------------------------------------------------------------- //
// 5. Instant UPI Payout (Cashfree Payouts - India)
// -------------------------------------------------------------------------- //
export const payoutToUPI = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  if (process.env.NODE_ENV === 'production' && !context.app) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'The function must be called from a verified app.',
    );
  }

  // Rate limiting: max 3 UPI payouts per 5 minutes
  const allowed = await checkRateLimit(context.auth.uid, 'upi_payout', {
    maxOps: 3,
    windowMs: 300_000,
  });
  if (!allowed) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Too many payout requests. Please wait a few minutes before trying again.',
    );
  }

  const uid = context.auth.uid;
  const { vpa, amountINR, recipientName } = data || {};

  if (!vpa || !isValidUPI(vpa)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid UPI ID format. Expected format: username@bank (e.g., alex@okhdfcbank)',
    );
  }

  if (typeof amountINR !== 'number' || amountINR < 10) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Minimum UPI payout amount is ₹10.00.',
    );
  }

  // Conversion: 1 INR = 1.25 cents (₹80 = $1.00 / 100 cents)
  const costCents = Math.round(amountINR * 1.25);
  const userRef = db.collection('users').doc(uid);
  const txRef = db.collection('users').doc(uid).collection('transactions').doc();

  // Step 1: Atomic Balance Check and Deduction
  await db.runTransaction(async (transaction: Transaction) => {
    const userDoc = await transaction.get(userRef);
    const userData = userDoc.data() || {};
    const balanceCents = userData.wallet?.balanceCents || 0;

    if (balanceCents < costCents) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `Insufficient balance. You need ${costCents} cents for a ₹${amountINR} payout.`,
      );
    }

    // Immediate atomic balance deduction
    transaction.set(
      userRef,
      {
        wallet: {
          balanceCents: balanceCents - costCents,
        },
      },
      { merge: true },
    );

    transaction.set(txRef, {
      type: 'SPEND',
      category: 'UPI_PAYOUT',
      amountCents: costCents,
      amountINR,
      vpa,
      status: 'PROCESSING',
      settled: true, // Marked settled so onTransactionCreated does not double-deduct
      provider: 'CASHFREE',
      description: `Instant UPI Payout to ${vpa}`,
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  // Step 2: Execute Cashfree Transfer
  try {
    const result = await executeCashfreeUpiTransfer({
      transferId: txRef.id,
      amountINR,
      vpa,
      recipientName: recipientName || 'Kindred User',
      remarks: 'Kindred Eco Rewards Payout',
    });

    await txRef.update({
      status: result.status,
      referenceId: result.referenceId,
      isSimulated: result.isSimulated ?? false,
      completedAt: FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      referenceId: result.referenceId,
      status: result.status,
      message: result.message,
    };
  } catch (err: any) {
    console.error('UPI payout error, executing rollback:', err);

    // Rollback: refund user wallet balance and mark transaction as FAILED
    await db.runTransaction(async (transaction: Transaction) => {
      const userDoc = await transaction.get(userRef);
      const userData = userDoc.data() || {};
      const currentBalance = userData.wallet?.balanceCents || 0;

      transaction.set(
        userRef,
        {
          wallet: {
            balanceCents: currentBalance + costCents,
          },
        },
        { merge: true },
      );

      transaction.update(txRef, {
        status: 'FAILED',
        settled: false,
        failureReason: err.message || 'Transfer failed',
        refundedAt: FieldValue.serverTimestamp(),
      });
    });

    throw new functions.https.HttpsError('internal', err.message || 'UPI transfer failed.');
  }
});

// -------------------------------------------------------------------------- //
// 6. Rewards & Gift Card Redemption (Xoxoday Plum - Global & India)
// -------------------------------------------------------------------------- //
export const redeemVoucher = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  if (process.env.NODE_ENV === 'production' && !context.app) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'The function must be called from a verified app.',
    );
  }

  // Rate limiting: max 5 voucher redemptions per 5 minutes
  const allowed = await checkRateLimit(context.auth.uid, 'voucher_redemption', {
    maxOps: 5,
    windowMs: 300_000,
  });
  if (!allowed) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Too many requests. Please wait a few minutes before trying again.',
    );
  }

  const uid = context.auth.uid;
  const {
    productId = 'AMAZON_IN',
    denomination = 500,
    currency = 'INR',
    recipientEmail,
    recipientName,
  } = data || {};

  const emailToUse = recipientEmail || context.auth.token.email;
  if (!emailToUse) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Recipient email is required for voucher delivery.',
    );
  }

  // Cost in points/cents: if currency is INR, 1 INR = 1.25 cents; if USD, 1 USD = 100 cents
  const costCents =
    currency === 'USD' ? Math.round(denomination * 100) : Math.round(denomination * 1.25);

  const userRef = db.collection('users').doc(uid);
  const txRef = db.collection('users').doc(uid).collection('transactions').doc();

  // Step 1: Atomic Balance Check and Deduction
  await db.runTransaction(async (transaction: Transaction) => {
    const userDoc = await transaction.get(userRef);
    const userData = userDoc.data() || {};
    const balanceCents = userData.wallet?.balanceCents || 0;

    if (balanceCents < costCents) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `Insufficient balance. You need ${costCents} cents for this voucher.`,
      );
    }

    // Immediate atomic balance deduction
    transaction.set(
      userRef,
      {
        wallet: {
          balanceCents: balanceCents - costCents,
        },
      },
      { merge: true },
    );

    transaction.set(txRef, {
      type: 'SPEND',
      category: 'VOUCHER_REDEMPTION',
      amountCents: costCents,
      productId,
      denomination,
      currency,
      recipientEmail: emailToUse,
      status: 'PROCESSING',
      settled: true, // Marked settled so onTransactionCreated does not double-deduct
      provider: 'XOXODAY',
      description: `${productId} Voucher (${denomination} ${currency})`,
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  // Step 2: Dispatch Xoxoday Voucher Order
  try {
    const result = await executeXoxodayOrder({
      orderId: txRef.id,
      productId,
      denomination,
      currency,
      recipientEmail: emailToUse,
      recipientName: recipientName || 'Kindred Member',
    });

    await txRef.update({
      status: 'SUCCESS',
      voucherCode: result.voucherCode || null,
      voucherPin: result.voucherPin || null,
      expiryDate: result.expiryDate || null,
      isSimulated: result.isSimulated ?? false,
      completedAt: FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      orderId: result.orderId,
      voucherCode: result.voucherCode,
      message: result.message,
    };
  } catch (err: any) {
    console.error('Xoxoday order error, executing rollback:', err);

    // Rollback: refund user wallet balance and mark transaction as FAILED
    await db.runTransaction(async (transaction: Transaction) => {
      const userDoc = await transaction.get(userRef);
      const userData = userDoc.data() || {};
      const currentBalance = userData.wallet?.balanceCents || 0;

      transaction.set(
        userRef,
        {
          wallet: {
            balanceCents: currentBalance + costCents,
          },
        },
        { merge: true },
      );

      transaction.update(txRef, {
        status: 'FAILED',
        settled: false,
        failureReason: err.message || 'Voucher creation failed',
        refundedAt: FieldValue.serverTimestamp(),
      });
    });

    throw new functions.https.HttpsError('internal', err.message || 'Voucher redemption failed.');
  }
});

// Backward-compatible alias for existing frontend calls
export const redeemGiftCard = functions.https.onCall(async (data, context) => {
  const payload = {
    productId: 'AMAZON_IN',
    denomination: data?.amountCents ? Math.round(data.amountCents / 1.25) : 500,
    currency: 'INR',
    recipientEmail: data?.recipientEmail,
  };

  const fakeReq = {
    auth: context.auth,
    app: context.app,
    rawRequest: context.rawRequest,
  };

  // Execute internal voucher redemption directly
  return redeemVoucher.run(payload, fakeReq as any);
});
