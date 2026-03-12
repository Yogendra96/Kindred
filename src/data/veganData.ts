/**
 * veganData.ts — Vegan Calculator impact constants
 * Extracted from VeganCalculatorScreen.tsx (SRP: data ≠ UI).
 *
 * Sources:
 *  - Animals: Animal Clock (animalclock.org), ~2,535/sec globally
 *  - CO₂:     FAO, ~7.1GT/year animal ag (55,000 t/day ÷ 86,400)
 *  - Water:   UNESCO/PNAS, ~70% of freshwater to animal ag
 *  - Personal: Oxford/Poore & Nemecek 2018 meta-analysis
 */

/** Global impact per second constants */
export const GLOBAL_IMPACT_PER_SEC = {
  animalsKilled: 2535,
  kgCO2: 636.57, // 55,000 t/day ÷ 86,400
  litersWater: 45.6, // ~3.9B liters/day animal ag ÷ 86,400
} as const;

/** Personal annual impact of going vegan */
export const PERSONAL_ANNUAL_IMPACT = {
  animalsSaved: 95,
  kgCO2Saved: 1600,
  litersWaterSaved: 500_000,
} as const;

/** Milestones that trigger a celebration visual */
export const MILESTONES = {
  animals: [100, 1000, 10_000, 100_000],
  co2Kg: [1000, 5000, 10_000, 50_000],
  waterL: [100_000, 500_000, 1_000_000],
} as const;

/** Tree planting — 1 credit = 1 tree = this many kg CO2 offset */
export const KG_CO2_PER_TREE = 21;

/** Ad reward: how many credits per watched ad */
export const CREDITS_PER_AD = 5;
