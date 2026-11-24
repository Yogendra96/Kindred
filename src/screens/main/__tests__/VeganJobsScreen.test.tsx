import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Share } from 'react-native';
import VeganJobsScreen from '../VeganJobsScreen';
import { ToastProvider } from '../../../contexts/ToastContext';

const mockNavigation: any = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

const renderWithProviders = (ui: React.ReactElement) => {
  return render(<ToastProvider>{ui}</ToastProvider>);
};

describe('VeganJobsScreen (Cruelty-Free Careers)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as any);
  });

  it('renders Cruelty-Free Careers board with initial verified job listings', () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(
      <VeganJobsScreen
        navigation={mockNavigation}
        route={{ key: 'VeganJobs', name: 'VeganJobs' } as any}
      />,
    );

    expect(getByText('Cruelty-Free Careers')).toBeTruthy();
    expect(getByText('Verified 100% Ethical & Plant-Based')).toBeTruthy();
    expect(getByText('Work Where Your Values Matter')).toBeTruthy();
    expect(getByPlaceholderText('Search role, skill, company (e.g. Science, Cashew)')).toBeTruthy();

    expect(getByText('Food Scientist – Plant-Based Dairy Innovation')).toBeTruthy();
    expect(getByText('Silk & Oat Labs')).toBeTruthy();
    expect(getByText('Catskill Sanctuary Foundation')).toBeTruthy();
  });

  it('filters jobs by category chip', () => {
    const { getByText, queryByText } = renderWithProviders(
      <VeganJobsScreen
        navigation={mockNavigation}
        route={{ key: 'VeganJobs', name: 'VeganJobs' } as any}
      />,
    );

    // Tap Sanctuary & Animals
    fireEvent.press(getByText('Sanctuary & Animals'));
    expect(getByText('Sanctuary Animal Care Specialist & Rescue Fellow')).toBeTruthy();
    expect(queryByText('Food Scientist – Plant-Based Dairy Innovation')).toBeNull();

    // Reset to All
    fireEvent.press(getByText('🌱 All Categories'));
    expect(getByText('Food Scientist – Plant-Based Dairy Innovation')).toBeTruthy();
  });

  it('filters jobs by workplace type (Remote, Hybrid, On-site)', () => {
    const { getByTestId, getByText, queryByText } = renderWithProviders(
      <VeganJobsScreen
        navigation={mockNavigation}
        route={{ key: 'VeganJobs', name: 'VeganJobs' } as any}
      />,
    );

    // Tap Remote
    fireEvent.press(getByTestId('workplace-filter-Remote'));
    expect(getByText('Senior Full-Stack Engineer (Climate & Supply Chain)')).toBeTruthy();
    expect(getByText('Growth Marketing & Animal Advocacy Campaigner')).toBeTruthy();
    expect(queryByText('Sanctuary Animal Care Specialist & Rescue Fellow')).toBeNull();

    // Tap All Sites
    fireEvent.press(getByTestId('workplace-filter-All'));
    expect(getByText('Sanctuary Animal Care Specialist & Rescue Fellow')).toBeTruthy();
  });

  it('searches jobs by role, company, or keyword', () => {
    const { getByPlaceholderText, getByText, queryByText } = renderWithProviders(
      <VeganJobsScreen
        navigation={mockNavigation}
        route={{ key: 'VeganJobs', name: 'VeganJobs' } as any}
      />,
    );

    const searchInput = getByPlaceholderText('Search role, skill, company (e.g. Science, Cashew)');

    // Search for Mycelium
    fireEvent.changeText(searchInput, 'Mycelium');
    expect(getByText('Biomaterials Research Fellow – Mycelium Leather')).toBeTruthy();
    expect(queryByText('Silk & Oat Labs')).toBeNull();

    // Clear search
    fireEvent.changeText(searchInput, '');
    expect(getByText('Silk & Oat Labs')).toBeTruthy();
  });

  it('toggles job bookmark and filters saved jobs', () => {
    const { getByTestId, getByText, queryByText } = renderWithProviders(
      <VeganJobsScreen
        navigation={mockNavigation}
        route={{ key: 'VeganJobs', name: 'VeganJobs' } as any}
      />,
    );

    // Toggle saved filter
    const savedToggle = getByTestId('saved-jobs-toggle');
    fireEvent.press(savedToggle);

    // job-3 was initially saved (CrueltyFree Carbon OS)
    expect(getByText('Senior Full-Stack Engineer (Climate & Supply Chain)')).toBeTruthy();
    expect(queryByText('Silk & Oat Labs')).toBeNull();

    // Untoggle
    fireEvent.press(savedToggle);
    expect(getByText('Silk & Oat Labs')).toBeTruthy();
  });

  it('opens 1-Click Quick Apply modal and submits ethical application', () => {
    const { getByTestId, getByText, queryByText } = renderWithProviders(
      <VeganJobsScreen
        navigation={mockNavigation}
        route={{ key: 'VeganJobs', name: 'VeganJobs' } as any}
      />,
    );

    // Click apply on job-1 (Silk & Oat Labs)
    const applyBtn = getByTestId('apply-job-1');
    fireEvent.press(applyBtn);

    expect(getByText('Kindred Verified Ethical Applicant')).toBeTruthy();
    expect(getByText('Submit Ethical Application')).toBeTruthy();

    // Submit application
    const submitBtn = getByTestId('submit-application-btn');
    fireEvent.press(submitBtn);

    // Modal dismissed
    expect(queryByText('Kindred Verified Ethical Applicant')).toBeNull();

    // Button updates to Applied
    expect(getByText('Applied ✓')).toBeTruthy();
  });

  it('shares job opportunity via Share.share', () => {
    const { getByTestId } = renderWithProviders(
      <VeganJobsScreen
        navigation={mockNavigation}
        route={{ key: 'VeganJobs', name: 'VeganJobs' } as any}
      />,
    );

    const shareBtn = getByTestId('share-job-1');
    fireEvent.press(shareBtn);

    expect(Share.share).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Silk & Oat Labs'),
      }),
    );
  });
});
