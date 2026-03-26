// @ts-nocheck
/* eslint-disable */
import HapticFeedbackService from '../services/HapticFeedbackService';
import { useTheme } from '../theme/ThemeProvider';
import { AnimatedTouchable } from './MicroInteractions';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Animated,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
} from 'react-native';

const { width: _screenWidth, height: _screenHeight } = Dimensions.get('window');

interface InputField {
  id: string;
  type:
    | 'text'
    | 'number'
    | 'email'
    | 'phone'
    | 'date'
    | 'time'
    | 'select'
    | 'multiselect'
    | 'slider'
    | 'toggle'
    | 'barcode'
    | 'voice';
  label: string;
  placeholder?: string;
  value: any;
  required?: boolean;
  validation?: {
    pattern?: RegExp;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    custom?: (value: any) => string | null;
  };
  options?: Array<{ label: string; value: any; icon?: string }>;
  suggestions?: string[];
  autoComplete?: boolean;
  smartSuggestions?: boolean;
  voiceInput?: boolean;
  barcodeInput?: boolean;
  icon?: string;
  helpText?: string;
  dependencies?: string[];
  conditional?: {
    field: string;
    value: any;
    operator: 'equals' | 'not_equals' | 'greater' | 'less' | 'contains';
  };
}

interface FormTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  fields: InputField[];
  autoSave?: boolean;
  smartDefaults?: boolean;
  progressTracking?: boolean;
}

interface DataInputState {
  formData: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
  currentStep: number;
  totalSteps: number;
  progress: number;
  suggestions: Record<string, string[]>;
  recentInputs: Record<string, any[]>;
  voiceRecording: boolean;
  scanningBarcode: boolean;
  autoSaveEnabled: boolean;
  smartMode: boolean;
}

const COMMON_TEMPLATES: FormTemplate[] = [
  {
    id: 'carbon_activity',
    name: 'Carbon Activity',
    description: 'Log your daily carbon footprint activities',
    icon: 'leaf',
    category: 'environment',
    fields: [
      {
        id: 'activity_type',
        type: 'select',
        label: 'Activity Type',
        required: true,
        options: [
          { label: 'Transportation', value: 'transport', icon: 'car' },
          { label: 'Energy Usage', value: 'energy', icon: 'flash' },
          { label: 'Food & Diet', value: 'food', icon: 'restaurant' },
          { label: 'Waste', value: 'waste', icon: 'trash' },
        ],
        value: null,
      },
      {
        id: 'transport_mode',
        type: 'select',
        label: 'Transportation Mode',
        required: true,
        options: [
          { label: 'Car', value: 'car', icon: 'car' },
          { label: 'Bus', value: 'bus', icon: 'bus' },
          { label: 'Train', value: 'train', icon: 'train' },
          { label: 'Bicycle', value: 'bike', icon: 'bicycle' },
          { label: 'Walking', value: 'walk', icon: 'walk' },
        ],
        value: null,
        conditional: {
          field: 'activity_type',
          value: 'transport',
          operator: 'equals',
        },
      },
      {
        id: 'distance',
        type: 'number',
        label: 'Distance (km)',
        placeholder: 'Enter distance traveled',
        required: true,
        validation: {
          min: 0,
          max: 1000,
        },
        value: '',
        voiceInput: true,
        conditional: {
          field: 'activity_type',
          value: 'transport',
          operator: 'equals',
        },
      },
      {
        id: 'energy_amount',
        type: 'number',
        label: 'Energy Usage (kWh)',
        placeholder: 'Enter energy consumption',
        required: true,
        validation: {
          min: 0,
          max: 10000,
        },
        value: '',
        voiceInput: true,
        conditional: {
          field: 'activity_type',
          value: 'energy',
          operator: 'equals',
        },
      },
      {
        id: 'notes',
        type: 'text',
        label: 'Additional Notes',
        placeholder: 'Any additional details...',
        value: '',
        voiceInput: true,
        smartSuggestions: true,
      },
    ],
    autoSave: true,
    smartDefaults: true,
    progressTracking: true,
  },
];

interface DataInputSimplificationProps {
  template?: FormTemplate;
  initialData?: Record<string, any>;
  onSubmit?: (data: Record<string, any>) => void;
  onSave?: (data: Record<string, any>) => void;
  onCancel?: () => void;
  enableTemplates?: boolean;
  enableSmartFeatures?: boolean;
  testID?: string;
}

