import type {CityPreset, PlanetId, PlanetProfile} from '../types/astral';

export const CHALDEAN_ORDER: readonly PlanetId[] = [
  'Saturn',
  'Jupiter',
  'Mars',
  'Sun',
  'Venus',
  'Mercury',
  'Moon',
] as const;

// Date.getDay(): 0 = Sunday .. 6 = Saturday
export const DAY_RULERS: readonly PlanetId[] = [
  'Sun',
  'Moon',
  'Mars',
  'Mercury',
  'Jupiter',
  'Venus',
  'Saturn',
] as const;

export const PLANET_PROFILES: Record<PlanetId, PlanetProfile> = {
  Saturn: {
    id: 'Saturn',
    name: 'Saturn',
    glyph: '♄',
    zodiacCorrespondence: 'Capricorn / Aquarius',
    zodiacGlyph: '♑',
    chakra: 'Root',
    pairedStones: ['Smoky Quartz', 'Obsidian', 'Black Tourmaline'],
    practiceFocus:
      'Settle into structural stillness and let your attention rest on steady, unhurried exhalations.',
    frequencyHz: 147.85,
    accentHex: '#94a3b8',
    celestialAngleRad: 0,
  },
  Jupiter: {
    id: 'Jupiter',
    name: 'Jupiter',
    glyph: '♃',
    zodiacCorrespondence: 'Sagittarius / Pisces',
    zodiacGlyph: '♐',
    chakra: 'Third Eye',
    pairedStones: ['Amethyst', 'Lapis Lazuli', 'Labradorite'],
    practiceFocus:
      'Widen your internal horizon and breathe slowly enough to notice the space between thoughts.',
    frequencyHz: 183.58,
    accentHex: '#8ab4f8',
    celestialAngleRad: (Math.PI * 2) / 7,
  },
  Mars: {
    id: 'Mars',
    name: 'Mars',
    glyph: '♂',
    zodiacCorrespondence: 'Aries / Scorpio',
    zodiacGlyph: '♈',
    chakra: 'Solar Plexus',
    pairedStones: ['Red Jasper', 'Carnelian', 'Garnet'],
    practiceFocus:
      'Channel active energy into crisp posture and deliberate, rhythmic diaphragmatic breathing.',
    frequencyHz: 144.72,
    accentHex: '#e07a5f',
    celestialAngleRad: (Math.PI * 4) / 7,
  },
  Sun: {
    id: 'Sun',
    name: 'Sun',
    glyph: '☉',
    zodiacCorrespondence: 'Leo',
    zodiacGlyph: '♌',
    chakra: 'Solar Plexus',
    pairedStones: ['Citrine', 'Sunstone', "Tiger's Eye"],
    practiceFocus:
      'Direct gentle warmth toward the solar center and maintain clear, upright alertness.',
    frequencyHz: 126.22,
    accentHex: '#d4af37',
    celestialAngleRad: (Math.PI * 6) / 7,
  },
  Venus: {
    id: 'Venus',
    name: 'Venus',
    glyph: '♀',
    zodiacCorrespondence: 'Taurus / Libra',
    zodiacGlyph: '♎',
    chakra: 'Heart',
    pairedStones: ['Rose Quartz', 'Green Aventurine', 'Rhodonite'],
    practiceFocus:
      'Soften tension around the chest and shoulders, allowing each breath to land with ease.',
    frequencyHz: 221.23,
    accentHex: '#73b896',
    celestialAngleRad: (Math.PI * 8) / 7,
  },
  Mercury: {
    id: 'Mercury',
    name: 'Mercury',
    glyph: '☿',
    zodiacCorrespondence: 'Gemini / Virgo',
    zodiacGlyph: '♊',
    chakra: 'Throat',
    pairedStones: ['Aquamarine', 'Kyanite', 'Fluorite'],
    practiceFocus:
      'Clarify mental chatter by tracking the cool sensation of air entering and leaving the throat.',
    frequencyHz: 141.27,
    accentHex: '#7dd3fc',
    celestialAngleRad: (Math.PI * 10) / 7,
  },
  Moon: {
    id: 'Moon',
    name: 'Moon',
    glyph: '☽',
    zodiacCorrespondence: 'Cancer',
    zodiacGlyph: '♋',
    chakra: 'Crown',
    pairedStones: ['Moonstone', 'Selenite', 'Celestite'],
    practiceFocus:
      'Follow the natural ebb and tide of your breath without forcing depth or speed.',
    frequencyHz: 210.42,
    accentHex: '#cbd5e1',
    celestialAngleRad: (Math.PI * 12) / 7,
  },
};

export const CITY_PRESETS: CityPreset[] = [
  {id: 'sf', name: 'San Francisco', region: 'US-CA', latitude: 37.7749, longitude: -122.4194},
  {id: 'nyc', name: 'New York', region: 'US-NY', latitude: 40.7128, longitude: -74.006},
  {id: 'london', name: 'London', region: 'UK', latitude: 51.5074, longitude: -0.1278},
  {id: 'tokyo', name: 'Tokyo', region: 'JP', latitude: 35.6762, longitude: 139.6503},
  {id: 'varanasi', name: 'Varanasi', region: 'IN', latitude: 25.3176, longitude: 82.9739},
  {id: 'cairo', name: 'Cairo', region: 'EG', latitude: 30.0444, longitude: 31.2357},
  {id: 'reykjavik', name: 'Reykjavik', region: 'IS', latitude: 64.1466, longitude: -21.9426},
  {id: 'sydney', name: 'Sydney', region: 'AU', latitude: -33.8688, longitude: 151.2093},
];
