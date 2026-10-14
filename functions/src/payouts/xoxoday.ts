/**
 * Xoxoday Plum (Giift) Rewards & Voucher Integration
 * Supports Indian & Global gift cards, store vouchers, prepaid cards, and charity donations.
 *
 * Docs: https://www.xoxoday.com/plum/developers
 */

export interface XoxodayOrderParams {
  orderId: string;
  productId: string; // e.g. 'AMAZON_IN', 'FLIPKART', 'SWIGGY', 'AMAZON_US', 'STARBUCKS'
  denomination: number; // e.g. 100, 250, 500, 1000
  currency?: string; // 'INR' (default) or 'USD'
  recipientEmail: string;
  recipientName?: string;
  recipientPhone?: string;
}

export interface XoxodayOrderResult {
  success: boolean;
  orderId: string;
  voucherCode?: string;
  voucherPin?: string;
  expiryDate?: string;
  message: string;
  isSimulated?: boolean;
}

const XOXODAY_CLIENT_ID = process.env.XOXODAY_CLIENT_ID;
const XOXODAY_CLIENT_SECRET = process.env.XOXODAY_CLIENT_SECRET;
const XOXODAY_ENV = process.env.XOXODAY_ENV || 'sandbox';

const BASE_URL =
  XOXODAY_ENV === 'production'
    ? 'https://accounts.xoxoday.com/chef/v1/oauth/api'
    : 'https://stagingadmin.xoxoday.com/chef/v1/oauth/api';

/**
 * Creates and dispatches a voucher/gift card order via Xoxoday Plum.
 * Falls back to simulation mode in dev/staging when API credentials are not set.
 */
export async function executeXoxodayOrder(
  params: XoxodayOrderParams,
): Promise<XoxodayOrderResult> {
  const {
    orderId,
    productId,
    denomination,
    currency = 'INR',
    recipientEmail,
    recipientName = 'Kindred Member',
    recipientPhone,
  } = params;

  if (!recipientEmail || !recipientEmail.includes('@')) {
    throw new Error('Valid recipient email address is required for voucher delivery.');
  }

  if (denomination <= 0) {
    throw new Error('Voucher denomination must be greater than 0.');
  }

  // 1. Simulation fallback for local development / test environments
  if (!XOXODAY_CLIENT_ID || !XOXODAY_CLIENT_SECRET) {
    const mockCode = `XOXO-${productId.toUpperCase().slice(0, 4)}-${Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()}`;

    console.log(
      `[SIMULATED XOXODAY ORDER] OrderId: ${orderId}, Product: ${productId}, Denom: ${denomination} ${currency}, To: ${recipientEmail}`,
    );

    return {
      success: true,
      orderId,
      voucherCode: mockCode,
      voucherPin: '1234',
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      message: `Voucher generated successfully (Simulated mode).`,
      isSimulated: true,
    };
  }

  // 2. Production / Sandbox live API call
  try {
    // Step A: Obtain Access Token
    const tokenRes = await fetch(`${BASE_URL}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: XOXODAY_CLIENT_ID,
        client_secret: XOXODAY_CLIENT_SECRET,
      }),
    });

    const tokenData = (await tokenRes.json()) as any;
    const accessToken = tokenData.access_token;
    if (!accessToken) {
      throw new Error(`Xoxoday authentication failed: ${tokenData.error_description || 'No token returned'}`);
    }

    // Step B: Place Voucher Order
    const orderRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId,
        quantity: 1,
        denomination,
        currency,
        poNumber: orderId,
        notifyAdminEmail: 1,
        deliveryType: 'email',
        deliveryDetails: {
          email: recipientEmail,
          name: recipientName,
          phone: recipientPhone,
        },
      }),
    });

    const orderData = (await orderRes.json()) as any;

    if (orderData.status === 'success' || orderData.data?.orderId) {
      const voucher = orderData.data?.vouchers?.[0];
      return {
        success: true,
        orderId: orderData.data?.orderId || orderId,
        voucherCode: voucher?.voucherCode,
        voucherPin: voucher?.pin,
        expiryDate: voucher?.expiryDate,
        message: 'Voucher dispatched to recipient email successfully.',
        isSimulated: false,
      };
    } else {
      throw new Error(orderData.message || 'Xoxoday failed to create voucher order.');
    }
  } catch (err: any) {
    console.error('Xoxoday order error:', err);
    throw new Error(`Xoxoday voucher redemption failed: ${err.message || 'Unknown error'}`);
  }
}
