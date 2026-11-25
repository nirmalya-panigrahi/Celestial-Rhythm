import {useEffect, useRef, useState} from 'react';
import gsap from 'gsap';
import type {BreathStateSnapshot} from '../utils/breathEngine';
import {STUDIO_IMAGES} from './VisualAssets';

interface MandalaBackgroundProps {
  accentColor: string;
  isBreathActive: boolean;
  breathSnapshot: BreathStateSnapshot | null;
}

export function MandalaBackground({
  accentColor,
  isBreathActive,
  breathSnapshot,
}: MandalaBackgroundProps) {
  const tintOverlayRef = useRef<HTMLDivElement | null>(null);
  const pulseWrapRef = useRef<HTMLDivElement | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(() =>
    typeof document !== 'undefined' ? document.hidden : false,
  );

  useEffect(() => {
    const onVisibilityChange = () => {
      setIsPaused(document.hidden);
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  // Cross-fade subtle accent glow behind the mandala on selection / tab switch
  useEffect(() => {
    const tintEl = tintOverlayRef.current;
    if (!tintEl) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      tintEl.style.backgroundColor = accentColor;
      return;
    }

    gsap.to(tintEl, {
      backgroundColor: accentColor,
      duration: 0.75,
      ease: 'power2.out',
      overwrite: 'auto',
    });
  }, [accentColor]);

  // Subtle scale & opacity pulse synchronized with active breath cadence
  const phase = breathSnapshot?.phase ?? 'Inhale';
  const phaseDuration = breathSnapshot?.phaseDurationSec ?? 4;

  useEffect(() => {
    const wrap = pulseWrapRef.current;
    if (!wrap) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || !isBreathActive) {
      gsap.killTweensOf(wrap);
      gsap.to(wrap, {
        scale: 1,
        opacity: 0.22,
        duration: 0.6,
        ease: 'power2.out',
        overwrite: 'auto',
      });
      return;
    }

    if (phase === 'Inhale') {
      gsap.to(wrap, {
        scale: 1.07,
        opacity: 0.3,
        duration: phaseDuration,
        ease: 'sine.inOut',
        overwrite: 'auto',
      });
    } else if (phase === 'Hold') {
      gsap.to(wrap, {
        scale: 1.08,
        opacity: 0.3,
        duration: phaseDuration,
        ease: 'none',
        overwrite: 'auto',
      });
    } else if (phase === 'Exhale') {
      gsap.to(wrap, {
        scale: 0.96,
        opacity: 0.16,
        duration: phaseDuration,
        ease: 'sine.inOut',
        overwrite: 'auto',
      });
    } else {
      gsap.to(wrap, {
        scale: 0.95,
        opacity: 0.15,
        duration: phaseDuration,
        ease: 'none',
        overwrite: 'auto',
      });
    }
  }, [isBreathActive, phase, phaseDuration]);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-[1] flex items-center justify-center overflow-hidden ${
        isPaused ? 'astral-mandala-paused' : ''
      }`}
    >
      <div
        ref={pulseWrapRef}
        className="relative flex h-[112vmin] w-[112vmin] max-h-[1180px] max-w-[1180px] items-center justify-center sm:h-[118vmin] sm:w-[118vmin]"
        style={{opacity: 0.22}}
      >
        <div
          ref={tintOverlayRef}
          className="pointer-events-none absolute inset-[16%] rounded-full opacity-25 blur-3xl"
          style={{backgroundColor: accentColor}}
        />
        <img
          src={STUDIO_IMAGES.chakraMandala}
          alt=""
          draggable={false}
          className="astral-mandala-img-rotate relative h-full w-full select-none object-contain mix-blend-screen"
          style={{
            maskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 52%, rgba(0,0,0,0) 72%)',
            WebkitMaskImage:
              'radial-gradient(circle at center, rgba(0,0,0,1) 52%, rgba(0,0,0,0) 72%)',
          }}
        />
      </div>
    </div>
  );
}

