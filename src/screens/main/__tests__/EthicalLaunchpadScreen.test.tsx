import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { EthicalLaunchpadScreen } from '../EthicalLaunchpadScreen';
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

describe('EthicalLaunchpadScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderScreen = () =>
    render(
      <ToastProvider>
        <NavigationContainer>
          <EthicalLaunchpadScreen />
        </NavigationContainer>
      </ToastProvider>,
    );

  it('renders header, title, and initial seed innovations', () => {
    const { getByText, getByTestId } = renderScreen();

    expect(getByText('Ethical Launchpad')).toBeTruthy();
    expect(getByText('Product Hunt for Plant Tech')).toBeTruthy();
    expect(getByTestId('launchpad-search-input')).toBeTruthy();
    expect(getByText(/BioMelt: Precision Fermented Stretch Mozzarella/)).toBeTruthy();
    expect(getByText(/MycoStrides: Pure Mushroom Root Everyday Sneakers/)).toBeTruthy();
  });

  it('filters innovations by search input query', () => {
    const { getByTestId, getByText, queryByText } = renderScreen();

    const searchInput = getByTestId('launchpad-search-input');
    fireEvent.changeText(searchInput, 'BioMelt');

    expect(getByText(/BioMelt: Precision Fermented Stretch Mozzarella/)).toBeTruthy();
    expect(queryByText(/MycoStrides/)).toBeNull();
  });

  it('filters innovations by category chip', () => {
    const { getByTestId, getByText, queryByText } = renderScreen();

    const bioChip = getByTestId('launch-category-Biomaterials');
    fireEvent.press(bioChip);

    expect(getByText(/MycoStrides: Pure Mushroom Root Everyday Sneakers/)).toBeTruthy();
    expect(queryByText(/BioMelt/)).toBeNull();
  });

  it('toggles upvote button and increments upvote count', () => {
    const { getByTestId, getByText } = renderScreen();

    const upvoteBtn = getByTestId('upvote-btn-proj-biomelt-cheese');
    expect(getByText('428')).toBeTruthy();

    fireEvent.press(upvoteBtn);
    expect(getByText('429')).toBeTruthy();
  });

  it('opens backing modal, selects a seed perk, and confirms pledge', () => {
    const { getByTestId, getByText, queryByTestId } = renderScreen();

    const backCta = getByTestId('back-cta-proj-biomelt-cheese');
    fireEvent.press(backCta);

    expect(getByText('The Innovation Story')).toBeTruthy();
    expect(getByText('Select Backer Seed Perk')).toBeTruthy();
    expect(getByText('Kindred Founder Taster Trio')).toBeTruthy();

    // Confirm pledge
    const pledgeBtn = getByTestId('confirm-pledge-btn');
    fireEvent.press(pledgeBtn);

    // Modal should close
    expect(queryByTestId('confirm-pledge-btn')).toBeNull();
  });

  it('submits a new plant innovation to the launchpad', async () => {
    const { getByTestId, getByText } = renderScreen();

    // Open submit modal
    const launchBtn = getByTestId('open-launch-modal-btn');
    fireEvent.press(launchBtn);

    expect(getByText('Launch a Plant Innovation')).toBeTruthy();

    // Fill form
    fireEvent.changeText(getByTestId('innovation-title-input'), 'FloraSilk Protein Fibers');
    fireEvent.changeText(
      getByTestId('innovation-tagline-input'),
      'Spider-silk proteins brewed with sugar cane instead of silkworms',
    );
    fireEvent.changeText(getByTestId('innovation-founder-input'), 'Dr. Anya V.');
    fireEvent.changeText(getByTestId('innovation-goal-input'), '45000');

    // Agree to pledge
    fireEvent.press(getByTestId('innovation-pledge-toggle'));

    // Submit
    fireEvent.press(getByTestId('submit-innovation-btn'));

    // New innovation should appear
    await waitFor(() => {
      expect(getByText('FloraSilk Protein Fibers')).toBeTruthy();
    });
  });
});
