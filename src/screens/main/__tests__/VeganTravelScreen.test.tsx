import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Share } from 'react-native';
import { VeganTravelScreen } from '../VeganTravelScreen';
import { COUNTRY_VEGAN_GUIDES } from '../../../data/countryVeganData';
import { ToastProvider } from '../../../contexts/ToastContext';

// Wrap with ToastProvider for useToast hook
const renderWithProviders = (ui: React.ReactElement) => {
  return render(<ToastProvider>{ui}</ToastProvider>);
};

describe('VeganTravelScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });
  });

  it('renders the country list with initial destinations', () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(<VeganTravelScreen />);

    expect(getByText('Vegan World Travel')).toBeTruthy();
    expect(
      getByPlaceholderText('Search destination, dish, or trap (e.g. Japan, Dashi)'),
    ).toBeTruthy();
    expect(getByText('Japan')).toBeTruthy();
    expect(getByText('Thailand')).toBeTruthy();
    expect(getByText('India')).toBeTruthy();
    expect(getByText('Italy')).toBeTruthy();
  });

  it('filters countries when searching by query', () => {
    const { getByPlaceholderText, getByText, queryByText } = renderWithProviders(
      <VeganTravelScreen />,
    );
    const searchInput = getByPlaceholderText(
      'Search destination, dish, or trap (e.g. Japan, Dashi)',
    );

    // Search for Japan
    fireEvent.changeText(searchInput, 'Japan');
    expect(getByText('Japan')).toBeTruthy();
    expect(queryByText('Thailand')).toBeNull();

    // Search for a specific trap ingredient like "Dashi"
    fireEvent.changeText(searchInput, 'Dashi');
    expect(getByText('Japan')).toBeTruthy();
    expect(queryByText('India')).toBeNull();

    // Search for non-existent item
    fireEvent.changeText(searchInput, 'NonExistentPlace123');
    expect(getByText('No Destinations Found')).toBeTruthy();
  });

  it('filters countries when switching region chips', () => {
    const { getByText, queryByText } = renderWithProviders(<VeganTravelScreen />);

    // Tap on Europe
    fireEvent.press(getByText('Europe'));
    expect(getByText('Italy')).toBeTruthy();
    expect(getByText('France')).toBeTruthy();
    expect(getByText('Germany')).toBeTruthy();
    expect(queryByText('Japan')).toBeNull();
    expect(queryByText('Thailand')).toBeNull();

    // Tap on Americas
    fireEvent.press(getByText('Americas'));
    expect(getByText('Mexico')).toBeTruthy();
    expect(queryByText('Italy')).toBeNull();

    // Return to All
    fireEvent.press(getByText('All'));
    expect(getByText('Japan')).toBeTruthy();
    expect(getByText('Italy')).toBeTruthy();
  });

  it('navigates to country detail view and switches sub-tabs', async () => {
    const { getByText, queryByText } = renderWithProviders(<VeganTravelScreen />);

    // Select Thailand
    fireEvent.press(getByText('Thailand'));

    // Should now be in Thailand detail view
    expect(getByText('Show Dining Card to Waiter')).toBeTruthy();
    expect(getByText('Region: Asia')).toBeTruthy();

    // Default tab is Safe Dishes
    expect(getByText(/Safe Dishes/)).toBeTruthy();
    expect(getByText('Mango Sticky Rice')).toBeTruthy();

    // Switch to Traps tab
    fireEvent.press(getByText(/Traps/));
    expect(getByText('Fish Sauce')).toBeTruthy();
    expect(getByText('Shrimp Paste')).toBeTruthy();

    // Switch to Phrases tab
    fireEvent.press(getByText('Phrases'));
    expect(getByText('Essential Dining Phrases')).toBeTruthy();
    expect(getByText('Is this Jay (vegan)?')).toBeTruthy();
    expect(getByText('Convenience & Survival Hacks')).toBeTruthy();
  });

  it('opens, shares, and closes the Waiter Dining Flashcard modal', async () => {
    const { getByText, queryByText } = renderWithProviders(<VeganTravelScreen />);

    // Select Japan
    fireEvent.press(getByText('Japan'));

    // Tap the CTA to show flashcard
    fireEvent.press(getByText('Show Dining Card to Waiter'));

    // Modal should be visible with Japanese dining script
    expect(getByText('Japan Dining Card')).toBeTruthy();
    expect(getByText('Hold up screen to show waiter or chef')).toBeTruthy();
    expect(getByText(/私は肉、魚、魚介類/)).toBeTruthy();
    expect(getByText('Pronunciation (How to say it):')).toBeTruthy();
    expect(getByText('English Translation:')).toBeTruthy();

    // Tap Share Card button
    fireEvent.press(getByText('Share Card'));
    expect(Share.share).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('Vegan Dining Card — Japan'),
      }),
    );

    // Tap Done to close modal
    fireEvent.press(getByText('Done'));
  });

  it('switches to Vlogs tab, views video guide card, and earns travel karma', async () => {
    const { getByText, getByTestId, queryByTestId } = renderWithProviders(<VeganTravelScreen />);

    // Select Japan
    fireEvent.press(getByText('Japan'));

    // Switch to Vlogs sub-tab
    const vlogsTab = getByTestId('tab-vlogs');
    fireEvent.press(vlogsTab);

    expect(getByText('Local Street Food Vlogs & Hacks')).toBeTruthy();
    expect(getByText(/How to Order 100% Vegan Street Food in Tokyo/)).toBeTruthy();

    // Tap on vlog card
    const vlogCard = getByTestId('vlog-card-vlog-jp-1');
    fireEvent.press(vlogCard);

    // Modal should open
    expect(getByText('Streaming via Open Piped / Invidious API')).toBeTruthy();
    expect(getByText('💡 Secret Street Food Hack:')).toBeTruthy();

    // Mark as watched
    const karmaBtn = getByTestId('complete-vlog-karma-btn');
    fireEvent.press(karmaBtn);

    // Modal should close
    expect(queryByTestId('complete-vlog-karma-btn')).toBeNull();
  });
});
