import {useEffect, useRef} from 'react';
import gsap from 'gsap';
import type {BreathStateSnapshot} from '../utils/breathEngine';
import {formatCountdown} from '../utils/planetaryHours';

interface BreathOrbOverlayProps {
  isActive: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  snapshot: BreathStateSnapshot | null;
  remainingSec: number;
  accentHex?: string;
  compact?: boolean;
}

export function BreathOrbOverlay({
  isActive,
  isPaused,
  isCompleted,
  snapshot,
  remainingSec,
  accentHex = '#d4af37',
  compact = false,
}: BreathOrbOverlayProps) {
  const outerRingRef = useRef<HTMLDivElement | null>(null);
  const innerCoreRef = useRef<HTMLDivElement | null>(null);

  const phase = snapshot?.phase ?? 'Inhale';
  const phaseDuration = snapshot?.phaseDurationSec ?? 4;

  useEffect(() => {
    const outer = outerRingRef.current;
    const inner = innerCoreRef.current;
    if (!outer || !inner) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || !isActive || isPaused || isCompleted) {
      gsap.killTweensOf([outer, inner]);
      gsap.set(outer, {scale: isCompleted ? 1 : 0.92, opacity: isCompleted ? 0.95 : 0.72});
      gsap.set(inner, {scale: isCompleted ? 1 : 0.88});
      return;
    }

    if (phase === 'Inhale') {
      gsap.to(outer, {
        scale: 1.22,
        opacity: 0.96,
        duration: phaseDuration,
        ease: 'sine.inOut',
        overwrite: 'auto',
      });
      gsap.to(inner, {
        scale: 1.16,
        duration: phaseDuration,
        ease: 'sine.inOut',
        overwrite: 'auto',
      });
    } else if (phase === 'Hold') {
      gsap.to(outer, {
        scale: 1.24,
        opacity: 1,
        duration: phaseDuration,
        ease: 'none',
        overwrite: 'auto',
      });
      gsap.to(inner, {
        scale: 1.18,
        duration: phaseDuration,
        ease: 'none',
        overwrite: 'auto',
      });
    } else if (phase === 'Exhale') {
      gsap.to(outer, {
        scale: 0.78,
        opacity: 0.65,
        duration: phaseDuration,
        ease: 'sine.inOut',
        overwrite: 'auto',
      });
      gsap.to(inner, {
        scale: 0.75,
        duration: phaseDuration,
        ease: 'sine.inOut',
        overwrite: 'auto',
      });
    } else {
      gsap.to(outer, {
        scale: 0.76,
        opacity: 0.55,
        duration: phaseDuration,
        ease: 'none',
        overwrite: 'auto',
      });
      gsap.to(inner, {
        scale: 0.74,
        duration: phaseDuration,
        ease: 'none',
        overwrite: 'auto',
      });
    }
  }, [isActive, isPaused, isCompleted, phase, phaseDuration]);

  useEffect(() => {
    const outer = outerRingRef.current;
    const inner = innerCoreRef.current;
    return () => {
      if (outer) gsap.killTweensOf(outer);
      if (inner) gsap.killTweensOf(inner);
    };
  }, []);

  if (!isActive && !isPaused && !isCompleted) {
    return null;
  }

  const ringSize = compact ? 'h-44 w-44 sm:h-52 sm:w-52' : 'h-52 w-52 sm:h-64 sm:w-64';

  return (
    <div
      className="pointer-events-none flex flex-col items-center justify-center text-center"
      aria-live="polite"
    >
      <div className={`relative flex items-center justify-center ${ringSize}`}>
        <div
          ref={outerRingRef}
          className="absolute inset-0 rounded-full border-2"
          style={{
            borderColor: accentHex,
            boxShadow: `0 0 36px ${accentHex}33, inset 0 0 28px ${accentHex}1f`,
          }}
        />
        <div
          ref={innerCoreRef}
          className="flex h-3/4 w-3/4 flex-col items-center justify-center rounded-full border border-white/15 bg-[#070a14]/75 px-4"
        >
          {isCompleted ? (
            <>
              <span className="font-display text-lg font-semibold tracking-wide text-[#d4af37]">
                Session Complete
              </span>
              <span className="mt-1 text-xs text-slate-300">Rest in stillness</span>
            </>
          ) : (
            <>
              <span className="font-display text-xl font-semibold tracking-wider text-slate-50 sm:text-2xl">
                {isPaused ? 'Paused' : phase}
              </span>
              <span className="astral-tabular mt-1 text-2xl font-medium text-[#d4af37] sm:text-3xl">
                {isPaused ? formatCountdown(remainingSec * 1000) : `${snapshot?.phaseRemainingSec ?? 0}s`}
              </span>
              <span className="astral-tabular mt-1 text-xs text-slate-400">
                {formatCountdown(remainingSec * 1000)} remaining
              </span>
            </>
          )}
        </div>
      </div>

      {!isCompleted && snapshot && (
        <p className="mt-4 max-w-xs rounded-lg border border-white/10 bg-[#070a14]/80 px-3.5 py-2 text-xs text-slate-200">
          {snapshot.instruction}
        </p>
      )}
    </div>
  );
}
