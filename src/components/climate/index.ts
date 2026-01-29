/**
 * Climate Components Index
 * Central export for all climate-related UI components
 */

// Core Climate Cards
export { GlobalContextCard } from './GlobalContextCard';
export { GridCarbonWidget } from './GridCarbonWidget';
export { EmissionSourceCard } from './EmissionSourceCard';
export type { EmissionSourceDisplay } from './EmissionSourceCard';
export { AirQualityBadge } from './AirQualityBadge';

// Default exports (for lazy loading)
export { default as GlobalContextCardDefault } from './GlobalContextCard';
export { default as GridCarbonWidgetDefault } from './GridCarbonWidget';
export { default as EmissionSourceCardDefault } from './EmissionSourceCard';
export { default as AirQualityBadgeDefault } from './AirQualityBadge';
