import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { VeggregatorScreen } from '../VeggregatorScreen';
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

describe('VeggregatorScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderScreen = () =>
    render(
      <ToastProvider>
        <NavigationContainer>
          <VeggregatorScreen />
        </NavigationContainer>
      </ToastProvider>,
    );

  it('renders header, title, and default plant-based products', () => {
    const { getByText, getByTestId } = renderScreen();

    expect(getByText('Veggregator')).toBeTruthy();
    expect(getByText('100% Plant-Based')).toBeTruthy();
    expect(getByTestId('veggregator-search-input')).toBeTruthy();
    expect(getByText('Crunchy Peanut Caramel & Nougat Bar')).toBeTruthy();
  });

  it('filters products by search input', () => {
    const { getByTestId, getByText, queryByText } = renderScreen();

    const searchInput = getByTestId('veggregator-search-input');
    fireEvent.changeText(searchInput, 'Snickers');

    expect(getByText('Crunchy Peanut Caramel & Nougat Bar')).toBeTruthy();
    expect(queryByText('Cave-Aged Black Truffle Cashew Camembert')).toBeNull();
  });

  it('filters products by category chip', () => {
    const { getByTestId, getByText, queryByText } = renderScreen();

    const cheeseChip = getByTestId('category-filter-Pantry & Cheese');
    fireEvent.press(cheeseChip);

    expect(getByText('Cave-Aged Black Truffle Cashew Camembert')).toBeTruthy();
    expect(queryByText('Crunchy Peanut Caramel & Nougat Bar')).toBeNull();
  });

  it('opens product detail modal and displays impact and ingredients', () => {
    const { getByTestId, getByText, getAllByText } = renderScreen();

    const productCard = getByTestId('product-card-vp-snickers-bar');
    fireEvent.press(productCard);

    expect(getByText('Ingredients & Quality')).toBeTruthy();
    expect(getByText(/Single-Origin 60% Cocoa/)).toBeTruthy();
    expect(getAllByText(/Saves 1.2 cow-days of milk demand/).length).toBeGreaterThan(0);
  });

  it('adds item to basket and opens cart modal with total and impact', () => {
    const { getByTestId, getByText } = renderScreen();

    const addBtn = getByTestId('buy-btn-vp-snickers-bar');
    fireEvent.press(addBtn);

    // Floating cart should appear
    const floatingCart = getByTestId('floating-cart-bar');
    expect(floatingCart).toBeTruthy();

    fireEvent.press(floatingCart);

    // Cart modal visible
    expect(getByText(/Kindred Basket \(1\)/)).toBeTruthy();
    expect(getByText('Checkout With Kindred Cash')).toBeTruthy();
    expect(getByText(/Reduces ~0\.[89] kg greenhouse CO₂/)).toBeTruthy();
  });

  it('handles cart checkout successfully', () => {
    const { getByTestId, queryByTestId } = renderScreen();

    // Add item
    fireEvent.press(getByTestId('buy-btn-vp-snickers-bar'));

    // Open cart
    fireEvent.press(getByTestId('open-cart-btn'));

    // Checkout
    const checkoutBtn = getByTestId('checkout-btn');
    fireEvent.press(checkoutBtn);

    // Cart should be emptied
    expect(queryByTestId('floating-cart-bar')).toBeNull();
  });

  it('switches to Brand Hub tab and shows verified brand storefronts', () => {
    const { getByTestId, getByText } = renderScreen();

    const brandsTab = getByTestId('tab-brands');
    fireEvent.press(brandsTab);

    expect(getByText('Verified Ethical Storefronts')).toBeTruthy();
    expect(getByText('Naked Cocoa & Confections')).toBeTruthy();
    expect(getByText('Flora Botanical Ferments')).toBeTruthy();
    expect(getByText('Kindred Ethics Score: 99/100')).toBeTruthy();
  });

  it('creates and publishes a new verified brand storefront in Sell tab', async () => {
    const { getByTestId, getByText } = renderScreen();

    const sellTab = getByTestId('tab-sell');
    fireEvent.press(sellTab);

    expect(getByText('Open Your Vegan Storefront')).toBeTruthy();

    // Fill form
    fireEvent.changeText(getByTestId('seller-brand-name-input'), 'Pure Peanut Nirvana');
    fireEvent.changeText(getByTestId('seller-product-name-input'), 'Crunchy Dry Fruit Cluster Bar');
    fireEvent.changeText(getByTestId('seller-price-input'), '3.95');

    // Agree to cruelty-free pledge
    fireEvent.press(getByTestId('seller-pledge-toggle'));

    // Submit
    fireEvent.press(getByTestId('submit-listing-btn'));

    // Should switch back to shop and show new product
    await waitFor(() => {
      expect(getByText('Pure Peanut Nirvana')).toBeTruthy();
      expect(getByText('Crunchy Dry Fruit Cluster Bar')).toBeTruthy();
    });
  });
});
