import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { RescueSwipeScreen } from '../RescueSwipeScreen';
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

describe('RescueSwipeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderScreen = () =>
    render(
      <ToastProvider>
        <NavigationContainer>
          <RescueSwipeScreen />
        </NavigationContainer>
      </ToastProvider>,
    );

  it('renders header, impact bar, and top animal bill', () => {
    const { getByText, getByTestId } = renderScreen();

    expect(getByText('Swipe to Save')).toBeTruthy();
    expect(getByText('Direct micro-bills for rescued animals')).toBeTruthy();
    expect(getByText('Bills Funded')).toBeTruthy();
    expect(getByText('Barnaby')).toBeTruthy();
    expect(getByText(/Catskill Animal Sanctuary/)).toBeTruthy();
    expect(getByText('3-Day Pediatric Formula & Warm Blanket')).toBeTruthy();
    expect(getByText('$8.50')).toBeTruthy();
    expect(getByTestId('rescue-swipe-sponsor-btn')).toBeTruthy();
    expect(getByTestId('rescue-swipe-pass-btn')).toBeTruthy();
  });

  it('sponsors bill via right action button and opens celebration modal', () => {
    const { getByTestId, getByText, queryByTestId } = renderScreen();

    const sponsorBtn = getByTestId('rescue-swipe-sponsor-btn');
    fireEvent.press(sponsorBtn);

    // Modal appears
    expect(getByText('🎉 Bill Sourced & Funded!')).toBeTruthy();
    expect(getByText(/You funded 3-Day Pediatric Formula & Warm Blanket/)).toBeTruthy();
    expect(getByText('Keep Saving Lives')).toBeTruthy();

    // Close celebration modal
    const closeBtn = getByTestId('close-celebration-modal-btn');
    fireEvent.press(closeBtn);

    // Now top card should be Sheru
    expect(getByText('Sheru')).toBeTruthy();
    expect(getByText(/Peepal Farm Animal Rescue/)).toBeTruthy();
  });

  it('passes to next animal via left action button', () => {
    const { getByTestId, getByText } = renderScreen();

    expect(getByText('Barnaby')).toBeTruthy();

    const passBtn = getByTestId('rescue-swipe-pass-btn');
    fireEvent.press(passBtn);

    // Moves to Sheru
    expect(getByText('Sheru')).toBeTruthy();
  });

  it('rewinds previous passed animal back into the deck', () => {
    const { getByTestId, getByText } = renderScreen();

    // Pass Barnaby
    fireEvent.press(getByTestId('rescue-swipe-pass-btn'));
    expect(getByText('Sheru')).toBeTruthy();

    // Rewind
    const rewindBtn = getByTestId('rescue-swipe-rewind-btn');
    fireEvent.press(rewindBtn);

    // Restores Barnaby
    expect(getByText('Barnaby')).toBeTruthy();
  });

  it('filters bills by category chip', () => {
    const { getByTestId, getByText } = renderScreen();

    const surgeryFilter = getByTestId('category-filter-emergency-surgery');
    fireEvent.press(surgeryFilter);

    // Should directly show Sheru with emergency fracture bill
    expect(getByText('Sheru')).toBeTruthy();
    expect(getByText('Surgical Fracture Splint & Pain Injections')).toBeTruthy();
  });

  it('sponsors as Super Guardian via star button', () => {
    const { getByTestId, getByText } = renderScreen();

    const superBtn = getByTestId('rescue-swipe-super-btn');
    fireEvent.press(superBtn);

    expect(getByText('⭐ Super Guardian Angel!')).toBeTruthy();
    expect(getByText(/Verified Micro-Grant Certificate/)).toBeTruthy();
  });

  it('opens and closes itemized invoice modal', () => {
    const { getByTestId, getByText, getAllByText, queryByText } = renderScreen();

    const viewInvoiceBtn = getByTestId('view-invoice-btn');
    fireEvent.press(viewInvoiceBtn);

    expect(getByText('Itemized Veterinary Invoice')).toBeTruthy();
    expect(getAllByText('Electrolyte Calf Formula (3 Days)').length).toBeGreaterThan(0);
    expect(getAllByText('Sterilized Feeding Bottle & Teat').length).toBeGreaterThan(0);

    const closeInvoiceBtn = getByTestId('close-invoice-modal-btn');
    fireEvent.press(closeInvoiceBtn);

    expect(queryByText('Itemized Veterinary Invoice')).toBeNull();
  });

  it('shows empty state when all cards are swiped and allows reset', () => {
    const { getByTestId, getByText } = renderScreen();

    // Filter to category with single item (Emergency Surgery has 1 bill)
    fireEvent.press(getByTestId('category-filter-emergency-surgery'));
    expect(getByText('Sheru')).toBeTruthy();

    // Pass the only card in this category
    fireEvent.press(getByTestId('rescue-swipe-pass-btn'));

    // Should show empty state
    expect(getByText('All Urgent Bills Funded! 🎉')).toBeTruthy();
    expect(getByTestId('rescue-swipe-reset-btn')).toBeTruthy();

    // Press reset
    fireEvent.press(getByTestId('rescue-swipe-reset-btn'));
    expect(getByText('Sheru')).toBeTruthy();
  });
});
