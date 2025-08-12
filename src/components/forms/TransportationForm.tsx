import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAdvancedLogging } from '../../hooks/useAdvancedLogging';

export interface TransportationData {
  mode: string;
  distance: number;
  duration?: number;
  passengers?: number;
  fuelType?: string;
  vehicleType?: string;
  description: string;
}

interface TransportationFormProps {
  onSubmit: (data: TransportationData) => void;
  onCancel: () => void;
  loading?: boolean;
  initialData?: Partial<TransportationData>;
}

const TransportationForm: React.FC<TransportationFormProps> = ({
  onSubmit,
  onCancel,
  loading = false,
  initialData = {},
}) => {
  const [formData, setFormData] = useState<TransportationData>({
    mode: initialData.mode ?? '',
    distance: initialData.distance ?? 0,
    duration: initialData.duration,
    passengers: initialData.passengers ?? 1,
    fuelType: initialData.fuelType,
    vehicleType: initialData.vehicleType,
    description: initialData.description ?? '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const log = useAdvancedLogging({
    component: 'TransportationForm',
    screen: 'CarbonTrackerScreen',
    category: 'carbon',
    autoTrackLifecycle: true,
  });

  const transportModes = [
    { id: 'car', name: 'Car', icon: 'car-outline', color: '#FF6B6B' },
    { id: 'bus', name: 'Bus', icon: 'bus-outline', color: '#4ECDC4' },
    { id: 'train', name: 'Train', icon: 'train-outline', color: '#45B7D1' },
    { id: 'plane', name: 'Flight', icon: 'airplane-outline', color: '#96CEB4' },
    { id: 'bike', name: 'Bicycle', icon: 'bicycle-outline', color: '#FFA726' },
    { id: 'walk', name: 'Walking', icon: 'walk-outline', color: '#66BB6A' },
    { id: 'scooter', name: 'E-Scooter', icon: 'flash-outline', color: '#AB47BC' },
    { id: 'motorcycle', name: 'Motorcycle', icon: 'bicycle-outline', color: '#FF5722' },
  ];

  const fuelTypes = [
    { id: 'gasoline', name: 'Gasoline' },
    { id: 'diesel', name: 'Diesel' },
    { id: 'electric', name: 'Electric' },
    { id: 'hybrid', name: 'Hybrid' },
    { id: 'plugin-hybrid', name: 'Plug-in Hybrid' },
    { id: 'natural-gas', name: 'Natural Gas' },
  ];

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.mode) {
      newErrors.mode = 'Please select a transportation mode';
    }

    if (!formData.distance || formData.distance <= 0) {
      newErrors.distance = 'Please enter a valid distance';
    }

    if (formData.distance > 10000) {
      newErrors.distance = 'Distance seems unusually high. Please verify.';
    }

    if (formData.passengers && (formData.passengers < 1 || formData.passengers > 20)) {
      newErrors.passengers = 'Number of passengers must be between 1 and 20';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Please provide a brief description';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(() => {
    log.trackButtonPress('submit_transportation_form', {
      mode: formData.mode,
      distance: formData.distance,
      hasDescription: !!formData.description,
    });

    if (validateForm()) {
      log.trackBusinessEvent('transportation_activity_submitted', {
        mode: formData.mode,
        distance: formData.distance,
        passengers: formData.passengers,
        fuelType: formData.fuelType,
      });

      onSubmit(formData);
    } else {
      log.trackError('transportation_form_validation_failed', {
        errors: Object.keys(errors),
        formData: {
          mode: formData.mode,
          distance: formData.distance,
          hasDescription: !!formData.description,
        },
      });

      Alert.alert('Form Error', 'Please fix the highlighted fields and try again.');
    }
  }, [formData, validateForm, onSubmit, log, errors]);

  const updateFormData = useCallback((field: keyof TransportationData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const renderModeSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Transportation Mode *</Text>
      <View style={styles.modeGrid}>
        {transportModes.map(mode => (
          <TouchableOpacity
            key={mode.id}
            style={[
              styles.modeCard,
              { borderColor: mode.color },
              formData.mode === mode.id && {
                backgroundColor: `${mode.color}20`,
                borderWidth: 2,
              },
            ]}
            onPress={() => updateFormData('mode', mode.id)}
          >
            <Icon name={mode.icon} size={24} color={mode.color} />
            <Text style={styles.modeText}>{mode.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {errors.mode ? <Text style={styles.errorText}>{errors.mode}</Text> : null}
    </View>
  );

  const renderDistanceInput = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Distance *</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, errors.distance && styles.inputError]}
          placeholder="Enter distance in km"
          value={formData.distance.toString()}
          onChangeText={text => updateFormData('distance', parseFloat(text) || 0)}
          keyboardType="numeric"
          returnKeyType="next"
        />
      </View>
      {errors.distance ? <Text style={styles.errorText}>{errors.distance}</Text> : null}
    </View>
  );

  const renderOptionalFields = () => {
    const showFuelType = ['car', 'motorcycle', 'bus'].includes(formData.mode);
    const showPassengers = ['car', 'bus', 'train', 'plane'].includes(formData.mode);

    return (
      <>
        {showFuelType && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fuel Type</Text>
            <View style={styles.fuelTypeContainer}>
              {fuelTypes.map(fuel => (
                <TouchableOpacity
                  key={fuel.id}
                  style={[
                    styles.fuelTypeButton,
                    formData.fuelType === fuel.id && styles.fuelTypeButtonSelected,
                  ]}
                  onPress={() => updateFormData('fuelType', fuel.id)}
                >
                  <Text
                    style={[
                      styles.fuelTypeText,
                      formData.fuelType === fuel.id && styles.fuelTypeTextSelected,
                    ]}
                  >
                    {fuel.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {showPassengers && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Number of Passengers</Text>
            <TextInput
              style={[styles.input, errors.passengers && styles.inputError]}
              placeholder="Including yourself"
              value={formData.passengers?.toString() ?? ''}
              onChangeText={text => updateFormData('passengers', parseInt(text, 10) || 1)}
              keyboardType="numeric"
              returnKeyType="next"
            />
            {errors.passengers ? <Text style={styles.errorText}>{errors.passengers}</Text> : null}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Duration (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter duration in minutes"
            value={formData.duration?.toString() ?? ''}
            onChangeText={text => updateFormData('duration', parseInt(text, 10) || undefined)}
            keyboardType="numeric"
            returnKeyType="next"
          />
        </View>
      </>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Transportation Activity</Text>
        <Text style={styles.subtitle}>Track your travel and commute</Text>
      </View>

      {renderModeSelector()}
      {renderDistanceInput()}
      {renderOptionalFields()}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description *</Text>
        <TextInput
          style={[styles.textArea, errors.description && styles.inputError]}
          placeholder="e.g., Commute to work, weekend trip to the beach..."
          value={formData.description}
          onChangeText={text => updateFormData('description', text)}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          returnKeyType="done"
        />
        {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.submitButton, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Calculating...' : 'Calculate Impact'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
  },
  modeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  modeCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  modeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2C3E50',
    marginTop: 8,
    textAlign: 'center',
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E1E8ED',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#E74C3C',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E1E8ED',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    minHeight: 80,
  },
  fuelTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fuelTypeButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  fuelTypeButtonSelected: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  fuelTypeText: {
    fontSize: 14,
    color: '#2C3E50',
  },
  fuelTypeTextSelected: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 14,
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7F8C8D',
  },
  submitButton: {
    backgroundColor: '#4ECDC4',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default TransportationForm;