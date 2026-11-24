import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert, Share } from 'react-native';
import VeganMeetScreen from '../VeganMeetScreen';
import { ToastProvider } from '../../../contexts/ToastContext';

const mockNavigation: any = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

const renderWithProviders = (ui: React.ReactElement) => {
  return render(<ToastProvider>{ui}</ToastProvider>);
};

describe('VeganMeetScreen (Dating, Friends & Community Meetups)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert');
    jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as any);
  });

  it('renders Vegan Connect screen with default dating profiles and safety badge', () => {
    const { getByText, getByTestId } = renderWithProviders(
      <VeganMeetScreen
        navigation={mockNavigation}
        route={{ key: 'VeganMeet', name: 'VeganMeet' } as any}
      />,
    );

    expect(getByText('Vegan Connect')).toBeTruthy();
    expect(getByText('Cruelty-Free Dating & Community')).toBeTruthy();
    expect(getByTestId('safety-shield-btn')).toBeTruthy();

    // Default tab is Dating
    expect(getByText('Maya Lin, 26')).toBeTruthy();
    expect(getByText('Julian Vance, 29')).toBeTruthy();
    expect(getByText(/Strictly 100% Vegan/)).toBeTruthy();
  });

  it('switches between Dating, Friends, and Meetups tabs', () => {
    const { getByText, queryByText } = renderWithProviders(
      <VeganMeetScreen
        navigation={mockNavigation}
        route={{ key: 'VeganMeet', name: 'VeganMeet' } as any}
      />,
    );

    // Switch to Friends tab
    fireEvent.press(getByText('Friends'));
    expect(getByText('Aisha Sharma, 27')).toBeTruthy();

    // Switch to Meetups tab
    fireEvent.press(getByText('Meetups'));
    expect(getByText('Local Vegan Community Meetups')).toBeTruthy();
    expect(getByText('Farm Sanctuary Care & Cuddle Volunteer Day')).toBeTruthy();
    expect(getByText('Brooklyn Vegan Street Food Night Crawl')).toBeTruthy();
    expect(queryByText('Maya Lin, 26')).toBeNull();
  });

  it('filters profiles by passion tags', () => {
    const { getByText, getAllByText, queryByText } = renderWithProviders(
      <VeganMeetScreen
        navigation={mockNavigation}
        route={{ key: 'VeganMeet', name: 'VeganMeet' } as any}
      />,
    );

    // Filter by Baking tag
    fireEvent.press(getAllByText('Baking')[0]);
    expect(getByText('Maya Lin, 26')).toBeTruthy();
    expect(queryByText('Julian Vance, 29')).toBeNull();

    // Return to All Passions
    fireEvent.press(getByText('🌱 All Passions'));
    expect(getByText('Julian Vance, 29')).toBeTruthy();
  });

  it('handles Pass action and removes profile from visible feed', () => {
    const { getByText, getByTestId, queryByText } = renderWithProviders(
      <VeganMeetScreen
        navigation={mockNavigation}
        route={{ key: 'VeganMeet', name: 'VeganMeet' } as any}
      />,
    );

    expect(getByText('Maya Lin, 26')).toBeTruthy();

    // Tap Pass on Maya Lin
    const passBtn = getByTestId('pass-profile-1');
    fireEvent.press(passBtn);

    // Maya Lin should be removed
    expect(queryByText('Maya Lin, 26')).toBeNull();
    // Julian Vance should remain
    expect(getByText('Julian Vance, 29')).toBeTruthy();
  });

  it('handles Connect/Like action and opens celebration match modal', () => {
    const { getByText, getByTestId, queryByText } = renderWithProviders(
      <VeganMeetScreen
        navigation={mockNavigation}
        route={{ key: 'VeganMeet', name: 'VeganMeet' } as any}
      />,
    );

    // Like Maya Lin (configured as simulated mutual match)
    const likeBtn = getByTestId('like-profile-1');
    fireEvent.press(likeBtn);

    expect(getByText("It's a Vegan Connection! 💚")).toBeTruthy();
    expect(getByText(/You and Maya Lin share a passion for cruelty-free living!/)).toBeTruthy();

    // Dismiss match modal
    fireEvent.press(getByText('Keep Exploring'));
    expect(queryByText("It's a Vegan Connection! 💚")).toBeNull();
  });

  it('supports Meetup RSVP toggle and sharing', async () => {
    const { getByText, getByTestId, getAllByText } = renderWithProviders(
      <VeganMeetScreen
        navigation={mockNavigation}
        route={{ key: 'VeganMeet', name: 'VeganMeet' } as any}
      />,
    );

    // Switch to Meetups
    fireEvent.press(getByText('Meetups'));

    // Check Farm Sanctuary Meetup RSVP button
    const rsvpBtn = getByTestId('rsvp-meetup-1');
    expect(getAllByText('Join Meetup').length).toBeGreaterThanOrEqual(1);

    // Join meetup
    fireEvent.press(rsvpBtn);
    expect(getAllByText('Attending ✓').length).toBeGreaterThanOrEqual(1);

    // Tap again to leave
    fireEvent.press(rsvpBtn);
    expect(getAllByText('Join Meetup').length).toBeGreaterThanOrEqual(1);
  });

  it('opens and dismisses Community Safety Guidelines modal', () => {
    const { getByTestId, getByText, queryByText } = renderWithProviders(
      <VeganMeetScreen
        navigation={mockNavigation}
        route={{ key: 'VeganMeet', name: 'VeganMeet' } as any}
      />,
    );

    // Tap Safety Shield button in header
    fireEvent.press(getByTestId('safety-shield-btn'));

    expect(getByText('Community Safety Shield')).toBeTruthy();
    expect(getByText('Meet in Public Spaces')).toBeTruthy();
    expect(getByText('Location Privacy Protection')).toBeTruthy();
    expect(getByText('Ethical Respect & Consent')).toBeTruthy();

    // Dismiss
    fireEvent.press(getByText('I Understand & Agree'));
    expect(queryByText('Community Safety Shield')).toBeNull();
  });

  it('reports and blocks a profile instantly', () => {
    const { getByTestId, getByText, queryByText } = renderWithProviders(
      <VeganMeetScreen
        navigation={mockNavigation}
        route={{ key: 'VeganMeet', name: 'VeganMeet' } as any}
      />,
    );

    expect(getByText('Maya Lin, 26')).toBeTruthy();

    // Tap report on Maya Lin
    fireEvent.press(getByTestId('report-profile-1'));

    expect(getByText('Report & Block')).toBeTruthy();
    expect(getByText(/Reason for reporting Maya Lin:/)).toBeTruthy();

    // Select reason & confirm
    fireEvent.press(getByText('Harassment or inappropriate message'));
    fireEvent.press(getByText('Report & Block Instantly'));

    // Modal dismissed and profile blocked
    expect(queryByText('Report & Block')).toBeNull();
    expect(queryByText('Maya Lin, 26')).toBeNull();
  });
});
