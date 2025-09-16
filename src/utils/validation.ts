/**
 * @fileoverview Form Validation Utilities
 * 
 * Centralized form validation logic to eliminate code duplication
 * and provide consistent validation across all forms.
 * 
 * @version 1.0.0
 */

import { VALIDATION_LIMITS, VALIDATION_MESSAGES } from './constants';

// ===================================================================
// TYPES
// ===================================================================

export interface ValidationRule<T> {
  field: keyof T;
  validator: (value: any, formData: T) => string | null;
  required?: boolean;
}

export interface ValidationResult<T> {
  isValid: boolean;
  errors: Partial<Record<keyof T, string>>;
  errorCount: number;
  firstError?: string;
}

export interface ValidationSchema<T> {
  rules: ValidationRule<T>[];
  customValidators?: Array<(data: T) => Partial<Record<keyof T, string>>>;
}

export type Validator = (value: any, formData?: any) => string | null;

// ===================================================================
// BASIC VALIDATORS
// ===================================================================

export const validators = {
  required: (message: string = VALIDATION_MESSAGES.REQUIRED): Validator => 
    (value: any) => {
      if (value === null || value === undefined || value === '' || 
          (Array.isArray(value) && value.length === 0)) {
        return message;
      }
      return null;
    },

  minLength: (min: number, message?: string): Validator => 
    (value: any) => {
      const str = String(value || '');
      if (str.length < min) {
        return message || `Minimum length is ${min} characters`;
      }
      return null;
    },

  maxLength: (max: number, message?: string): Validator => 
    (value: any) => {
      const str = String(value || '');
      if (str.length > max) {
        return message || `Maximum length is ${max} characters`;
      }
      return null;
    },

  minValue: (min: number, message?: string): Validator => 
    (value: any) => {
      const num = Number(value);
      if (isNaN(num) || num < min) {
        return message || `Minimum value is ${min}`;
      }
      return null;
    },

  maxValue: (max: number, message?: string): Validator => 
    (value: any) => {
      const num = Number(value);
      if (isNaN(num) || num > max) {
        return message || `Maximum value is ${max}`;
      }
      return null;
    },

  positiveNumber: (message?: string): Validator => 
    (value: any) => {
      const num = Number(value);
      if (isNaN(num) || num <= 0) {
        return message || 'Must be a positive number';
      }
      return null;
    },

  integer: (message?: string): Validator => 
    (value: any) => {
      const num = Number(value);
      if (isNaN(num) || !Number.isInteger(num)) {
        return message || 'Must be a whole number';
      }
      return null;
    },

  email: (message?: string): Validator => 
    (value: any) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(String(value))) {
        return message || 'Invalid email address';
      }
      return null;
    },

  pattern: (regex: RegExp, message: string): Validator => 
    (value: any) => {
      if (value && !regex.test(String(value))) {
        return message;
      }
      return null;
    },

  oneOf: (options: any[], message?: string): Validator => 
    (value: any) => {
      if (value && !options.includes(value)) {
        return message || `Must be one of: ${options.join(', ')}`;
      }
      return null;
    },
};

// ===================================================================
// DOMAIN-SPECIFIC VALIDATORS
// ===================================================================

