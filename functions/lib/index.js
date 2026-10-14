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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redeemGiftCard = exports.redeemVoucher = exports.payoutToUPI = exports.onAdRewardVerified = exports.verifyWorkEmailCode = exports.requestWorkEmailVerification = exports.onActivityLogged = exports.onTransactionCreated = void 0;
// @ts-nocheck
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const mail_1 = __importDefault(require("@sendgrid/mail"));
const rateLimit_1 = require("./rateLimit");
const cashfree_1 = require("./payouts/cashfree");
const xoxoday_1 = require("./payouts/xoxoday");
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (SENDGRID_API_KEY) {
    mail_1.default.setApiKey(SENDGRID_API_KEY);
}
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'no-reply@kindred.app';
admin.initializeApp();
const db = admin.firestore();
// -------------------------------------------------------------------------- //
// 1. Transaction Aggregation
// -------------------------------------------------------------------------- //
exports.onTransactionCreated = functions.firestore
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
        }
        else if (tx.type === 'SPEND') {
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
exports.onActivityLogged = functions.firestore
    .document('users/{userId}/history/{historyId}')
    .onCreate(async (snap, context) => {
    const { userId } = context.params;
    const activity = snap.data();
    // In a real app, you would inspect `activity.type` or `activity.footprint`
    // and route the points to specific SDG buckets (sdg7, sdg11, etc.)
    // For MVP, we will extract the total points awarded and increment them.
    const pointsAwarded = activity.points || 0;
    if (pointsAwarded <= 0)
        return null;
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
exports.requestWorkEmailVerification = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }
    // Rate limiting: max 5 email verification requests per minute
    const allowed = await (0, rateLimit_1.checkRateLimit)(context.auth.uid, { maxOps: 5, windowMs: 60000 });
    if (!allowed) {
        throw new functions.https.HttpsError('resource-exhausted', 'Too many requests. Please try again later.');
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
        await mail_1.default.send({
            to: email,
            from: FROM_EMAIL,
            subject: 'Your Kindred verification code',
            text: `Your Kindred corporate email verification code is: ${code}. It expires in 10 minutes.`,
            html: `<p>Your Kindred corporate email verification code is:</p>
             <h2 style="letter-spacing: 4px; font-size: 32px; margin: 16px 0;">${code}</h2>
             <p>This code expires in 10 minutes. If you did not request this, you can ignore this email.</p>`,
        });
    }
    else {
        console.log(`[MOCK EMAIL] To: ${email} -> Your Kindred verification code is: ${code}`);
    }
    return { success: true, message: 'Verification code sent.' };
});
exports.verifyWorkEmailCode = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }
    const { code } = data;
    const verificationRef = db.collection('verifications').doc(context.auth.uid);
    const doc = await verificationRef.get();
    if (!doc.exists) {
        throw new functions.https.HttpsError('not-found', 'No verification request found.');
    }
    const vData = doc.data();
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
exports.onAdRewardVerified = functions.https.onCall(async (_data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }
    // App Check enforcement (blocks non-app requests in production)
    if (process.env.NODE_ENV === 'production' && !context.app) {
        throw new functions.https.HttpsError('failed-precondition', 'The function must be called from a verified app.');
    }
    // Rate limiting: max 10 ad reward claims per minute
    const allowed = await (0, rateLimit_1.checkRateLimit)(context.auth.uid, { maxOps: 10, windowMs: 60000 });
    if (!allowed) {
        throw new functions.https.HttpsError('resource-exhausted', 'Too many requests. Please try again later.');
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
// 4. Instant UPI Payout (Cashfree Payouts - India)
// -------------------------------------------------------------------------- //
exports.payoutToUPI = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }
    if (process.env.NODE_ENV === 'production' && !context.app) {
        throw new functions.https.HttpsError('failed-precondition', 'The function must be called from a verified app.');
    }
    // Rate limiting: max 3 UPI payouts per 5 minutes
    const allowed = await (0, rateLimit_1.checkRateLimit)(context.auth.uid, { maxOps: 3, windowMs: 300000 });
    if (!allowed) {
        throw new functions.https.HttpsError('resource-exhausted', 'Too many payout requests. Please wait a few minutes before trying again.');
    }
    const uid = context.auth.uid;
    const { vpa, amountINR, recipientName } = data;
    if (!vpa || !(0, cashfree_1.isValidUPI)(vpa)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid UPI ID format. Expected format: username@bank (e.g., alex@okhdfcbank)');
    }
    if (typeof amountINR !== 'number' || amountINR < 10) {
        throw new functions.https.HttpsError('invalid-argument', 'Minimum UPI payout amount is ₹10.00.');
    }
    // Conversion: 1 INR = 1.25 cents (₹80 = $1.00 / 100 cents)
    const costCents = Math.round(amountINR * 1.25);
    const userRef = db.collection('users').doc(uid);
    const txRef = db.collection('users').doc(uid).collection('transactions').doc();
    // Step 1: Atomic Balance Check and Deduction
    await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const userData = userDoc.data() || {};
        const balanceCents = userData.wallet?.balanceCents || 0;
        if (balanceCents < costCents) {
            throw new functions.https.HttpsError('failed-precondition', `Insufficient balance. You need ${costCents} cents for a ₹${amountINR} payout.`);
        }
        transaction.set(txRef, {
            type: 'SPEND',
            category: 'UPI_PAYOUT',
            amountCents: costCents,
            amountINR,
            vpa,
            status: 'PROCESSING',
            provider: 'CASHFREE',
            description: `Instant UPI Payout to ${vpa}`,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    });
    // Step 2: Execute Cashfree Transfer
    try {
        const result = await (0, cashfree_1.executeCashfreeUpiTransfer)({
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
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return {
            success: true,
            referenceId: result.referenceId,
            status: result.status,
            message: result.message,
        };
    }
    catch (err) {
        console.error('UPI payout error, executing rollback:', err);
        // Rollback: refund user wallet balance and mark transaction as FAILED
        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            const userData = userDoc.data() || {};
            const currentBalance = userData.wallet?.balanceCents || 0;
            transaction.update(userRef, {
                'wallet.balanceCents': currentBalance + costCents,
            });
            transaction.update(txRef, {
                status: 'FAILED',
                failureReason: err.message || 'Transfer failed',
                refundedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        });
        throw new functions.https.HttpsError('internal', err.message || 'UPI transfer failed.');
    }
});
// -------------------------------------------------------------------------- //
// 5. Rewards & Gift Card Redemption (Xoxoday Plum - Global & India)
// -------------------------------------------------------------------------- //
exports.redeemVoucher = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }
    if (process.env.NODE_ENV === 'production' && !context.app) {
        throw new functions.https.HttpsError('failed-precondition', 'The function must be called from a verified app.');
    }
    // Rate limiting: max 5 voucher redemptions per 5 minutes
    const allowed = await (0, rateLimit_1.checkRateLimit)(context.auth.uid, { maxOps: 5, windowMs: 300000 });
    if (!allowed) {
        throw new functions.https.HttpsError('resource-exhausted', 'Too many requests. Please wait a few minutes before trying again.');
    }
    const uid = context.auth.uid;
    const { productId = 'AMAZON_IN', denomination = 500, currency = 'INR', recipientEmail, recipientName, } = data;
    const emailToUse = recipientEmail || context.auth.token.email;
    if (!emailToUse) {
        throw new functions.https.HttpsError('invalid-argument', 'Recipient email is required for voucher delivery.');
    }
    // Cost in points/cents: if currency is INR, 1 INR = 1.25 cents; if USD, 1 USD = 100 cents
    const costCents = currency === 'USD' ? Math.round(denomination * 100) : Math.round(denomination * 1.25);
    const userRef = db.collection('users').doc(uid);
    const txRef = db.collection('users').doc(uid).collection('transactions').doc();
    // Step 1: Atomic Balance Check and Deduction
    await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const userData = userDoc.data() || {};
        const balanceCents = userData.wallet?.balanceCents || 0;
        if (balanceCents < costCents) {
            throw new functions.https.HttpsError('failed-precondition', `Insufficient balance. You need ${costCents} cents for this voucher.`);
        }
        transaction.set(txRef, {
            type: 'SPEND',
            category: 'VOUCHER_REDEMPTION',
            amountCents: costCents,
            productId,
            denomination,
            currency,
            recipientEmail: emailToUse,
            status: 'PROCESSING',
            provider: 'XOXODAY',
            description: `${productId} Voucher (${denomination} ${currency})`,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    });
    // Step 2: Dispatch Xoxoday Voucher Order
    try {
        const result = await (0, xoxoday_1.executeXoxodayOrder)({
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
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return {
            success: true,
            orderId: result.orderId,
            voucherCode: result.voucherCode,
            message: result.message,
        };
    }
    catch (err) {
        console.error('Xoxoday order error, executing rollback:', err);
        // Rollback: refund user wallet balance and mark transaction as FAILED
        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            const userData = userDoc.data() || {};
            const currentBalance = userData.wallet?.balanceCents || 0;
            transaction.update(userRef, {
                'wallet.balanceCents': currentBalance + costCents,
            });
            transaction.update(txRef, {
                status: 'FAILED',
                failureReason: err.message || 'Voucher creation failed',
                refundedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        });
        throw new functions.https.HttpsError('internal', err.message || 'Voucher redemption failed.');
    }
});
// Backward-compatible alias for existing frontend calls
exports.redeemGiftCard = functions.https.onCall(async (data, context) => {
    return (0, exports.redeemVoucher)({
        productId: 'AMAZON_IN',
        denomination: data.amountCents ? Math.round(data.amountCents / 1.25) : 500,
        currency: 'INR',
        recipientEmail: data.recipientEmail,
    }, context);
});
//# sourceMappingURL=index.js.map