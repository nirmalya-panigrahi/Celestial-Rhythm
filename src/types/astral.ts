export type TabId = 'now' | 'chakras' | 'crystals';

export type PlanetId =
  | 'Saturn'
  | 'Jupiter'
  | 'Mars'
  | 'Sun'
  | 'Venus'
  | 'Mercury'
  | 'Moon';

export type ChakraId =
  | 'Root'
  | 'Sacral'
  | 'Solar Plexus'
  | 'Heart'
  | 'Throat'
  | 'Third Eye'
  | 'Crown';

export type BreathCadenceId = 'box' | 'coherence' | 'relax';

export type BreathPhaseLabel = 'Inhale' | 'Hold' | 'Exhale' | 'Rest';

export type WaterSafety = 'Safe' | 'Caution' | 'Unsafe / Toxic';

export interface PlanetProfile {
  id: PlanetId;
  name: string;
  glyph: string;
  zodiacCorrespondence: string;
  zodiacGlyph: string;
  chakra: ChakraId;
  pairedStones: string[];
  practiceFocus: string;
  frequencyHz: number;
  accentHex: string;
  celestialAngleRad: number;
}

export interface PlanetaryHourSlot {
  hourIndex: number; // 0..23
  hourInPeriod: number; // 1..12
  planet: PlanetId;
  isDaytime: boolean;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  isCurrent: boolean;
}

export interface PlanetaryDaySchedule {
  referenceDate: Date;
  dayRuler: PlanetId;
  sunrise: Date;
  sunset: Date;
  nextSunrise: Date;
  hours: PlanetaryHourSlot[];
  activeHour: PlanetaryHourSlot;
  nextHour: PlanetaryHourSlot;
  countdownMs: number;
  isPolarFallback: boolean;
}

export interface LunarPhaseInfo {
  fraction: number; // 0..1 illuminated fraction
  illuminationPercent: number; // 0..100 rounded
  phase: number; // 0..1 lunar cycle position
  phaseName: string;
  windowType: 'full-moon-charging' | 'new-moon-cleansing' | 'waxing' | 'waning';
  headline: string;
  guidance: string;
  daysToNextFullMoon: number;
  daysToNextNewMoon: number;
}

export interface CityPreset {
  id: string;
  name: string;
  region: string;
  latitude: number;
  longitude: number;
}

export interface GeoLocationState {
  latitude: number;
  longitude: number;
  label: string;
  source: 'gps' | 'preset' | 'manual';
  loading: boolean;
  error: string | null;
}

export interface ChakraConfig {
  id: ChakraId;
  order: number;
  name: string;
  sanskritName: string;
  element: string;
  location: string;
  frequencyHz: number;
  noteName: string;
  colorHex: string;
  pairedCrystals: string[];
  practiceFocus: string;
}

export interface BreathStep {
  phase: BreathPhaseLabel;
  durationSec: number;
  instruction: string;
}

export interface BreathCadence {
  id: BreathCadenceId;
  name: string;
  ratioLabel: string;
  description: string;
  steps: BreathStep[];
}

export interface CrystalItem {
  id: string;
  name: string;
  mineralGroup: string;
  mohsHardness: string;
  crystalSystem: string;
  chakra: ChakraId;
  traditionalLore: string;
  waterSafety: WaterSafety;
  waterSafetyNote: string;
  cleansingMethod: string;
}
