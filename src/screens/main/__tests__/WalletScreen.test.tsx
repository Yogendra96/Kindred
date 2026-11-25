import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert, Share } from 'react-native';
import WalletScreen from '../WalletScreen';
import { ToastProvider } from '../../../contexts/ToastContext';

jest.mock('../../../hooks/useFirebaseData', () => ({
  useWallet: jest.fn(() => ({ balanceCents: 500, totalEarnedCents: 1500 })),
  useTransactions: jest.fn(() => [
    { id: 'tx-1', type: 'EARN', description: 'Green Commute Eco-Bonus', amountCents: 50 },
  ]),
  usePayoutToUPI: jest.fn(() => ({
    payout: jest.fn().mockResolvedValue({ success: true, referenceId: 'REF123456' }),
    isLoading: false,
  })),
  useRedeemVoucher: jest.fn(() => ({
    redeemVoucher: jest.fn().mockResolvedValue({ success: true, voucherCode: 'AMZ-8899' }),
    isLoading: false,
  })),
}));

const mockNavigation: any = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

const renderWithProviders = (ui: React.ReactElement) => {
  return render(<ToastProvider>{ui}</ToastProvider>);
};

describe('WalletScreen & Animal Rescue Hub', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert');
    jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as any);
  });

  it('renders wallet screen with balance and default brand rewards', () => {
    const { getByText, getAllByText } = renderWithProviders(
      <WalletScreen navigation={mockNavigation} route={{ key: 'Wallet', name: 'Wallet' } as any} />,
    );

    expect(getByText('Impact Wallet')).toBeTruthy();
    expect(getByText('Available Kindred Cash')).toBeTruthy();
    expect(getAllByText('$5.00').length).toBeGreaterThanOrEqual(1);
    expect(getByText('Instant UPI Cashout')).toBeTruthy();
    expect(getByText('Digital Vouchers')).toBeTruthy();
    expect(getByText('Brand Rewards')).toBeTruthy();
    expect(getByText('🐾 Animal Rescues')).toBeTruthy();
    expect(getByText('Sustainable Partners')).toBeTruthy();
    expect(getByText('Patagonia')).toBeTruthy();
  });

  it('switches to Animal Rescues tab and displays rescue hero banner', () => {
    const { getByText } = renderWithProviders(
      <WalletScreen navigation={mockNavigation} route={{ key: 'Wallet', name: 'Wallet' } as any} />,
    );

    fireEvent.press(getByText('🐾 Animal Rescues'));

    expect(getByText('Feed & Heal Rescue Animals')).toBeTruthy();
    expect(getByText('100% Direct-to-Bowl')).toBeTruthy();
    expect(getByText('Verified Rescue Sanctuaries')).toBeTruthy();
    expect(getByText('City Paws Animal Rescue')).toBeTruthy();
    expect(getByText('WildLife Haven Sanctuary')).toBeTruthy();
    expect(getByText('Ocean Guardian Marine Clinic')).toBeTruthy();
    expect(getByText('Sweet Meadows Farm Sanctuary')).toBeTruthy();
    expect(getByText('Live Rescue Meal Deliveries')).toBeTruthy();
  });

  it('filters rescue sanctuaries by category', () => {
    const { getByText, queryByText } = renderWithProviders(
      <WalletScreen navigation={mockNavigation} route={{ key: 'Wallet', name: 'Wallet' } as any} />,
    );

    fireEvent.press(getByText('🐾 Animal Rescues'));

    // Filter by Wildlife
    fireEvent.press(getByText('Wildlife'));
    expect(getByText('WildLife Haven Sanctuary')).toBeTruthy();
    expect(queryByText('City Paws Animal Rescue')).toBeNull();
    expect(queryByText('Sweet Meadows Farm Sanctuary')).toBeNull();

    // Filter by Marine
    fireEvent.press(getByText('Marine'));
    expect(getByText('Ocean Guardian Marine Clinic')).toBeTruthy();
    expect(queryByText('WildLife Haven Sanctuary')).toBeNull();

    // Reset to All
    fireEvent.press(getByText('🐾 All Rescues'));
    expect(getByText('City Paws Animal Rescue')).toBeTruthy();
    expect(getByText('WildLife Haven Sanctuary')).toBeTruthy();
    expect(getByText('Ocean Guardian Marine Clinic')).toBeTruthy();
    expect(getByText('Sweet Meadows Farm Sanctuary')).toBeTruthy();
  });

  it('switches impact tier and updates selected tier details', () => {
    const { getByText, getAllByText } = renderWithProviders(
      <WalletScreen navigation={mockNavigation} route={{ key: 'Wallet', name: 'Wallet' } as any} />,
    );

    fireEvent.press(getByText('🐾 Animal Rescues'));

    // Select Vaccine ($2.50) tier on the first shelter
    const vaccineTiers = getAllByText('$2.50');
    expect(vaccineTiers.length).toBeGreaterThan(0);
    fireEvent.press(vaccineTiers[0]);

    // Should display tier impact highlight
    expect(getByText(/Vaccine & Deworming Dose/)).toBeTruthy();
  });

  it('executes donation, triggers confirmation alert, and displays celebratory certificate modal', async () => {
    const { getByText, getAllByText, queryByText } = renderWithProviders(
      <WalletScreen navigation={mockNavigation} route={{ key: 'Wallet', name: 'Wallet' } as any} />,
    );

    fireEvent.press(getByText('🐾 Animal Rescues'));

    // Tap "Feed Rescue Animal" on City Paws
    const feedButtons = getAllByText(/Feed Rescue Animal/);
    fireEvent.press(feedButtons[0]);

    expect(Alert.alert).toHaveBeenCalled();
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const buttons = alertCall[2];
    const confirmButton = buttons.find((b: any) => b.text && b.text.includes('Feed with'));

    // Confirm donation
    act(() => {
      confirmButton.onPress();
    });

    // Modal should now be visible
    await waitFor(() => {
      expect(getByText('Rescue Meal Funded! 🐾')).toBeTruthy();
    });

    expect(getByText('Official Kindred Animal Protection Certificate')).toBeTruthy();
    expect(getByText('✓ 100% Direct-to-Bowl Verified')).toBeTruthy();
    expect(getByText('Share Impact Certificate')).toBeTruthy();

    // Test sharing certificate
    fireEvent.press(getByText('Share Impact Certificate'));
    expect(Share.share).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('@KindredApp! 🐾'),
      }),
    );

    // Dismiss modal
    fireEvent.press(getByText('Done'));
    expect(queryByText('Rescue Meal Funded! 🐾')).toBeNull();
  });

  it('supports opening directly to donate tab via initialTab route param', () => {
    const { getByText } = renderWithProviders(
      <WalletScreen
        navigation={mockNavigation}
        route={
          {
            key: 'Wallet',
            name: 'Wallet',
            params: { initialTab: 'donate' },
          } as any
        }
      />,
    );

    // Should immediately show the Rescue Hub without clicking the tab
    expect(getByText('Feed & Heal Rescue Animals')).toBeTruthy();
    expect(getByText('City Paws Animal Rescue')).toBeTruthy();
  });

  it('navigates to RescueSwipe from the swipe to save banner', () => {
    const { getByText, getByTestId } = renderWithProviders(
      <WalletScreen navigation={mockNavigation} route={{ key: 'Wallet', name: 'Wallet' } as any} />,
    );

    fireEvent.press(getByText('🐾 Animal Rescues'));
    const banner = getByTestId('wallet-swipe-to-save-banner');
    expect(banner).toBeTruthy();
    fireEvent.press(banner);
    expect(mockNavigation.navigate).toHaveBeenCalledWith('RescueSwipe');
  });
});
