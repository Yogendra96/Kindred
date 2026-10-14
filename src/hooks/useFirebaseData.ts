import { useState, useEffect, useCallback } from 'react';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import functions from '@react-native-firebase/functions';

export interface WalletState {
  balanceCents: number;
  totalEarnedCents: number;
}

export interface CorporateState {
  linkedCompany: string | null;
  companyDomain: string | null;
  isLinked: boolean;
  isVerified: boolean;
  totalCompanyPoints: number;
}

export interface SDGState {
  esg: {
    total: number;
  };
}

export interface CarbonState {
  currentFootprint: {
    total: number;
    transport: number;
    energy: number;
    food: number;
    shopping: number;
  };
  transport: number;
  energy: number;
  food: number;
  shopping: number;
  history: any[];
}

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({ balanceCents: 0, totalEarnedCents: 0 });

  useEffect(() => {
    try {
      const user = auth().currentUser;
      if (!user) return undefined;

      const subscriber = firestore()
        .collection('users')
        .doc(user.uid)
        .onSnapshot(documentSnapshot => {
          if (documentSnapshot.exists()) {
            const data = documentSnapshot.data();
            if (data?.wallet) {
              setWallet(data.wallet);
            }
          }
        });

      return () => subscriber();
    } catch {
      return undefined;
    }
  }, []);

  return wallet;
}

export function useCorporate() {
  const [corporate, setCorporate] = useState<CorporateState>({
    linkedCompany: null,
    companyDomain: null,
    isLinked: false,
    isVerified: false,
    totalCompanyPoints: 0,
  });

  useEffect(() => {
    try {
      const user = auth().currentUser;
      if (!user) return undefined;

      const subscriber = firestore()
        .collection('users')
        .doc(user.uid)
        .onSnapshot(documentSnapshot => {
          if (documentSnapshot.exists()) {
            const data = documentSnapshot.data();
            if (data?.corporate) {
              setCorporate(data.corporate);
            }
          }
        });

      return () => subscriber();
    } catch {
      return undefined;
    }
  }, []);

  return corporate;
}

export function useSDG() {
  const [sdg, setSdg] = useState<SDGState>({ esg: { total: 0 } });

  useEffect(() => {
    try {
      const user = auth().currentUser;
      if (!user) return undefined;

      const subscriber = firestore()
        .collection('users')
        .doc(user.uid)
        .onSnapshot(documentSnapshot => {
          if (documentSnapshot.exists()) {
            const data = documentSnapshot.data();
            if (data?.sdg) {
              setSdg(data.sdg);
            }
          }
        });

      return () => subscriber();
    } catch {
      return undefined;
    }
  }, []);

  return sdg;
}

export function useCarbon() {
  const [carbon, setCarbon] = useState<CarbonState>({
    currentFootprint: { total: 20, transport: 5, energy: 5, food: 5, shopping: 5 },
    transport: 5,
    energy: 5,
    food: 5,
    shopping: 5,
    history: [],
  });

  useEffect(() => {
    try {
      const user = auth().currentUser;
      if (!user) return undefined;

      const subscriber = firestore()
        .collection('users')
        .doc(user.uid)
        .onSnapshot(documentSnapshot => {
          if (documentSnapshot.exists()) {
            const data = documentSnapshot.data();
            if (data?.carbon) {
              setCarbon(data.carbon);
            }
          }
        });

      return () => subscriber();
    } catch {
      return undefined;
    }
  }, []);

  return carbon;
}

export function useRedeemGiftCard() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redeem = useCallback(async (amountCents: number, recipientEmail?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const redeemFn = functions().httpsCallable('redeemGiftCard');
      const result = await redeemFn({ amountCents, recipientEmail });
      return result.data as { success: boolean; message: string };
    } catch (err: any) {
      const message = err.message || 'Failed to redeem gift card. Please try again.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { redeem, isLoading, error };
}

export function usePayoutToUPI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payout = useCallback(async (amountINR: number, vpa: string, recipientName?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const payoutFn = functions().httpsCallable('payoutToUPI');
      const result = await payoutFn({ amountINR, vpa, recipientName });
      return result.data as { success: boolean; referenceId: string; status: string; message: string };
    } catch (err: any) {
      const message = err.message || 'Failed to process UPI payout. Please try again.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { payout, isLoading, error };
}

export function useRedeemVoucher() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redeemVoucher = useCallback(
    async (params: {
      productId: string;
      denomination: number;
      currency?: 'INR' | 'USD';
      recipientEmail?: string;
    }) => {
      setIsLoading(true);
      setError(null);
      try {
        const redeemFn = functions().httpsCallable('redeemVoucher');
        const result = await redeemFn(params);
        return result.data as {
          success: boolean;
          orderId: string;
          voucherCode?: string;
          message: string;
        };
      } catch (err: any) {
        const message = err.message || 'Failed to redeem voucher. Please try again.';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { redeemVoucher, isLoading, error };
}

