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
    const user = auth().currentUser;
    if (!user) return;

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
    const user = auth().currentUser;
    if (!user) return;

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
  }, []);

  return corporate;
}

export function useSDG() {
  const [sdg, setSdg] = useState<SDGState>({ esg: { total: 0 } });

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;

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
    const user = auth().currentUser;
    if (!user) return;

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
