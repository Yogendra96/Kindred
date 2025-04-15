import React from 'react';
import { render, screen } from '@testing-library/react-native';
import CarbonFootprintCard from '../CarbonFootprintCard';

describe('CarbonFootprintCard', () => {
  const mockProps = {
    total: 100,
    target: 200,
    categories: {
      transportation: 30,
      food: 25,
      energy: 35,
      waste: 10,
    },
  };

  it('renders correctly', () => {
    render(<CarbonFootprintCard {...mockProps} />);
    
    // Check if main elements are rendered
    expect(screen.getByText('Your Carbon Footprint')).toBeTruthy();
    expect(screen.getByText('100.0 kg CO₂')).toBeTruthy();
    
    // Check if categories are rendered
    expect(screen.getByText('Transportation')).toBeTruthy();
    expect(screen.getByText('Food')).toBeTruthy();
    expect(screen.getByText('Energy')).toBeTruthy();
    expect(screen.getByText('Waste')).toBeTruthy();
  });

  it('displays correct values for each category', () => {
    render(<CarbonFootprintCard {...mockProps} />);
    
    expect(screen.getByText('30 kg')).toBeTruthy();
    expect(screen.getByText('25 kg')).toBeTruthy();
    expect(screen.getByText('35 kg')).toBeTruthy();
    expect(screen.getByText('10 kg')).toBeTruthy();
  });

  it('shows correct progress percentage', () => {
    render(<CarbonFootprintCard {...mockProps} />);
    
    // 100/200 = 50%
    expect(screen.getByText('50% of target')).toBeTruthy();
  });
});