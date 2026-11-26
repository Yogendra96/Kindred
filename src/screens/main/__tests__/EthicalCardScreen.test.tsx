import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EthicalCardScreen } from '../EthicalCardScreen';
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

describe('EthicalCardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderScreen = () =>
    render(
      <ToastProvider>
        <NavigationContainer>
          <EthicalCardScreen />
        </NavigationContainer>
      </ToastProvider>,
    );

  it('renders My Card view with user profile, impact badges, and QR code section', () => {
    const { getByText, getByTestId } = renderScreen();

    expect(getByText('Ethical Card & Bio')).toBeTruthy();
    expect(getByText('Alex Rivers')).toBeTruthy();
    expect(getByText('Founder & Climate Architect')).toBeTruthy();
    expect(getByText(/Kindred Ecosystem Labs/)).toBeTruthy();
    expect(getByText('4.5 yrs')).toBeTruthy();
    expect(getByText('2,480 kg')).toBeTruthy();
    expect(getByText('490')).toBeTruthy();
    expect(getByText('Scan to Exchange & Save Contact')).toBeTruthy();

    expect(getByTestId('download-vcard-btn')).toBeTruthy();
    expect(getByTestId('share-card-btn')).toBeTruthy();
    expect(getByTestId('copy-bio-url-btn')).toBeTruthy();
  });

  it('triggers vCard download and link copy on My Card tab', () => {
    const { getByTestId } = renderScreen();

    const vcardBtn = getByTestId('download-vcard-btn');
    fireEvent.press(vcardBtn);

    const copyBtn = getByTestId('copy-bio-url-btn');
    fireEvent.press(copyBtn);
  });

  it('switches to Scan QR tab and connects via simulation', () => {
    const { getByTestId, getByText } = renderScreen();

    // Switch to Scan QR
    fireEvent.press(getByTestId('tab-scan-qr'));
    expect(getByText('Align Kindred QR Code')).toBeTruthy();

    // Press simulated scan for Dr. Elena Rostova
    const simElena = getByTestId('simulate-scan-elena');
    fireEvent.press(simElena);

    // Should open Connection Modal
    expect(getByText('Ethical Connection Made!')).toBeTruthy();
    expect(getByText(/\+25 Kindred Karma Awarded/)).toBeTruthy();

    // Close modal
    fireEvent.press(getByTestId('close-connection-modal-btn'));
  });

  it('allows manual lookup and connect on Scan QR tab', () => {
    const { getByTestId, getByText, getAllByText } = renderScreen();

    fireEvent.press(getByTestId('tab-scan-qr'));

    const input = getByTestId('manual-username-input');
    fireEvent.changeText(input, 'priya-sharma');

    const connectBtn = getByTestId('manual-connect-btn');
    fireEvent.press(connectBtn);

    expect(getByText('Ethical Connection Made!')).toBeTruthy();
    expect(getAllByText(/Priya Sharma/).length).toBeGreaterThan(0);
  });

  it('switches to Rolodex tab and filters saved contacts by search query', () => {
    const { getByTestId, getByText, queryByText } = renderScreen();

    fireEvent.press(getByTestId('tab-rolodex'));

    expect(getByText('Dr. Elena Rostova')).toBeTruthy();
    expect(getByText('Priya Sharma')).toBeTruthy();
    expect(getByText('Chef Marcus Vance')).toBeTruthy();

    // Search query filter
    const searchInput = getByTestId('rolodex-search-input');
    fireEvent.changeText(searchInput, 'Mycologist');

    expect(getByText('Dr. Elena Rostova')).toBeTruthy();
    expect(queryByText('Chef Marcus Vance')).toBeNull();
  });

  it('switches to Edit Bio tab and adds a new custom link', () => {
    const { getByTestId, getByText } = renderScreen();

    fireEvent.press(getByTestId('tab-edit-bio'));

    expect(getByText('Profile Information')).toBeTruthy();

    // Change Name
    const nameInput = getByTestId('input-edit-name');
    fireEvent.changeText(nameInput, 'Alex Rivers (Climate Fellow)');

    // Open Add Link Modal
    const addLinkBtn = getByTestId('btn-open-add-link-modal');
    fireEvent.press(addLinkBtn);

    expect(getByText('Add Bio Link')).toBeTruthy();

    // Fill link fields
    fireEvent.changeText(getByTestId('input-new-link-title'), 'My Green Patents Portfolio');
    fireEvent.changeText(
      getByTestId('input-new-link-url'),
      'https://patents.google.com/?inventor=Alex+Rivers',
    );

    fireEvent.press(getByTestId('submit-add-link-btn'));

    // Save profile
    const saveProfileBtn = getByTestId('save-profile-btn');
    fireEvent.press(saveProfileBtn);

    // Returns to My Card with updated name
    expect(getByText('Alex Rivers (Climate Fellow)')).toBeTruthy();
  });
});
