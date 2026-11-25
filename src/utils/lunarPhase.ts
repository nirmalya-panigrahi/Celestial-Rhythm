import {getMoonIllumination} from 'suncalc';
import type {LunarPhaseInfo} from '../types/astral';

const SYNODIC_MONTH_DAYS = 29.53058867;

export function getLunarPhaseName(phase: number): string {
  const p = ((phase % 1) + 1) % 1;
  if (p < 0.03 || p >= 0.97) return 'New Moon';
  if (p < 0.22) return 'Waxing Crescent';
  if (p < 0.28) return 'First Quarter';
  if (p < 0.47) return 'Waxing Gibbous';
  if (p <= 0.53) return 'Full Moon';
  if (p < 0.72) return 'Waning Gibbous';
  if (p < 0.78) return 'Last Quarter';
  return 'Waning Crescent';
}

export function calculateLunarPhase(referenceDate: Date): LunarPhaseInfo {
  const safeDate =
    referenceDate instanceof Date && !Number.isNaN(referenceDate.getTime())
      ? referenceDate
      : new Date();

  const illum = getMoonIllumination(safeDate);
  const fraction = Math.max(0, Math.min(1, illum.fraction));
  const phase = ((illum.phase % 1) + 1) % 1;
  const illuminationPercent = Math.round(fraction * 100);
  const phaseName = getLunarPhaseName(phase);

  // Estimate days until next Full Moon (phase = 0.5) and next New Moon (phase = 0/1)
  const deltaToFull = phase <= 0.5 ? 0.5 - phase : 1.5 - phase;
  const deltaToNew = phase === 0 ? 0 : 1 - phase;
  const daysToNextFullMoon = Math.max(0, Math.round(deltaToFull * SYNODIC_MONTH_DAYS));
  const daysToNextNewMoon = Math.max(0, Math.round(deltaToNew * SYNODIC_MONTH_DAYS));

  if (phase >= 0.45 && phase <= 0.55) {
    return {
      fraction,
      illuminationPercent,
      phase,
      phaseName,
      windowType: 'full-moon-charging',
      headline: 'Full Moon Charging Window Active',
      guidance:
        'Peak lunar illumination. Place quartz, moonstone, and water-safe silicates on a dry tray or windowsill for overnight moonlight exposure.',
      daysToNextFullMoon: 0,
      daysToNextNewMoon,
    };
  }

  if (phase <= 0.05 || phase >= 0.95) {
    return {
      fraction,
      illuminationPercent,
      phase,
      phaseName,
      windowType: 'new-moon-cleansing',
      headline: 'New Moon Smoke & Sound Cleansing Window',
      guidance:
        'Dark lunar phase suited for dry cleansing. Refresh delicate or water-unsafe stones (Selenite, Malachite, Pyrite) with singing-bowl resonance or herbal smoke.',
      daysToNextFullMoon,
      daysToNextNewMoon: 0,
    };
  }

  if (phase < 0.5) {
    return {
      fraction,
      illuminationPercent,
      phase,
      phaseName,
      windowType: 'waxing',
      headline: `${phaseName} · Building Toward Full Moon`,
      guidance:
        'Waxing lunar light supports intention setting. Dry-dust specimens and prepare safe stones for upcoming Full Moon charging.',
      daysToNextFullMoon,
      daysToNextNewMoon,
    };
  }

  return {
    fraction,
    illuminationPercent,
    phase,
    phaseName,
    windowType: 'waning',
    headline: `${phaseName} · Clearing Toward New Moon`,
    guidance:
      'Waning lunar cycle favors release and maintenance. Use sound vibration or a dry microfiber cloth for porous and copper-bearing minerals.',
    daysToNextFullMoon,
    daysToNextNewMoon,
  };
}
