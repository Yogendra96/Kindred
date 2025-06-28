const { device, expect, element, by } = require('detox');

describe('Kindred App E2E Tests', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('App Launch and Navigation', () => {
    it('should launch app successfully', async () => {
      await testHelpers.waitForVisible('app-container');
      await customExpect.screenToBeVisible('home');
    });

    it('should navigate between tabs', async () => {
      // Test navigation to each tab
      await testHelpers.navigateToScreen('carbon');
      await customExpect.screenToBeVisible('carbon');

      await testHelpers.navigateToScreen('social');
      await customExpect.screenToBeVisible('social');

      await testHelpers.navigateToScreen('achievements');
      await customExpect.screenToBeVisible('achievements');

      await testHelpers.navigateToScreen('profile');
      await customExpect.screenToBeVisible('profile');

      await testHelpers.navigateToScreen('home');
      await customExpect.screenToBeVisible('home');
    });

    it('should handle deep links', async () => {
      await testHelpers.openDeepLink('kindred://carbon/add');
      await testHelpers.waitForVisible('add-activity-screen');
    });
  });

  describe('Authentication Flow', () => {
    it('should show login screen for unauthenticated user', async () => {
      // Assuming user is not logged in
      await testHelpers.waitForVisible('login-screen');
      await expect(element(by.id('email-input'))).toBeVisible();
      await expect(element(by.id('password-input'))).toBeVisible();
      await expect(element(by.id('login-button'))).toBeVisible();
    });

    it('should login successfully with valid credentials', async () => {
      await testHelpers.login('test@example.com', 'password123');
      await customExpect.screenToBeVisible('home');
    });

    it('should show error for invalid credentials', async () => {
      await element(by.id('email-input')).typeText('invalid@example.com');
      await element(by.id('password-input')).typeText('wrongpassword');
      await element(by.id('login-button')).tap();

      await testHelpers.waitForVisible('error-message');
      await customExpect.errorToBeDisplayed('Invalid credentials');
    });

    it('should logout successfully', async () => {
      await testHelpers.login();
      await testHelpers.logout();
      await customExpect.screenToBeVisible('login');
    });
  });

  describe('Carbon Tracking', () => {
    beforeEach(async () => {
      await testHelpers.login();
      await testHelpers.navigateToScreen('carbon');
    });

    it('should display carbon dashboard', async () => {
      await expect(element(by.id('carbon-summary'))).toBeVisible();
      await expect(element(by.id('recent-activities'))).toBeVisible();
      await expect(element(by.id('add-activity-button'))).toBeVisible();
    });

    it('should add new carbon activity', async () => {
      await testHelpers.addCarbonActivity('walking', '5');

      // Verify activity was added
      await testHelpers.waitForVisible('activity-item');
      await customExpect.elementToContainText('activity-item', 'walking');
    });

    it('should calculate carbon footprint correctly', async () => {
      const initialFootprint = await testHelpers.getElementText(
        'carbon-footprint',
      );

      await testHelpers.addCarbonActivity('driving', '10');

      const newFootprint = await testHelpers.getElementText('carbon-footprint');
      expect(parseFloat(newFootprint)).toBeGreaterThan(
        parseFloat(initialFootprint),
      );
    });

    it('should filter activities by type', async () => {
      await element(by.id('filter-button')).tap();
      await element(by.text('Walking')).tap();
      await element(by.id('apply-filter')).tap();

      await testHelpers.waitForLoadingToComplete();
      // Verify only walking activities are shown
      await customExpect.listToHaveItems('activities-list');
    });

    it('should show activity details', async () => {
      await element(by.id('activity-item')).atIndex(0).tap();
      await testHelpers.waitForVisible('activity-details-screen');

      await expect(element(by.id('activity-type'))).toBeVisible();
      await expect(element(by.id('activity-distance'))).toBeVisible();
      await expect(element(by.id('carbon-saved'))).toBeVisible();
    });
  });

  describe('Social Features', () => {
    beforeEach(async () => {
      await testHelpers.login();
      await testHelpers.navigateToScreen('social');
    });

    it('should display social feed', async () => {
      await expect(element(by.id('social-feed'))).toBeVisible();
      await expect(element(by.id('leaderboard-section'))).toBeVisible();
    });

    it('should show leaderboard', async () => {
      await element(by.id('leaderboard-tab')).tap();
      await testHelpers.waitForVisible('leaderboard-list');

      await customExpect.listToHaveItems('leaderboard-list');
    });

    it('should share achievement', async () => {
      await element(by.id('share-button')).atIndex(0).tap();
      await testHelpers.waitForVisible('share-modal');

      await element(by.id('share-to-social')).tap();
      await customExpect.successToBeDisplayed('Shared successfully');
    });

    it('should add friend', async () => {
      await element(by.id('add-friend-button')).tap();
      await testHelpers.waitForVisible('add-friend-modal');

      await element(by.id('friend-email-input')).typeText('friend@example.com');
      await element(by.id('send-invite-button')).tap();

      await customExpect.successToBeDisplayed('Invite sent');
    });
  });

  describe('Achievements System', () => {
    beforeEach(async () => {
      await testHelpers.login();
      await testHelpers.navigateToScreen('achievements');
    });

    it('should display achievements list', async () => {
      await expect(element(by.id('achievements-list'))).toBeVisible();
      await customExpect.listToHaveItems('achievements-list');
    });

    it('should show achievement details', async () => {
      await element(by.id('achievement-item')).atIndex(0).tap();
      await testHelpers.waitForVisible('achievement-details-modal');

      await expect(element(by.id('achievement-title'))).toBeVisible();
      await expect(element(by.id('achievement-description'))).toBeVisible();
      await expect(element(by.id('achievement-progress'))).toBeVisible();
    });

    it('should filter achievements by category', async () => {
      await element(by.id('filter-dropdown')).tap();
      await element(by.text('Carbon Reduction')).tap();

      await testHelpers.waitForLoadingToComplete();
      await customExpect.listToHaveItems('achievements-list');
    });

    it('should show badge collection', async () => {
      await element(by.id('badges-tab')).tap();
      await testHelpers.waitForVisible('badges-grid');

      await expect(element(by.id('earned-badges'))).toBeVisible();
      await expect(element(by.id('available-badges'))).toBeVisible();
    });
  });

  describe('Barcode Scanner', () => {
    beforeEach(async () => {
      await testHelpers.login();
      await testHelpers.grantPermissions();
    });

    it('should open barcode scanner', async () => {
      await testHelpers.navigateToScreen('carbon');
      await element(by.id('scan-product-button')).tap();

      await testHelpers.waitForVisible('barcode-scanner-screen');
      await expect(element(by.id('camera-view'))).toBeVisible();
      await expect(element(by.id('scan-overlay'))).toBeVisible();
    });

    it('should handle camera permissions', async () => {
      await testHelpers.navigateToScreen('carbon');
      await element(by.id('scan-product-button')).tap();

      // Should show permission request or scanner
      const scannerVisible = await testHelpers.elementExists(
        'barcode-scanner-screen',
      );
      const permissionVisible = await testHelpers.elementExists(
        'camera-permission-modal',
      );

      expect(scannerVisible || permissionVisible).toBe(true);
    });
  });

  describe('Performance and Reliability', () => {
    beforeEach(async () => {
      await testHelpers.login();
    });

    it('should handle app backgrounding', async () => {
      await testHelpers.sendToBackground(3000);
      await customExpect.screenToBeVisible('home');
    });

    it('should handle network connectivity issues', async () => {
      await testHelpers.setNetworkCondition('none');
      await testHelpers.navigateToScreen('carbon');

      // Should show offline indicator or cached data
      const offlineVisible = await testHelpers.elementExists(
        'offline-indicator',
      );
      const cachedDataVisible = await testHelpers.elementExists(
        'carbon-summary',
      );

      expect(offlineVisible || cachedDataVisible).toBe(true);

      // Restore network
      await testHelpers.setNetworkCondition('fast');
    });

    it('should handle device orientation changes', async () => {
      await testHelpers.setOrientation('landscape');
      await customExpect.screenToBeVisible('home');

      await testHelpers.setOrientation('portrait');
      await customExpect.screenToBeVisible('home');
    });

    it('should handle memory warnings', async () => {
      await testHelpers.triggerMemoryWarning();
      // App should remain stable
      await customExpect.screenToBeVisible('home');
    });

    it('should measure app launch performance', async () => {
      const launchTime = await testHelpers.measurePerformance(async () => {
        await device.launchApp({ newInstance: true });
        await testHelpers.waitForVisible('app-container');
      }, 'App Launch');

      // App should launch within 5 seconds
      expect(launchTime).toBeLessThan(5000);
    });

    it('should measure navigation performance', async () => {
      const navigationTime = await testHelpers.measurePerformance(async () => {
        await testHelpers.navigateToScreen('carbon');
      }, 'Navigation to Carbon Screen');

      // Navigation should be fast
      expect(navigationTime).toBeLessThan(1000);
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      await testHelpers.enableAccessibility();
      await testHelpers.login();
    });

    it('should have accessible navigation', async () => {
      await expect(element(by.id('home-tab'))).toHaveAccessibilityLabel('Home');
      await expect(element(by.id('carbon-tab'))).toHaveAccessibilityLabel(
        'Carbon Tracking',
      );
      await expect(element(by.id('social-tab'))).toHaveAccessibilityLabel(
        'Social',
      );
      await expect(element(by.id('achievements-tab'))).toHaveAccessibilityLabel(
        'Achievements',
      );
      await expect(element(by.id('profile-tab'))).toHaveAccessibilityLabel(
        'Profile',
      );
    });

    it('should have accessible buttons', async () => {
      await testHelpers.navigateToScreen('carbon');
      await expect(
        element(by.id('add-activity-button')),
      ).toHaveAccessibilityLabel('Add new activity');
    });

    it('should support voice over navigation', async () => {
      // Test that elements are properly labeled for screen readers
      await testHelpers.navigateToScreen('carbon');

      const elements = [
        'carbon-summary',
        'recent-activities',
        'add-activity-button',
      ];

      for (const elementId of elements) {
        await expect(element(by.id(elementId))).toHaveAccessibilityLabel();
      }
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await testHelpers.login();
    });

    it('should handle API errors gracefully', async () => {
      // Simulate API error by disconnecting network
      await testHelpers.setNetworkCondition('none');

      await testHelpers.navigateToScreen('carbon');
      await element(by.id('add-activity-button')).tap();

      // Should show error message
      await testHelpers.waitForVisible('error-message');
      await customExpect.errorToBeDisplayed('Network error');

      // Restore network
      await testHelpers.setNetworkCondition('fast');
    });

    it('should handle app crashes gracefully', async () => {
      // Trigger a controlled crash scenario
      await testHelpers.shakeDevice();

      // App should recover or show error boundary
      const errorBoundaryVisible = await testHelpers.elementExists(
        'error-boundary',
      );
      const appStillRunning = await testHelpers.elementExists('app-container');

      expect(errorBoundaryVisible || appStillRunning).toBe(true);
    });
  });

  describe('Data Persistence', () => {
    beforeEach(async () => {
      await testHelpers.login();
    });

    it('should persist data across app restarts', async () => {
      // Add an activity
      await testHelpers.addCarbonActivity('walking', '3');

      // Restart app
      await device.terminateApp();
      await device.launchApp();
      await testHelpers.login();

      // Check if activity is still there
      await testHelpers.navigateToScreen('carbon');
      await testHelpers.waitForVisible('activity-item');
      await customExpect.elementToContainText('activity-item', 'walking');
    });

    it('should sync data when network is restored', async () => {
      // Add activity while offline
      await testHelpers.setNetworkCondition('none');
      await testHelpers.addCarbonActivity('cycling', '10');

      // Restore network
      await testHelpers.setNetworkCondition('fast');

      // Should sync data
      await testHelpers.waitForLoadingToComplete();
      await customExpect.successToBeDisplayed('Data synced');
    });
  });

  describe('Push Notifications', () => {
    beforeEach(async () => {
      await testHelpers.login();
      await testHelpers.grantPermissions();
    });

    it('should handle push notifications', async () => {
      await testHelpers.sendPushNotification({
        trigger: {
          type: 'push',
        },
        title: 'Achievement Unlocked!',
        body: 'You earned a new badge',
        payload: {
          screen: 'achievements',
          achievementId: '123',
        },
      });

      // Should navigate to achievements screen
      await testHelpers.waitForVisible('achievements-screen');
    });
  });

  describe('Biometric Authentication', () => {
    beforeEach(async () => {
      await testHelpers.grantPermissions();
    });

    it('should handle biometric authentication', async () => {
      // Enable biometric login
      await testHelpers.login();
      await testHelpers.navigateToScreen('profile');
      await element(by.id('biometric-toggle')).tap();

      // Logout and try biometric login
      await testHelpers.logout();
      await element(by.id('biometric-login-button')).tap();

      await testHelpers.simulateBiometricAuth(true);
      await customExpect.screenToBeVisible('home');
    });

    it('should handle failed biometric authentication', async () => {
      await element(by.id('biometric-login-button')).tap();
      await testHelpers.simulateBiometricAuth(false);

      await customExpect.errorToBeDisplayed('Biometric authentication failed');
      await customExpect.screenToBeVisible('login');
    });
  });
});
