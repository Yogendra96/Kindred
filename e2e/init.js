const { device, expect, element, by, waitFor } = require('detox');

// Global test setup
beforeAll(async () => {
  await device.launchApp({
    permissions: {
      location: 'always',
      camera: 'YES',
      notifications: 'YES',
      photos: 'YES',
    },
    newInstance: true,
  });
});

beforeEach(async () => {
  await device.reloadReactNative();
});

// Global test helpers
global.testHelpers = {
  // Wait for element to be visible
  waitForVisible: async (testID, timeout = 10000) => {
    await waitFor(element(by.id(testID)))
      .toBeVisible()
      .withTimeout(timeout);
  },

  // Wait for element to exist
  waitForExist: async (testID, timeout = 10000) => {
    await waitFor(element(by.id(testID)))
      .toExist()
      .withTimeout(timeout);
  },

  // Scroll to element
  scrollToElement: async (
    scrollViewTestID,
    elementTestID,
    direction = 'down',
  ) => {
    await waitFor(element(by.id(elementTestID)))
      .toBeVisible()
      .whileElement(by.id(scrollViewTestID))
      .scroll(200, direction);
  },

  // Take screenshot
  takeScreenshot: async name => {
    await device.takeScreenshot(name);
  },

  // Login helper
  login: async (email = 'test@example.com', password = 'password123') => {
    await element(by.id('email-input')).typeText(email);
    await element(by.id('password-input')).typeText(password);
    await element(by.id('login-button')).tap();
    await testHelpers.waitForVisible('home-screen', 15000);
  },

  // Logout helper
  logout: async () => {
    await element(by.id('profile-tab')).tap();
    await testHelpers.waitForVisible('profile-screen');
    await element(by.id('logout-button')).tap();
    await element(by.text('Logout')).tap(); // Confirm logout
    await testHelpers.waitForVisible('login-screen');
  },

  // Add carbon activity helper
  addCarbonActivity: async (type = 'walking', distance = '5') => {
    await element(by.id('carbon-tab')).tap();
    await testHelpers.waitForVisible('carbon-screen');
    await element(by.id('add-activity-button')).tap();
    await testHelpers.waitForVisible('add-activity-screen');

    await element(by.id('activity-type-picker')).tap();
    await element(by.text(type)).tap();
    await element(by.id('distance-input')).typeText(distance);
    await element(by.id('save-activity-button')).tap();

    await testHelpers.waitForVisible('carbon-screen');
  },

  // Navigate to screen
  navigateToScreen: async screenName => {
    const tabMap = {
      home: 'home-tab',
      carbon: 'carbon-tab',
      social: 'social-tab',
      achievements: 'achievements-tab',
      profile: 'profile-tab',
    };

    const tabId = tabMap[screenName];
    if (tabId) {
      await element(by.id(tabId)).tap();
      await testHelpers.waitForVisible(`${screenName}-screen`);
    }
  },

  // Swipe gestures
  swipeLeft: async testID => {
    await element(by.id(testID)).swipe('left');
  },

  swipeRight: async testID => {
    await element(by.id(testID)).swipe('right');
  },

  swipeUp: async testID => {
    await element(by.id(testID)).swipe('up');
  },

  swipeDown: async testID => {
    await element(by.id(testID)).swipe('down');
  },

  // Device actions
  sendToBackground: async (duration = 2000) => {
    await device.sendToHome();
    await new Promise(resolve => setTimeout(resolve, duration));
    await device.launchApp({ newInstance: false });
  },

  // Network conditions
  setNetworkCondition: async condition => {
    // condition: 'none', 'slow', 'fast'
    if (device.getPlatform() === 'ios') {
      await device.setURLBlacklist([]);
      if (condition === 'none') {
        await device.setURLBlacklist(['.*']);
      }
    }
  },

  // Permissions
  grantPermissions: async () => {
    if (device.getPlatform() === 'ios') {
      await device.launchApp({
        permissions: {
          location: 'always',
          camera: 'YES',
          notifications: 'YES',
          photos: 'YES',
        },
      });
    }
  },

  // Wait for loading to complete
  waitForLoadingToComplete: async (timeout = 10000) => {
    await waitFor(element(by.id('loading-indicator')))
      .not.toBeVisible()
      .withTimeout(timeout);
  },

  // Check if element exists
  elementExists: async testID => {
    try {
      await expect(element(by.id(testID))).toExist();
      return true;
    } catch (error) {
      return false;
    }
  },

  // Get element text
  getElementText: async testID => {
    const attributes = await element(by.id(testID)).getAttributes();
    return attributes.text || attributes.label;
  },

  // Performance helpers
  measurePerformance: async (actionFn, actionName) => {
    const startTime = Date.now();
    await actionFn();
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`Performance: ${actionName} took ${duration}ms`);
    return duration;
  },

  // Memory helpers
  triggerMemoryWarning: async () => {
    if (device.getPlatform() === 'ios') {
      await device.sendUserNotification({
        trigger: {
          type: 'push',
        },
        title: 'Memory Warning',
        body: 'Simulating memory warning',
      });
    }
  },

  // Accessibility helpers
  enableAccessibility: async () => {
    if (device.getPlatform() === 'ios') {
      await device.launchApp({
        launchArgs: {
          accessibility: 'YES',
        },
      });
    }
  },

  // Deep link testing
  openDeepLink: async url => {
    await device.openURL({ url });
  },

  // Push notification testing
  sendPushNotification: async payload => {
    await device.sendUserNotification(payload);
  },

  // Biometric authentication simulation
  simulateBiometricAuth: async (success = true) => {
    if (device.getPlatform() === 'ios') {
      if (success) {
        await device.setBiometricEnrollment(true);
        await device.matchFace();
      } else {
        await device.unmatchFace();
      }
    }
  },

  // Shake gesture
  shakeDevice: async () => {
    await device.shake();
  },

  // Orientation changes
  setOrientation: async orientation => {
    // orientation: 'portrait' | 'landscape'
    await device.setOrientation(orientation);
  },

  // Location simulation
  setLocation: async (lat, lon) => {
    await device.setLocation(lat, lon);
  },
};

