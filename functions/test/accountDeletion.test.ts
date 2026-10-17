process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.GCLOUD_PROJECT = 'demo-kindred-deletion-test';

import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import * as fs from 'fs';
import * as path from 'path';
import { describe, it, before, after, afterEach } from 'node:test';
import assert from 'node:assert';
import { purgeUserData } from '../src/accountDeletion';

describe('Account Deletion & Data Cascade Suite', () => {
  let testEnv: RulesTestEnvironment;
  const PROJECT_ID = 'demo-kindred-deletion-test';

  before(async () => {
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

  it('cascades deletion of user doc, subcollections, and verification requests', async () => {
    const uid = 'user_to_delete_123';

    // Seed data in Firestore under admin bypass
    await testEnv.withSecurityRulesDisabled(async adminContext => {
      const db = adminContext.firestore();

      // Seed root user doc
      await db
        .collection('users')
        .doc(uid)
        .set({
          email: 'testdelete@example.com',
          displayName: 'Delete Me',
          wallet: { balanceCents: 500, totalEarnedCents: 1000 },
        });

      // Seed subcollection activities
      await db.collection('users').doc(uid).collection('activities').doc('act_1').set({
        type: 'walking',
        points: 50,
      });

      // Seed subcollection transactions
      await db.collection('users').doc(uid).collection('transactions').doc('tx_1').set({
        type: 'EARN',
        amountCents: 100,
      });

      // Seed email verification record
      await db.collection('emailVerifications').doc('verif_1').set({
        userId: uid,
        email: 'testdelete@example.com',
        code: '123456',
      });
    });

    // Execute cascade purge with the test Firestore context
    await testEnv.withSecurityRulesDisabled(async adminContext => {
      await purgeUserData(uid, adminContext.firestore());
    });

    // Verify everything is deleted
    await testEnv.withSecurityRulesDisabled(async adminContext => {
      const db = adminContext.firestore();

      const userDoc = await db.collection('users').doc(uid).get();
      const userExists = typeof userDoc.exists === 'function' ? userDoc.exists() : userDoc.exists;
      assert.strictEqual(userExists, false, 'User root doc should be deleted');

      const actDoc = await db
        .collection('users')
        .doc(uid)
        .collection('activities')
        .doc('act_1')
        .get();
      const actExists = typeof actDoc.exists === 'function' ? actDoc.exists() : actDoc.exists;
      assert.strictEqual(actExists, false, 'Activity subcollection doc should be deleted');

      const txDoc = await db
        .collection('users')
        .doc(uid)
        .collection('transactions')
        .doc('tx_1')
        .get();
      const txExists = typeof txDoc.exists === 'function' ? txDoc.exists() : txDoc.exists;
      assert.strictEqual(txExists, false, 'Transaction subcollection doc should be deleted');

      const verifSnap = await db.collection('emailVerifications').where('userId', '==', uid).get();
      assert.strictEqual(verifSnap.empty, true, 'Email verification records should be deleted');
    });
  });
});
