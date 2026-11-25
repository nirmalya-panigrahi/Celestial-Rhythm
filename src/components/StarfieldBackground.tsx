import {useEffect, useRef} from 'react';
import {tsParticles, type Container} from '@tsparticles/engine';
import {loadSlim} from '@tsparticles/slim';

let slimLoaded = false;

export function StarfieldBackground() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Skip canvas initialization in non-browser/jsdom environments
    const testCanvas = document.createElement('canvas');
    if (!testCanvas.getContext) return;
    try {
      if (!testCanvas.getContext('2d')) return;
    } catch {
      return;
    }

    let cancelled = false;
    let instance: Container | undefined;

    async function mountParticles() {
      try {
        if (!slimLoaded) {
          await tsParticles.init();
          await loadSlim(tsParticles);
          slimLoaded = true;
        }
        if (cancelled || !element) return;

        instance = await tsParticles.load({
          id: 'astral-starfield',
          element,
          options: {
            fullScreen: {enable: false},
            background: {color: {value: 'transparent'}},
            fpsLimit: 45,
            detectRetina: true,
            particles: {
              number: {
                value: 85,
                density: {enable: true, width: 1200, height: 900},
              },
              color: {
                value: ['#e2e8f0', '#8ab4f8', '#cbd5e1', '#d4af37'],
              },
              shape: {type: 'circle'},
              opacity: {
                value: {min: 0.12, max: 0.65},
                animation: {
                  enable: !prefersReducedMotion,
                  speed: 0.45,
                  sync: false,
                },
              },
              size: {
                value: {min: 0.6, max: 2.1},
              },
              move: {
                enable: !prefersReducedMotion,
                speed: 0.18,
                direction: 'none',
                random: true,
                straight: false,
                outModes: {default: 'out'},
              },
            },
            interactivity: {
              events: {
                onHover: {enable: false},
                onClick: {enable: false},
              },
            },
          },
        });
      } catch {
        // Fallback silently to CSS nebula background if particles fail
      }
    }

    void mountParticles();

    return () => {
      cancelled = true;
      if (instance) {
        instance.destroy();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    />
  );
}
