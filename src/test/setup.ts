import '@testing-library/jest-dom/vitest';
import {vi} from 'vitest';

if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

vi.mock('tone', () => ({
  supported: vi.fn().mockResolvedValue(false),
  start: vi.fn().mockResolvedValue(undefined),
  now: vi.fn(() => 0),
  Gain: vi.fn(),
  Reverb: vi.fn(),
  Filter: vi.fn(),
  PolySynth: vi.fn(),
  Synth: vi.fn(),
}));
