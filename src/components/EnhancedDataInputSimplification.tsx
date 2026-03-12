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
    const totalSteps = Math.ceil(selectedTemplate.fields.length / 3); // 3 fields per step

    // Initialize animation values
    selectedTemplate.fields.forEach(field => {
      if (!animationValues.current.has(field.id)) {
        animationValues.current.set(field.id, new Animated.Value(0));
      }

      // Set smart defaults
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
    // Smart defaults based on field type and context
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
        if (min !== undefined && value < min) {
          return `${field.label} must be at least ${min}`;
        }
        if (max !== undefined && value > max) {
          return `${field.label} must be at most ${max}`;
        }
      }

      if (typeof value === 'string') {
        if (minLength !== undefined && value.length < minLength) {
          return `${field.label} must be at least ${minLength} characters`;
        }
        if (maxLength !== undefined && value.length > maxLength) {
          return `${field.label} must be at most ${maxLength} characters`;
        }
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
        return fieldValue && fieldValue.includes(conditionValue);
      default:
        return true;
    }
  };

  const updateProgress = () => {
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
  };

  const scheduleAutoSave = () => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    autoSaveTimer.current = setTimeout(() => {
      onSave?.(state.formData);
    }, 2000); // Auto-save after 2 seconds of inactivity
  };

  const handleFieldChange = (fieldId: string, value: any) => {
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
                  name={template.icon as any}
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
                name={field.icon as any}
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

  const renderFieldInput = (
    field: InputField,
    value: any,
    error: string | undefined,
    touched: boolean,
  ) => {
    switch (field.type) {
      case 'select':
        return (
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
                    name={option.icon as any}
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

      case 'slider':
        return (
          <View style={styles.sliderContainer}>
            <Text
              style={[styles.sliderValue, { color: theme.colors.onSurface }]}
            >
              {value || field.validation?.min || 0}
            </Text>
            {/* Slider implementation would go here */}
          </View>
        );

      case 'toggle':
        return (
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

      default:
        return (
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
            value={value?.toString() || ''}
            onChangeText={text => {
              const processedValue =
                field.type === 'number' ? parseFloat(text) || 0 : text;
              handleFieldChange(field.id, processedValue);
            }}
            placeholder={field.placeholder}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            keyboardType={
              field.type === 'number'
                ? 'numeric'
                : field.type === 'email'
                ? 'email-address'
                : field.type === 'phone'
                ? 'phone-pad'
                : 'default'
            }
            autoCapitalize={field.type === 'email' ? 'none' : 'sentences'}
            autoCorrect={field.type !== 'email'}
            multiline={field.id === 'notes'}
            numberOfLines={field.id === 'notes' ? 3 : 1}
          />
        );
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
  container: {
    flex: 1,
  },
  templateSelector: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  templateCard: {
    width: 200,
    padding: 16,
    marginRight: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  templateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  templateDescription: {
    fontSize: 12,
    textAlign: 'center',
  },
  progressContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressText: {
    fontSize: 12,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
  formHeader: {
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  formDescription: {
    fontSize: 14,
  },
  fieldsContainer: {
    gap: 16,
  },
  fieldContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fieldLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  fieldActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 44,
  },
  selectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 8,
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
  toggleContainer: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  suggestionsContainer: {
    marginTop: 8,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  suggestionText: {
    fontSize: 12,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  helpText: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 32,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButton: {
    flex: 2,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DataInputSimplification;