/**
 * Data Input Simplification Component
 * Provides a streamlined interface for complex data entry
 */
export const DataInputSimplification: React.FC<
  DataInputSimplificationProps
> = ({
  template,
  initialData = {},
  onSubmit,
  onSave,
  onCancel,
  enableTemplates = true,
  enableSmartFeatures = true,
  testID,
}) => {
  const { theme } = useTheme();
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(
    template || null,
  );
  const [state, setState] = useState<DataInputState>({
    formData: initialData,
    errors: {},
    touched: Record<string, boolean> = {},
    isValid: false,
    currentStep: 0,
    totalSteps: 1,
    progress: 0,
    suggestions: {},
    recentInputs: {},
    voiceRecording: false,
    scanningBarcode: false,
    autoSaveEnabled: true,
    smartMode: enableSmartFeatures,
  });

  const scrollViewRef = useRef<ScrollView>(null);
  const inputRefs = useRef<Map<string, TextInput>>(new Map());
  const animationValues = useRef<Map<string, Animated.Value>>(new Map());
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (selectedTemplate) {
      initializeForm();
      loadRecentInputs();
      loadSuggestions();
    }
  }, [selectedTemplate]);

  useEffect(() => {
    validateForm();
    updateProgress();

    if (state.autoSaveEnabled && selectedTemplate?.autoSave) {
      scheduleAutoSave();
    }
  }, [state.formData]);

  const initializeForm = () => {
    if (!selectedTemplate) return;

    const initialFormData = { ...initialData };
    const totalSteps = Math.ceil(selectedTemplate.fields.length / 3);

    selectedTemplate.fields.forEach(field => {
      if (!animationValues.current.has(field.id)) {
        animationValues.current.set(field.id, new Animated.Value(0));
      }

      if (selectedTemplate.smartDefaults && !initialFormData[field.id]) {
        initialFormData[field.id] = getSmartDefault(field);
      }
    });

    setState(prev => ({
      ...prev,
      formData: initialFormData,
      totalSteps,
      currentStep: 0,
    }));
  };

  const getSmartDefault = (field: InputField): any => {
    switch (field.type) {
      case 'date':
        return new Date().toISOString().split('T')[0];
      case 'time':
        return new Date().toTimeString().split(' ')[0].slice(0, 5);
      case 'toggle':
        return false;
      case 'slider':
        return field.validation?.min || 0;
      default:
        return field.value || '';
    }
  };

  const loadRecentInputs = async () => {
    try {
      const recentData = await AsyncStorage.getItem('recentInputs');
      if (recentData) {
        const parsed = JSON.parse(recentData);
        setState(prev => ({ ...prev, recentInputs: parsed }));
      }
    } catch (error) {
      console.error('Failed to load recent inputs:', error);
    }
  };

  const saveRecentInput = async (fieldId: string, value: any) => {
    try {
      const current = state.recentInputs[fieldId] || [];
      const updated = [value, ...current.filter(v => v !== value)].slice(0, 5);
      const newRecentInputs = { ...state.recentInputs, [fieldId]: updated };

      await AsyncStorage.setItem(
        'recentInputs',
        JSON.stringify(newRecentInputs),
      );
      setState(prev => ({ ...prev, recentInputs: newRecentInputs }));
    } catch (error) {
      console.error('Failed to save recent input:', error);
    }
  };

  const loadSuggestions = async () => {
    if (!enableSmartFeatures) return;

    try {
      const suggestionsData = await AsyncStorage.getItem('smartSuggestions');
      if (suggestionsData) {
        const parsed = JSON.parse(suggestionsData);
        setState(prev => ({ ...prev, suggestions: parsed }));
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
  };

  const generateSmartSuggestions = (
    field: InputField,
    value: string,
  ): string[] => {
    if (!field.smartSuggestions || !value) return [];

    const suggestions: string[] = [];
    const recent = state.recentInputs[field.id] || [];
    suggestions.push(
      ...recent.filter(r =>
        r.toString().toLowerCase().includes(value.toLowerCase()),
      ),
    );

    if (field.suggestions) {
      suggestions.push(
        ...field.suggestions.filter(s =>
          s.toLowerCase().includes(value.toLowerCase()),
        ),
      );
    }

    return [...new Set(suggestions)].slice(0, 5);
  };

  const validateField = (field: InputField, value: any): string | null => {
    if (field.required && (!value || value === '')) {
      return `${field.label} is required`;
    }

    if (field.validation) {
      const { pattern, min, max, minLength, maxLength, custom } =
        field.validation;

      if (pattern && !pattern.test(value)) {
        return `${field.label} format is invalid`;
      }

      if (typeof value === 'number') {
        if (min !== undefined && value < min) return `${field.label} must be at least ${min}`;
        if (max !== undefined && value > max) return `${field.label} must be at most ${max}`;
      }

      if (typeof value === 'string') {
        if (minLength !== undefined && value.length < minLength) return `${field.label} must be at least ${minLength}`;
        if (maxLength !== undefined && value.length > maxLength) return `${field.label} must be at most ${maxLength}`;
      }

      if (custom) {
        const customError = custom(value);
        if (customError) return customError;
      }
    }

    return null;
  };

  const validateForm = () => {
    if (!selectedTemplate) return;

    const errors: Record<string, string> = {};
    let isValid = true;

    selectedTemplate.fields.forEach(field => {
      if (shouldShowField(field)) {
        const error = validateField(field, state.formData[field.id]);
        if (error) {
          errors[field.id] = error;
          isValid = false;
        }
      }
    });

    setState(prev => ({ ...prev, errors, isValid }));
  };

  const shouldShowField = (field: InputField): boolean => {
    if (!field.conditional) return true;

    const { field: conditionField, value: conditionValue, operator } = field.conditional;
    const fieldValue = state.formData[conditionField];

    switch (operator) {
      case 'equals': return fieldValue === conditionValue;
      case 'not_equals': return fieldValue !== conditionValue;
      case 'greater': return fieldValue > conditionValue;
      case 'less': return fieldValue < conditionValue;
      case 'contains': return fieldValue && fieldValue.includes(conditionValue);
      default: return true;
    }
  };

  const updateProgress = () => {
    if (!selectedTemplate) return;

    const visibleFields = selectedTemplate.fields.filter(shouldShowField);
    const completedFields = visibleFields.filter(field => {
      const value = state.formData[field.id];
      return value !== undefined && value !== null && value !== '';
    });

    const progress = visibleFields.length > 0 ? (completedFields.length / visibleFields.length) * 100 : 0;
    setState(prev => ({ ...prev, progress }));
  };

  const scheduleAutoSave = () => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      onSave?.(state.formData);
    }, 2000);
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    const newFormData = { ...state.formData, [fieldId]: value };
    setState(prev => ({
      ...prev,
      formData: newFormData,
      touched: { ...prev.touched, [fieldId]: true },
    }));

    if (value && typeof value === 'string' && value.length > 2) {
      saveRecentInput(fieldId, value);
    }

    const animValue = animationValues.current.get(fieldId);
    if (animValue) {
      Animated.sequence([
        Animated.timing(animValue, { toValue: 1, duration: 150, useNativeDriver: false }),
        Animated.timing(animValue, { toValue: 0, duration: 150, useNativeDriver: false }),
      ]).start();
    }

    HapticFeedbackService.triggerSelection();
  };

  const handleVoiceInput = async (fieldId: string) => {
    setState(prev => ({ ...prev, voiceRecording: true }));
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      handleFieldChange(fieldId, 'Voice input result');
      HapticFeedbackService.triggerSuccess();
    } catch (error) {
      HapticFeedbackService.triggerError();
    } finally {
      setState(prev => ({ ...prev, voiceRecording: false }));
    }
  };

  const handleBarcodeInput = async (fieldId: string) => {
    setState(prev => ({ ...prev, scanningBarcode: true }));
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      handleFieldChange(fieldId, '1234567890123');
      HapticFeedbackService.triggerSuccess();
    } catch (error) {
      HapticFeedbackService.triggerError();
    } finally {
      setState(prev => ({ ...prev, scanningBarcode: false }));
    }
  };

  const handleSubmit = () => {
    if (!state.isValid) {
      HapticFeedbackService.triggerError();
      Alert.alert('Validation Error', 'Please fix errors');
      return;
    }
    onSubmit?.(state.formData);
    HapticFeedbackService.triggerSuccess();
  };

  const renderTemplateSelector = () => {
    if (!enableTemplates || selectedTemplate) return null;
    return (
      <View style={styles.templateSelector}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Choose Template</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {COMMON_TEMPLATES.map(t => (
            <AnimatedTouchable
              key={t.id}
              onPress={() => setSelectedTemplate(t)}
              style={[styles.templateCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}
            >
              <View style={[styles.templateIcon, { backgroundColor: theme.colors.primary }]}>
                <Ionicons name={t.icon as any} size={24} color={theme.colors.onPrimary} />
              </View>
              <Text style={[styles.templateName, { color: theme.colors.onSurface }]}>{t.name}</Text>
              <Text style={[styles.templateDescription, { color: theme.colors.onSurfaceVariant }]}>{t.description}</Text>
            </AnimatedTouchable>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderProgressBar = () => {
    if (!selectedTemplate?.progressTracking) return null;
    return (
      <View style={[styles.progressContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressTitle, { color: theme.colors.onSurface }]}>Progress</Text>
          <Text style={[styles.progressText, { color: theme.colors.onSurfaceVariant }]}>{Math.round(state.progress)}%</Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: theme.colors.outline }]}>
          <View style={[styles.progressFill, { backgroundColor: theme.colors.primary, width: `${state.progress}%` }]} />
        </View>
      </View>
    );
  };

  const renderField = (field: InputField) => {
    if (!shouldShowField(field)) return null;
    const value = state.formData[field.id];
    const error = state.errors[field.id];
    const touched = state.touched[field.id];
    
    return (
      <View key={field.id} style={[styles.fieldContainer, { borderColor: error && touched ? theme.colors.error : theme.colors.outline }]}>
        <View style={styles.fieldHeader}>
          <Text style={[styles.fieldLabel, { color: theme.colors.onSurface }]}>{field.label}</Text>
          <View style={styles.fieldActions}>
            {field.voiceInput && (
              <AnimatedTouchable onPress={() => handleVoiceInput(field.id)} style={styles.actionButton}>
                <Ionicons name="mic" size={16} />
              </AnimatedTouchable>
            )}
          </View>
        </View>
        {renderFieldInput(field, value, error, touched)}
      </View>
    );
  };

  const renderFieldInput = (field: InputField, value: any, error: string | undefined, touched: boolean) => {
    switch (field.type) {
      case 'select':
        return (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {field.options?.map(o => (
              <AnimatedTouchable key={o.value} onPress={() => handleFieldChange(field.id, o.value)} style={[styles.selectOption, { backgroundColor: value === o.value ? theme.colors.primary : theme.colors.surfaceVariant }]}>
                <Text style={{ color: value === o.value ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }}>{o.label}</Text>
              </AnimatedTouchable>
            ))}
          </ScrollView>
        );
      default:
        return (
          <TextInput
            style={[styles.textInput, { backgroundColor: theme.colors.surface, color: theme.colors.onSurface, borderColor: error && touched ? theme.colors.error : theme.colors.outline }]}
            value={value?.toString() || ''}
            onChangeText={t => handleFieldChange(field.id, t)}
            placeholder={field.placeholder}
          />
        );
    }
  };

  const renderFormActions = () => (
    <View style={styles.formActions}>
      <AnimatedTouchable onPress={handleSubmit} style={[styles.actionButton, styles.submitButton, { backgroundColor: theme.colors.primary }]} disabled={!state.isValid}>
        <Text style={{ color: theme.colors.onPrimary }}>Submit</Text>
      </AnimatedTouchable>
    </View>
  );

  if (!selectedTemplate) return <View style={styles.container}>{renderTemplateSelector()}</View>;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {renderProgressBar()}
      <ScrollView stretch style={styles.formContainer}>
        {selectedTemplate.fields.map(renderField)}
        {renderFormActions()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  templateSelector: { padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold' },
  templateCard: { width: 200, padding: 16, marginRight: 12, borderRadius: 12, borderWidth: 1 },
  templateIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  templateName: { fontSize: 16, fontWeight: '600' },
  templateDescription: { fontSize: 12 },
  progressContainer: { margin: 16, padding: 16, borderRadius: 12 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  progressTitle: { fontSize: 16, fontWeight: '600' },
  progressText: { fontSize: 12 },
  progressBar: { height: 6, borderRadius: 3 },
  progressFill: { height: '100%', borderRadius: 3 },
  formContainer: { flex: 1, padding: 16 },
  fieldContainer: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  fieldHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  fieldLabel: { fontSize: 16, fontWeight: '600' },
  fieldActions: { flexDirection: 'row', gap: 8 },
  actionButton: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  textInput: { borderWidth: 1, borderRadius: 8, padding: 12 },
  selectOption: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  formActions: { padding: 16 },
  submitButton: { flex: 1, height: 48 },
});

export default DataInputSimplification;
