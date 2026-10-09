/**
 * useRewardedAd — Hook for rewarded video ads via react-native-google-mobile-ads.
 *
 * Wraps the RewardedAd lifecycle: loads on mount, exposes show(), and
 * surfaces isLoaded / isWatched / adError signals so the UI can react.
 *
 * In development the ad unit defaults to the GMA test ad ID (TestIds.REWARDED).
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

interface UseRewardedAdReturn {
  /** True when the ad has loaded and is ready to show */
  isLoaded: boolean;
  /** Becomes true once the user has earned the reward */
  isWatched: boolean;
  /** Show the rewarded ad (no-op if not loaded) */
  show: () => void;
  /** Latest error message, or null */
  adError: string | null;
}

const AD_UNIT_ID = TestIds.REWARDED;

export const useRewardedAd = (): UseRewardedAdReturn => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);

  // Use a ref to keep the instance across renders without re-creating on state changes
  const adRef = useRef<RewardedAd | null>(null);

  useEffect(() => {
    const ad = RewardedAd.createForAdRequest(AD_UNIT_ID);
    adRef.current = ad;

    const unsubLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setIsLoaded(true);
      setAdError(null);
    });

    const unsubEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      setIsWatched(true);
    });

    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      setIsLoaded(false);
    });

    const unsubError = ad.addAdEventListener(AdEventType.ERROR, (error: any) => {
      setAdError(error?.message ?? 'Ad failed to load');
      setIsLoaded(false);
    });

    ad.load();

    return () => {
      unsubLoaded();
      unsubEarned();
      unsubClosed();
      unsubError();
      adRef.current = null;
    };
  }, []);

  const show = useCallback(() => {
    if (adRef.current && isLoaded) {
      adRef.current.show();
    }
  }, [isLoaded]);

  return { isLoaded, isWatched, show, adError };
};
