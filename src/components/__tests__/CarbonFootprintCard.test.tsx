import CarbonFootprintCard from '../CarbonFootprintCard';
import { render, screen } from '@testing-library/react-native';
import React from 'react';

describe('CarbonFootprintCard', () => {
  const mockProps = {
    totalEmissions: 100,
    target: 200,
    data: {
      transport: 30,
      food: 25,
      energy: 35,
      waste: 10,
    },
  };

  it('renders correctly', () => {
    render(<CarbonFootprintCard {...mockProps} />);

    // Check if main elements are rendered
    expect(screen.getByText('Carbon Footprint Overview')).toBeTruthy();
    expect(screen.getByText('100.0')).toBeTruthy();
    expect(screen.getByText('tonnes CO₂e/year')).toBeTruthy();

    // Check if categories are rendered
    expect(screen.getByText('Transport')).toBeTruthy();
    expect(screen.getByText('Food')).toBeTruthy();
    expect(screen.getByText('Energy')).toBeTruthy();
    expect(screen.getByText('Waste')).toBeTruthy();
  });

  it('displays correct values for each category', () => {
    render(<CarbonFootprintCard {...mockProps} />);

    expect(screen.getByText('30.0t')).toBeTruthy();
    expect(screen.getByText('25.0t')).toBeTruthy();
    expect(screen.getByText('35.0t')).toBeTruthy();
    expect(screen.getByText('10.0t')).toBeTruthy();
  });

  it('shows correct impact level', () => {
    render(<CarbonFootprintCard {...mockProps} />);

    expect(screen.getByText('High Impact')).toBeTruthy();
  });
});
