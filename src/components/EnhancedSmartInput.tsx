import { HapticFeedbackService } from '../services/HapticFeedbackService';
import { AnimatedTouchable } from './MicroInteractions';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/ThemeProvider';
import { BlurView } from 'expo-blur';
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
  TextInput,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Platform,
  Keyboard,
  Alert,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface ValidationRule {
  type:
    | 'required'
    | 'email'
    | 'phone'
    | 'url'
    | 'number'
    | 'min'
    | 'max'
    | 'pattern'
    | 'custom';
  value?: any;
  message: string;
  validator?: (value: string) => boolean;
}

interface SmartInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'url';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  autoComplete?: string;
  validationRules?: ValidationRule[];
  suggestions?: string[];
  enableSmartSuggestions?: boolean;
  enableAutoFill?: boolean;
  enableVoiceInput?: boolean;
  enableBarcodeScan?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  disabled?: boolean;
  required?: boolean;
  helpText?: string;
  errorText?: string;
  successText?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  onSubmitEditing?: () => void;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

interface SmartSuggestion {
  text: string;
  type: 'history' | 'prediction' | 'correction' | 'completion';
  confidence: number;
  icon?: string;
}

interface InputState {
  isFocused: boolean;
  isValid: boolean;
  errors: string[];
  suggestions: SmartSuggestion[];
  showSuggestions: boolean;
  isLoading: boolean;
}

