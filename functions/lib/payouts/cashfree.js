'use strict';
/**
 * Cashfree Payouts Integration
 * Supports instant 24/7 UPI & IMPS transfers to Indian bank accounts.
 *
 * Docs: https://docs.cashfree.com/reference/payouts-api
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.isValidUPI = isValidUPI;
exports.executeCashfreeUpiTransfer = executeCashfreeUpiTransfer;
const CASHFREE_CLIENT_ID = process.env.CASHFREE_CLIENT_ID;
const CASHFREE_CLIENT_SECRET = process.env.CASHFREE_CLIENT_SECRET;
const CASHFREE_ENV = process.env.CASHFREE_ENV || 'sandbox';
const BASE_URL =
  CASHFREE_ENV === 'production'
    ? 'https://payout-api.cashfree.com/payout/v1'
    : 'https://sandbox.cashfree.com/payout/v1';
/**
 * Validates Indian UPI VPA format (e.g. username@bank, mobile@upi)
 */
function isValidUPI(vpa) {
  if (!vpa || typeof vpa !== 'string') return false;
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  return upiRegex.test(vpa.trim());
}
/**
 * Dispatches an instant UPI transfer via Cashfree Payouts.
 * Falls back to simulation mode in dev/staging when API credentials are not set.
 */
async function executeCashfreeUpiTransfer(params) {
  const { transferId, amountINR, vpa, remarks = 'Kindred Eco Rewards' } = params;
  if (!isValidUPI(vpa)) {
    throw new Error('Invalid UPI ID format. Expected format: username@bank');
  }
  if (amountINR <= 0) {
    throw new Error('Transfer amount must be greater than 0 INR.');
  }
  // 1. Simulation fallback for local development / test environments ONLY
  if (!CASHFREE_CLIENT_ID || !CASHFREE_CLIENT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'Cashfree payout credentials (CASHFREE_CLIENT_ID / CASHFREE_CLIENT_SECRET) are missing in production.',
      );
    }
    console.log(
      `[SIMULATED CASHFREE PAYOUT] TransferId: ${transferId}, Amount: ₹${amountINR}, VPA: ${vpa}`,
    );
    return {
      success: true,
      referenceId: `SIM-CF-${Date.now()}`,
      status: 'SUCCESS',
      message: 'Simulated Cashfree transfer successful (CASHFREE_CLIENT_ID not configured).',
      isSimulated: true,
    };
  }
  // 2. Production / Sandbox live API call
  try {
    // Step A: Request Auth Token from Cashfree
    const authRes = await fetch(`${BASE_URL}/authorize`, {
      method: 'POST',
      headers: {
        'X-Client-Id': CASHFREE_CLIENT_ID,
        'X-Client-Secret': CASHFREE_CLIENT_SECRET,
        'Content-Type': 'application/json',
      },
    });
    const authData = await authRes.json();
    if (authData.status !== 'SUCCESS' || !authData.data?.token) {
      throw new Error(
        `Cashfree authentication failed: ${authData.message || 'Unable to authorize'}`,
      );
    }
    const bearerToken = authData.data.token;
    // Step B: Execute direct UPI transfer
    const transferRes = await fetch(`${BASE_URL}/directTransfer`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountINR.toFixed(2),
        transferId: transferId,
        transferMode: 'upi',
        vpa: vpa.trim(),
        remarks: remarks,
      }),
    });
    const transferData = await transferRes.json();
    if (transferData.status === 'SUCCESS') {
      return {
        success: true,
        referenceId: transferData.data?.referenceId || transferId,
        status: 'SUCCESS',
        message: 'UPI transfer completed successfully.',
        isSimulated: false,
      };
    } else if (transferData.status === 'PENDING') {
      return {
        success: true,
        referenceId: transferData.data?.referenceId || transferId,
        status: 'PENDING',
        message: 'UPI transfer is being processed by the bank.',
        isSimulated: false,
      };
    } else {
      throw new Error(transferData.message || 'Cashfree transfer failed.');
    }
  } catch (err) {
    console.error('Cashfree transfer error:', err);
    throw new Error(`Cashfree payout failed: ${err.message || 'Unknown error'}`);
  }
}
//# sourceMappingURL=cashfree.js.map
