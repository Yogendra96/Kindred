/**
 * useRewardedAd — Hook for rewarded video ads via react-native-google-mobile-ads.
 *
 * Wraps the RewardedAd lifecycle: loads on mount, exposes show(), and
 * surfaces isLoaded / isWatched / adError signals so the UI can react.
 *
 * In development the ad unit defaults to the GMA test ad ID (TestIds.REWARDED).
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { NativeModules } from 'react-native';

let RewardedAd: any = null;
let RewardedAdEventType: any = null;
let AdEventType: any = null;
let TestIds: any = null;
let AdsConsent: any = null;

try {
  if (NativeModules.RNGoogleMobileAdsModule) {
    const gma = require('react-native-google-mobile-ads');
    RewardedAd = gma.RewardedAd;
    RewardedAdEventType = gma.RewardedAdEventType;
    AdEventType = gma.AdEventType;
    TestIds = gma.TestIds;
    AdsConsent = gma.AdsConsent;
  }
} catch {
  // Gracefully fallback when native module is missing from the binary
}

/**
 * Opens Google's Privacy Options Form if available/required by EU User Consent Policy
 */
export const showAdPrivacyOptions = async (): Promise<boolean> => {
  try {
    if (AdsConsent && typeof AdsConsent.showPrivacyOptionsForm === 'function') {
      await AdsConsent.showPrivacyOptionsForm();
      return true;
    }
  } catch (error) {
    console.warn('Failed to display Ad Privacy Options form:', error);
  }
  return false;
};

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

const AD_UNIT_ID = TestIds?.REWARDED ?? 'ca-app-pub-3940256099942544/5224354917';

export const useRewardedAd = (): UseRewardedAdReturn => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);

  // Use a ref to keep the instance across renders without re-creating on state changes
  const adRef = useRef<any>(null);

  useEffect(() => {
    if (!RewardedAd) {
      setIsLoaded(true);
      return undefined;
    }

    let isMounted = true;

    try {
      const ad = RewardedAd.createForAdRequest(AD_UNIT_ID);
      adRef.current = ad;

      const unsubLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        if (isMounted) {
          setIsLoaded(true);
          setAdError(null);
        }
      });

      const unsubEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        if (isMounted) {
          setIsWatched(true);
        }
      });

      const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
        if (isMounted) {
          setIsLoaded(false);
        }
      });

      const unsubError = ad.addAdEventListener(AdEventType.ERROR, (error: any) => {
        if (isMounted) {
          setAdError(error?.message ?? 'Ad failed to load');
          setIsLoaded(false);
        }
      });

      // Gather EU / UK consent via User Messaging Platform (UMP) before requesting ad
      const initiateAdLoad = async () => {
        try {
          if (AdsConsent && typeof AdsConsent.gatherConsent === 'function') {
            await AdsConsent.gatherConsent();
          }
        } catch (consentErr) {
          console.warn('AdMob UMP consent gathering notice:', consentErr);
        }
        if (isMounted) {
          ad.load();
        }
      };

      initiateAdLoad();

      return () => {
        isMounted = false;
        unsubLoaded?.();
        unsubEarned?.();
        unsubClosed?.();
        unsubError?.();
        adRef.current = null;
      };
    } catch (e: any) {
      setAdError(e?.message ?? 'Failed to initialize ad');
      return undefined;
    }
  }, []);

  const show = useCallback(() => {
    if (!RewardedAd) {
      setIsWatched(true);
      setIsLoaded(false);
      return;
    }
    if (adRef.current && isLoaded) {
      try {
        adRef.current.show();
      } catch (error: any) {
        setAdError(error?.message ?? 'Failed to show ad');
      }
    }
  }, [isLoaded]);

  return { isLoaded, isWatched, show, adError };
};