// Global assertions
global.customExpect = {
  // Check if screen is visible
  screenToBeVisible: async screenName => {
    await expect(element(by.id(`${screenName}-screen`))).toBeVisible();
  },

  // Check if loading is complete
  loadingToBeComplete: async () => {
    await expect(element(by.id('loading-indicator'))).not.toBeVisible();
  },

  // Check if error is displayed
  errorToBeDisplayed: async errorMessage => {
    await expect(element(by.text(errorMessage))).toBeVisible();
  },

  // Check if success message is displayed
  successToBeDisplayed: async successMessage => {
    await expect(element(by.text(successMessage))).toBeVisible();
  },

  // Check if list has items
  listToHaveItems: async (listTestID, minItems = 1) => {
    const attributes = await element(by.id(listTestID)).getAttributes();
    const itemCount = attributes.elements ? attributes.elements.length : 0;
    expect(itemCount).toBeGreaterThanOrEqual(minItems);
  },

  // Check if element has text
  elementToHaveText: async (testID, expectedText) => {
    await expect(element(by.id(testID))).toHaveText(expectedText);
  },

  // Check if element contains text
  elementToContainText: async (testID, expectedText) => {
    const actualText = await testHelpers.getElementText(testID);
    expect(actualText).toContain(expectedText);
  },
};

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Test artifacts cleanup
afterEach(async () => {
  // Take screenshot on test failure
  if (
    jasmine.currentTest &&
    jasmine.currentTest.failedExpectations.length > 0
  ) {
    const testName = jasmine.currentTest.fullName.replace(/\s+/g, '_');
    await testHelpers.takeScreenshot(`failed_${testName}`);
  }
});

afterAll(async () => {
  // Cleanup after all tests
  await device.terminateApp();
});
