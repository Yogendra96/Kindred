import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { VeganStaysScreen } from '../VeganStaysScreen';
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

describe('VeganStaysScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderScreen = () =>
    render(
      <ToastProvider>
        <NavigationContainer>
          <VeganStaysScreen />
        </NavigationContainer>
      </ToastProvider>,
    );

  it('renders header, title, and initial vegan homestays and cottages', () => {
    const { getByText, getByTestId } = renderScreen();

    expect(getByText('Vegan Stays')).toBeTruthy();
    expect(getByText('OSM diet:vegan=only')).toBeTruthy();
    expect(getByTestId('vegan-stays-search-input')).toBeTruthy();
    expect(getByText('Willow Brook Sanctuary Guest Cabin')).toBeTruthy();
    expect(getByText('Arashiyama Bamboo Vegan Machiya')).toBeTruthy();
  });

  it('filters stays by search input query', () => {
    const { getByTestId, getByText, queryByText } = renderScreen();

    const searchInput = getByTestId('vegan-stays-search-input');
    fireEvent.changeText(searchInput, 'Catskill');

    expect(getByText('Willow Brook Sanctuary Guest Cabin')).toBeTruthy();
    expect(queryByText('Arashiyama Bamboo Vegan Machiya')).toBeNull();
  });

  it('filters stays by stay type chip', () => {
    const { getByTestId, getByText, queryByText } = renderScreen();

    const villaChip = getByTestId('stay-type-filter-Permaculture Villa');
    fireEvent.press(villaChip);

    expect(getByText('Podere Melograno Olive Grove Retreat')).toBeTruthy();
    expect(queryByText('Willow Brook Sanctuary Guest Cabin')).toBeNull();
  });

  it('opens stay detail modal and shows animal impact and amenities', () => {
    const { getByTestId, getByText, getAllByText } = renderScreen();

    const stayCard = getByTestId('stay-card-stay-catskill-cottage');
    fireEvent.press(stayCard);

    expect(getByText(/🐾 Animal & Sanctuary Impact/)).toBeTruthy();
    expect(getByText(/100% Plant-Based Kitchen/)).toBeTruthy();
    expect(getAllByText(/Each night booked feeds 4 rescued cows/i).length).toBeGreaterThan(0);
  });

  it('opens reservation checkout modal, applies karma points discount, and confirms', () => {
    const { getByTestId, getByText, queryByTestId } = renderScreen();

    const bookBtn = getByTestId('book-btn-stay-catskill-cottage');
    fireEvent.press(bookBtn);

    expect(getByText('Confirm Sanctuary Reservation')).toBeTruthy();

    // Toggle Kindred Karma discount
    const discountToggle = getByTestId('karma-discount-toggle');
    fireEvent.press(discountToggle);

    expect(getByText('-$25')).toBeTruthy();

    // Confirm booking
    const confirmBtn = getByTestId('confirm-reservation-btn');
    fireEvent.press(confirmBtn);

    // Modal should close
    expect(queryByTestId('confirm-reservation-btn')).toBeNull();
  });

  it('allows ethical hosts and sanctuaries to publish a new verified stay', async () => {
    const { getByTestId, getByText } = renderScreen();

    // Open host modal
    const hostBtn = getByTestId('open-host-modal-btn');
    fireEvent.press(hostBtn);

    expect(getByText('List Your Vegan Stay')).toBeTruthy();

    // Fill form
    fireEvent.changeText(
      getByTestId('host-stay-name-input'),
      'Blue Ridge Mountain Sanctuary Cabin',
    );
    fireEvent.changeText(getByTestId('host-location-input'), 'Asheville, NC, USA');
    fireEvent.changeText(getByTestId('host-price-input'), '115');

    // Agree to pledge
    fireEvent.press(getByTestId('host-pledge-toggle'));

    // Submit
    fireEvent.press(getByTestId('submit-host-listing-btn'));

    // Newly published stay should appear in list
    await waitFor(() => {
      expect(getByText('Blue Ridge Mountain Sanctuary Cabin')).toBeTruthy();
    });
  });
});
