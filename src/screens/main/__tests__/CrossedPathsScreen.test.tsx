import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CrossedPathsScreen } from '../CrossedPathsScreen';
import { NavigationContainer } from '@react-navigation/native';
import { ToastProvider } from '../../../contexts/ToastContext';

// Mock SpaceBackground
jest.mock('../../../components/common/SpaceBackground', () => ({
  SpaceBackground: ({ children }: any) => <>{children}</>,
}));

// Mock GlassCard
jest.mock('../../../components/common/GlassCard', () => ({
  GlassCard: ({ children, style }: any) => <div style={style}>{children}</div>,
}));

// Mock navigation
const mockGoBack = jest.fn();
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      goBack: mockGoBack,
      navigate: mockNavigate,
    }),
  };
});

describe('CrossedPathsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderScreen = () =>
    render(
      <ToastProvider>
        <NavigationContainer>
          <CrossedPathsScreen />
        </NavigationContainer>
      </ToastProvider>,
    );

  it('renders header, radar status, and initial crossed-path encounters', () => {
    const { getByText, getByTestId } = renderScreen();

    expect(getByText('Kindred Beacon')).toBeTruthy();
    expect(getByText('Crossed paths & fuzzed proximity radar')).toBeTruthy();
    expect(getByText(/Maya Chen/)).toBeTruthy();
    expect(getByText(/Near Mission District/)).toBeTruthy();
    expect(getByText(/Liam O’Connor/)).toBeTruthy();

    expect(getByTestId('toggle-ghost-mode-btn')).toBeTruthy();
    expect(getByTestId('open-beacon-safety-btn')).toBeTruthy();
  });

  it('toggles Ghost Mode on and off', () => {
    const { getByTestId, getByText, queryByText } = renderScreen();

    const ghostBtn = getByTestId('toggle-ghost-mode-btn');

    // Turn ON
    fireEvent.press(ghostBtn);
    expect(getByText('Ghost: ON')).toBeTruthy();
    expect(getByText('Ghost Mode Active')).toBeTruthy();

    // Turn OFF
    fireEvent.press(ghostBtn);
    expect(getByText('Radar: ON')).toBeTruthy();
    expect(queryByText('Ghost Mode Active')).toBeNull();
  });

  it('filters encounters by filter chips', () => {
    const { getByTestId, getByText, queryByText } = renderScreen();

    // Filter to Mutual Waves
    fireEvent.press(getByTestId('filter-tab-mutual'));
    expect(getByText(/Liam O’Connor/)).toBeTruthy();
    expect(queryByText(/Maya Chen/)).toBeNull();

    // Filter to Frequent (3x+)
    fireEvent.press(getByTestId('filter-tab-frequent'));
    expect(getByText(/Maya Chen/)).toBeTruthy();
    expect(queryByText(/Liam O’Connor/)).toBeNull();

    // Reset to All
    fireEvent.press(getByTestId('filter-tab-all'));
    expect(getByText(/Maya Chen/)).toBeTruthy();
    expect(getByText(/Liam O’Connor/)).toBeTruthy();
  });

  it('sends a wave and opens mutual chat modal', () => {
    const { getByTestId, getByText } = renderScreen();

    const waveBtnMaya = getByTestId('wave-btn-enc-maya-chen');
    fireEvent.press(waveBtnMaya);

    // Mutual wave button clicked
    fireEvent.press(waveBtnMaya);
    expect(getByText(/Mutual Wave with Maya Chen/)).toBeTruthy();
    expect(getByText('Start Conscious Chat')).toBeTruthy();

    fireEvent.press(getByTestId('close-chat-modal-btn'));
  });

  it('opens and closes anti-stalking safety guidelines modal', () => {
    const { getByTestId, getByText, queryByText } = renderScreen();

    fireEvent.press(getByTestId('open-beacon-safety-btn'));

    expect(getByText('Anti-Stalking Privacy Shield')).toBeTruthy();
    expect(getByText(/300m–500m Geohash Fuzzing/)).toBeTruthy();
    expect(getByText(/Automatic Safe Zones/)).toBeTruthy();

    fireEvent.press(getByTestId('close-safety-modal-btn'));
    expect(queryByText('Anti-Stalking Privacy Shield')).toBeNull();
  });

  it('hides an encounter card when X is clicked', () => {
    const { getByTestId, queryByTestId, queryByText, getByText } = renderScreen();

    expect(getByText('Solar Mobility & Cargo Bike Founder')).toBeTruthy();
    expect(getByTestId('hide-encounter-enc-kai-tanaka')).toBeTruthy();

    fireEvent.press(getByTestId('hide-encounter-enc-kai-tanaka'));

    // The encounter card is removed from visible timeline
    expect(queryByTestId('hide-encounter-enc-kai-tanaka')).toBeNull();
    expect(queryByText('Solar Mobility & Cargo Bike Founder')).toBeNull();
    expect(queryByText(/Hidden encounter with Kai Tanaka/)).toBeTruthy();
  });
});
