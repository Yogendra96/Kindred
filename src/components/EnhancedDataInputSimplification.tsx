import React, { useEffect, useCallback, useRef, useState } from 'react';

import {
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  // Keyboard,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import HapticFeedbackService from '../services/HapticFeedbackService';
import { useTheme } from '../theme/ThemeProvider';

import { AnimatedTouchable } from './MicroInteractions';

// import { LinearGradient } from 'expo-linear-gradient';

// Note: These expo modules would need to be installed separately
// import * as Speech from 'expo-speech';
// import { Camera } from 'expo-camera';
// import { BarCodeScanner } from 'expo-barcode-scanner';

// Placeholder objects for expo modules
const _BarCodeScanner = {
  requestPermissionsAsync: () => Promise.resolve({ status: 'granted' }),
};
const _Camera = {
  requestCameraPermissionsAsync: () => Promise.resolve({ status: 'granted' }),
};
const _Speech = {
  speak: () => {},
  isSpeakingAsync: () => Promise.resolve(false),
  stop: () => {},
};

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
  value: unknown;
  required?: boolean;
  validation?: {
    pattern?: RegExp;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    custom?: (value: unknown) => string | null;
  };
  options?: Array<{ label: string; value: unknown; icon?: string }>;
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
    value: unknown;
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
  formData: Record<string, unknown>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
  currentStep: number;
  totalSteps: number;
  progress: number;
  suggestions: Record<string, string[]>;
  recentInputs: Record<string, unknown[]>;
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
  initialData?: Record<string, unknown>;
  onSubmit?: (data: Record<string, unknown>) => void;
  onSave?: (data: Record<string, unknown>) => void;
  onCancel?: () => void;
  enableTemplates?: boolean;
  enableSmartFeatures?: boolean;
  testID?: string;
}

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
    touched: {},
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
  }, [selectedTemplate, initializeForm, loadRecentInputs, loadSuggestions]);

  useEffect(() => {
    validateForm();
    updateProgress();

    if (state.autoSaveEnabled && selectedTemplate?.autoSave) {
      scheduleAutoSave();
    }
  }, [
    state.formData,
    state.autoSaveEnabled,
    selectedTemplate?.autoSave,
    validateForm,
    updateProgress,
    scheduleAutoSave,
  ]);

  const initializeForm = useCallback(() => {
    if (!selectedTemplate) return;

    const initialFormData = { ...initialData };
    const totalSteps = Math.ceil(selectedTemplate.fields.length / 3); // 3 fields per step

    // Initialize animation values
    for (const field of selectedTemplate.fields) {
      if (!animationValues.current.has(field.id)) {
        animationValues.current.set(field.id, new Animated.Value(0));
      }

      // Set smart defaults
      if (selectedTemplate.smartDefaults && !initialFormData[field.id]) {
        initialFormData[field.id] = getSmartDefault(field);
      }
    }

    setState(prev => ({
      ...prev,
      formData: initialFormData,
      totalSteps,
      currentStep: 0,
    }));
  }, [selectedTemplate, initialData, getSmartDefault]);

  const getSmartDefault = useCallback((field: InputField): unknown => {
    // Smart defaults based on field type and context
    switch (field.type) {
      case 'date':
        return new Date().toISOString().split('T')[0];
      case 'time':
        return new Date().toTimeString().split(' ')[0].slice(0, 5);
      case 'toggle':
        return false;
      case 'slider':
        return field.validation?.min ?? 0;
      default:
        return field.value ?? '';
    }
  }, []);

  const loadRecentInputs = useCallback(async () => {
    try {
      const recentData = await AsyncStorage.getItem('recentInputs');
      if (recentData) {
        const parsed = JSON.parse(recentData);
        setState(prev => ({ ...prev, recentInputs: parsed }));
      }
    } catch (error) {
      console.error('Failed to load recent inputs:', error);
    }
  }, []);

  const saveRecentInput = async (fieldId: string, value: unknown) => {
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

  const loadSuggestions = useCallback(async () => {
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
  }, [enableSmartFeatures]);

  const generateSmartSuggestions = (
    field: InputField,
    value: string,
  ): string[] => {
    if (!field.smartSuggestions || !value) return [];

    const suggestions: string[] = [];

    // Add recent inputs
    const recent = state.recentInputs[field.id] || [];
    suggestions.push(
      ...recent.filter(r =>
        r.toString().toLowerCase().includes(value.toLowerCase()),
      ),
    );

    // Add predefined suggestions
    if (field.suggestions) {
      suggestions.push(
        ...field.suggestions.filter(s =>
          s.toLowerCase().includes(value.toLowerCase()),
        ),
      );
    }

    // Add contextual suggestions based on field type
    if (field.type === 'text' && field.id === 'notes') {
      const contextualSuggestions = [
        'Regular commute to work',
        'Weekend trip',
        'Business travel',
        'Grocery shopping',
        'Exercise activity',
      ];
      suggestions.push(
        ...contextualSuggestions.filter(s =>
          s.toLowerCase().includes(value.toLowerCase()),
        ),
      );
    }

    return [...new Set(suggestions)].slice(0, 5);
  };

  // Helper validation functions to reduce cognitive complexity
  const validateRequired = (field: InputField, value: unknown): string | null => {
    if (field.required && (!value || value === '')) {
      return `${field.label} is required`;
    }
    return null;
  };

  const validatePattern = (field: InputField, value: unknown, pattern: RegExp): string | null => {
    if (pattern && !pattern.test(value as string)) {
      return `${field.label} format is invalid`;
    }
    return null;
  };

  const validateNumberRange = (field: InputField, value: number, min?: number, max?: number): string | null => {
    if (min !== undefined && value < min) {
      return `${field.label} must be at least ${min}`;
    }
    if (max !== undefined && value > max) {
      return `${field.label} must be at most ${max}`;
    }
    return null;
  };

  const validateStringLength = (field: InputField, value: string, minLength?: number, maxLength?: number): string | null => {
    if (minLength !== undefined && value.length < minLength) {
      return `${field.label} must be at least ${minLength} characters`;
    }
    if (maxLength !== undefined && value.length > maxLength) {
      return `${field.label} must be at most ${maxLength} characters`;
    }
    return null;
  };

  const validateCustom = (customValidator: (value: unknown) => string | null, value: unknown): string | null => {
    return customValidator(value);
  };

  const validateField = useCallback(
    (field: InputField, value: unknown): string | null => {
      const requiredError = validateRequired(field, value);
      if (requiredError) return requiredError;

      if (!field.validation) return null;

      const { pattern, min, max, minLength, maxLength, custom } = field.validation;

      if (pattern) {
        const patternError = validatePattern(field, value, pattern);
        if (patternError) return patternError;
      }

      if (typeof value === 'number') {
        const rangeError = validateNumberRange(field, value, min, max);
        if (rangeError) return rangeError;
      }

      if (typeof value === 'string') {
        const lengthError = validateStringLength(field, value, minLength, maxLength);
        if (lengthError) return lengthError;
      }

      if (custom) {
        const customError = validateCustom(custom, value);
        if (customError) return customError;
      }

      return null;
    },
    [],
  );

  const validateForm = useCallback(() => {
    if (!selectedTemplate) return;

    const errors: Record<string, string> = {};
    let isValid = true;

    for (const field of selectedTemplate.fields) {
      if (shouldShowField(field)) {
        const error = validateField(field, state.formData[field.id]);
        if (error) {
          errors[field.id] = error;
          isValid = false;
        }
      }
    }

    setState(prev => ({ ...prev, errors, isValid }));
  }, [selectedTemplate, state.formData, shouldShowField, validateField]);

  const shouldShowField = useCallback(
    (field: InputField): boolean => {
      if (!field.conditional) return true;

      const {
        field: conditionField,
        value: conditionValue,
        operator,
      } = field.conditional;
      const fieldValue = state.formData[conditionField];

      switch (operator) {
        case 'equals':
          return fieldValue === conditionValue;
        case 'not_equals':
          return fieldValue !== conditionValue;
        case 'greater':
          return fieldValue > conditionValue;
        case 'less':
          return fieldValue < conditionValue;
        case 'contains':
          return fieldValue?.includes?.(conditionValue);
        default:
          return true;
      }
    },
    [state.formData],
  );

  const updateProgress = useCallback(() => {
    if (!selectedTemplate) return;

    const visibleFields = selectedTemplate.fields.filter(shouldShowField);
    const completedFields = visibleFields.filter(field => {
      const value = state.formData[field.id];
      return value !== undefined && value !== null && value !== '';
    });

    const progress =
      visibleFields.length > 0
        ? (completedFields.length / visibleFields.length) * 100
        : 0;
    setState(prev => ({ ...prev, progress }));
  }, [selectedTemplate, shouldShowField, state.formData]);

  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    autoSaveTimer.current = setTimeout(() => {
      onSave?.(state.formData);
    }, 2000); // Auto-save after 2 seconds of inactivity
  }, [onSave, state.formData]);

  const handleFieldChange = (fieldId: string, value: unknown) => {
    const newFormData = { ...state.formData, [fieldId]: value };
    setState(prev => ({
      ...prev,
      formData: newFormData,
      touched: { ...prev.touched, [fieldId]: true },
    }));

    // Save to recent inputs for text fields
    if (value && typeof value === 'string' && value.length > 2) {
      saveRecentInput(fieldId, value);
    }

    // Animate field
    const animValue = animationValues.current.get(fieldId);
    if (animValue) {
      Animated.sequence([
        Animated.timing(animValue, {
          toValue: 1,
          duration: 150,
          useNativeDriver: false,
        }),
        Animated.timing(animValue, {
          toValue: 0,
          duration: 150,
          useNativeDriver: false,
        }),
      ]).start();
    }

    HapticFeedbackService.triggerSelection();
  };

  const handleVoiceInput = async (fieldId: string) => {
    setState(prev => ({ ...prev, voiceRecording: true }));

    try {
      // Voice input implementation would go here
      // For now, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockVoiceResult = 'Voice input result';
      handleFieldChange(fieldId, mockVoiceResult);

      HapticFeedbackService.triggerSuccess();
    } catch (error) {
      console.error('Voice input failed:', error);
      HapticFeedbackService.triggerError();
    } finally {
      setState(prev => ({ ...prev, voiceRecording: false }));
    }
  };

  const handleBarcodeInput = async (fieldId: string) => {
    setState(prev => ({ ...prev, scanningBarcode: true }));

    try {
      // Barcode scanning implementation would go here
      // For now, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockBarcodeResult = '1234567890123';
      handleFieldChange(fieldId, mockBarcodeResult);

      HapticFeedbackService.triggerSuccess();
    } catch (error) {
      console.error('Barcode scanning failed:', error);
      HapticFeedbackService.triggerError();
    } finally {
      setState(prev => ({ ...prev, scanningBarcode: false }));
    }
  };

  const handleSubmit = () => {
    if (!state.isValid) {
      HapticFeedbackService.triggerError();
      Alert.alert(
        'Validation Error',
        'Please fix the errors before submitting.',
      );
      return;
    }

    onSubmit?.(state.formData);
    HapticFeedbackService.triggerSuccess();
  };

  const renderTemplateSelector = () => {
    if (!enableTemplates || selectedTemplate) return null;

    return (
      <View style={styles.templateSelector}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Choose a Template
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {COMMON_TEMPLATES.map(template => (
            <AnimatedTouchable
              key={template.id}
              onPress={() => {
                setSelectedTemplate(template);
                HapticFeedbackService.triggerSelection();
              }}
              style={[
                styles.templateCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.outline,
                },
              ]}
              animationType='scale'
              hapticType='selection'
            >
              <View
                style={[
                  styles.templateIcon,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <Ionicons
                  name={template.icon as string}
                  size={24}
                  color={theme.colors.onPrimary}
                />
              </View>

              <Text
                style={[styles.templateName, { color: theme.colors.onSurface }]}
              >
                {template.name}
              </Text>

              <Text
                style={[
                  styles.templateDescription,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {template.description}
              </Text>
            </AnimatedTouchable>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderProgressBar = () => {
    if (!selectedTemplate?.progressTracking) return null;

    return (
      <View
        style={[
          styles.progressContainer,
          { backgroundColor: theme.colors.surfaceVariant },
        ]}
      >
        <View style={styles.progressHeader}>
          <Text
            style={[styles.progressTitle, { color: theme.colors.onSurface }]}
          >
            Progress
          </Text>
          <Text
            style={[
              styles.progressText,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {Math.round(state.progress)}% Complete
          </Text>
        </View>

        <View
          style={[
            styles.progressBar,
            { backgroundColor: theme.colors.outline },
          ]}
        >
          <Animated.View
            style={[
              styles.progressFill,
              {
                backgroundColor: theme.colors.primary,
                width: `${state.progress}%`,
              },
            ]}
          />
        </View>
      </View>
    );
  };

  const renderField = (field: InputField) => {
    if (!shouldShowField(field)) return null;

    const value = state.formData[field.id];
    const error = state.errors[field.id];
    const touched = state.touched[field.id];
    const animValue =
      animationValues.current.get(field.id) || new Animated.Value(0);

    const borderColor = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [
        error && touched ? theme.colors.error : theme.colors.outline,
        theme.colors.primary,
      ],
    });

    const suggestions = field.smartSuggestions
      ? generateSmartSuggestions(field, value)
      : [];

    return (
      <Animated.View
        key={field.id}
        style={[styles.fieldContainer, { borderColor }]}
      >
        <View style={styles.fieldHeader}>
          <View style={styles.fieldLabelContainer}>
            {field.icon && (
              <Ionicons
                name={field.icon as string}
                size={20}
                color={theme.colors.primary}
              />
            )}
            <Text
              style={[styles.fieldLabel, { color: theme.colors.onSurface }]}
            >
              {field.label}
              {field.required && (
                <Text style={{ color: theme.colors.error }}> *</Text>
              )}
            </Text>
          </View>

          <View style={styles.fieldActions}>
            {field.voiceInput && (
              <AnimatedTouchable
                onPress={() => handleVoiceInput(field.id)}
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: state.voiceRecording
                      ? theme.colors.error
                      : theme.colors.surfaceVariant,
                  },
                ]}
                animationType='scale'
                hapticType='selection'
                disabled={state.voiceRecording}
              >
                <Ionicons
                  name={state.voiceRecording ? 'stop' : 'mic'}
                  size={16}
                  color={
                    state.voiceRecording
                      ? theme.colors.onError
                      : theme.colors.onSurfaceVariant
                  }
                />
              </AnimatedTouchable>
            )}

            {field.barcodeInput && (
              <AnimatedTouchable
                onPress={() => handleBarcodeInput(field.id)}
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: state.scanningBarcode
                      ? theme.colors.primary
                      : theme.colors.surfaceVariant,
                  },
                ]}
                animationType='scale'
                hapticType='selection'
                disabled={state.scanningBarcode}
              >
                <Ionicons
                  name='barcode'
                  size={16}
                  color={
                    state.scanningBarcode
                      ? theme.colors.onPrimary
                      : theme.colors.onSurfaceVariant
                  }
                />
              </AnimatedTouchable>
            )}
          </View>
        </View>

        {renderFieldInput(field, value, error, touched)}

        {suggestions.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.suggestionsContainer}
          >
            {suggestions.map((suggestion, index) => (
              <AnimatedTouchable
                key={index}
                onPress={() => handleFieldChange(field.id, suggestion)}
                style={[
                  styles.suggestionChip,
                  { backgroundColor: theme.colors.surfaceVariant },
                ]}
                animationType='scale'
                hapticType='selection'
              >
                <Text
                  style={[
                    styles.suggestionText,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {suggestion}
                </Text>
              </AnimatedTouchable>
            ))}
          </ScrollView>
        )}

        {error && touched && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error}
          </Text>
        )}

        {field.helpText && (
          <Text
            style={[styles.helpText, { color: theme.colors.onSurfaceVariant }]}
          >
            {field.helpText}
          </Text>
        )}
      </Animated.View>
    );
  };

  // Helper render functions to reduce cognitive complexity
  const renderSelectField = (field: InputField, value: unknown) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {field.options?.map(option => (
        <AnimatedTouchable
          key={option.value}
          onPress={() => handleFieldChange(field.id, option.value)}
          style={[
            styles.selectOption,
            {
              backgroundColor:
                value === option.value
                  ? theme.colors.primary
                  : theme.colors.surfaceVariant,
            },
          ]}
          animationType='scale'
          hapticType='selection'
        >
          {option.icon && (
            <Ionicons
              name={option.icon as string}
              size={20}
              color={
                value === option.value
                  ? theme.colors.onPrimary
                  : theme.colors.onSurfaceVariant
              }
            />
          )}
          <Text
            style={[
              styles.selectOptionText,
              {
                color:
                  value === option.value
                    ? theme.colors.onPrimary
                    : theme.colors.onSurfaceVariant,
              },
            ]}
          >
            {option.label}
          </Text>
        </AnimatedTouchable>
      ))}
    </ScrollView>
  );

  const renderSliderField = (field: InputField, value: unknown) => (
    <View style={styles.sliderContainer}>
      <Text style={[styles.sliderValue, { color: theme.colors.onSurface }]}>
        {value ?? field.validation?.min ?? 0}
      </Text>
      {/* Slider implementation would go here */}
    </View>
  );

  const renderToggleField = (field: InputField, value: unknown) => (
    <AnimatedTouchable
      onPress={() => handleFieldChange(field.id, !value)}
      style={[
        styles.toggleContainer,
        {
          backgroundColor: value
            ? theme.colors.primary
            : theme.colors.surfaceVariant,
        },
      ]}
      animationType='scale'
      hapticType='selection'
    >
      <Animated.View
        style={[
          styles.toggleThumb,
          {
            backgroundColor: theme.colors.surface,
            transform: [{ translateX: value ? 20 : 0 }],
          },
        ]}
      />
    </AnimatedTouchable>
  );

  const getKeyboardType = (fieldType: string) => {
    switch (fieldType) {
      case 'number': return 'numeric';
      case 'email': return 'email-address';
      case 'phone': return 'phone-pad';
      default: return 'default';
    }
  };

  const renderTextInputField = (field: InputField, value: unknown, error: string | undefined, touched: boolean) => (
    <TextInput
      ref={ref => {
        if (ref) inputRefs.current.set(field.id, ref);
      }}
      style={[
        styles.textInput,
        {
          backgroundColor: theme.colors.surface,
          color: theme.colors.onSurface,
          borderColor:
            error && touched ? theme.colors.error : theme.colors.outline,
        },
      ]}
      value={value?.toString() ?? ''}
      onChangeText={text => {
        const processedValue =
          field.type === 'number' ? parseFloat(text) || 0 : text;
        handleFieldChange(field.id, processedValue);
      }}
      placeholder={field.placeholder}
      placeholderTextColor={theme.colors.onSurfaceVariant}
      keyboardType={getKeyboardType(field.type)}
      autoCapitalize={field.type === 'email' ? 'none' : 'sentences'}
      autoCorrect={field.type !== 'email'}
      multiline={field.id === 'notes'}
      numberOfLines={field.id === 'notes' ? 3 : 1}
    />
  );

  const renderFieldInput = (
    field: InputField,
    value: unknown,
    error: string | undefined,
    touched: boolean,
  ) => {
    switch (field.type) {
      case 'select':
        return renderSelectField(field, value);
      case 'slider':
        return renderSliderField(field, value);
      case 'toggle':
        return renderToggleField(field, value);
      default:
        return renderTextInputField(field, value, error, touched);
    }
  };

  const renderFormActions = () => {
    return (
      <View style={styles.formActions}>
        {onCancel && (
          <AnimatedTouchable
            onPress={onCancel}
            style={[
              styles.actionButton,
              styles.cancelButton,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
            animationType='scale'
            hapticType='selection'
          >
            <Text
              style={[
                styles.actionButtonText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Cancel
            </Text>
          </AnimatedTouchable>
        )}

        <AnimatedTouchable
          onPress={handleSubmit}
          style={[
            styles.actionButton,
            styles.submitButton,
            {
              backgroundColor: state.isValid
                ? theme.colors.primary
                : theme.colors.surfaceVariant,
            },
          ]}
          animationType='scale'
          hapticType='medium'
          disabled={!state.isValid}
        >
          <Text
            style={[
              styles.actionButtonText,
              {
                color: state.isValid
                  ? theme.colors.onPrimary
                  : theme.colors.onSurfaceVariant,
              },
            ]}
          >
            Submit
          </Text>
        </AnimatedTouchable>
      </View>
    );
  };

  if (!selectedTemplate) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        testID={testID}
      >
        {renderTemplateSelector()}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      testID={testID}
    >
      {renderProgressBar()}

      <ScrollView
        ref={scrollViewRef}
        style={styles.formContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
      >
        <View style={styles.formHeader}>
          <Text style={[styles.formTitle, { color: theme.colors.onSurface }]}>
            {selectedTemplate.name}
          </Text>
          <Text
            style={[
              styles.formDescription,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {selectedTemplate.description}
          </Text>
        </View>

        <View style={styles.fieldsContainer}>
          {selectedTemplate.fields.map(renderField)}
        </View>

        {renderFormActions()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    height: 48,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  fieldActions: {
    flexDirection: 'row',
    gap: 8,
  },
  fieldContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  fieldHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  fieldLabelContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  fieldsContainer: {
    gap: 16,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
    marginTop: 24,
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
  formDescription: {
    fontSize: 14,
  },
  formHeader: {
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  progressBar: {
    borderRadius: 3,
    height: 6,
    overflow: 'hidden',
  },
  progressContainer: {
    borderRadius: 12,
    margin: 16,
    padding: 16,
  },
  progressFill: {
    borderRadius: 3,
    height: '100%',
  },
  progressHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  selectOption: {
    alignItems: 'center',
    borderRadius: 20,
    flexDirection: 'row',
    gap: 8,
    marginRight: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  selectOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sliderContainer: {
    alignItems: 'center',
  },
  sliderValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  submitButton: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 2,
    height: 48,
    justifyContent: 'center',
  },
  suggestionChip: {
    borderRadius: 16,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  suggestionText: {
    fontSize: 12,
  },
  suggestionsContainer: {
    marginTop: 8,
  },
  templateCard: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 12,
    padding: 16,
    width: 200,
  },
  templateDescription: {
    fontSize: 12,
    textAlign: 'center',
  },
  templateIcon: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    marginBottom: 12,
    width: 48,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  templateSelector: {
    padding: 16,
  },
  textInput: {
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 44,
    padding: 12,
  },
  toggleContainer: {
    borderRadius: 15,
    height: 30,
    justifyContent: 'center',
    paddingHorizontal: 2,
    width: 50,
  },
  toggleThumb: {
    borderRadius: 13,
    height: 26,
    width: 26,
  },
});

export default DataInputSimplification;
