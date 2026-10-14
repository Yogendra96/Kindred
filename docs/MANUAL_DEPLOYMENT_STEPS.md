# Manual Production Deployment Steps & Reminder Runbook

This runbook contains the required manual steps for activating production credentials, cloud
secrets, and deploying live Firebase Cloud Functions and Firestore Security Rules.

---

## ⚡ Quick Copy-Paste Cheatsheet

Once you are ready with your merchant portals and Firebase project, run these commands in the
project root:

```bash
# 1. Authorize Firebase CLI
npx firebase-tools login

# 2. Select your Firebase project
npx firebase-tools use <your-firebase-project-id>

# 3. Provision Cloud Secrets
npx firebase-tools functions:secrets:set CASHFREE_CLIENT_ID
npx firebase-tools functions:secrets:set CASHFREE_CLIENT_SECRET
npx firebase-tools functions:secrets:set XOXODAY_CLIENT_ID
npx firebase-tools functions:secrets:set XOXODAY_CLIENT_SECRET
npx firebase-tools functions:secrets:set SENDGRID_API_KEY

# 4. Deploy Hardened Security Rules
npx firebase-tools deploy --only firestore:rules

# 5. Deploy Cloud Functions
npx firebase-tools deploy --only functions
```

---

## 📋 Detailed Step-by-Step Checklist

### Step 1: Authorize Firebase CLI

The Firebase CLI requires interactive browser OAuth to access your Google Cloud project.

```bash
npx firebase-tools login
```

- A browser window will open.
- Sign in with the Google Account that is the **Owner** or **Editor** of your Firebase project.
- To verify you are logged in, run:
  ```bash
  npx firebase-tools login:list
  ```

---

### Step 2: Retrieve Merchant API Credentials

| Service              | Portal                                                  | Keys Required                     |
| -------------------- | ------------------------------------------------------- | --------------------------------- |
| **Cashfree Payouts** | [merchant.cashfree.com](https://merchant.cashfree.com/) | Client ID & Client Secret         |
| **Xoxoday Plum**     | [plum.xoxoday.com](https://plum.xoxoday.com/)           | Client ID & Client Secret         |
| **SendGrid Email**   | [app.sendgrid.com](https://app.sendgrid.com/)           | API Key (Full Access / Mail Send) |

Set them securely in Firebase Secret Manager:

```bash
npx firebase-tools functions:secrets:set CASHFREE_CLIENT_ID
# Enter value when prompted

npx firebase-tools functions:secrets:set CASHFREE_CLIENT_SECRET
# Enter value when prompted

npx firebase-tools functions:secrets:set XOXODAY_CLIENT_ID
# Enter value when prompted

npx firebase-tools functions:secrets:set XOXODAY_CLIENT_SECRET
# Enter value when prompted

npx firebase-tools functions:secrets:set SENDGRID_API_KEY
# Enter value when prompted
```

---

### Step 3: Deploy Firestore Rules & Cloud Functions

Deploy the production-hardened rules and 7 Cloud Functions:

```bash
# Deploy Firestore security rules
npx firebase-tools deploy --only firestore:rules

# Deploy all 7 Cloud Functions
npx firebase-tools deploy --only functions
```

Functions deployed:

1. `onTransactionCreated` (Firestore trigger)
2. `onActivityLogged` (Firestore trigger)
3. `requestWorkEmailVerification` (Callable)
4. `verifyWorkEmailCode` (Callable)
5. `payoutToUPI` (Callable — Cashfree instant UPI)
6. `redeemVoucher` (Callable — Xoxoday brand vouchers)
7. `redeemGiftCard` (Callable — backwards-compatible alias)
8. `onAdRewardVerified` (Callable — AdMob SSV)

---

### Step 4: Download Native Config Files

From your **Firebase Console → Project Settings**:

1. **Android:** Download `google-services.json` and place it in `android/app/google-services.json`.
2. **iOS:** Download `GoogleService-Info.plist` and place it in `ios/GoogleService-Info.plist`.

---

### Step 5: Post-Deployment Smoke Test

Verify the deployment in real-time:

```bash
# View live Cloud Functions logs
npx firebase-tools functions:log
```

Open the mobile app and test:

- Request a work email verification code.
- Test a small UPI payout or voucher redemption.
