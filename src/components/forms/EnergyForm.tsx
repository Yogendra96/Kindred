import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAdvancedLogging } from '../../hooks/useAdvancedLogging';

export interface EnergyData {
  type: string;
  amount: number;
  unit: string;
  period: string;
  source?: string;
  efficiency?: 'low' | 'medium' | 'high';
  renewableEnergy: boolean;
  description: string;
}

interface EnergyFormProps {
  onSubmit: (data: EnergyData) => void;
  onCancel: () => void;
  loading?: boolean;
  initialData?: Partial<EnergyData>;
}

const EnergyForm: React.FC<EnergyFormProps> = ({
  onSubmit,
  onCancel,
  loading = false,
  initialData = {},
}) => {
  const [formData, setFormData] = useState<EnergyData>({
    type: initialData.type ?? '',
    amount: initialData.amount ?? 0,
    unit: initialData.unit ?? 'kWh',
    period: initialData.period ?? 'daily',
    source: initialData.source,
    efficiency: initialData.efficiency,
    renewableEnergy: initialData.renewableEnergy ?? false,
    description: initialData.description ?? '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const log = useAdvancedLogging({
    component: 'EnergyForm',
    screen: 'CarbonTrackerScreen',
    category: 'carbon',
    autoTrackLifecycle: true,
  });

  const energyTypes = [
    { id: 'electricity', name: 'Electricity', icon: 'flash-outline', color: '#F39C12' },
    { id: 'heating', name: 'Heating', icon: 'flame-outline', color: '#E74C3C' },
    { id: 'cooling', name: 'Air Conditioning', icon: 'snow-outline', color: '#3498DB' },
    { id: 'hot-water', name: 'Hot Water', icon: 'water-outline', color: '#1ABC9C' },
    { id: 'cooking', name: 'Cooking', icon: 'restaurant-outline', color: '#9B59B6' },
    { id: 'lighting', name: 'Lighting', icon: 'bulb-outline', color: '#F1C40F' },
  ];

  const energySources = [
    { id: 'grid', name: 'Grid Electricity' },
    { id: 'solar', name: 'Solar Panels' },
    { id: 'wind', name: 'Wind Power' },
    { id: 'hydro', name: 'Hydroelectric' },
    { id: 'natural-gas', name: 'Natural Gas' },
    { id: 'oil', name: 'Heating Oil' },
    { id: 'propane', name: 'Propane' },
    { id: 'wood', name: 'Wood/Biomass' },
  ];

  const units = [
    { id: 'kWh', name: 'kWh (Kilowatt Hours)' },
    { id: 'MWh', name: 'MWh (Megawatt Hours)' },
    { id: 'therms', name: 'Therms' },
    { id: 'BTU', name: 'BTU' },
    { id: 'cubic-meters', name: 'Cubic Meters (gas)' },
    { id: 'gallons', name: 'Gallons (oil)' },
  ];

  const periods = [
    { id: 'daily', name: 'Daily' },
    { id: 'weekly', name: 'Weekly' },
    { id: 'monthly', name: 'Monthly' },
    { id: 'yearly', name: 'Yearly' },
    { id: 'one-time', name: 'One-time Usage' },
  ];

  const efficiencyLevels = [
    { id: 'low', name: 'Low Efficiency', color: '#E74C3C' },
    { id: 'medium', name: 'Medium Efficiency', color: '#F39C12' },
    { id: 'high', name: 'High Efficiency', color: '#27AE60' },
  ];

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.type) {
      newErrors.type = 'Please select an energy type';
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    if (formData.amount > 100000) {
      newErrors.amount = 'Amount seems unusually high. Please verify.';
    }

    if (!formData.unit) {
      newErrors.unit = 'Please select a unit';
    }

    if (!formData.period) {
      newErrors.period = 'Please select a time period';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Please provide a brief description';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(() => {
    log.trackButtonPress('submit_energy_form', {
      type: formData.type,
      amount: formData.amount,
      unit: formData.unit,
      period: formData.period,
      renewableEnergy: formData.renewableEnergy,
    });

    if (validateForm()) {
      log.trackBusinessEvent('energy_activity_submitted', {
        type: formData.type,
        amount: formData.amount,
        unit: formData.unit,
        period: formData.period,
        source: formData.source,
        efficiency: formData.efficiency,
        renewableEnergy: formData.renewableEnergy,
      });

      onSubmit(formData);
    } else {
      log.trackError('energy_form_validation_failed', {
        errors: Object.keys(errors),
        formData: {
          type: formData.type,
          amount: formData.amount,
          hasDescription: !!formData.description,
        },
      });

      Alert.alert('Form Error', 'Please fix the highlighted fields and try again.');
    }
  }, [formData, validateForm, onSubmit, log, errors]);

  const updateFormData = useCallback((field: keyof EnergyData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const renderEnergyTypeSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Energy Type *</Text>
      <View style={styles.typeGrid}>
        {energyTypes.map(type => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.typeCard,
              { borderColor: type.color },
              formData.type === type.id && {
                backgroundColor: `${type.color}20`,
                borderWidth: 2,
              },
            ]}
            onPress={() => updateFormData('type', type.id)}
          >
            <Icon name={type.icon} size={24} color={type.color} />
            <Text style={styles.typeText}>{type.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {errors.type ? <Text style={styles.errorText}>{errors.type}</Text> : null}
    </View>
  );

  const renderAmountAndUnit = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Amount & Unit *</Text>
      <View style={styles.amountContainer}>
        <View style={styles.amountInputContainer}>
          <TextInput
            style={[styles.input, errors.amount && styles.inputError]}
            placeholder="Amount"
            value={formData.amount.toString()}
            onChangeText={text => updateFormData('amount', parseFloat(text) || 0)}
            keyboardType="numeric"
            returnKeyType="next"
          />
        </View>
        <View style={styles.unitContainer}>
          <TouchableOpacity
            style={[styles.unitSelector, errors.unit && styles.inputError]}
            onPress={() => {
              // In a real app, this would open a picker
              Alert.alert(
                'Select Unit',
                'Choose your energy unit',
                units.map(unit => ({
                  text: unit.name,
                  onPress: () => updateFormData('unit', unit.id),
                })),
              );
            }}
          >
            <Text style={styles.unitText}>
              {units.find(u => u.id === formData.unit)?.name ?? 'Select Unit'}
            </Text>
            <Icon name="chevron-down-outline" size={20} color="#7F8C8D" />
          </TouchableOpacity>
        </View>
      </View>
      {errors.amount ? <Text style={styles.errorText}>{errors.amount}</Text> : null}
      {errors.unit ? <Text style={styles.errorText}>{errors.unit}</Text> : null}
    </View>
  );

  const renderPeriodSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Time Period *</Text>
      <View style={styles.periodContainer}>
        {periods.map(period => (
          <TouchableOpacity
            key={period.id}
            style={[
              styles.periodButton,
              formData.period === period.id && styles.periodButtonSelected,
            ]}
            onPress={() => updateFormData('period', period.id)}
          >
            <Text
              style={[
                styles.periodText,
                formData.period === period.id && styles.periodTextSelected,
              ]}
            >
              {period.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {errors.period ? <Text style={styles.errorText}>{errors.period}</Text> : null}
    </View>
  );

  const renderOptionalFields = () => (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Energy Source</Text>
        <TouchableOpacity
          style={styles.sourceSelector}
          onPress={() => {
            Alert.alert(
              'Select Energy Source',
              'Choose your energy source',
              energySources.map(source => ({
                text: source.name,
                onPress: () => updateFormData('source', source.id),
              })),
            );
          }}
        >
          <Text style={styles.sourceSelectorText}>
            {energySources.find(s => s.id === formData.source)?.name ?? 'Select Source (Optional)'}
          </Text>
          <Icon name="chevron-down-outline" size={20} color="#7F8C8D" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appliance Efficiency</Text>
        <View style={styles.efficiencyContainer}>
          {efficiencyLevels.map(level => (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.efficiencyButton,
                { borderColor: level.color },
                formData.efficiency === level.id && {
                  backgroundColor: `${level.color}20`,
                  borderWidth: 2,
                },
              ]}
              onPress={() => updateFormData('efficiency', level.id as 'low' | 'medium' | 'high')}
            >
              <Text style={[styles.efficiencyText, { color: level.color }]}>
                {level.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.switchContainer}>
          <View style={styles.switchLabelContainer}>
            <Icon name="leaf-outline" size={20} color="#27AE60" />
            <Text style={styles.switchLabel}>Renewable Energy Source</Text>
          </View>
          <Switch
            value={formData.renewableEnergy}
            onValueChange={value => updateFormData('renewableEnergy', value)}
            trackColor={{ false: '#E1E8ED', true: '#27AE60' }}
            thumbColor={formData.renewableEnergy ? '#FFFFFF' : '#FFFFFF'}
          />
        </View>
      </View>
    </>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Energy Consumption</Text>
        <Text style={styles.subtitle}>Track your energy usage and efficiency</Text>
      </View>

      {renderEnergyTypeSelector()}
      {renderAmountAndUnit()}
      {renderPeriodSelector()}
      {renderOptionalFields()}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description *</Text>
        <TextInput
          style={[styles.textArea, errors.description && styles.inputError]}
          placeholder="e.g., Monthly electricity bill, heating during winter..."
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
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  typeCard: {
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
  typeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2C3E50',
    marginTop: 8,
    textAlign: 'center',
  },
  amountContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  amountInputContainer: {
    flex: 2,
  },
  unitContainer: {
    flex: 3,
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
  unitSelector: {
    borderWidth: 1,
    borderColor: '#E1E8ED',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  unitText: {
    fontSize: 16,
    color: '#2C3E50',
  },
  periodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  periodButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  periodButtonSelected: {
    backgroundColor: '#F39C12',
    borderColor: '#F39C12',
  },
  periodText: {
    fontSize: 14,
    color: '#2C3E50',
  },
  periodTextSelected: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  sourceSelector: {
    borderWidth: 1,
    borderColor: '#E1E8ED',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  sourceSelectorText: {
    fontSize: 16,
    color: '#2C3E50',
  },
  efficiencyContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  efficiencyButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    padding: 12,
    alignItems: 'center',
  },
  efficiencyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
  },
  switchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C3E50',
    marginLeft: 8,
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
    backgroundColor: '#F39C12',
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

export default EnergyForm;