export const SmartInput: React.FC<SmartInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect = true,
  autoComplete,
  validationRules = [],
  suggestions = [],
  enableSmartSuggestions = true,
  enableAutoFill = true,
  enableVoiceInput = false,
  enableBarcodeScan = false,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  leftIcon,
  rightIcon,
  onRightIconPress,
  disabled = false,
  required = false,
  helpText,
  errorText,
  successText,
  onFocus,
  onBlur,
  onSubmitEditing,
  testID,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { theme } = useTheme();
  const [inputState, setInputState] = useState<InputState>({
    isFocused: false,
    isValid: true,
    errors: [],
    suggestions: [],
    showSuggestions: false,
    isLoading: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [inputHistory, setInputHistory] = useState<string[]>([]);

  const inputRef = useRef<TextInput>(null);
  const labelAnimRef = useRef(new Animated.Value(value ? 1 : 0)).current;
  const borderAnimRef = useRef(new Animated.Value(0)).current;
  const suggestionAnimRef = useRef(new Animated.Value(0)).current;
  const shakeAnimRef = useRef(new Animated.Value(0)).current;

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadInputHistory();
  }, []);

  useEffect(() => {
    validateInput(value);
  }, [value, validationRules]);

  useEffect(() => {
    if (enableSmartSuggestions && value.length > 0) {
      generateSmartSuggestions(value);
    } else {
      setInputState(prev => ({
        ...prev,
        suggestions: [],
        showSuggestions: false,
      }));
    }
  }, [value, enableSmartSuggestions]);

  const loadInputHistory = async () => {
    try {
      // Load input history from storage (implementation depends on your storage solution)
      // const history = await AsyncStorage.getItem(`input_history_${label}`);
      // if (history) {
      //   setInputHistory(JSON.parse(history));
      // }
    } catch (error) {
      console.error('Error loading input history:', error);
    }
  };

  const saveToHistory = useCallback(
    async (text: string) => {
      if (text.length < 2) return;

      const newHistory = [
        text,
        ...inputHistory.filter(item => item !== text),
      ].slice(0, 10);
      setInputHistory(newHistory);

      try {
        // Save to storage
        // await AsyncStorage.setItem(`input_history_${label}`, JSON.stringify(newHistory));
      } catch (error) {
        console.error('Error saving input history:', error);
      }
    },
    [inputHistory, label],
  );

  const validateInput = useCallback(
    (text: string) => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }

      validationTimeoutRef.current = setTimeout(() => {
        const errors: string[] = [];

        for (const rule of validationRules) {
          switch (rule.type) {
            case 'required':
              if (!text.trim()) {
                errors.push(rule.message);
              }
              break;
            case 'email':
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (text && !emailRegex.test(text)) {
                errors.push(rule.message);
              }
              break;
            case 'phone':
              const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
              if (text && !phoneRegex.test(text.replace(/\s/g, ''))) {
                errors.push(rule.message);
              }
              break;
            case 'url':
              try {
                if (text && !new URL(text)) {
                  errors.push(rule.message);
                }
              } catch {
                if (text) errors.push(rule.message);
              }
              break;
            case 'number':
              if (text && isNaN(Number(text))) {
                errors.push(rule.message);
              }
              break;
            case 'min':
              if (text.length < rule.value) {
                errors.push(rule.message);
              }
              break;
            case 'max':
              if (text.length > rule.value) {
                errors.push(rule.message);
              }
              break;
            case 'pattern':
              if (text && !new RegExp(rule.value).test(text)) {
                errors.push(rule.message);
              }
              break;
            case 'custom':
              if (rule.validator && text && !rule.validator(text)) {
                errors.push(rule.message);
              }
              break;
          }
        }

        const isValid = errors.length === 0;
        setInputState(prev => ({ ...prev, errors, isValid }));

        if (!isValid && inputState.isFocused) {
          triggerShakeAnimation();
          HapticFeedbackService.triggerError();
        }
      }, 300);
    },
    [validationRules, inputState.isFocused],
  );

  const generateSmartSuggestions = useCallback(
    (text: string) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(() => {
        const smartSuggestions: SmartSuggestion[] = [];

        // History-based suggestions
        const historySuggestions = inputHistory
          .filter(item => item.toLowerCase().includes(text.toLowerCase()))
          .slice(0, 3)
          .map(item => ({
            text: item,
            type: 'history' as const,
            confidence: 0.8,
            icon: 'time',
          }));

        smartSuggestions.push(...historySuggestions);

        // Predefined suggestions
        const predefinedSuggestions = suggestions
          .filter(item => item.toLowerCase().includes(text.toLowerCase()))
          .slice(0, 3)
          .map(item => ({
            text: item,
            type: 'prediction' as const,
            confidence: 0.9,
            icon: 'bulb',
          }));

        smartSuggestions.push(...predefinedSuggestions);

        // Auto-completion suggestions
        if (
          keyboardType === 'email-address' &&
          text.includes('@') &&
          !text.includes('.')
        ) {
          const emailDomains = [
            'gmail.com',
            'yahoo.com',
            'outlook.com',
            'hotmail.com',
          ];
          const completions = emailDomains.map(domain => ({
            text: text + domain.substring(text.split('@')[1]?.length || 0),
            type: 'completion' as const,
            confidence: 0.7,
            icon: 'mail',
          }));
          smartSuggestions.push(...completions.slice(0, 2));
        }

        // Sort by confidence and limit
        const sortedSuggestions = smartSuggestions
          .sort((a, b) => b.confidence - a.confidence)
          .slice(0, 5);

        setInputState(prev => ({
          ...prev,
          suggestions: sortedSuggestions,
          showSuggestions: sortedSuggestions.length > 0,
        }));

        if (sortedSuggestions.length > 0) {
          animateSuggestions(true);
        }
      }, 300);
    },
    [inputHistory, suggestions, keyboardType],
  );

  const handleFocus = useCallback(() => {
    setInputState(prev => ({ ...prev, isFocused: true }));
    animateLabel(true);
    animateBorder(true);
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    setInputState(prev => ({
      ...prev,
      isFocused: false,
      showSuggestions: false,
    }));
    if (!value) {
      animateLabel(false);
    }
    animateBorder(false);
    animateSuggestions(false);

    if (value) {
      saveToHistory(value);
    }

    onBlur?.();
  }, [value, onBlur, saveToHistory]);

  const handleChangeText = useCallback(
    (text: string) => {
      onChangeText(text);
    },
    [onChangeText],
  );

  const handleSuggestionPress = useCallback(
    (suggestion: SmartSuggestion) => {
      onChangeText(suggestion.text);
      setInputState(prev => ({ ...prev, showSuggestions: false }));
      animateSuggestions(false);
      HapticFeedbackService.triggerSelection();
    },
    [onChangeText],
  );

  const animateLabel = (focused: boolean) => {
    Animated.timing(labelAnimRef, {
      toValue: focused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const animateBorder = (focused: boolean) => {
    Animated.timing(borderAnimRef, {
      toValue: focused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const animateSuggestions = (show: boolean) => {
    Animated.timing(suggestionAnimRef, {
      toValue: show ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const triggerShakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnimRef, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimRef, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimRef, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimRef, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getInputStatus = () => {
    if (errorText || inputState.errors.length > 0) return 'error';
    if (successText) return 'success';
    if (inputState.isFocused) return 'focused';
    return 'default';
  };

  const getStatusColor = () => {
    switch (getInputStatus()) {
      case 'error':
        return theme.colors.error;
      case 'success':
        return theme.colors.primary;
      case 'focused':
        return theme.colors.primary;
      default:
        return theme.colors.outline;
    }
  };

  const getStatusIcon = () => {
    switch (getInputStatus()) {
      case 'error':
        return 'alert-circle';
      case 'success':
        return 'checkmark-circle';
      default:
        return null;
    }
  };

  const labelStyle = {
    top: labelAnimRef.interpolate({
      inputRange: [0, 1],
      outputRange: [multiline ? 20 : 16, -8],
    }),
    fontSize: labelAnimRef.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: labelAnimRef.interpolate({
      inputRange: [0, 1],
      outputRange: [theme.colors.onSurfaceVariant, getStatusColor()],
    }),
  };

  const borderStyle = {
    borderColor: borderAnimRef.interpolate({
      inputRange: [0, 1],
      outputRange: [theme.colors.outline, getStatusColor()],
    }),
    borderWidth: borderAnimRef.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 2],
    }),
  };

  const containerStyle = {
    transform: [{ translateX: shakeAnimRef }],
  };

  const statusIcon = getStatusIcon();
  const displayErrors = errorText ? [errorText] : inputState.errors;

  return (
    <Animated.View style={[styles.container, containerStyle]} testID={testID}>
      <Animated.View style={[styles.inputContainer, borderStyle]}>
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            <Ionicons
              name={leftIcon as any}
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
          </View>
        )}

        <View style={styles.inputWrapper}>
          <Animated.Text style={[styles.label, labelStyle]}>
            {label}
            {required && ' *'}
          </Animated.Text>

          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              {
                color: theme.colors.onSurface,
                minHeight: multiline ? numberOfLines * 20 : undefined,
              },
            ]}
            value={value}
            onChangeText={handleChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onSubmitEditing={onSubmitEditing}
            placeholder={inputState.isFocused ? placeholder : ''}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            secureTextEntry={secureTextEntry && !showPassword}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            autoCorrect={autoCorrect}
            autoComplete={autoComplete}
            multiline={multiline}
            numberOfLines={numberOfLines}
            maxLength={maxLength}
            editable={!disabled}
            selectTextOnFocus={!disabled}
            accessible={true}
            accessibilityLabel={accessibilityLabel || label}
            accessibilityHint={accessibilityHint}
            accessibilityState={{
              disabled,
              selected: inputState.isFocused,
            }}
          />
        </View>

        <View style={styles.rightIconContainer}>
          {secureTextEntry && (
            <AnimatedTouchable
              onPress={() => {
                setShowPassword(!showPassword);
                HapticFeedbackService.triggerSelection();
              }}
              style={styles.iconButton}
              animationType='scale'
              hapticType='selection'
              accessible={true}
              accessibilityRole='button'
              accessibilityLabel={
                showPassword ? 'Hide password' : 'Show password'
              }
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
            </AnimatedTouchable>
          )}

          {enableVoiceInput && (
            <AnimatedTouchable
              onPress={() => {
                // Implement voice input
                HapticFeedbackService.triggerSelection();
              }}
              style={styles.iconButton}
              animationType='scale'
              hapticType='selection'
              accessible={true}
              accessibilityRole='button'
              accessibilityLabel='Voice input'
            >
              <Ionicons
                name='mic'
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
            </AnimatedTouchable>
          )}

          {enableBarcodeScan && (
            <AnimatedTouchable
              onPress={() => {
                // Implement barcode scanning
                HapticFeedbackService.triggerSelection();
              }}
              style={styles.iconButton}
              animationType='scale'
              hapticType='selection'
              accessible={true}
              accessibilityRole='button'
              accessibilityLabel='Scan barcode'
            >
              <Ionicons
                name='barcode'
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
            </AnimatedTouchable>
          )}

          {rightIcon && (
            <AnimatedTouchable
              onPress={onRightIconPress}
              style={styles.iconButton}
              animationType='scale'
              hapticType='selection'
              disabled={!onRightIconPress}
              accessible={true}
              accessibilityRole='button'
            >
              <Ionicons
                name={rightIcon as any}
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
            </AnimatedTouchable>
          )}

          {statusIcon && (
            <Ionicons
              name={statusIcon as any}
              size={20}
              color={getStatusColor()}
            />
          )}
        </View>
      </Animated.View>

      {/* Suggestions */}
      {inputState.showSuggestions && inputState.suggestions.length > 0 && (
        <Animated.View
          style={[
            styles.suggestionsContainer,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outline,
              opacity: suggestionAnimRef,
              transform: [
                {
                  translateY: suggestionAnimRef.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsContent}
          >
            {inputState.suggestions.map((suggestion, index) => (
              <AnimatedTouchable
                key={index}
                onPress={() => handleSuggestionPress(suggestion)}
                style={[
                  styles.suggestionItem,
                  { backgroundColor: theme.colors.surfaceVariant },
                ]}
                animationType='scale'
                hapticType='selection'
                accessible={true}
                accessibilityRole='button'
                accessibilityLabel={`Suggestion: ${suggestion.text}`}
              >
                {suggestion.icon && (
                  <Ionicons
                    name={suggestion.icon as any}
                    size={14}
                    color={theme.colors.onSurfaceVariant}
                  />
                )}
                <Text
                  style={[
                    styles.suggestionText,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                  numberOfLines={1}
                >
                  {suggestion.text}
                </Text>
              </AnimatedTouchable>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {/* Help Text */}
      {helpText &&
        !inputState.isFocused &&
        displayErrors.length === 0 &&
        !successText && (
          <Text
            style={[styles.helpText, { color: theme.colors.onSurfaceVariant }]}
          >
            {helpText}
          </Text>
        )}

      {/* Error Messages */}
      {displayErrors.length > 0 && (
        <View style={styles.messagesContainer}>
          {displayErrors.map((error, index) => (
            <Text
              key={index}
              style={[styles.errorText, { color: theme.colors.error }]}
            >
              {error}
            </Text>
          ))}
        </View>
      )}

      {/* Success Message */}
      {successText && displayErrors.length === 0 && (
        <Text style={[styles.successText, { color: theme.colors.primary }]}>
          {successText}
        </Text>
      )}

      {/* Character Count */}
      {maxLength && (
        <Text
          style={[
            styles.characterCount,
            {
              color:
                value.length > maxLength * 0.9
                  ? theme.colors.error
                  : theme.colors.onSurfaceVariant,
            },
          ]}
        >
          {value.length}/{maxLength}
        </Text>
      )}
    </Animated.View>
  );
};

// Smart Form Component
interface SmartFormProps {
  children: React.ReactNode;
  onSubmit?: (data: Record<string, any>) => void;
  validationMode?: 'onChange' | 'onBlur' | 'onSubmit';
  enableAutoSave?: boolean;
  autoSaveInterval?: number;
  testID?: string;
}

export const SmartForm: React.FC<SmartFormProps> = ({
  children,
  onSubmit,
  validationMode = 'onBlur',
  enableAutoSave = false,
  autoSaveInterval = 5000,
  testID,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (enableAutoSave) {
      setupAutoSave();
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [enableAutoSave, formData]);

  const setupAutoSave = () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      saveFormData();
    }, autoSaveInterval);
  };

  const saveFormData = async () => {
    try {
      // Implement auto-save logic
      console.log('Auto-saving form data:', formData);
    } catch (error) {
      console.error('Error auto-saving form:', error);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Validate all fields
      const hasErrors = Object.keys(formErrors).some(
        key => formErrors[key].length > 0,
      );

      if (hasErrors) {
        HapticFeedbackService.triggerError();
        return;
      }

      await onSubmit?.(formData);
      HapticFeedbackService.triggerSuccess();
    } catch (error) {
      console.error('Form submission error:', error);
      HapticFeedbackService.triggerError();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.formContainer} testID={testID}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  leftIconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  inputWrapper: {
    flex: 1,
    position: 'relative',
  },
  label: {
    position: 'absolute',
    left: 0,
    fontWeight: '500',
    backgroundColor: 'transparent',
    paddingHorizontal: 4,
    zIndex: 1,
  },
  input: {
    fontSize: 16,
    paddingTop: 8,
    paddingBottom: 0,
    textAlignVertical: 'top',
  },
  rightIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
    marginTop: 2,
  },
  iconButton: {
    padding: 4,
  },
  suggestionsContainer: {
    marginTop: 4,
    borderRadius: 8,
    borderWidth: 1,
    maxHeight: 120,
  },
  suggestionsContent: {
    padding: 8,
    gap: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
    maxWidth: 200,
  },
  suggestionText: {
    fontSize: 14,
    flex: 1,
  },
  helpText: {
    fontSize: 12,
    marginTop: 4,
    marginHorizontal: 16,
  },
  messagesContainer: {
    marginTop: 4,
    marginHorizontal: 16,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 2,
  },
  successText: {
    fontSize: 12,
    marginTop: 4,
    marginHorizontal: 16,
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
    marginHorizontal: 16,
  },
  formContainer: {
    flex: 1,
  },
});

export default SmartInput;
