import type {BreathCadence, BreathPhaseLabel} from '../types/astral';

export interface BreathStateSnapshot {
  phase: BreathPhaseLabel;
  instruction: string;
  phaseIndex: number;
  phaseDurationSec: number;
  phaseElapsedSec: number;
  phaseRemainingSec: number;
  phaseProgress: number; // 0..1
  targetScale: number; // visual orb target scale
}

export function getCycleDurationSec(cadence: BreathCadence): number {
  return cadence.steps.reduce((sum, step) => sum + Math.max(0.5, step.durationSec), 0);
}

export function computeBreathSnapshot(
  elapsedSec: number,
  cadence: BreathCadence,
): BreathStateSnapshot {
  const safeElapsed = Math.max(0, Number.isFinite(elapsedSec) ? elapsedSec : 0);
  const cycleSec = getCycleDurationSec(cadence);
  const posInCycle = cycleSec > 0 ? safeElapsed % cycleSec : 0;

  let acc = 0;
  for (let i = 0; i < cadence.steps.length; i++) {
    const step = cadence.steps[i];
    const dur = Math.max(0.5, step.durationSec);
    if (posInCycle < acc + dur || i === cadence.steps.length - 1) {
      const phaseElapsed = Math.max(0, posInCycle - acc);
      const phaseProgress = Math.min(1, Math.max(0, phaseElapsed / dur));
      const phaseRemainingSec = Math.max(0, Math.ceil(dur - phaseElapsed));

      let targetScale = 1;
      if (step.phase === 'Inhale') {
        targetScale = 0.78 + 0.42 * phaseProgress;
      } else if (step.phase === 'Hold') {
        targetScale = 1.2;
      } else if (step.phase === 'Exhale') {
        targetScale = 1.2 - 0.42 * phaseProgress;
      } else {
        targetScale = 0.78;
      }

      return {
        phase: step.phase,
        instruction: step.instruction,
        phaseIndex: i,
        phaseDurationSec: dur,
        phaseElapsedSec: phaseElapsed,
        phaseRemainingSec,
        phaseProgress,
        targetScale,
      };
    }
    acc += dur;
  }

  const fallback = cadence.steps[0];
  return {
    phase: fallback?.phase ?? 'Inhale',
    instruction: fallback?.instruction ?? '',
    phaseIndex: 0,
    phaseDurationSec: fallback?.durationSec ?? 4,
    phaseElapsedSec: 0,
    phaseRemainingSec: fallback?.durationSec ?? 4,
    phaseProgress: 0,
    targetScale: 0.78,
  };
}
