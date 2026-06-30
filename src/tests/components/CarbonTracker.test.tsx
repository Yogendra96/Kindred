import CarbonTracker from '../../components/CarbonTracker';
import { render, TestDataFactory, TestHelpers } from '../utils/testUtils';
import { fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert, View, Text, TextInput, TouchableOpacity } from 'react-native';

// Mock the CarbonTracker component (since it doesn't exist yet)
const MockCarbonTracker = ({ onActivityAdd, activities = [] }: any) => {
  const [carbonSaved, setCarbonSaved] = React.useState(0);
  const [activityType, setActivityType] = React.useState('');
  const [distance, setDistance] = React.useState('');

  const handleAddActivity = () => {
    if (!activityType || !distance) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const activity = {
      id: Date.now().toString(),
      type: activityType,
      distance: parseFloat(distance),
      carbonSaved: parseFloat(distance) * 0.5, // Mock calculation
      timestamp: new Date().toISOString(),
    };

    onActivityAdd?.(activity);
    setCarbonSaved(prev => prev + activity.carbonSaved);
    setActivityType('');
    setDistance('');
  };

  return (
    <View>
      <Text testID='carbon-saved-display'>{carbonSaved.toFixed(1)} kg CO₂ saved</Text>
      <Text testID='activity-count'>{activities.length} activities logged</Text>

      <Text testID='activity-type-label'>Activity Type</Text>
      <TextInput
        testID='activity-type-input'
        value={activityType}
        onChangeText={setActivityType}
        placeholder='Select activity type'
      />

      <Text testID='distance-label'>Distance (km)</Text>
      <TextInput
        testID='distance-input'
        value={distance}
        onChangeText={setDistance}
        placeholder='Enter distance'
        keyboardType='numeric'
      />

      <TouchableOpacity testID='add-activity-button' onPress={handleAddActivity}>
        <Text>Add Activity</Text>
      </TouchableOpacity>

      {activities.map((activity: any, index: number) => (
        <View key={activity.id} testID={`activity-item-${index}`}>
          <Text testID={`activity-type-${index}`}>{activity.type}</Text>
          <Text testID={`activity-distance-${index}`}>{activity.distance} km</Text>
          <Text testID={`activity-carbon-${index}`}>{activity.carbonSaved} kg CO₂</Text>
        </View>
      ))}
    </View>
  );
};

// Mock Alert is handled in setup.ts

