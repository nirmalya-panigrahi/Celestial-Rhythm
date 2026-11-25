import {useEffect, useRef, useState} from 'react';
import gsap from 'gsap';
import {ChevronLeft, ChevronRight, Pause, Play, RotateCcw, Square, Volume2, VolumeX} from 'lucide-react';
import {BREATH_CADENCES, CHAKRAS, DURATION_OPTIONS_MIN} from '../data/chakras';
import type {useBreathSession} from '../hooks/useBreathSession';
import type {BreathCadenceId, ChakraId} from '../types/astral';
import {formatCountdown} from '../utils/planetaryHours';
import {BreathOrbOverlay} from './BreathOrbOverlay';
import {ChakraSymbol} from './VisualAssets';

const BASE_PATH = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;
const CHAKRA_FIGURE_SRC = `${BASE_PATH}assets/aistudio/image_87996eea.png`;

const CHAKRA_FIGURE_POSITIONS: Array<{id: ChakraId; topPct: number}> = [
  {id: 'Crown', topPct: 6.5},
  {id: 'Third Eye', topPct: 19.5},
  {id: 'Throat', topPct: 37.5},
  {id: 'Heart', topPct: 52.5},
  {id: 'Solar Plexus', topPct: 66.0},
  {id: 'Sacral', topPct: 79.5},
  {id: 'Root', topPct: 93.0},
];

interface ChakraSessionsTabProps {
  selectedChakraId: ChakraId;
  onSelectChakra: (id: ChakraId) => void;
  breathSession: ReturnType<typeof useBreathSession>;
}

