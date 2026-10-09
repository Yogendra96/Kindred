import { useAppStore } from '../useAppStore';

describe('Preferences Zustand Store (useAppStore.ts)', () => {
  beforeEach(() => {
    useAppStore.setState({
      preferences: {
        theme: 'dark',
        notifications: true,
        locationSharing: true,
        pushEnabled: true,
        emailEnabled: true,
        weeklyReports: true,
        consentAccepted: false,
      },
    });
  });

  it('should have default preferences after reset', () => {
    useAppStore.getState().resetPreferences();
    const state = useAppStore.getState();
    expect(state.preferences.theme).toBe('dark');
    expect(state.preferences.notifications).toBe(true);
    expect(state.preferences.consentAccepted).toBe(false);
  });

  it('should update partial preferences', () => {
    useAppStore.getState().updatePreferences({ theme: 'light', notifications: false });

    const state = useAppStore.getState();
    expect(state.preferences.theme).toBe('light');
    expect(state.preferences.notifications).toBe(false);
    expect(state.preferences.locationSharing).toBe(true);
  });
});
