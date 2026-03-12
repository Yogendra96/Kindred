import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
});

export const CarbonEntrySchema = z.object({
  id: z.string().uuid(),
  category: z.enum(['transportation', 'food', 'energy', 'shopping', 'waste']),
  kgCO2: z.number().positive(),
  date: z.string().datetime(),
});

export const ApiConfigSchema = z.object({
  apiKey: z.string(),
  timeout: z.number().min(1000).max(60000),
  retryAttempts: z.number().nonnegative().max(5),
});

export type User = z.infer<typeof UserSchema>;
export type CarbonEntry = z.infer<typeof CarbonEntrySchema>;
export type ApiConfig = z.infer<typeof ApiConfigSchema>;
