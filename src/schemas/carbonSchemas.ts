// @ts-nocheck
/* eslint-disable */
import { z } from 'zod';
import { VALIDATION_LIMITS, VALIDATION_MESSAGES } from '../utils/constants';

// --- Base Field Schemas ---

const descriptionSchema = z
  .string()
  .min(
    VALIDATION_LIMITS.DESCRIPTION_MIN_LENGTH,
    VALIDATION_MESSAGES.DESCRIPTION_REQUIRED,
  )
  .max(
    VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH,
    VALIDATION_MESSAGES.DESCRIPTION_TOO_LONG,
  );

export const transportModeSchema = z.enum(
  ['car', 'bus', 'train', 'plane', 'bike', 'walk', 'scooter', 'motorcycle'],
  {
    errorMap: () => ({ message: 'Please select a valid transportation mode' }),
  },
);

export const fuelTypeSchema = z.enum(
  ['gasoline', 'diesel', 'electric', 'hybrid', 'plugin-hybrid', 'natural-gas'],
  { errorMap: () => ({ message: 'Please select a valid fuel type' }) },
);

// --- Form Schemas ---

export const TransportationSchema = z.object({
  mode: transportModeSchema,
  distance: z
    .number({
      required_error: 'Distance is required',
      invalid_type_error: 'Must be a number',
    })
    .min(0.1, VALIDATION_MESSAGES.INVALID_DISTANCE)
    .max(
      VALIDATION_LIMITS.DISTANCE_MAX_KM,
      VALIDATION_MESSAGES.DISTANCE_TOO_HIGH,
    ),
  passengers: z
    .number()
    .min(
      VALIDATION_LIMITS.PASSENGERS_MIN,
      VALIDATION_MESSAGES.INVALID_PASSENGERS,
    )
    .max(
      VALIDATION_LIMITS.PASSENGERS_MAX,
      VALIDATION_MESSAGES.INVALID_PASSENGERS,
    )
    .optional(),
  description: descriptionSchema,
});

export const EnergySchema = z.object({
  energyType: z.string({ required_error: 'Please select an energy type' }),
  amount: z
    .number({ required_error: 'Energy amount is required' })
    .positive(VALIDATION_MESSAGES.INVALID_ENERGY)
    .max(
      VALIDATION_LIMITS.ENERGY_MAX_KWH,
      'Energy consumption seems unusually high. Please verify.',
    ),
  description: descriptionSchema,
});

export const FoodSchema = z.object({
  foodType: z.string({ required_error: 'Please select a food category' }),
  amount: z
    .number({ required_error: 'Food amount is required' })
    .positive(VALIDATION_MESSAGES.INVALID_FOOD)
    .max(
      VALIDATION_LIMITS.FOOD_MAX_KG,
      'Food amount seems unusually high. Please verify.',
    ),
  description: descriptionSchema,
});

// --- Types ---

export type TransportationData = z.infer<typeof TransportationSchema>;
export type EnergyData = z.infer<typeof EnergySchema>;
export type FoodData = z.infer<typeof FoodSchema>;
