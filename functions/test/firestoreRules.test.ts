import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import * as fs from 'fs';
import * as path from 'path';
import { describe, it, before, after, beforeEach, afterEach } from 'node:test';

describe('Firestore Security Rules Hardening Suite', () => {
  let testEnv: RulesTestEnvironment;
  const PROJECT_ID = 'demo-kindred-rules-test';

  before(async () => {
    // Read the project's root firestore.rules
    const rulesPath = path.resolve(__dirname, '../../firestore.rules');
    const rules = fs.readFileSync(rulesPath, 'utf8');

    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules,
        host: '127.0.0.1',
        port: 8080,
      },
    });
  });

  after(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  afterEach(async () => {
    if (testEnv) {
      await testEnv.clearFirestore();
    }
  });

  // =========================================================================
  // 1. User Creation Security
  // =========================================================================
  describe('User Document Creation (/users/{uid})', () => {
    it('allows a user to initialize their own profile with zero wallet and unverified status', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const userRef = alice.firestore().collection('users').doc('alice');

      await assertSucceeds(
        userRef.set({
          uid: 'alice',
          displayName: 'Alice Green',
          email: 'alice@example.com',
          wallet: {
            balanceCents: 0,
            totalEarnedCents: 0,
          },
          corporate: {
            isVerified: false,
          },
          sdg: {
            esg: {
              total: 0,
            },
          },
        }),
      );
    });

    it('denies unauthenticated visitors from creating a user profile', async () => {
      const unauthed = testEnv.unauthenticatedContext();
      const userRef = unauthed.firestore().collection('users').doc('alice');

      await assertFails(
        userRef.set({
          displayName: 'Hacker',
        }),
      );
    });

    it('denies Alice from creating a profile under Bob ID', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const userRef = alice.firestore().collection('users').doc('bob');

      await assertFails(
        userRef.set({
          displayName: 'Bob Impersonator',
        }),
      );
    });

    it('TAMPER BLOCKED: denies Alice from initializing non-zero wallet balanceCents', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const userRef = alice.firestore().collection('users').doc('alice');

      await assertFails(
        userRef.set({
          uid: 'alice',
          displayName: 'Alice',
          wallet: {
            balanceCents: 100000, // Attempt to inject $1,000
            totalEarnedCents: 0,
          },
        }),
      );
    });

    it('TAMPER BLOCKED: denies Alice from initializing corporate.isVerified == true', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const userRef = alice.firestore().collection('users').doc('alice');

      await assertFails(
        userRef.set({
          uid: 'alice',
          displayName: 'Alice',
          corporate: {
            isVerified: true, // Attempt to bypass employer verification
            linkedCompany: 'Google',
          },
        }),
      );
    });

    it('TAMPER BLOCKED: denies Alice from initializing non-zero ESG total score', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const userRef = alice.firestore().collection('users').doc('alice');

      await assertFails(
        userRef.set({
          uid: 'alice',
          displayName: 'Alice',
          sdg: {
            esg: {
              total: 9999, // Attempt to forge ESG score
            },
          },
        }),
      );
    });
  });

  // =========================================================================
  // 2. User Update Security
  // =========================================================================
  describe('User Document Updates (/users/{uid})', () => {
    beforeEach(async () => {
      // Seed Alice's existing profile using admin security context
      await testEnv.withSecurityRulesDisabled(async context => {
        await context
          .firestore()
          .collection('users')
          .doc('alice')
          .set({
            uid: 'alice',
            displayName: 'Alice Original',
            bio: 'Eco Enthusiast',
            wallet: {
              balanceCents: 500,
              totalEarnedCents: 1000,
            },
            corporate: {
              isVerified: false,
              linkedCompany: 'Acme Corp',
            },
            sdg: {
              esg: {
                total: 250,
              },
            },
          });
      });
    });

    it('allows Alice to update non-financial fields like bio and displayName', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const userRef = alice.firestore().collection('users').doc('alice');

      await assertSucceeds(
        userRef.update({
          displayName: 'Alice Updated',
          bio: 'Updated bio statement',
        }),
      );
    });

    it('denies Bob from updating Alice profile', async () => {
      const bob = testEnv.authenticatedContext('bob');
      const userRef = bob.firestore().collection('users').doc('alice');

      await assertFails(
        userRef.update({
          displayName: 'Hacked by Bob',
        }),
      );
    });

    it('TAMPER BLOCKED: denies client update to wallet field', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const userRef = alice.firestore().collection('users').doc('alice');

      await assertFails(
        userRef.update({
          'wallet.balanceCents': 999999,
        }),
      );
    });

    it('TAMPER BLOCKED: denies client update to corporate field', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const userRef = alice.firestore().collection('users').doc('alice');

      await assertFails(
        userRef.update({
          'corporate.isVerified': true,
        }),
      );
    });

    it('TAMPER BLOCKED: denies client update to sdg field', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const userRef = alice.firestore().collection('users').doc('alice');

      await assertFails(
        userRef.update({
          'sdg.esg.total': 50000,
        }),
      );
    });

    it('denies client from deleting their user document', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const userRef = alice.firestore().collection('users').doc('alice');

      await assertFails(userRef.delete());
    });
  });

  // =========================================================================
  // 3. Transactions Subcollection (/users/{uid}/transactions/{txId})
  // =========================================================================
  describe('Transactions Subcollection (Financial Integrity)', () => {
    it('TAMPER BLOCKED: strictly denies clients from creating transactions directly', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const txRef = alice
        .firestore()
        .collection('users')
        .doc('alice')
        .collection('transactions')
        .doc('fake_tx');

      await assertFails(
        txRef.set({
          amountCents: 10000,
          type: 'EARN',
          description: 'Forged Reward',
          createdAt: Date.now(),
        }),
      );
    });

    it('allows Alice to read her own transaction records created by server', async () => {
      // Seed a server-created transaction
      await testEnv.withSecurityRulesDisabled(async context => {
        await context
          .firestore()
          .collection('users')
          .doc('alice')
          .collection('transactions')
          .doc('tx_123')
          .set({
            amountCents: 200,
            type: 'EARN',
            description: 'Ad Reward',
          });
      });

      const alice = testEnv.authenticatedContext('alice');
      const txRef = alice
        .firestore()
        .collection('users')
        .doc('alice')
        .collection('transactions')
        .doc('tx_123');

      await assertSucceeds(txRef.get());
    });

    it('denies Bob from reading Alice transactions', async () => {
      await testEnv.withSecurityRulesDisabled(async context => {
        await context
          .firestore()
          .collection('users')
          .doc('alice')
          .collection('transactions')
          .doc('tx_123')
          .set({
            amountCents: 200,
            type: 'EARN',
          });
      });

      const bob = testEnv.authenticatedContext('bob');
      const txRef = bob
        .firestore()
        .collection('users')
        .doc('alice')
        .collection('transactions')
        .doc('tx_123');

      await assertFails(txRef.get());
    });
  });

  // =========================================================================
  // 4. Activity History Subcollection (/users/{uid}/history/{historyId})
  // =========================================================================
  describe('Activity History Logging', () => {
    it('allows Alice to log a valid activity event within bounded points', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const histRef = alice
        .firestore()
        .collection('users')
        .doc('alice')
        .collection('history')
        .doc('act_1');

      await assertSucceeds(
        histRef.set({
          title: 'Walked to Work',
          type: 'TRANSPORT',
          points: 50,
          description: 'Saved 1.2kg CO2',
        }),
      );
    });

    it('DOS/EXPLOIT BLOCKED: denies activity log with exorbitant points (>10000)', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const histRef = alice
        .firestore()
        .collection('users')
        .doc('alice')
        .collection('history')
        .doc('act_exploit');

      await assertFails(
        histRef.set({
          title: 'Fake Huge Activity',
          type: 'TRANSPORT',
          points: 500000, // Exceeds rule bound (10000)
        }),
      );
    });

    it('denies client from updating or deleting past activity logs', async () => {
      await testEnv.withSecurityRulesDisabled(async context => {
        await context
          .firestore()
          .collection('users')
          .doc('alice')
          .collection('history')
          .doc('act_1')
          .set({
            title: 'Seeded Activity',
            points: 10,
          });
      });

      const alice = testEnv.authenticatedContext('alice');
      const histRef = alice
        .firestore()
        .collection('users')
        .doc('alice')
        .collection('history')
        .doc('act_1');

      await assertFails(histRef.update({ points: 20 }));
      await assertFails(histRef.delete());
    });
  });

  // =========================================================================
  // 5. Server-Only & System Collections
  // =========================================================================
  describe('Protected & Server-Only Collections', () => {
    it('strictly denies client read and write to internal _rateLimits', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const rateLimitRef = alice
        .firestore()
        .collection('users')
        .doc('alice')
        .collection('_rateLimits')
        .doc('payoutToUPI');

      await assertFails(rateLimitRef.get());
      await assertFails(rateLimitRef.set({ count: 0 }));
    });

    it('strictly denies client read and write to email verifications collection', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const verifRef = alice.firestore().collection('verifications').doc('alice');

      await assertFails(verifRef.get());
      await assertFails(verifRef.set({ code: '123456' }));
    });

    it('allows authenticated users to read corporate leaderboard but denies writes', async () => {
      await testEnv.withSecurityRulesDisabled(async context => {
        await context.firestore().collection('companies').doc('google.com').set({
          name: 'Google LLC',
          totalCO2SavedKg: 15400,
        });
      });

      const alice = testEnv.authenticatedContext('alice');
      const companyRef = alice.firestore().collection('companies').doc('google.com');

      await assertSucceeds(companyRef.get());
      await assertFails(companyRef.update({ totalCO2SavedKg: 999999 }));
    });

    it('denies access to arbitrary unmapped root collections', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const rootRef = alice.firestore().collection('admin_secrets').doc('config');

      await assertFails(rootRef.get());
      await assertFails(rootRef.set({ secret: 'hacked' }));
    });
  });
});
