import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import logger from './LoggerService';
import type { CarbonState, CorporateState, SDGState, WalletState } from '../hooks/useFirebaseData';

const log = logger.withTag('FirebaseService');

class FirebaseService {
  private static instance: FirebaseService;

  private constructor() {}

  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  /**
   * Syncs the user's wallet state to Firestore.
   */
  public async syncWallet(walletState: WalletState) {
    const user = auth().currentUser;
    if (!user) {
      log.debug('No user logged in. Skipping wallet sync.');
      return;
    }

    try {
      const userRef = firestore().collection('users').doc(user.uid);
      await userRef.set({ wallet: walletState }, { merge: true });
      log.debug('Wallet state synced to Firestore');
    } catch (error) {
      log.error('Failed to sync wallet state', error);
      throw error; // Re-throw so thunks can catch it
    }
  }

  /**
   * Syncs the user's carbon footprint state to Firestore.
   */
  public async syncCarbon(carbonState: CarbonState) {
    const user = auth().currentUser;
    if (!user) {
      log.debug('No user logged in. Skipping carbon sync.');
      return;
    }

    try {
      const userRef = firestore().collection('users').doc(user.uid);
      await userRef.set({ carbon: carbonState }, { merge: true });
      log.debug('Carbon state synced to Firestore');
    } catch (error) {
      log.error('Failed to sync carbon state', error);
    }
  }

  /**
   * Syncs the user's SDG scores to Firestore.
   */
  public async syncSDG(sdgState: SDGState) {
    const user = auth().currentUser;
    if (!user) {
      log.debug('No user logged in. Skipping SDG sync.');
      return;
    }

    try {
      const userRef = firestore().collection('users').doc(user.uid);
      await userRef.set({ sdg: sdgState }, { merge: true });
      log.debug('SDG state synced to Firestore');
    } catch (error) {
      log.error('Failed to sync SDG state', error);
    }
  }

  /**
   * Syncs the user's corporate state to Firestore.
   */
  public async syncCorporate(corporateState?: CorporateState) {
    const user = auth().currentUser;
    if (!user) {
      log.debug('No user logged in. Skipping corporate sync.');
      return;
    }

    if (!corporateState) return;

    try {
      const userRef = firestore().collection('users').doc(user.uid);
      await userRef.set({ corporate: corporateState }, { merge: true });
      log.debug('Corporate state synced to Firestore');

      // Note: Updating the aggregate `/companies/{domain}` document should ideally be done
      // via Cloud Functions to prevent users from spamming the aggregate score.
      // But for the MVP demo, we can just write it.
      if (corporateState.isLinked && corporateState.companyDomain) {
        const companyRef = firestore().collection('companies').doc(corporateState.companyDomain);
        await companyRef.set(
          {
            name: corporateState.linkedCompany,
            // In a real app, this would be FieldValue.increment() triggered from a Cloud Function.
            // Since we are mocking it for the demo, we won't aggressively write here,
            // we just keep the record of the company existence.
            lastActive: firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }
    } catch (error) {
      log.error('Failed to sync corporate state', error);
    }
  }
}

export const firebaseService = FirebaseService.getInstance();
