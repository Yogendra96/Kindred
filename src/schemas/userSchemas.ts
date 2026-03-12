import { z } from 'zod';

export const UserProfileSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  avatarAssetId: z.string().optional(),
  joinDate: z.string().datetime(),
  preferences: z
    .object({
      theme: z.enum(['light', 'dark', 'system']).default('system'),
      notifications: z.boolean().default(true),
    })
    .optional(),
});

export const LoginCredentialsSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
export type LoginCredentials = z.infer<typeof LoginCredentialsSchema>;
