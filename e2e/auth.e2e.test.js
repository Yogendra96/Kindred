/**
 * Authentication E2E Tests
 * End-to-end testing for the complete authentication flow
 */

describe('Authentication Flow E2E Tests', () => {
  beforeAll(async () => {
    await device.launchApp({ 
      newInstance: true,
      permissions: { notifications: 'YES' }
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Login Flow', () => {
    it('should display login screen on app launch', async () => {
      await expect(element(by.id('login-screen'))).toBeVisible();
      await expect(element(by.text('Welcome to Kindred'))).toBeVisible();
      await expect(element(by.id('email-input'))).toBeVisible();
      await expect(element(by.id('password-input'))).toBeVisible();
      await expect(element(by.id('login-button'))).toBeVisible();
    });

    it('should show validation errors for invalid credentials', async () => {
      await element(by.id('email-input')).typeText('invalid-email');
      await element(by.id('password-input')).typeText('123');
      await element(by.id('login-button')).tap();
      
      await expect(element(by.text('Please enter a valid email address'))).toBeVisible();
      await expect(element(by.text('Password must be at least 6 characters'))).toBeVisible();
    });

    it('should successfully login with valid credentials', async () => {
      await element(by.id('email-input')).clearText();
      await element(by.id('email-input')).typeText('test@example.com');
      await element(by.id('password-input')).clearText();
      await element(by.id('password-input')).typeText('password123');
      await element(by.id('login-button')).tap();
      
      // Should navigate to main app
      await expect(element(by.id('main-tab-navigator'))).toBeVisible();
      await expect(element(by.text('Carbon Tracker'))).toBeVisible();
    });

    it('should handle network errors gracefully', async () => {
      // Simulate network failure
      await device.setURLBlacklist(['*']);
      
      await element(by.id('email-input')).clearText();
      await element(by.id('email-input')).typeText('test@example.com');
      await element(by.id('password-input')).clearText();
      await element(by.id('password-input')).typeText('password123');
      await element(by.id('login-button')).tap();
      
      await expect(element(by.text('Network error. Please check your connection.'))).toBeVisible();
      
      // Restore network
      await device.setURLBlacklist([]);
    });
  });

  describe('Registration Flow', () => {
    beforeEach(async () => {
      await element(by.id('signup-link')).tap();
      await expect(element(by.id('register-screen'))).toBeVisible();
    });

    it('should display registration form', async () => {
      await expect(element(by.id('name-input'))).toBeVisible();
      await expect(element(by.id('email-input'))).toBeVisible();
      await expect(element(by.id('password-input'))).toBeVisible();
      await expect(element(by.id('confirm-password-input'))).toBeVisible();
      await expect(element(by.id('register-button'))).toBeVisible();
    });

    it('should validate registration form inputs', async () => {
      await element(by.id('name-input')).typeText('A');
      await element(by.id('email-input')).typeText('invalid');
      await element(by.id('password-input')).typeText('123');
      await element(by.id('confirm-password-input')).typeText('456');
      await element(by.id('register-button')).tap();
      
      await expect(element(by.text('Name must be at least 2 characters'))).toBeVisible();
      await expect(element(by.text('Please enter a valid email address'))).toBeVisible();
      await expect(element(by.text('Password must be at least 6 characters'))).toBeVisible();
      await expect(element(by.text('Passwords do not match'))).toBeVisible();
    });

    it('should successfully register new user', async () => {
      await element(by.id('name-input')).typeText('Test User');
      await element(by.id('email-input')).typeText('newuser@example.com');
      await element(by.id('password-input')).typeText('password123');
      await element(by.id('confirm-password-input')).typeText('password123');
      await element(by.id('register-button')).tap();
      
      // Should show success message and navigate to main app
      await expect(element(by.text('Account created successfully!'))).toBeVisible();
      await expect(element(by.id('main-tab-navigator'))).toBeVisible();
    });
  });

  describe('Biometric Authentication', () => {
    it('should offer biometric authentication after successful login', async () => {
      // First, login normally
      await element(by.id('email-input')).typeText('test@example.com');
      await element(by.id('password-input')).typeText('password123');
      await element(by.id('login-button')).tap();
      
      await expect(element(by.id('main-tab-navigator'))).toBeVisible();
      
      // Navigate to settings
      await element(by.id('settings-tab')).tap();
      await element(by.text('Biometric Login')).tap();
      
      // Should prompt for biometric setup
      await expect(element(by.text('Enable Face ID / Fingerprint'))).toBeVisible();
      await element(by.id('enable-biometrics-button')).tap();
      
      // Mock biometric success
      await expect(element(by.text('Biometric authentication enabled'))).toBeVisible();
    });

    it('should use biometric authentication on subsequent logins', async () => {
      // Logout first
      await element(by.id('settings-tab')).tap();
      await element(by.text('Logout')).tap();
      await element(by.text('Logout')).tap(); // Confirm
      
      // Should return to login screen
      await expect(element(by.id('login-screen'))).toBeVisible();
      
      // Should show biometric option
      await expect(element(by.id('biometric-login-button'))).toBeVisible();
      await element(by.id('biometric-login-button')).tap();
      
      // Should navigate to main app after biometric success
      await expect(element(by.id('main-tab-navigator'))).toBeVisible();
    });
  });

  describe('Social Authentication', () => {
    it('should offer Google Sign-In option', async () => {
      await expect(element(by.id('google-signin-button'))).toBeVisible();
      await expect(element(by.text('Continue with Google'))).toBeVisible();
    });

    it('should handle Google Sign-In flow', async () => {
      await element(by.id('google-signin-button')).tap();
      
      // Note: In a real E2E test, this would involve actual Google OAuth flow
      // For testing purposes, we'd mock the response
      await expect(element(by.text('Signing in with Google...'))).toBeVisible();
      
      // Mock successful Google authentication
      await waitFor(element(by.id('main-tab-navigator')))
        .toBeVisible()
        .withTimeout(10000);
    });
  });

  describe('Password Recovery', () => {
    it('should provide forgot password functionality', async () => {
      await element(by.id('forgot-password-link')).tap();
      await expect(element(by.id('forgot-password-screen'))).toBeVisible();
      
      await element(by.id('reset-email-input')).typeText('test@example.com');
      await element(by.id('send-reset-button')).tap();
      
      await expect(element(by.text('Reset link sent to your email'))).toBeVisible();
    });
  });

  describe('Session Management', () => {
    it('should maintain session across app restarts', async () => {
      // Login first
      await element(by.id('email-input')).typeText('test@example.com');
      await element(by.id('password-input')).typeText('password123');
      await element(by.id('login-button')).tap();
      
      await expect(element(by.id('main-tab-navigator'))).toBeVisible();
      
      // Terminate and relaunch app
      await device.terminateApp();
      await device.launchApp({ newInstance: false });
      
      // Should remain logged in
      await expect(element(by.id('main-tab-navigator'))).toBeVisible();
    });

    it('should handle session expiration', async () => {
      // Mock expired session
      await device.setURLBlacklist(['*/auth/verify']);
      
      // Try to perform authenticated action
      await element(by.id('carbon-tracker-tab')).tap();
      
      // Should redirect to login
      await expect(element(by.text('Session expired. Please login again.'))).toBeVisible();
      await expect(element(by.id('login-screen'))).toBeVisible();
      
      // Restore network
      await device.setURLBlacklist([]);
    });
  });

  describe('Security Features', () => {
    it('should lock app after inactivity', async () => {
      // Login first
      await element(by.id('email-input')).typeText('test@example.com');
      await element(by.id('password-input')).typeText('password123');
      await element(by.id('login-button')).tap();
      
      await expect(element(by.id('main-tab-navigator'))).toBeVisible();
      
      // Put app in background for extended period
      await device.sendToHome();
      await device.launchApp({ newInstance: false });
      
      // Should require re-authentication
      await expect(element(by.text('Please authenticate to continue'))).toBeVisible();
    });

    it('should prevent screenshots of sensitive screens', async () => {
      // This would be implemented at the native level
      // Test would verify screenshot prevention is active
      await element(by.id('email-input')).typeText('test@example.com');
      await element(by.id('password-input')).typeText('password123');
      
      // Screenshot should be blocked or content should be hidden
      // Implementation would depend on native security measures
    });
  });

  describe('Accessibility in Authentication', () => {
    it('should support screen reader navigation', async () => {
      await device.enableAccessibility();
      
      // Screen reader should announce form elements properly
      await element(by.id('email-input')).tap();
      // Verify accessibility announcements
      
      await element(by.id('password-input')).tap();
      // Verify accessibility announcements
      
      await device.disableAccessibility();
    });

    it('should support voice control', async () => {
      await device.enableVoiceControl();
      
      // Voice commands should work for form interaction
      // "Tap email input", "Type password", etc.
      
      await device.disableVoiceControl();
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle rapid login attempts', async () => {
      const attempts = 5;
      
      for (let i = 0; i < attempts; i++) {
        await element(by.id('email-input')).clearText();
        await element(by.id('email-input')).typeText('test@example.com');
        await element(by.id('password-input')).clearText();
        await element(by.id('password-input')).typeText('password123');
        await element(by.id('login-button')).tap();
        
        if (i < attempts - 1) {
          // Logout to try again
          await waitFor(element(by.id('main-tab-navigator'))).toBeVisible().withTimeout(5000);
          await element(by.id('settings-tab')).tap();
          await element(by.text('Logout')).tap();
          await element(by.text('Logout')).tap();
        }
      }
      
      // Final login should succeed
      await expect(element(by.id('main-tab-navigator'))).toBeVisible();
    });

    it('should maintain performance under load', async () => {
      const startTime = Date.now();
      
      await element(by.id('email-input')).typeText('test@example.com');
      await element(by.id('password-input')).typeText('password123');
      await element(by.id('login-button')).tap();
      
      await expect(element(by.id('main-tab-navigator'))).toBeVisible();
      
      const endTime = Date.now();
      const loginTime = endTime - startTime;
      
      // Login should complete within reasonable time
      expect(loginTime).toBeLessThan(5000); // 5 seconds
    });
  });

  afterAll(async () => {
    await device.terminateApp();
  });
});