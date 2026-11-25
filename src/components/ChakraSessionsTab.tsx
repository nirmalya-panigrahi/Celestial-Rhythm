import {useRef, useState} from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
  Square,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {BREATH_CADENCES, CHAKRAS, DURATION_OPTIONS_MIN} from '../data/chakras';
import type {useBreathSession} from '../hooks/useBreathSession';
import type {BreathCadenceId, ChakraId} from '../types/astral';
import {formatCountdown} from '../utils/planetaryHours';
import {BreathOrbOverlay} from './BreathOrbOverlay';
import {ChakraSymbol, ResilientImage, STUDIO_IMAGES} from './VisualAssets';

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
  const sliderRef = useRef<HTMLDivElement | null>(null);

  const activeChakra = CHAKRAS.find((c) => c.id === selectedChakraId) ?? CHAKRAS[0];
  const activeCadence = BREATH_CADENCES[cadenceId];
  const sessionKey = `chakra-${activeChakra.id}`;
  const isThisSessionRunning =
    breathSession.config?.sessionId === sessionKey && breathSession.status !== 'idle';

  const startChakraSession = (targetChakra = activeChakra) => {
    void breathSession.startSession({
      sessionId: `chakra-${targetChakra.id}`,
      label: `${targetChakra.name} (${targetChakra.sanskritName})`,
      durationSec: durationMin * 60,
      frequencyHz: targetChakra.frequencyHz,
      cadence: activeCadence,
    });
  };

  const scrollSlider = (dir: -1 | 1) => {
    sliderRef.current?.scrollBy({left: dir * 240, behavior: 'smooth'});
  };

  return (
    <div className="space-y-8">
      {/* Flowing Glass Breath Sanctuary */}
      <section
        aria-label="Chakra Breath Studio"
        className="astral-glass relative grid items-center gap-8 overflow-hidden rounded-3xl p-6 sm:p-9 lg:grid-cols-12"
      >
        <div className="relative z-10 space-y-6 lg:col-span-6">
          {/* 1. Chakra Title & Frequency */}
          <div className="flex items-center gap-4">
            <ChakraSymbol chakraId={activeChakra.id} colorHex={activeChakra.colorHex} size={68} />
            <div>
              <h1 className="astral-headline text-2xl font-semibold tracking-wide text-slate-50 sm:text-3xl">
                {activeChakra.name}
              </h1>
              <p className="astral-tabular mt-1 text-xs text-slate-300">
                {activeChakra.sanskritName} · {activeChakra.frequencyHz} Hz
              </p>
            </div>
          </div>

          {/* 2. Duration & Cadence Pills */}
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Session duration">
              {DURATION_OPTIONS_MIN.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDurationMin(mins)}
                  aria-pressed={durationMin === mins}
                  className={`min-h-[40px] cursor-pointer rounded-full px-5 py-2 text-xs font-medium transition-all whitespace-nowrap ${
                    durationMin === mins
                      ? 'bg-[#d4af37]/20 text-amber-100 ring-1 ring-[#d4af37]'
                      : 'bg-white/[0.04] text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2" role="group" aria-label="Breath cadence">
              {(Object.keys(BREATH_CADENCES) as BreathCadenceId[]).map((key) => {
                const option = BREATH_CADENCES[key];
                const selected = cadenceId === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCadenceId(key)}
                    aria-pressed={selected}
                    className={`min-h-[42px] cursor-pointer rounded-2xl px-4 py-2 text-left transition-all ${
                      selected
                        ? 'bg-[#d4af37]/20 text-slate-50 ring-1 ring-[#d4af37]'
                        : 'bg-white/[0.04] text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-xs font-semibold">{option.name}</span>
                    <span className="astral-tabular ml-2 text-[11px] text-[#d4af37]">
                      {option.ratioLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Practice CTA & Volume */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {!isThisSessionRunning ? (
              <button
                type="button"
                onClick={() => startChakraSession(activeChakra)}
                className="flex min-h-[48px] cursor-pointer items-center gap-2 rounded-full bg-[#d4af37] px-7 py-3 text-sm font-semibold text-[#070a14] shadow-[0_8px_28px_rgba(212,175,55,0.28)] transition-all hover:bg-[#e1be4c]"
              >
                <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                Begin {durationMin}-Min Practice
              </button>
            ) : (
              <>
                {breathSession.status === 'active' ? (
                  <button
                    type="button"
                    onClick={breathSession.pauseSession}
                    className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full bg-white/10 px-6 py-2.5 text-sm font-medium text-slate-100"
                  >
                    <Pause className="h-4 w-4" aria-hidden="true" />
                    Pause
                  </button>
                ) : breathSession.status === 'paused' ? (
                  <button
                    type="button"
                    onClick={() => void breathSession.resumeSession()}
                    className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full bg-[#d4af37] px-6 py-2.5 text-sm font-semibold text-[#070a14]"
                  >
                    <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                    Resume
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => startChakraSession(activeChakra)}
                    className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full bg-[#d4af37] px-6 py-2.5 text-sm font-semibold text-[#070a14]"
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    Restart
                  </button>
                )}

                <button
                  type="button"
                  onClick={breathSession.stopSession}
                  className="flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-full bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white"
                >
                  <Square className="h-3.5 w-3.5" aria-hidden="true" />
                  Stop
                </button>
              </>
            )}

            <div className="flex items-center gap-2 rounded-full bg-white/[0.04] px-3.5 py-1.5">
              <button
                type="button"
                onClick={breathSession.toggleMute}
                aria-label={breathSession.isMuted ? 'Unmute singing bowl' : 'Mute singing bowl'}
                className="flex min-h-[34px] min-w-[34px] cursor-pointer items-center justify-center text-slate-200 hover:text-[#d4af37]"
              >
                {breathSession.isMuted ? (
                  <VolumeX className="h-4 w-4 text-slate-400" aria-hidden="true" />
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
                className="w-20 accent-[#d4af37]"
              />
            </div>
          </div>
        </div>

        {/* Visual Mandala Sanctuary */}
        <div className="relative flex min-h-[310px] items-center justify-center overflow-hidden rounded-3xl lg:col-span-6">
          <ResilientImage
            src={STUDIO_IMAGES.chakraMandala}
            alt="Sacred geometric mandala"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40"
          />
          <div className="pointer-events-none absolute inset-0 bg-radial from-transparent via-[#070a14]/35 to-[#070a14]/90" />

          <div className="relative z-10 flex flex-col items-center">
            {isThisSessionRunning ? (
              <BreathOrbOverlay
                isActive={breathSession.status === 'active'}
                isPaused={breathSession.status === 'paused'}
                isCompleted={breathSession.status === 'completed'}
                snapshot={breathSession.snapshot}
                remainingSec={breathSession.remainingSec}
                accentHex={activeChakra.colorHex}
                compact
              />
            ) : (
              <div
                className="astral-glass-soft flex h-48 w-48 flex-col items-center justify-center rounded-full"
                style={{
                  boxShadow: `0 0 56px ${activeChakra.colorHex}30`,
                }}
              >
                <ChakraSymbol
                  chakraId={activeChakra.id}
                  colorHex={activeChakra.colorHex}
                  size={64}
                />
                <span className="astral-tabular mt-2 text-lg font-medium text-slate-100">
                  {activeChakra.frequencyHz} Hz
                </span>
                <span className="astral-tabular text-xs text-slate-400">
                  {formatCountdown(durationMin * 60 * 1000)}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Seamless Horizontal Chakra Flow Slider */}
      <section aria-label="Seven Chakras" className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-display text-sm font-semibold tracking-wider text-slate-200">
            Chakra Flow
          </h2>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scrollSlider(-1)}
              aria-label="Scroll chakras left"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => scrollSlider(1)}
              aria-label="Scroll chakras right"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div
          ref={sliderRef}
          className="astral-flow-track flex snap-x snap-mandatory gap-4 overflow-x-auto px-3 py-3"
        >
          {CHAKRAS.map((chakra) => {
            const isSelected = chakra.id === selectedChakraId;
            return (
              <article
                key={chakra.id}
                onClick={() => onSelectChakra(chakra.id)}
                className={`astral-glass-soft flex min-w-[168px] shrink-0 snap-center cursor-pointer flex-col items-center justify-between rounded-3xl p-5 text-center transition-all duration-200 ${
                  isSelected
                    ? 'scale-[1.03] border-[#d4af37]/70 bg-[#141c38]/75 shadow-[0_12px_32px_rgba(212,175,55,0.14)]'
                    : 'hover:scale-[1.02] hover:bg-white/[0.06]'
                }`}
              >
                <ChakraSymbol chakraId={chakra.id} colorHex={chakra.colorHex} size={60} />

                <div className="mt-3">
                  <h3 className="font-display text-sm font-semibold text-slate-100">
                    {chakra.id}
                  </h3>
                  <p className="astral-tabular mt-0.5 text-xs text-slate-400">
                    {chakra.frequencyHz} Hz
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectChakra(chakra.id);
                    startChakraSession(chakra);
                  }}
                  className={`mt-4 min-h-[36px] w-full cursor-pointer rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                    isSelected
                      ? 'bg-[#d4af37] text-[#070a14]'
                      : 'bg-white/[0.07] text-slate-200 hover:bg-[#d4af37]/25 hover:text-amber-100'
                  }`}
                >
                  Practice
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