export const carbonValidators = {
  distance: validators.minValue(0.1, VALIDATION_MESSAGES.INVALID_DISTANCE),
  
  maxDistance: validators.maxValue(
    VALIDATION_LIMITS.DISTANCE_MAX_KM, 
    VALIDATION_MESSAGES.DISTANCE_TOO_HIGH
  ),

  passengers: (value: any) => {
    const num = Number(value);
    if (isNaN(num) || num < VALIDATION_LIMITS.PASSENGERS_MIN || num > VALIDATION_LIMITS.PASSENGERS_MAX) {
      return VALIDATION_MESSAGES.INVALID_PASSENGERS;
    }
    return null;
  },

  energy: validators.positiveNumber(VALIDATION_MESSAGES.INVALID_ENERGY),
  
  maxEnergy: validators.maxValue(
    VALIDATION_LIMITS.ENERGY_MAX_KWH,
    'Energy consumption seems unusually high. Please verify.'
  ),

  food: validators.positiveNumber(VALIDATION_MESSAGES.INVALID_FOOD),
  
  maxFood: validators.maxValue(
    VALIDATION_LIMITS.FOOD_MAX_KG,
    'Food amount seems unusually high. Please verify.'
  ),

  description: validators.minLength(
    VALIDATION_LIMITS.DESCRIPTION_MIN_LENGTH,
    VALIDATION_MESSAGES.DESCRIPTION_REQUIRED
  ),

  maxDescription: validators.maxLength(
    VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH,
    VALIDATION_MESSAGES.DESCRIPTION_TOO_LONG
  ),

  transportMode: validators.oneOf(
    ['car', 'bus', 'train', 'plane', 'bike', 'walk', 'scooter', 'motorcycle'],
    'Please select a valid transportation mode'
  ),

  fuelType: validators.oneOf(
    ['gasoline', 'diesel', 'electric', 'hybrid', 'plugin-hybrid', 'natural-gas'],
    'Please select a valid fuel type'
  ),
};

// ===================================================================
// VALIDATION SCHEMAS
// ===================================================================

// Transportation Form Schema
export const transportationSchema = {
  rules: [
    {
      field: 'mode' as const,
      validator: validators.required('Please select a transportation mode'),
      required: true,
    },
    {
      field: 'mode' as const,
      validator: carbonValidators.transportMode,
    },
    {
      field: 'distance' as const,
      validator: validators.required('Distance is required'),
      required: true,
    },
    {
      field: 'distance' as const,
      validator: carbonValidators.distance,
    },
    {
      field: 'distance' as const,
      validator: carbonValidators.maxDistance,
    },
    {
      field: 'passengers' as const,
      validator: carbonValidators.passengers,
    },
    {
      field: 'description' as const,
      validator: carbonValidators.description,
      required: true,
    },
    {
      field: 'description' as const,
      validator: carbonValidators.maxDescription,
    },
  ],
} as const;

// Energy Form Schema
export const energySchema = {
  rules: [
    {
      field: 'energyType' as const,
      validator: validators.required('Please select an energy type'),
      required: true,
    },
    {
      field: 'amount' as const,
      validator: validators.required('Energy amount is required'),
      required: true,
    },
    {
      field: 'amount' as const,
      validator: carbonValidators.energy,
    },
    {
      field: 'amount' as const,
      validator: carbonValidators.maxEnergy,
    },
    {
      field: 'description' as const,
      validator: carbonValidators.description,
      required: true,
    },
    {
      field: 'description' as const,
      validator: carbonValidators.maxDescription,
    },
  ],
} as const;

// Food Form Schema
export const foodSchema = {
  rules: [
    {
      field: 'foodType' as const,
      validator: validators.required('Please select a food category'),
      required: true,
    },
    {
      field: 'amount' as const,
      validator: validators.required('Food amount is required'),
      required: true,
    },
    {
      field: 'amount' as const,
      validator: carbonValidators.food,
    },
    {
      field: 'amount' as const,
      validator: carbonValidators.maxFood,
    },
    {
      field: 'description' as const,
      validator: carbonValidators.description,
      required: true,
    },
    {
      field: 'description' as const,
      validator: carbonValidators.maxDescription,
    },
  ],
} as const;

// ===================================================================
// VALIDATION ENGINE
// ===================================================================

/**
 * Create a validator function from a schema
 */
