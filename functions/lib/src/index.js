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
exports.verifyWorkEmailCode = exports.requestWorkEmailVerification = exports.onActivityLogged = exports.onTransactionCreated = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
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
        var _a, _b;
        const userDoc = await transaction.get(userRef);
        const userData = userDoc.data() || {};
        let balanceCents = ((_a = userData.wallet) === null || _a === void 0 ? void 0 : _a.balanceCents) || 0;
        let totalEarnedCents = ((_b = userData.wallet) === null || _b === void 0 ? void 0 : _b.totalEarnedCents) || 0;
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
        var _a, _b;
        const userDoc = await transaction.get(userRef);
        const userData = userDoc.data() || {};
        // 2a. Update User's ESG / SDG Mock Metrics
        let currentTotalScore = ((_b = (_a = userData.sdg) === null || _a === void 0 ? void 0 : _a.esg) === null || _b === void 0 ? void 0 : _b.total) || 0;
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
    // MOCK EMAIL SENDING: In production, call SendGrid/Mailgun here.
    console.log(`[MOCK EMAIL] To: ${email} -> Your Kindred verification code is: ${code}`);
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
//# sourceMappingURL=index.js.map