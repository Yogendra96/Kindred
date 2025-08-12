import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, type RouteProp } from '@react-navigation/native';
import { useDispatch } from 'react-redux';

import CarbonActivityForm, { 
  type CarbonActivityType, 
  type CarbonActivityResult 
} from '../../components/forms/CarbonActivityForm';
import { useAdvancedLogging } from '../../hooks/useAdvancedLogging';

// Navigation types
type CarbonActivityScreenRouteParams = {
  activityType: CarbonActivityType;
  initialData?: Record<string, unknown>;
};

type CarbonActivityScreenRouteProp = RouteProp<
  { CarbonActivity: CarbonActivityScreenRouteParams }, 
  'CarbonActivity'
>;

const CarbonActivityScreen: React.FC = () => {
  const route = useRoute<CarbonActivityScreenRouteProp>();
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const { activityType, initialData } = route.params;

  const log = useAdvancedLogging({
    component: 'CarbonActivityScreen',
    screen: 'CarbonActivityScreen',
    category: 'carbon',
    autoTrackLifecycle: true,
    metadata: {
      activityType,
      hasInitialData: !!initialData,
    },
  });

  const handleActivitySubmit = useCallback((result: CarbonActivityResult) => {
    log.trackBusinessEvent('carbon_activity_completed', {
      activityType: result.type,
      emissions: result.calculation.carbon_footprint_kg,
      offsetCost: result.calculation.offset_cost_usd,
      equivalentTrees: result.calculation.equivalent_trees_planted,
    });

    // TODO: Save to Redux store and local storage
    // dispatch(addCarbonActivity(result));

    // Show success and navigate back
    Alert.alert(
      'Activity Saved!',
      `Your ${result.type} activity has been logged successfully.`,
      [
        {
          text: 'View Dashboard',
          onPress: () => {
            // Navigate to carbon dashboard
            navigation.navigate('CarbonDashboard' as never);
          },
        },
        {
          text: 'Add Another',
          onPress: () => {
            // Stay on current screen to add another activity
            navigation.navigate('CarbonTracker' as never);
          },
        },
        {
          text: 'Done',
          onPress: () => {
            navigation.goBack();
          },
          style: 'cancel',
        },
      ]
    );
  }, [activityType, navigation, log]);

  const handleCancel = useCallback(() => {
    log.trackButtonPress('cancel_activity_form', {
      activityType,
    });

    Alert.alert(
      'Cancel Activity',
      'Are you sure you want to cancel? Your progress will be lost.',
      [
        {
          text: 'Keep Editing',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          onPress: () => {
            log.trackBusinessEvent('carbon_activity_cancelled', {
              activityType,
            });
            navigation.goBack();
          },
          style: 'destructive',
        },
      ]
    );
  }, [activityType, navigation, log]);

  return (
    <View style={styles.container}>
      <CarbonActivityForm
        activityType={activityType}
        onSubmit={handleActivitySubmit}
        onCancel={handleCancel}
        initialData={initialData}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});

export default CarbonActivityScreen;