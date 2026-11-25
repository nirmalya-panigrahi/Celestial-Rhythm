import {useEffect, useRef, useState} from 'react';
import gsap from 'gsap';
import {Bell, BellOff, Pause, Play, RotateCcw, Square, Volume2, VolumeX} from 'lucide-react';
import {BREATH_CADENCES, CHAKRAS} from '../data/chakras';
import {PLANET_PROFILES} from '../data/planetaryData';
import type {useBreathSession} from '../hooks/useBreathSession';
import type {NotificationStatus} from '../hooks/usePlanetaryClock';
import type {ChakraId, PlanetaryDaySchedule, PlanetaryHourSlot} from '../types/astral';
import {formatClockTime, formatCountdown} from '../utils/planetaryHours';
import {CelestialGlobe} from './CelestialGlobe';
import {ChakraSymbol, PlanetGlyph, STUDIO_IMAGES, ZodiacGlyph} from './VisualAssets';

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

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
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
  const [hoveredHourIndex, setHoveredHourIndex] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const displaySlot: PlanetaryHourSlot =
    inspectedHourIndex !== null
      ? schedule.hours[inspectedHourIndex] ?? schedule.activeHour
      : schedule.activeHour;

  const dialPreviewSlot: PlanetaryHourSlot | null =
    hoveredHourIndex !== null ? schedule.hours[hoveredHourIndex] ?? null : null;

  const isInspectingOther =
    inspectedHourIndex !== null && inspectedHourIndex !== schedule.activeHour.hourIndex;

  const profile = PLANET_PROFILES[displaySlot.planet];
  const dialPreviewProfile = dialPreviewSlot ? PLANET_PROFILES[dialPreviewSlot.planet] : null;
  const activeProfile = PLANET_PROFILES[schedule.activeHour.planet];
  const mappedChakra = CHAKRAS.find((c) => c.id === profile.chakra) ?? CHAKRAS[0];
  const isThisSessionRunning =
    breathSession.config?.sessionId === 'now-3min' && breathSession.status !== 'idle';

  const activeDurMs = Math.max(
    1,
    schedule.activeHour.endTime.getTime() - schedule.activeHour.startTime.getTime(),
  );
  const hourProgress = Math.max(
    0.04,
    Math.min(1, 1 - schedule.countdownMs / activeDurMs),
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({defaults: {ease: 'power2.out'}});
      tl.fromTo(
        '[data-gsap-now-card]',
        {opacity: 0, y: 12},
        {opacity: 1, y: 0, duration: 0.45, stagger: 0.08, clearProps: 'transform'},
      );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  const handleStartNowSession = () => {
    void breathSession.startSession({
      sessionId: 'now-3min',
      label: `Hour of ${activeProfile.name}`,
      durationSec: 180,
      frequencyHz: activeProfile.frequencyHz,
      cadence: BREATH_CADENCES.coherence,
    });
  };

  return (
    <div ref={rootRef} className="py-2">
      <div className="grid items-center gap-6 lg:grid-cols-12">
        {/* Left Column: Glassmorphism Active Hour Card */}
        <section
          data-gsap-now-card
          aria-label="Active Planetary Hour"
          className="astral-glass flex flex-col justify-between space-y-6 rounded-2xl p-6 sm:p-7 lg:col-span-5 xl:col-span-4"
        >
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <span>
                {displaySlot.isDaytime ? 'Day' : 'Night'} {displaySlot.hourInPeriod}/12 ·{' '}
                {schedule.dayRuler} Day
              </span>
              <button
                type="button"
                onClick={onOpenLocation}
                className="cursor-pointer truncate text-slate-300 transition-colors hover:text-[#d4af37]"
              >
                {locationLabel}
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#070a14]/75"
                style={{
                  boxShadow: `0 0 26px ${profile.accentHex}33`,
                }}
              >
                <PlanetGlyph planet={profile.id} color={profile.accentHex} size={28} />
              </div>
              <div className="min-w-0">
                <h1 className="astral-headline text-2xl font-semibold uppercase tracking-wide text-slate-50 sm:text-3xl">
                  Hour of {profile.name}
                </h1>
                <div className="astral-tabular mt-1.5 flex items-center gap-2.5 text-sm text-slate-300">
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

          <div className="flex items-center gap-4 border-y border-white/10 py-4">
            <button
              type="button"
              onClick={() => onNavigateToChakra(profile.chakra)}
              className="shrink-0 cursor-pointer transition-transform hover:scale-105"
              title={`Open ${profile.chakra} Chakra`}
            >
              <ChakraSymbol chakraId={mappedChakra.id} colorHex={mappedChakra.colorHex} size={48} />
            </button>
            <div className="min-w-0 space-y-1">
              <button
                type="button"
                onClick={() => onNavigateToChakra(profile.chakra)}
                className="block cursor-pointer text-sm font-medium text-slate-100 hover:text-[#d4af37]"
              >
                {profile.chakra} Chakra
              </button>
              <div className="flex flex-wrap gap-2 text-xs text-slate-400">
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

          <div className="space-y-4">
            {!isThisSessionRunning ? (
              <button
                type="button"
                onClick={handleStartNowSession}
                className="flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2.5 rounded-full bg-[#d4af37] px-6 py-3 text-sm font-semibold text-[#070a14] shadow-[0_0_28px_rgba(212,175,55,0.28)] transition-all hover:bg-[#e1be4c]"
              >
                <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                Start 3-Minute Guided Session
              </button>
            ) : (
              <div className="space-y-3 rounded-xl border border-white/10 bg-[#070a14]/55 p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">{activeProfile.frequencyHz.toFixed(1)} Hz Bowl</span>
                  <span className="astral-tabular font-medium text-[#d4af37]">
                    {formatCountdown(breathSession.remainingSec * 1000)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {breathSession.status === 'active' ? (
                    <button
                      type="button"
                      onClick={breathSession.pauseSession}
                      className="flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-full border border-[#d4af37]/40 bg-[#d4af37]/10 px-4 py-1.5 text-xs font-medium text-slate-100 hover:border-[#d4af37]"
                    >
                      <Pause className="h-3.5 w-3.5 text-[#d4af37]" aria-hidden="true" />
                      Pause
                    </button>
                  ) : breathSession.status === 'paused' ? (
                    <button
                      type="button"
                      onClick={() => void breathSession.resumeSession()}
                      className="flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-full bg-[#d4af37] px-4 py-1.5 text-xs font-semibold text-[#070a14]"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                      Resume
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStartNowSession}
                      className="flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-full bg-[#d4af37] px-4 py-1.5 text-xs font-semibold text-[#070a14]"
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                      Restart
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={breathSession.stopSession}
                    className="flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-full border border-white/10 px-4 py-1.5 text-xs font-medium text-slate-300 hover:border-white/30 hover:text-white"
                  >
                    <Square className="h-3.5 w-3.5" aria-hidden="true" />
                    Stop
                  </button>

                  <button
                    type="button"
                    onClick={breathSession.toggleMute}
                    aria-label={breathSession.isMuted ? 'Unmute singing bowl audio' : 'Mute singing bowl audio'}
                    className="ml-auto flex min-h-[38px] min-w-[38px] cursor-pointer items-center justify-center rounded-full border border-white/10 text-slate-200 hover:border-[#d4af37]/40 hover:text-[#d4af37]"
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
              className="flex min-h-[36px] cursor-pointer items-center gap-2 text-xs text-slate-400 transition-colors hover:text-slate-100 disabled:opacity-50"
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

        {/* Right Column: Glass WebGL Stage with 3D Globe Ringed by Circular 24-Hour Chaldean Progression */}
        <section
          data-gsap-now-card
          aria-label="24-Hour Chaldean Progression"
          className="astral-glass relative flex min-h-[450px] flex-col items-center justify-center overflow-hidden rounded-2xl p-4 sm:min-h-[580px] sm:p-6 lg:col-span-7 xl:col-span-8"
        >
          {/* Subtle Nebula Backdrop */}
          <img
            src={STUDIO_IMAGES.cosmicNebula}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-screen"
          />

          {/* Top & Bottom Corner HUD Readouts matching Reference */}
          <div className="pointer-events-none absolute inset-x-4 top-4 z-30 flex items-center justify-between text-xs sm:inset-x-6 sm:top-5">
            <div className="flex items-center gap-2 text-slate-200">
              <PlanetGlyph planet={profile.id} color={profile.accentHex} size={14} />
              <span className="font-medium">{profile.name}</span>
            </div>
            <span className="text-slate-400">Drag to orbit</span>
          </div>

          {/* Center Orbital Dial + Embedded 3D Celestial Sphere */}
          <div className="relative my-5 flex aspect-square w-full max-w-[520px] items-center justify-center">
            {/* Inner 3D Globe framed inside the 24-hour circle */}
            <div className="absolute inset-[18%] z-10 flex items-center justify-center rounded-full">
              <CelestialGlobe
                embedded
                activePlanet={displaySlot.planet}
                sessionStatus={isThisSessionRunning ? breathSession.status : 'idle'}
                breathSnapshot={isThisSessionRunning ? breathSession.snapshot : null}
                remainingSec={breathSession.remainingSec}
              />
            </div>

            {/* 24-Hour Circular Chaldean Ring Surrounding the Globe */}
            <svg
              viewBox="0 0 600 600"
              className="pointer-events-none relative z-20 h-full w-full select-none overflow-visible"
              role="list"
              aria-label="24-Hour Chaldean Progression"
            >
              {/* Outer orbital guide */}
              <circle
                cx="300"
                cy="300"
                r="254"
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="1"
              />

              {/* Day (gold) & Night (silver-blue) semicircular arcs */}
              <path
                d={describeArc(300, 300, 218, 4, 176)}
                fill="none"
                stroke="#d4af37"
                strokeOpacity="0.28"
                strokeWidth="1.25"
              />
              <path
                d={describeArc(300, 300, 218, 184, 356)}
                fill="none"
                stroke="#8ab4f8"
                strokeOpacity="0.24"
                strokeWidth="1.25"
              />

              {/* Active Hour Elapsed Clockwise Arc */}
              <path
                d={describeArc(
                  300,
                  300,
                  218,
                  schedule.activeHour.hourIndex * 15 + 1.5,
                  schedule.activeHour.hourIndex * 15 + 1.5 + 12 * hourProgress,
                )}
                fill="none"
                stroke={activeProfile.accentHex}
                strokeWidth="2.8"
                strokeLinecap="round"
              />

              {/* 24 Planetary Hour Nodes around the Globe */}
              {schedule.hours.map((slot) => {
                const p = PLANET_PROFILES[slot.planet];
                const midDeg = slot.hourIndex * 15 + 7.5;
                const pos = polarToCartesian(300, 300, 254, midDeg);
                const isSelected = displaySlot.hourIndex === slot.hourIndex;
                const isHovered = hoveredHourIndex === slot.hourIndex;
                const isActive = slot.isCurrent;

                return (
                  <g
                    key={slot.hourIndex}
                    role="listitem"
                    tabIndex={0}
                    aria-current={slot.isCurrent ? 'time' : undefined}
                    aria-label={`${p.name} ${formatClockTime(slot.startTime)}`}
                    onClick={() =>
                      setInspectedHourIndex(
                        slot.hourIndex === schedule.activeHour.hourIndex ? null : slot.hourIndex,
                      )
                    }
                    onMouseEnter={() => setHoveredHourIndex(slot.hourIndex)}
                    onMouseLeave={() => setHoveredHourIndex(null)}
                    onFocus={() => setHoveredHourIndex(slot.hourIndex)}
                    onBlur={() => setHoveredHourIndex(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setInspectedHourIndex(
                          slot.hourIndex === schedule.activeHour.hourIndex ? null : slot.hourIndex,
                        );
                      }
                    }}
                    className="pointer-events-auto cursor-pointer focus:outline-none"
                  >
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={22}
                      fill={isActive ? p.accentHex : isSelected ? p.accentHex : '#070a14'}
                      fillOpacity={isActive ? 0.22 : isSelected ? 0.16 : 0.84}
                      stroke={
                        isActive
                          ? '#d4af37'
                          : isSelected || isHovered
                            ? p.accentHex
                            : slot.isDaytime
                              ? 'rgba(212, 175, 55, 0.22)'
                              : 'rgba(138, 180, 248, 0.2)'
                      }
                      strokeWidth={isActive ? 1.75 : isSelected || isHovered ? 1.35 : 0.9}
                    />

                    <g transform={`translate(${pos.x - 6.5}, ${pos.y - 14})`}>
                      <PlanetGlyph
                        planet={p.id}
                        color={isActive || isSelected || isHovered ? p.accentHex : '#cbd5e1'}
                        size={13}
                      />
                    </g>

                    <text
                      x={pos.x}
                      y={pos.y + 11}
                      textAnchor="middle"
                      fill={isActive ? '#fde68a' : isSelected || isHovered ? '#ffffff' : '#94a3b8'}
                      fontSize="9"
                      fontFamily="var(--font-mono)"
                      fontWeight={isActive ? '600' : '400'}
                    >
                      {formatClockTime(slot.startTime)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Bottom Corner HUD & Hover Preview */}
          <div className="pointer-events-none absolute inset-x-4 bottom-3.5 z-30 flex flex-wrap items-center justify-between gap-2 text-xs sm:inset-x-6 sm:bottom-4">
            <div className="flex items-center gap-2 text-slate-300">
              <ZodiacGlyph planet={profile.id} color="#a78bfa" size={14} />
              <span>{profile.zodiacCorrespondence}</span>
            </div>

            <span className="astral-tabular hidden text-[11px] text-slate-400 sm:inline">
              {dialPreviewSlot && dialPreviewProfile
                ? `${dialPreviewProfile.name} · ${formatClockTime(dialPreviewSlot.startTime)} – ${formatClockTime(dialPreviewSlot.endTime)} · ${dialPreviewSlot.isDaytime ? 'Day' : 'Night'}`
                : `Sunrise ${formatClockTime(schedule.sunrise)} · Sunset ${formatClockTime(schedule.sunset)}`}
            </span>

            <span className="astral-tabular text-slate-300">{profile.frequencyHz.toFixed(1)} Hz</span>
          </div>
        </section>
      </div>
    </div>
  );
}