export const createValidator = <T extends Record<string, any>>(
  schema: ValidationSchema<T>
) => {
  return {
    validate: (data: T): ValidationResult<T> => {
      const errors: Partial<Record<keyof T, string>> = {};
      
      // Apply schema rules
      for (const rule of schema.rules) {
        const value = data[rule.field];
        const error = rule.validator(value, data);
        
        if (error && !errors[rule.field]) {
          errors[rule.field] = error;
        }
      }
      
      // Apply custom validators
      if (schema.customValidators) {
        for (const customValidator of schema.customValidators) {
          const customErrors = customValidator(data);
          Object.assign(errors, customErrors);
        }
      }
      
      const errorCount = Object.keys(errors).length;
      const firstError = errorCount > 0 ? Object.values(errors)[0] : undefined;
      
      return {
        isValid: errorCount === 0,
        errors,
        errorCount,
        firstError,
      };
    },

    validateField: (field: keyof T, value: any, formData?: T): string | null => {
      const fieldRules = schema.rules.filter(rule => rule.field === field);
      
      for (const rule of fieldRules) {
        const error = rule.validator(value, formData);
        if (error) {
          return error;
        }
      }
      
      return null;
    },

    getRequiredFields: (): Array<keyof T> => {
      return schema.rules
        .filter(rule => rule.required)
        .map(rule => rule.field);
    },
  };
};

// ===================================================================
// PRE-BUILT VALIDATORS
// ===================================================================

export const transportationValidator = createValidator(transportationSchema);
export const energyValidator = createValidator(energySchema);
export const foodValidator = createValidator(foodSchema);

// ===================================================================
// VALIDATION HOOKS
// ===================================================================

/**
 * Custom validation result for React components
 */
export interface UseValidationResult<T> {
  errors: Partial<Record<keyof T, string>>;
  isValid: boolean;
  validate: () => boolean;
  validateField: (field: keyof T) => string | null;
  clearError: (field: keyof T) => void;
  clearAllErrors: () => void;
  hasError: (field: keyof T) => boolean;
  getError: (field: keyof T) => string | null;
}

/**
 * Validation state management for forms
 */
export const createValidationState = <T extends Record<string, any>>(
  validator: ReturnType<typeof createValidator<T>>,
  initialData: T
) => {
  let errors: Partial<Record<keyof T, string>> = {};
  let formData = initialData;

  return {
    setFormData: (newData: T) => {
      formData = newData;
    },

    validate: (): boolean => {
      const result = validator.validate(formData);
      errors = result.errors;
      return result.isValid;
    },

    validateField: (field: keyof T): string | null => {
      const error = validator.validateField(field, formData[field], formData);
      if (error) {
        errors[field] = error;
      } else {
        delete errors[field];
      }
      return error;
    },

    clearError: (field: keyof T) => {
      delete errors[field];
    },

    clearAllErrors: () => {
      errors = {};
    },

    hasError: (field: keyof T): boolean => {
      return !!errors[field];
    },

    getError: (field: keyof T): string | null => {
      return errors[field] || null;
    },

    getAllErrors: () => errors,

    isValid: (): boolean => {
      return Object.keys(errors).length === 0;
    },

    getErrorCount: (): number => {
      return Object.keys(errors).length;
    },
  };
};

// ===================================================================
// UTILITY FUNCTIONS
// ===================================================================

/**
 * Combine multiple validation results
 */
export const combineValidationResults = <T>(...results: ValidationResult<T>[]): ValidationResult<T> => {
  const combinedErrors: Partial<Record<keyof T, string>> = {};
  let isValid = true;
  
  for (const result of results) {
    if (!result.isValid) {
      isValid = false;
    }
    Object.assign(combinedErrors, result.errors);
  }
  
  const errorCount = Object.keys(combinedErrors).length;
  const firstError = errorCount > 0 ? Object.values(combinedErrors)[0] : undefined;
  
  return {
    isValid,
    errors: combinedErrors,
    errorCount,
    firstError,
  };
};

/**
 * Create conditional validator based on another field
 */
export const conditionalValidator = <T>(
  condition: (formData: T) => boolean,
  validator: Validator
): Validator => {
  return (value: any, formData: T) => {
    if (condition(formData)) {
      return validator(value, formData);
    }
    return null;
  };
};

// ===================================================================
// EXPORTS
// ===================================================================

export default {
  validators,
  carbonValidators,
  transportationSchema,
  energySchema,
  foodSchema,
  createValidator,
  transportationValidator,
  energyValidator,
  foodValidator,
  createValidationState,
  combineValidationResults,
  conditionalValidator,
};