export function ChakraSessionsTab({
  selectedChakraId,
  onSelectChakra,
  breathSession,
}: ChakraSessionsTabProps) {
  const [durationMin, setDurationMin] = useState<number>(5);
  const [cadenceId, setCadenceId] = useState<BreathCadenceId>('coherence');
  const stageRef = useRef<HTMLDivElement | null>(null);
  const flowStripRef = useRef<HTMLDivElement | null>(null);

  const activeChakra = CHAKRAS.find((c) => c.id === selectedChakraId) ?? CHAKRAS[3];
  const activeCadence = BREATH_CADENCES[cadenceId];
  const sessionKey = `chakra-${activeChakra.id}`;
  const isThisSessionRunning =
    breathSession.config?.sessionId === sessionKey && breathSession.status !== 'idle';

  const startChakraSession = (chakra = activeChakra) => {
    void breathSession.startSession({
      sessionId: `chakra-${chakra.id}`,
      label: `${chakra.name} (${chakra.sanskritName})`,
      durationSec: durationMin * 60,
      frequencyHz: chakra.frequencyHz,
      cadence: activeCadence,
    });
  };

  useEffect(() => {
    const root = stageRef.current;
    if (!root) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-gsap-chakra-card]',
        {opacity: 0, y: 12},
        {opacity: 1, y: 0, duration: 0.45, stagger: 0.05, ease: 'power2.out', clearProps: 'transform'},
      );
    }, stageRef);

    return () => ctx.revert();
  }, []);

  const scrollFlow = (direction: -1 | 1) => {
    const el = flowStripRef.current;
    if (!el) return;
    el.scrollBy({left: direction * 260, behavior: 'smooth'});
  };

  return (
    <div ref={stageRef} className="space-y-8 py-2">
      {/* Top Hero Glass Card */}
      <section
        data-gsap-chakra-card
        aria-label="Chakra Session Controls"
        className="astral-glass rounded-2xl p-6 sm:p-8"
      >
        <div className="grid items-center gap-8 lg:grid-cols-12">
          {/* Left: Chakra Heading, Duration & Cadence Pills, CTA & Volume Pill */}
          <div className="space-y-6 lg:col-span-6">
            <div className="flex items-center gap-4">
              <ChakraSymbol
                chakraId={activeChakra.id}
                colorHex={activeChakra.colorHex}
                size={54}
              />
              <div>
                <h1 className="astral-headline text-2xl font-semibold uppercase tracking-wide text-slate-50 sm:text-3xl">
                  {activeChakra.name}
                </h1>
                <p className="astral-tabular mt-1 text-sm text-slate-400">
                  {activeChakra.sanskritName} · {activeChakra.frequencyHz} Hz
                </p>
              </div>
            </div>

            {/* Duration Pills */}
            <div className="flex flex-wrap gap-2.5" role="group" aria-label="Session duration">
              {DURATION_OPTIONS_MIN.map((mins) => {
                const selected = durationMin === mins;
                return (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDurationMin(mins)}
                    aria-pressed={selected}
                    className={`astral-tabular min-h-[38px] cursor-pointer rounded-full border px-4 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                      selected
                        ? 'border-[#d4af37] bg-[#d4af37]/10 text-[#d4af37]'
                        : 'border-white/10 bg-[#070a14]/50 text-slate-300 hover:border-white/25 hover:text-white'
                    }`}
                  >
                    {mins} min
                  </button>
                );
              })}
            </div>

            {/* Breath Cadence Pills */}
            <div className="flex flex-wrap gap-2.5" role="group" aria-label="Breath cadence">
              {(Object.keys(BREATH_CADENCES) as BreathCadenceId[]).map((key) => {
                const option = BREATH_CADENCES[key];
                const selected = cadenceId === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCadenceId(key)}
                    aria-pressed={selected}
                    className={`min-h-[40px] cursor-pointer rounded-full border px-4 py-2 text-xs transition-colors whitespace-nowrap ${
                      selected
                        ? 'border-[#d4af37] bg-[#d4af37]/10 font-semibold text-slate-100'
                        : 'border-white/10 bg-[#070a14]/50 text-slate-300 hover:border-white/25 hover:text-white'
                    }`}
                  >
                    <span>{option.name}</span>
                    <span
                      className={`astral-tabular ml-2 ${
                        selected ? 'text-[#d4af37]' : 'text-slate-400'
                      }`}
                    >
                      {option.ratioLabel}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* CTA Button + Volume Slider Pill */}
            <div className="flex flex-wrap items-center gap-4 pt-1">
              {!isThisSessionRunning ? (
                <button
                  type="button"
                  onClick={() => startChakraSession(activeChakra)}
                  className="flex min-h-[48px] cursor-pointer items-center gap-2.5 rounded-full bg-[#d4af37] px-7 py-3 text-sm font-semibold text-[#070a14] shadow-[0_0_28px_rgba(212,175,55,0.3)] transition-all hover:bg-[#e1be4c]"
                >
                  <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                  Begin {durationMin}-Min Practice
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  {breathSession.status === 'active' ? (
                    <button
                      type="button"
                      onClick={breathSession.pauseSession}
                      className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border border-[#d4af37]/45 bg-[#d4af37]/10 px-5 py-2 text-sm font-medium text-slate-100 hover:border-[#d4af37]"
                    >
                      <Pause className="h-4 w-4 text-[#d4af37]" aria-hidden="true" />
                      Pause
                    </button>
                  ) : breathSession.status === 'paused' ? (
                    <button
                      type="button"
                      onClick={() => void breathSession.resumeSession()}
                      className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full bg-[#d4af37] px-6 py-2 text-sm font-semibold text-[#070a14]"
                    >
                      <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                      Resume
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startChakraSession(activeChakra)}
                      className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full bg-[#d4af37] px-6 py-2 text-sm font-semibold text-[#070a14]"
                    >
                      <RotateCcw className="h-4 w-4" aria-hidden="true" />
                      Restart
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={breathSession.stopSession}
                    className="flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-[#070a14]/60 px-5 py-2 text-sm text-slate-300 hover:border-white/30 hover:text-white"
                  >
                    <Square className="h-3.5 w-3.5" aria-hidden="true" />
                    Stop
                  </button>
                </div>
              )}

              <div className="flex min-h-[46px] items-center gap-2.5 rounded-full border border-white/10 bg-[#070a14]/60 px-4 py-2">
                <button
                  type="button"
                  onClick={breathSession.toggleMute}
                  aria-label={breathSession.isMuted ? 'Unmute singing bowl' : 'Mute singing bowl'}
                  className="cursor-pointer text-slate-300 hover:text-[#d4af37]"
                >
                  {breathSession.isMuted ? (
                    <VolumeX className="h-4 w-4 text-slate-500" aria-hidden="true" />
                  ) : (
                    <Volume2 className="h-4 w-4 text-[#d4af37]" aria-hidden="true" />
                  )}
                </button>
                <input
                  type="range"
                  aria-label="Soundscape volume"
                  min={0}
                  max={1}
                  step={0.05}
                  value={breathSession.volume}
                  onChange={(e) => breathSession.setVolume(Number(e.target.value))}
                  className="w-24 accent-[#d4af37]"
                />
              </div>
            </div>
          </div>

          {/* Right: 7-Chakra Meditation Figure Stage & Active Breath Orb */}
          <div className="lg:col-span-6">
            <div className="relative flex min-h-[300px] items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#070a14]/80 p-5 sm:min-h-[340px]">
              {/* Expanded ambient aura glow aligned to active chakra color */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute h-72 w-72 rounded-full opacity-35 blur-3xl transition-colors duration-500 sm:h-80 sm:w-80"
                style={{backgroundColor: activeChakra.colorHex}}
              />

              {/* Meditating 7-Chakra Figure with soft wide glow at active chakra (no solid circle) */}
              <div
                className={`relative z-10 inline-flex h-[270px] items-center justify-center transition-opacity duration-300 sm:h-[310px] ${
                  isThisSessionRunning ? 'opacity-35' : 'opacity-100'
                }`}
              >
                {/* Wide radial glow radiating behind/around the active chakra position */}
                {CHAKRA_FIGURE_POSITIONS.map(({id, topPct}) => {
                  const chakra = CHAKRAS.find((c) => c.id === id);
                  if (!chakra || chakra.id !== selectedChakraId) return null;
                  return (
                    <span
                      key={`glow-${id}`}
                      aria-hidden="true"
                      style={{
                        top: `${topPct}%`,
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: `radial-gradient(circle, ${chakra.colorHex}e6 0%, ${chakra.colorHex}73 38%, transparent 72%)`,
                      }}
                      className="pointer-events-none absolute h-28 w-28 rounded-full blur-xl transition-all duration-500 sm:h-32 sm:w-32"
                    />
                  );
                })}

                <img
                  src={CHAKRA_FIGURE_SRC}
                  alt="Seven chakras alignment figure"
                  draggable={false}
                  className="relative z-10 block h-full w-auto select-none object-contain drop-shadow-[0_12px_28px_rgba(0,0,0,0.75)]"
                />

                {CHAKRA_FIGURE_POSITIONS.map(({id, topPct}) => {
                  const chakra = CHAKRAS.find((c) => c.id === id);
                  if (!chakra) return null;
                  const isSelected = chakra.id === selectedChakraId;

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onSelectChakra(id)}
                      aria-label={`Focus ${chakra.name}`}
                      aria-pressed={isSelected}
                      style={{
                        top: `${topPct}%`,
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: isSelected
                          ? `radial-gradient(circle, ${chakra.colorHex}55 0%, transparent 70%)`
                          : undefined,
                      }}
                      className="absolute z-20 h-10 w-10 cursor-pointer rounded-full bg-transparent transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4af37]"
                    />
                  );
                })}
              </div>

              {isThisSessionRunning ? (
                <div className="absolute inset-0 z-20 flex items-center justify-center">
                  <BreathOrbOverlay
                    compact
                    isActive={breathSession.status === 'active'}
                    isPaused={breathSession.status === 'paused'}
                    isCompleted={breathSession.status === 'completed'}
                    snapshot={breathSession.snapshot}
                    remainingSec={breathSession.remainingSec}
                    accentHex={activeChakra.colorHex}
                  />
                </div>
              ) : (
                <div className="pointer-events-none absolute right-4 bottom-4 z-10 flex flex-col items-end text-right sm:right-5 sm:bottom-5">
                  <span
                    className="astral-tabular text-lg font-semibold"
                    style={{color: activeChakra.colorHex}}
                  >
                    {activeChakra.frequencyHz} Hz
                  </span>
                  <span className="astral-tabular text-xs text-slate-400">
                    {formatCountdown(durationMin * 60 * 1000)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom: Chakra Flow Horizontal Carousel */}
      <section aria-label="Chakra Flow" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-slate-200">
            Chakra Flow
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollFlow(-1)}
              aria-label="Scroll chakras left"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-[#0d1224]/80 text-slate-300 transition-colors hover:border-[#d4af37]/50 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => scrollFlow(1)}
              aria-label="Scroll chakras right"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-[#0d1224]/80 text-slate-300 transition-colors hover:border-[#d4af37]/50 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div
          ref={flowStripRef}
          className="astral-flow-track flex gap-4 overflow-x-auto pb-2"
        >
          {CHAKRAS.map((chakra) => {
            const isSelected = chakra.id === selectedChakraId;
            return (
              <div
                key={chakra.id}
                data-gsap-chakra-card
                onClick={() => onSelectChakra(chakra.id)}
                className={`astral-glass flex min-w-[162px] flex-1 cursor-pointer flex-col items-center justify-between rounded-2xl p-5 text-center transition-all ${
                  isSelected
                    ? 'border-[#d4af37]/45 shadow-[0_0_24px_rgba(212,175,55,0.12)]'
                    : 'hover:border-white/25'
                }`}
              >
                <div className="flex flex-col items-center">
                  <ChakraSymbol
                    chakraId={chakra.id}
                    colorHex={chakra.colorHex}
                    size={50}
                  />
                  <h3 className="font-display mt-3 text-xs font-semibold uppercase tracking-wider text-slate-100">
                    {chakra.id}
                  </h3>
                  <span className="astral-tabular mt-1 text-xs text-slate-400">
                    {chakra.frequencyHz} Hz
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectChakra(chakra.id);
                    if (isSelected) {
                      startChakraSession(chakra);
                    }
                  }}
                  aria-label={`Practice ${chakra.id} Chakra`}
                  className={`mt-4 w-full cursor-pointer rounded-full py-2 text-xs font-semibold transition-colors ${
                    isSelected
                      ? 'bg-[#d4af37] text-[#070a14] hover:bg-[#e1be4c]'
                      : 'border border-white/10 bg-[#070a14]/60 text-slate-200 hover:border-white/25 hover:text-white'
                  }`}
                >
                  Practice
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
