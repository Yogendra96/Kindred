import { store } from '../index';
import { RootState } from '../index';

jest.mock('redux-persist', () => {
  const real = jest.requireActual('redux-persist');
  return {
    ...real,
    persistStore: jest.fn().mockReturnValue({
      pause: jest.fn(),
      persist: jest.fn(),
      purge: jest.fn(),
      flush: jest.fn(),
      dispatch: jest.fn(),
      getState: jest.fn(),
      replaceReducer: jest.fn(),
      subscribe: jest.fn(),
    }),
  };
});

describe('Redux Store', () => {
  it('should have the correct initial state', () => {
    const state = store.getState();

    // Check auth slice
    expect(state.auth).toEqual({
      isAuthenticated: false,
      user: {
        id: null,
        email: null,
        name: null,
      },
      loading: false,
      error: null,
    });

    // Check user slice
    expect(state.user).toEqual({
      profile: {
        id: '',
        name: '',
        email: '',
        avatar: null,
        bio: null,
      },
      preferences: {
        theme: 'light',
        highContrast: false,
        notifications: true,
        locationSharing: true,
      },
      loading: false,
      error: null,
    });

    // Check carbon slice
    expect(state.carbon).toEqual({
      footprint: {
        total: 0,
        transportation: 0,
        food: 0,
        energy: 0,
        waste: 0,
      },
      history: [],
      goals: {
        target: 0,
        deadline: '',
      },
      ecosystem: {
        health: 0.5,
        treeCount: 0,
        biodiversity: 0.3,
        waterClarity: 0.5,
        airQuality: 0.5,
        lastUpdated: expect.any(String),
      },
      loading: {
        footprint: false,
        history: false,
        goals: false,
      },
      error: null,
    });

    // Check settings slice
    expect(state.settings).toMatchObject({
      notifications: expect.any(Object),
      privacy: expect.any(Object),
      app: expect.any(Object),
      security: expect.any(Object),
      isLoading: false,
      error: null,
    });

    // Check analytics slice
    expect(state.analytics).toMatchObject({
      currentSession: null,
      events: [],
      metrics: [],
      isOnline: true,
    });

    // Check location slice
    expect(state.location).toMatchObject({
      currentLocation: null,
      isTracking: false,
      history: [],
    });
  });

  it('should dispatch actions correctly', () => {
    // Test auth actions
    store.dispatch({
      type: 'auth/loginSuccess',
      payload: { id: '1', email: 'test@example.com', name: 'Test User' },
    });
    expect(store.getState().auth.isAuthenticated).toBe(true);

    // Test user actions
    store.dispatch({
      type: 'user/updatePreferences',
      payload: { theme: 'dark' },
    });
    expect(store.getState().user.preferences.theme).toBe('dark');

    // Test carbon actions
    store.dispatch({
      type: 'carbon/updateFootprint',
      payload: { transportation: 10 },
    });
    expect(store.getState().carbon.footprint.transportation).toBe(10);
    expect(store.getState().carbon.footprint.total).toBe(10);

    // Test settings actions
    store.dispatch({
      type: 'settings/updateNotificationSettings',
      payload: { pushEnabled: false },
    });
    expect(store.getState().settings.notifications.pushEnabled).toBe(false);

    // Test analytics actions
    store.dispatch({
      type: 'analytics/startSession',
      payload: { sessionId: 'test-session', timestamp: Date.now() },
    });
    expect(store.getState().analytics.currentSession?.sessionId).toBe(
      'test-session',
    );

    // Test location actions
    store.dispatch({
      type: 'location/setTrackingStatus',
      payload: { foreground: true, background: false },
    });
    expect(store.getState().location.isTracking).toBe(true);
  });
});
