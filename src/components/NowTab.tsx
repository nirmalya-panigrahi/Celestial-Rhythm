import {useEffect, useRef, useState} from 'react';
import gsap from 'gsap';
import {
  Bell,
  BellOff,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
  Square,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {BREATH_CADENCES, CHAKRAS} from '../data/chakras';
import {PLANET_PROFILES} from '../data/planetaryData';
import type {useBreathSession} from '../hooks/useBreathSession';
import type {NotificationStatus} from '../hooks/usePlanetaryClock';
import type {ChakraId, PlanetaryDaySchedule, PlanetaryHourSlot} from '../types/astral';
import {formatClockTime, formatCountdown} from '../utils/planetaryHours';
import {CelestialGlobe} from './CelestialGlobe';
import {ChakraSymbol} from './VisualAssets';

interface NowTabProps {
  schedule: PlanetaryDaySchedule;
  locationLabel: string;
  onOpenLocation: () => void;
  breathSession: ReturnType<typeof useBreathSession>;
  notificationsEnabled: boolean;
  notificationPermission: NotificationStatus;
  onToggleNotifications: () => void;
  onNavigateToChakra: (chakra: ChakraId) => void;
  onNavigateToCrystal: (stoneName: string) => void;
}

export function NowTab({
  schedule,
  locationLabel,
  onOpenLocation,
  breathSession,
  notificationsEnabled,
  notificationPermission,
  onToggleNotifications,
  onNavigateToChakra,
  onNavigateToCrystal,
}: NowTabProps) {
  const [inspectedHourIndex, setInspectedHourIndex] = useState<number | null>(null);
  const leftColRef = useRef<HTMLDivElement | null>(null);
  const flowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !leftColRef.current) return;

    gsap.fromTo(
      leftColRef.current,
      {opacity: 0, y: 12},
      {opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', clearProps: 'transform'},
    );
  }, []);

  const displaySlot: PlanetaryHourSlot =
    inspectedHourIndex !== null
      ? schedule.hours[inspectedHourIndex] ?? schedule.activeHour
      : schedule.activeHour;

  const isInspectingOther =
    inspectedHourIndex !== null && inspectedHourIndex !== schedule.activeHour.hourIndex;

  const profile = PLANET_PROFILES[displaySlot.planet];
  const activeProfile = PLANET_PROFILES[schedule.activeHour.planet];
  const mappedChakra = CHAKRAS.find((c) => c.id === profile.chakra) ?? CHAKRAS[0];
  const isThisSessionRunning =
    breathSession.config?.sessionId === 'now-3min' && breathSession.status !== 'idle';

  const handleStartNowSession = () => {
    void breathSession.startSession({
      sessionId: 'now-3min',
      label: `Hour of ${activeProfile.name}`,
      durationSec: 180,
      frequencyHz: activeProfile.frequencyHz,
      cadence: BREATH_CADENCES.coherence,
    });
  };

  const scrollFlow = (dir: -1 | 1) => {
    flowRef.current?.scrollBy({left: dir * 280, behavior: 'smooth'});
  };

  return (
    <div className="space-y-8">
      <div className="grid items-center gap-8 lg:grid-cols-12">
        {/* Left: Seamless Floating Glass Readout */}
        <section
          ref={leftColRef}
          aria-label="Active Planetary Hour"
          className="astral-glass flex flex-col justify-between rounded-3xl p-7 sm:p-8 lg:col-span-4"
        >
          <div className="space-y-7">
            {/* 1. Planetary Hour + Time Window */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                <span>
                  {displaySlot.isDaytime ? 'Day' : 'Night'} {displaySlot.hourInPeriod}/12 ·{' '}
                  {schedule.dayRuler} Day
                </span>
                <button
                  type="button"
                  onClick={onOpenLocation}
                  className="cursor-pointer truncate text-slate-300 underline decoration-white/20 underline-offset-4 hover:text-[#d4af37]"
                >
                  {locationLabel}
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/[0.04] text-3xl shadow-inner"
                  style={{
                    color: profile.accentHex,
                    boxShadow: `0 0 32px ${profile.accentHex}33`,
                  }}
                  aria-hidden="true"
                >
                  {profile.glyph}
                </div>
                <div>
                  <h1 className="astral-headline text-2xl font-semibold tracking-wide text-slate-50 sm:text-3xl">
                    Hour of {profile.name}
                  </h1>
                  <div className="astral-tabular mt-1.5 flex items-center gap-2 text-sm text-slate-300">
                    <span>
                      {formatClockTime(displaySlot.startTime)} – {formatClockTime(displaySlot.endTime)}
                    </span>
                    {!isInspectingOther && (
                      <>
                        <span aria-hidden="true" className="text-slate-600">
                          ·
                        </span>
                        <span data-testid="hour-countdown" className="font-medium text-[#d4af37]">
                          {formatCountdown(schedule.countdownMs)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {isInspectingOther && (
                <button
                  type="button"
                  onClick={() => setInspectedHourIndex(null)}
                  className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-[#d4af37] hover:underline"
                >
                  <RotateCcw className="h-3 w-3" aria-hidden="true" />
                  Return to active hour
                </button>
              )}
            </div>

            {/* 2. Chakra Emblem & Paired Stones (unboxed flow) */}
            <div className="flex items-center gap-4 py-2">
              <button
                type="button"
                onClick={() => onNavigateToChakra(profile.chakra)}
                className="shrink-0 cursor-pointer transition-transform hover:scale-105"
                title={`Open ${profile.chakra} Chakra`}
              >
                <ChakraSymbol chakraId={mappedChakra.id} colorHex={mappedChakra.colorHex} size={58} />
              </button>
              <div className="min-w-0 space-y-1.5">
                <button
                  type="button"
                  onClick={() => onNavigateToChakra(profile.chakra)}
                  className="block cursor-pointer text-sm font-medium text-slate-100 hover:text-[#d4af37]"
                >
                  {profile.chakra} Chakra
                </button>
                <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                  {profile.pairedStones.map((stone, idx) => (
                    <span key={stone} className="inline-flex items-center gap-2">
                      {idx > 0 && (
                        <span aria-hidden="true" className="text-slate-600">
                          ·
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => onNavigateToCrystal(stone)}
                        className="cursor-pointer transition-colors hover:text-[#d4af37]"
                      >
                        {stone}
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Primary Gold CTA & Nudge Toggle */}
          <div className="mt-7 space-y-3">
            {!isThisSessionRunning ? (
              <button
                type="button"
                onClick={handleStartNowSession}
                className="flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#d4af37] px-6 py-3 text-sm font-semibold text-[#070a14] shadow-[0_8px_28px_rgba(212,175,55,0.28)] transition-all hover:bg-[#e1be4c]"
              >
                <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                Start 3-Minute Guided Session
              </button>
            ) : (
              <div className="astral-glass-soft space-y-3 rounded-2xl p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">{activeProfile.frequencyHz.toFixed(1)} Hz Bowl</span>
                  <span className="astral-tabular font-medium text-[#d4af37]">
                    {formatCountdown(breathSession.remainingSec * 1000)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {breathSession.status === 'active' ? (
                    <button
                      type="button"
                      onClick={breathSession.pauseSession}
                      className="flex min-h-[40px] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-slate-100"
                    >
                      <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                      Pause
                    </button>
                  ) : breathSession.status === 'paused' ? (
                    <button
                      type="button"
                      onClick={() => void breathSession.resumeSession()}
                      className="flex min-h-[40px] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[#d4af37] px-4 py-2 text-xs font-semibold text-[#070a14]"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                      Resume
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStartNowSession}
                      className="flex min-h-[40px] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[#d4af37] px-4 py-2 text-xs font-semibold text-[#070a14]"
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                      Restart
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={breathSession.stopSession}
                    className="flex min-h-[40px] cursor-pointer items-center justify-center gap-1.5 rounded-full bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 hover:text-white"
                  >
                    <Square className="h-3.5 w-3.5" aria-hidden="true" />
                    Stop
                  </button>

                  <button
                    type="button"
                    onClick={breathSession.toggleMute}
                    aria-label={breathSession.isMuted ? 'Unmute singing bowl audio' : 'Mute singing bowl audio'}
                    className="flex min-h-[40px] min-w-[40px] cursor-pointer items-center justify-center rounded-full bg-white/5 text-slate-200"
                  >
                    {breathSession.isMuted ? (
                      <VolumeX className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    ) : (
                      <Volume2 className="h-4 w-4 text-[#d4af37]" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => void onToggleNotifications()}
              disabled={notificationPermission === 'unsupported'}
              aria-pressed={notificationsEnabled}
              className="flex min-h-[38px] cursor-pointer items-center gap-2 text-xs text-slate-400 transition-colors hover:text-slate-100 disabled:opacity-50"
            >
              {notificationsEnabled ? (
                <Bell className="h-3.5 w-3.5 text-[#d4af37]" aria-hidden="true" />
              ) : (
                <BellOff className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>{notificationsEnabled ? 'Hour-change nudges on' : 'Hour-change nudges'}</span>
            </button>
          </div>
        </section>

        {/* Right: Open 3D Celestial Sphere */}
        <section aria-label="3D Celestial Sphere" className="flex lg:col-span-8">
          <CelestialGlobe
            activePlanet={displaySlot.planet}
            sessionStatus={isThisSessionRunning ? breathSession.status : 'idle'}
            breathSnapshot={isThisSessionRunning ? breathSession.snapshot : null}
            remainingSec={breathSession.remainingSec}
          />
        </section>
      </div>

      {/* Seamless Horizontal Chaldean Progression Flow Slider */}
      <section aria-label="24-Hour Chaldean Progression" className="relative space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-display text-xs font-semibold tracking-wider text-slate-300">
            24-Hour Chaldean Progression
          </h2>
          <div className="flex items-center gap-3">
            <span className="astral-tabular hidden text-[11px] text-slate-400 sm:inline">
              ☉ {formatClockTime(schedule.sunrise)} · ☽ {formatClockTime(schedule.sunset)}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => scrollFlow(-1)}
                aria-label="Scroll hours left"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => scrollFlow(1)}
                aria-label="Scroll hours right"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={flowRef}
          className="astral-flow-track flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-2 py-2"
          role="list"
        >
          {schedule.hours.map((slot) => {
            const p = PLANET_PROFILES[slot.planet];
            const isSelected = displaySlot.hourIndex === slot.hourIndex;
            return (
              <button
                key={slot.hourIndex}
                type="button"
                role="listitem"
                onClick={() =>
                  setInspectedHourIndex(
                    slot.hourIndex === schedule.activeHour.hourIndex ? null : slot.hourIndex,
                  )
                }
                aria-current={slot.isCurrent ? 'time' : undefined}
                aria-label={`${p.name} ${formatClockTime(slot.startTime)}`}
                className={`astral-glass-soft flex min-w-[74px] shrink-0 snap-center cursor-pointer flex-col items-center rounded-2xl px-3 py-2.5 transition-all ${
                  slot.isCurrent
                    ? 'border-[#d4af37]/70 bg-[#d4af37]/15 text-amber-50 shadow-[0_0_20px_rgba(212,175,55,0.2)]'
                    : isSelected
                      ? 'border-[#8ab4f8]/60 bg-[#8ab4f8]/15 text-slate-100'
                      : 'text-slate-300 hover:scale-105 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1 text-base leading-none">
                  <span style={{color: p.accentHex}} aria-hidden="true">
                    {p.glyph}
                  </span>
                  <span className="text-[11px] text-slate-500" aria-hidden="true">
                    {p.zodiacGlyph}
                  </span>
                </div>
                <span className="astral-tabular mt-1.5 text-[11px] text-slate-300">
                  {formatClockTime(slot.startTime)}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
