import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SanctuaryAssuranceScreen } from '../SanctuaryAssuranceScreen';
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

describe('SanctuaryAssuranceScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderScreen = () =>
    render(
      <ToastProvider>
        <NavigationContainer>
          <SanctuaryAssuranceScreen />
        </NavigationContainer>
      </ToastProvider>,
    );

  it('renders header, pool reserves, and initial emergency claims', () => {
    const { getByText, getByTestId } = renderScreen();

    expect(getByText('Sanctuary Assurance')).toBeTruthy();
    expect(getByText('Decentralized animal emergency health pool')).toBeTruthy();
    expect(getByText('Community Reserves')).toBeTruthy();
    expect(getByText('Barnaby')).toBeTruthy();
    expect(getByText(/Catskill Animal Sanctuary/)).toBeTruthy();
    expect(getByText('Acute Neonatal Bronchial Pneumonia')).toBeTruthy();

    expect(getByTestId('tab-assurance-claims')).toBeTruthy();
    expect(getByTestId('tab-assurance-underwrite')).toBeTruthy();
    expect(getByTestId('tab-assurance-submit')).toBeTruthy();
  });

  it('opens and closes blockchain audit ledger modal for a claim', () => {
    const { getByTestId, getByText, getAllByText, queryByText } = renderScreen();

    const auditBtn = getByTestId('view-audit-ledger-claim-084-barnaby');
    fireEvent.press(auditBtn);

    expect(getByText('Cryptographic Proof Ledger')).toBeTruthy();
    expect(getByText('SHA-256 Settlement Hash')).toBeTruthy();
    expect(getAllByText(/0x7a9c8f2b/).length).toBeGreaterThan(0);

    fireEvent.press(getByTestId('close-audit-modal-btn'));
    expect(queryByText('Cryptographic Proof Ledger')).toBeNull();
  });

  it('switches to Back the Pool tab and pledges underwriting tier', () => {
    const { getByTestId, getByText, getAllByText } = renderScreen();

    fireEvent.press(getByTestId('tab-assurance-underwrite'));

    expect(getByText('Sanctuary Emergency Underwriting')).toBeTruthy();
    expect(getByText('$25')).toBeTruthy();
    expect(getByText('Diagnostic X-Ray & Blood Panel')).toBeTruthy();

    // Pledge tier
    const pledgeBtn = getByTestId('pledge-btn-tier-guardian-standard');
    fireEvent.press(pledgeBtn);

    // Shows certificate modal
    expect(getByText('Pool Backer Certificate')).toBeTruthy();
    expect(getAllByText(/Sanctuary Shield Backer/).length).toBeGreaterThan(0);

    fireEvent.press(getByTestId('close-pledge-modal-btn'));
  });

  it('submits a new emergency claim in Sanctuary Portal tab', () => {
    const { getByTestId, getByText } = renderScreen();

    fireEvent.press(getByTestId('tab-assurance-submit'));

    expect(getByText('Submit Emergency Surgery Claim')).toBeTruthy();

    fireEvent.changeText(getByTestId('claim-input-animal-name'), 'Penny');
    fireEvent.changeText(getByTestId('claim-input-sanctuary-name'), 'Willow Brook Sanctuary');
    fireEvent.changeText(getByTestId('claim-input-hospital'), 'Hudson Valley Vet Clinic');
    fireEvent.changeText(getByTestId('claim-input-condition'), 'Horn Fracture Repair');
    fireEvent.changeText(getByTestId('claim-input-amount'), '380');

    fireEvent.press(getByTestId('submit-emergency-claim-btn'));

    // Returns to claims tab and shows newly submitted claim
    expect(getByText('Penny')).toBeTruthy();
    expect(getByText('Horn Fracture Repair')).toBeTruthy();
  });
});
