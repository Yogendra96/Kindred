import { z } from 'zod';

export const GeoCoordinateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const EcoLocationSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  coordinate: GeoCoordinateSchema.optional(), // Map compatibility
  distance: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  description: z.string().optional(),
  impact: z.string().optional(),
  open: z.boolean().optional(),
});

// Helper for Google API mapping to our generic EcoLocation type
export const GooglePlaceResponseSchema = z.object({
  place_id: z.string(),
  name: z.string(),
  geometry: z.object({
    location: z.object({
      lat: z.number(),
      lng: z.number(),
    }),
  }),
  rating: z.number().optional(),
  opening_hours: z
    .object({
      open_now: z.boolean(),
    })
    .optional(),
  types: z.array(z.string()),
});

export type GeoCoordinate = z.infer<typeof GeoCoordinateSchema>;
export type EcoLocation = z.infer<typeof EcoLocationSchema>;
