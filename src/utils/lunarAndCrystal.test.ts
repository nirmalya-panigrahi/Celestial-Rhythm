import {describe, expect, it} from 'vitest';
import {BREATH_CADENCES} from '../data/chakras';
import {CRYSTALS} from '../data/crystals';
import {computeBreathSnapshot, getCycleDurationSec} from './breathEngine';
import {filterCrystals} from './crystalFilter';
import {calculateLunarPhase, getLunarPhaseName} from './lunarPhase';

describe('Crystal Vault dataset & filtering', () => {
  it('contains exactly 30 scientifically accurate stones with required water-safety flags', () => {
    expect(CRYSTALS).toHaveLength(30);

    const byName = new Map(CRYSTALS.map((c) => [c.name, c]));
    expect(byName.get('Selenite (Satin Spar Gypsum)')?.waterSafety).toBe('Unsafe / Toxic');
    expect(byName.get('Pyrite')?.waterSafety).toBe('Unsafe / Toxic');
    expect(byName.get('Malachite')?.waterSafety).toBe('Unsafe / Toxic');
    expect(byName.get('Azurite')?.waterSafety).toBe('Unsafe / Toxic');
    expect(byName.get('Chrysocolla')?.waterSafety).toBe('Unsafe / Toxic');
    expect(byName.get('Clear Quartz')?.waterSafety).toBe('Safe');
  });

  it('filters by search query, chakra, water safety, and My Collection (Blue Pill)', () => {
    const toxicHeart = filterCrystals(CRYSTALS, {
      searchQuery: '',
      chakra: 'Heart',
      waterSafety: 'Unsafe / Toxic',
      myCollectionOnly: false,
      collectionIds: [],
    });
    expect(toxicHeart.map((c) => c.id)).toEqual(
      expect.arrayContaining(['malachite', 'rhodochrosite']),
    );

    const savedOnly = filterCrystals(CRYSTALS, {
      searchQuery: 'gypsum',
      chakra: 'All',
      waterSafety: 'All',
      myCollectionOnly: true,
      collectionIds: ['selenite'],
    });
    expect(savedOnly).toHaveLength(1);
    expect(savedOnly[0].id).toBe('selenite');
  });

  it('handles whitespace queries and nonexistent collection IDs cleanly (Red Pill)', () => {
    const none = filterCrystals(CRYSTALS, {
      searchQuery: '   unobtainium   ',
      chakra: 'All',
      waterSafety: 'All',
      myCollectionOnly: false,
      collectionIds: [],
    });
    expect(none).toHaveLength(0);

    const missingCollection = filterCrystals(CRYSTALS, {
      searchQuery: '',
      chakra: 'All',
      waterSafety: 'All',
      myCollectionOnly: true,
      collectionIds: ['nonexistent-id'],
    });
    expect(missingCollection).toHaveLength(0);
  });
});

describe('Lunar phase & Breath engine', () => {
  it('calculates lunar illumination and handles invalid dates safely', () => {
    const info = calculateLunarPhase(new Date(2026, 10, 25, 12, 0, 0));
    expect(info.illuminationPercent).toBeGreaterThanOrEqual(0);
    expect(info.illuminationPercent).toBeLessThanOrEqual(100);
    expect(getLunarPhaseName(0.5)).toBe('Full Moon');
    expect(getLunarPhaseName(0.0)).toBe('New Moon');

    const fallback = calculateLunarPhase(new Date('invalid'));
    expect(fallback.illuminationPercent).toBeGreaterThanOrEqual(0);
  });

  it('computes breath phases accurately and clamps negative/NaN elapsed seconds', () => {
    const box = BREATH_CADENCES.box;
    expect(getCycleDurationSec(box)).toBe(16);
    expect(computeBreathSnapshot(2, box).phase).toBe('Inhale');
    expect(computeBreathSnapshot(5, box).phase).toBe('Hold');
    expect(computeBreathSnapshot(9, box).phase).toBe('Exhale');
    expect(computeBreathSnapshot(13, box).phase).toBe('Rest');

    // Red Pill: negative and NaN input
    expect(computeBreathSnapshot(-42, box).phase).toBe('Inhale');
    expect(computeBreathSnapshot(Number.NaN, box).phase).toBe('Inhale');
  });
});
