import { store } from '../index';
import { RootState } from '../index';

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
      loading: false,
      error: null,
    });
  });

  it('should dispatch actions correctly', () => {
    // Test auth actions
    store.dispatch({ type: 'auth/loginStart' });
    expect(store.getState().auth.loading).toBe(true);

    // Test user actions
    store.dispatch({
      type: 'user/updateProfile',
      payload: { name: 'Test User' }
    });
    expect(store.getState().user.profile.name).toBe('Test User');

    // Test carbon actions
    store.dispatch({
      type: 'carbon/updateFootprint',
      payload: { transportation: 5 }
    });
    expect(store.getState().carbon.footprint.transportation).toBe(5);
  });
});