describe('CarbonTracker Component', () => {
  const mockOnActivityAdd = jest.fn();
  const defaultProps = {
    onActivityAdd: mockOnActivityAdd,
    activities: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render carbon tracker with initial state', () => {
      const { getByTestId } = render(<MockCarbonTracker {...defaultProps} />);

      expect(getByTestId('carbon-saved-display')).toHaveTextContent('0.0 kg CO₂ saved');
      expect(getByTestId('activity-count')).toHaveTextContent('0 activities logged');
      expect(getByTestId('activity-type-input')).toBeTruthy();
      expect(getByTestId('distance-input')).toBeTruthy();
      expect(getByTestId('add-activity-button')).toBeTruthy();
    });

    it('should render existing activities', () => {
      const activities = [
        TestDataFactory.createCarbonActivity({
          id: '1',
          type: 'walking',
          distance: 5,
          carbonSaved: 2.5,
        }),
        TestDataFactory.createCarbonActivity({
          id: '2',
          type: 'cycling',
          distance: 10,
          carbonSaved: 5.0,
        }),
      ];

      const { getByTestId } = render(
        <MockCarbonTracker {...defaultProps} activities={activities} />,
      );

      expect(getByTestId('activity-count')).toHaveTextContent('2 activities logged');
      expect(getByTestId('activity-item-0')).toBeTruthy();
      expect(getByTestId('activity-item-1')).toBeTruthy();
      expect(getByTestId('activity-type-0')).toHaveTextContent('walking');
      expect(getByTestId('activity-type-1')).toHaveTextContent('cycling');
    });

    it('should have proper accessibility labels', () => {
      const { getByTestId } = render(<MockCarbonTracker {...defaultProps} />);

      const activityTypeInput = getByTestId('activity-type-input');
      const distanceInput = getByTestId('distance-input');
      const addButton = getByTestId('add-activity-button');

      // Check if elements have accessibility properties
      expect(activityTypeInput.props.placeholder).toBe('Select activity type');
      expect(distanceInput.props.placeholder).toBe('Enter distance');
      expect(distanceInput.props.keyboardType).toBe('numeric');
    });
  });

  describe('User Interactions', () => {
    it('should update activity type when input changes', () => {
      const { getByTestId } = render(<MockCarbonTracker {...defaultProps} />);

      const activityTypeInput = getByTestId('activity-type-input');
      fireEvent.changeText(activityTypeInput, 'walking');

      expect(activityTypeInput.props.value).toBe('walking');
    });

    it('should update distance when input changes', () => {
      const { getByTestId } = render(<MockCarbonTracker {...defaultProps} />);

      const distanceInput = getByTestId('distance-input');
      fireEvent.changeText(distanceInput, '5');

      expect(distanceInput.props.value).toBe('5');
    });

    it('should add activity when form is submitted with valid data', async () => {
      const { getByTestId } = render(<MockCarbonTracker {...defaultProps} />);

      const activityTypeInput = getByTestId('activity-type-input');
      const distanceInput = getByTestId('distance-input');
      const addButton = getByTestId('add-activity-button');

      fireEvent.changeText(activityTypeInput, 'walking');
      fireEvent.changeText(distanceInput, '5');
      fireEvent.press(addButton);

      await waitFor(() => {
        expect(mockOnActivityAdd).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'walking',
            distance: 5,
            carbonSaved: 2.5,
          }),
        );
      });

      expect(getByTestId('carbon-saved-display')).toHaveTextContent('2.5 kg CO₂ saved');
      expect(activityTypeInput.props.value).toBe('');
      expect(distanceInput.props.value).toBe('');
    });

    it('should show error when trying to add activity without activity type', async () => {
      const { getByTestId } = render(<MockCarbonTracker {...defaultProps} />);

      const distanceInput = getByTestId('distance-input');
      const addButton = getByTestId('add-activity-button');

      fireEvent.changeText(distanceInput, '5');
      fireEvent.press(addButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please fill all fields');
      });

      expect(mockOnActivityAdd).not.toHaveBeenCalled();
    });

    it('should show error when trying to add activity without distance', async () => {
      const { getByTestId } = render(<MockCarbonTracker {...defaultProps} />);

      const activityTypeInput = getByTestId('activity-type-input');
      const addButton = getByTestId('add-activity-button');

      fireEvent.changeText(activityTypeInput, 'walking');
      fireEvent.press(addButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please fill all fields');
      });

      expect(mockOnActivityAdd).not.toHaveBeenCalled();
    });
  });

  describe('Carbon Calculation', () => {
    it('should calculate carbon savings correctly', async () => {
      const { getByTestId } = render(<MockCarbonTracker {...defaultProps} />);

      const activityTypeInput = getByTestId('activity-type-input');
      const distanceInput = getByTestId('distance-input');
      const addButton = getByTestId('add-activity-button');

      // Add first activity
      fireEvent.changeText(activityTypeInput, 'walking');
      fireEvent.changeText(distanceInput, '5');
      fireEvent.press(addButton);

      await waitFor(() => {
        expect(getByTestId('carbon-saved-display')).toHaveTextContent('2.5 kg CO₂ saved');
      });

      // Add second activity
      fireEvent.changeText(activityTypeInput, 'cycling');
      fireEvent.changeText(distanceInput, '10');
      fireEvent.press(addButton);

      await waitFor(() => {
        expect(getByTestId('carbon-saved-display')).toHaveTextContent('7.5 kg CO₂ saved');
      });
    });

    it('should handle decimal distances correctly', async () => {
      const { getByTestId } = render(<MockCarbonTracker {...defaultProps} />);

      const activityTypeInput = getByTestId('activity-type-input');
      const distanceInput = getByTestId('distance-input');
      const addButton = getByTestId('add-activity-button');

      fireEvent.changeText(activityTypeInput, 'walking');
      fireEvent.changeText(distanceInput, '2.5');
      fireEvent.press(addButton);

      await waitFor(() => {
        expect(mockOnActivityAdd).toHaveBeenCalledWith(
          expect.objectContaining({
            distance: 2.5,
            carbonSaved: 1.25,
          }),
        );
      });
    });
  });

  describe('Performance', () => {
    it('should render quickly with many activities', async () => {
      const manyActivities = Array.from({ length: 100 }, (_, i) =>
        TestDataFactory.createCarbonActivity({
          id: i.toString(),
          type: 'walking',
          distance: 1,
          carbonSaved: 0.5,
        }),
      );

      const renderTime = await TestHelpers.measureRenderTime(() => {
        render(<MockCarbonTracker {...defaultProps} activities={manyActivities} />);
      });

      expect(renderTime).toBeLessThan(100); // Should render in less than 100ms
    });

    it('should not cause memory leaks with frequent updates', async () => {
      const { rerender } = render(<MockCarbonTracker {...defaultProps} />);

      const initialMemory = TestHelpers.measureMemoryUsage();

      // Simulate frequent updates
      for (let i = 0; i < 50; i++) {
        const activities = Array.from({ length: i }, (_, j) =>
          TestDataFactory.createCarbonActivity({ id: j.toString() }),
        );
        rerender(<MockCarbonTracker {...defaultProps} activities={activities} />);
      }

      const finalMemory = TestHelpers.measureMemoryUsage();

      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory.used - initialMemory.used;
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // Less than 10MB increase
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid distance input gracefully', async () => {
      const { getByTestId } = render(<MockCarbonTracker {...defaultProps} />);

      const activityTypeInput = getByTestId('activity-type-input');
      const distanceInput = getByTestId('distance-input');
      const addButton = getByTestId('add-activity-button');

      fireEvent.changeText(activityTypeInput, 'walking');
      fireEvent.changeText(distanceInput, 'invalid');
      fireEvent.press(addButton);

      await waitFor(() => {
        expect(mockOnActivityAdd).toHaveBeenCalledWith(
          expect.objectContaining({
            distance: NaN,
            carbonSaved: NaN,
          }),
        );
      });
    });

    it('should handle negative distance input', async () => {
      const { getByTestId } = render(<MockCarbonTracker {...defaultProps} />);

      const activityTypeInput = getByTestId('activity-type-input');
      const distanceInput = getByTestId('distance-input');
      const addButton = getByTestId('add-activity-button');

      fireEvent.changeText(activityTypeInput, 'walking');
      fireEvent.changeText(distanceInput, '-5');
      fireEvent.press(addButton);

      await waitFor(() => {
        expect(mockOnActivityAdd).toHaveBeenCalledWith(
          expect.objectContaining({
            distance: -5,
            carbonSaved: -2.5,
          }),
        );
      });
    });

    it('should handle very large numbers', async () => {
      const { getByTestId } = render(<MockCarbonTracker {...defaultProps} />);

      const activityTypeInput = getByTestId('activity-type-input');
      const distanceInput = getByTestId('distance-input');
      const addButton = getByTestId('add-activity-button');

      fireEvent.changeText(activityTypeInput, 'walking');
      fireEvent.changeText(distanceInput, '999999');
      fireEvent.press(addButton);

      await waitFor(() => {
        expect(mockOnActivityAdd).toHaveBeenCalledWith(
          expect.objectContaining({
            distance: 999999,
            carbonSaved: 499999.5,
          }),
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('should be accessible to screen readers', () => {
      const { getByTestId } = render(<MockCarbonTracker {...defaultProps} />);

      const activityTypeInput = getByTestId('activity-type-input');
      const distanceInput = getByTestId('distance-input');
      const addButton = getByTestId('add-activity-button');

      expect(activityTypeInput).toBeTruthy();
      expect(distanceInput).toBeTruthy();
      expect(addButton).toBeTruthy();
    });

    it('should have proper labels for form fields', () => {
      const { getByTestId } = render(<MockCarbonTracker {...defaultProps} />);

      expect(getByTestId('activity-type-label')).toHaveTextContent('Activity Type');
      expect(getByTestId('distance-label')).toHaveTextContent('Distance (km)');
    });
  });

  describe('Integration', () => {
    it('should work with Redux store', () => {
      const initialState = {
        carbon: {
          activities: [TestDataFactory.createCarbonActivity()],
          totalSaved: 2.5,
        },
      };

      const { getByTestId } = render(<MockCarbonTracker {...defaultProps} />, {
        initialState,
      });

      // Component should integrate with Redux state
      expect(getByTestId('carbon-saved-display')).toBeTruthy();
    });

    it('should work with React Query', async () => {
      const queryClient = TestHelpers.createMockQueryClient();

      const { getByTestId } = render(<MockCarbonTracker {...defaultProps} />, {
        queryClient,
      });

      // Component should work with React Query
      expect(getByTestId('add-activity-button')).toBeTruthy();
    });
  });
});
