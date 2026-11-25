import {useEffect, useMemo, useRef, useState} from 'react';
import {
  AlertTriangle,
  Bookmark,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  OctagonAlert,
  RotateCcw,
  Search,
} from 'lucide-react';
import {CHAKRAS} from '../data/chakras';
import {CRYSTALS} from '../data/crystals';
import type {ChakraId, LunarPhaseInfo, WaterSafety} from '../types/astral';
import {filterCrystals} from '../utils/crystalFilter';
import {Crystal3DViewer} from './Crystal3DViewer';
import {CrystalSpecimenGraphic, ResilientImage, STUDIO_IMAGES} from './VisualAssets';

interface CrystalVaultTabProps {
  lunar: LunarPhaseInfo;
  initialSearch?: string;
  collectionIds: string[];
  notesById: Record<string, string>;
  onToggleCollection: (crystalId: string) => void;
  onUpdateNote: (crystalId: string, note: string) => void;
}

const SPECIMEN_SHOWCASE: Array<{
  safety: WaterSafety;
  title: string;
  subtitle: string;
  image: string;
}> = [
  {
    safety: 'Safe',
    title: 'Water-Safe Silicates',
    subtitle: 'Quartz · Amethyst · Carnelian',
    image: STUDIO_IMAGES.quartzAmethyst,
  },
  {
    safety: 'Caution',
    title: 'Delicate Cleavage',
    subtitle: 'Moonstone · Labradorite · Fluorite',
    image: STUDIO_IMAGES.seleniteMoonstone,
  },
  {
    safety: 'Unsafe / Toxic',
    title: 'Dry & Sound Only',
    subtitle: 'Selenite · Pyrite · Malachite',
    image: STUDIO_IMAGES.malachiteCopper,
  },
];

function MoonPhaseDisc({phase}: {phase: number}) {
  const p = ((phase % 1) + 1) % 1;
  const isWaxing = p <= 0.5;
  const terminatorScale = Math.cos(p * Math.PI * 2);
  const rx = Math.abs(terminatorScale) * 28;

  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16 shrink-0" aria-hidden="true">
      <circle cx="32" cy="32" r="28" fill="#0f172a" stroke="#8ab4f8" strokeOpacity="0.45" strokeWidth="1.2" />
      {p > 0.02 && p < 0.98 && (
        <>
          <path
            d={isWaxing ? 'M 32 4 A 28 28 0 0 1 32 60 Z' : 'M 32 4 A 28 28 0 0 0 32 60 Z'}
            fill="#e2e8f0"
          />
          {terminatorScale < 0 ? (
            <ellipse cx="32" cy="32" rx={rx} ry="28" fill="#e2e8f0" />
          ) : (
            <ellipse cx="32" cy="32" rx={rx} ry="28" fill="#0f172a" />
          )}
        </>
      )}
    </svg>
  );
}

function WaterSafetyBadge({safety}: {safety: WaterSafety}) {
  if (safety === 'Safe') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Water Safety: Safe</span>
      </span>
    );
  }
  if (safety === 'Caution') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-300">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Water Safety: Caution</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-300">
      <OctagonAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>Water Safety: Unsafe / Toxic</span>
    </span>
  );
}

export function CrystalVaultTab({
  lunar,
  initialSearch = '',
  collectionIds,
  notesById,
  onToggleCollection,
  onUpdateNote,
}: CrystalVaultTabProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [chakraFilter, setChakraFilter] = useState<ChakraId | 'All'>('All');
  const [safetyFilter, setSafetyFilter] = useState<WaterSafety | 'All'>('All');
  const [myCollectionOnly, setMyCollectionOnly] = useState(false);
  const [focusedCrystalId, setFocusedCrystalId] = useState<string>(CRYSTALS[0].id);

  const sliderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (initialSearch) {
      setSearchQuery(initialSearch);
    }
  }, [initialSearch]);

  const filteredCrystals = useMemo(
    () =>
      filterCrystals(CRYSTALS, {
        searchQuery,
        chakra: chakraFilter,
        waterSafety: safetyFilter,
        myCollectionOnly,
        collectionIds,
      }),
    [searchQuery, chakraFilter, safetyFilter, myCollectionOnly, collectionIds],
  );

  const activeCrystal = useMemo(() => {
    return (
      filteredCrystals.find((c) => c.id === focusedCrystalId) ??
      filteredCrystals[0] ??
      CRYSTALS[0]
    );
  }, [filteredCrystals, focusedCrystalId]);

  const resetFilters = () => {
    setSearchQuery('');
    setChakraFilter('All');
    setSafetyFilter('All');
    setMyCollectionOnly(false);
  };

  const scrollSlider = (dir: -1 | 1) => {
    sliderRef.current?.scrollBy({left: dir * 320, behavior: 'smooth'});
  };

  const activeInCollection = collectionIds.includes(activeCrystal.id);

  return (
    <div className="space-y-7">
      {/* Seamless Atmospheric Moon-Charging Header */}
      <section
        aria-label="Lunar Charging and Cleansing Window"
        className="astral-glass relative overflow-hidden rounded-3xl p-6 sm:p-7"
      >
        <ResilientImage
          src={STUDIO_IMAGES.cosmicNebula}
          alt="Cosmic sky horizon"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#070a14]/85 via-[#070a14]/60 to-[#070a14]/85" />

        <div className="relative z-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-5">
            <MoonPhaseDisc phase={lunar.phase} />
            <div>
              <span className="astral-tabular text-xs font-medium text-[#d4af37]">
                {lunar.phaseName} · {lunar.illuminationPercent}% illuminated
              </span>
              <h1 className="astral-headline mt-0.5 text-xl font-semibold tracking-wide text-slate-50 sm:text-2xl">
                {lunar.headline}
              </h1>
            </div>
          </div>

          <div className="astral-tabular flex gap-6 text-xs text-slate-300">
            <div>
              <span className="block text-slate-400">Full Moon</span>
              <span className="font-medium text-slate-100">
                {lunar.daysToNextFullMoon === 0 ? 'Tonight' : `${lunar.daysToNextFullMoon}d`}
              </span>
            </div>
            <div>
              <span className="block text-slate-400">New Moon</span>
              <span className="font-medium text-slate-100">
                {lunar.daysToNextNewMoon === 0 ? 'Tonight' : `${lunar.daysToNextNewMoon}d`}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Interactive 3D Crystal Mesh Stage + Specimen Readout */}
      {filteredCrystals.length > 0 && (
        <section
          aria-label="3D Crystal Specimen Inspector"
          className="astral-glass grid items-center gap-6 rounded-3xl p-5 sm:p-7 lg:grid-cols-12"
        >
          <div className="lg:col-span-6">
            <Crystal3DViewer crystal={activeCrystal} />
          </div>

          <div className="space-y-5 lg:col-span-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs text-slate-400">
                  {activeCrystal.mineralGroup} · {activeCrystal.chakra} Chakra
                </span>
                <h2 className="astral-headline mt-1 text-2xl font-semibold text-slate-50 sm:text-3xl">
                  {activeCrystal.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onToggleCollection(activeCrystal.id)}
                aria-pressed={activeInCollection}
                className={`flex min-h-[40px] shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                  activeInCollection
                    ? 'bg-[#d4af37]/20 text-[#d4af37] ring-1 ring-[#d4af37]'
                    : 'bg-white/[0.06] text-slate-200 hover:bg-white/10'
                }`}
              >
                <Bookmark
                  className={`h-3.5 w-3.5 ${activeInCollection ? 'fill-current' : ''}`}
                  aria-hidden="true"
                />
                <span>{activeInCollection ? 'In Collection' : 'Save'}</span>
              </button>
            </div>

            <div className="space-y-2">
              <WaterSafetyBadge safety={activeCrystal.waterSafety} />
              <p className="text-xs leading-relaxed text-slate-300">
                {activeCrystal.cleansingMethod}
              </p>
            </div>

            <input
              type="text"
              value={notesById[activeCrystal.id] ?? ''}
              onChange={(e) => onUpdateNote(activeCrystal.id, e.target.value)}
              placeholder={`Personal notes on ${activeCrystal.name}…`}
              aria-label={`Inspector notes for ${activeCrystal.name}`}
              className="w-full rounded-2xl bg-white/[0.04] px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 ring-1 ring-white/10 focus:ring-[#d4af37] focus:outline-none"
            />
          </div>
        </section>
      )}

      {/* Seamless Photo-Filter Pills & Search Flow */}
      <section aria-label="Crystal Search and Filters" className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {SPECIMEN_SHOWCASE.map((card) => {
            const isSelected = safetyFilter === card.safety;
            return (
              <button
                key={card.safety}
                type="button"
                onClick={() => setSafetyFilter(isSelected ? 'All' : card.safety)}
                aria-pressed={isSelected}
                className={`group relative h-28 cursor-pointer overflow-hidden rounded-3xl text-left transition-all ${
                  isSelected
                    ? 'ring-2 ring-[#d4af37]'
                    : 'ring-1 ring-white/10 hover:ring-white/30'
                }`}
              >
                <ResilientImage
                  src={card.image}
                  alt={card.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070a14]/90 via-[#070a14]/35 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 px-4 pb-3">
                  <span className="block font-display text-sm font-semibold text-slate-50">
                    {card.title}
                  </span>
                  <span className="block text-[11px] text-slate-300">{card.subtitle}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="astral-glass-soft flex flex-wrap items-center gap-3 rounded-3xl px-4 py-3">
          <div className="relative min-w-[200px] flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="text"
              role="searchbox"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 30 stones…"
              aria-label="Search crystals"
              className="min-h-[40px] w-full rounded-full bg-[#070a14]/70 pr-4 pl-10 text-sm text-slate-100 placeholder:text-slate-500 ring-1 ring-white/10 focus:ring-[#d4af37] focus:outline-none"
            />
          </div>

          <select
            id="chakra-filter"
            aria-label="Filter by Chakra"
            value={chakraFilter}
            onChange={(e) => setChakraFilter(e.target.value as ChakraId | 'All')}
            className="min-h-[40px] cursor-pointer rounded-full bg-[#070a14]/70 px-4 text-xs text-slate-100 ring-1 ring-white/10 focus:ring-[#d4af37] focus:outline-none"
          >
            <option value="All">All Chakras</option>
            {CHAKRAS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setMyCollectionOnly((prev) => !prev)}
            aria-pressed={myCollectionOnly}
            className={`flex min-h-[40px] cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
              myCollectionOnly
                ? 'bg-[#d4af37]/20 text-amber-100 ring-1 ring-[#d4af37]'
                : 'bg-white/[0.05] text-slate-200 hover:bg-white/10'
            }`}
          >
            <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
            <span>My Collection ({collectionIds.length})</span>
          </button>

          <span className="astral-tabular ml-auto text-xs text-slate-400">
            Showing {filteredCrystals.length} of {CRYSTALS.length} stones
          </span>
        </div>
      </section>

      {/* Seamless Horizontal Crystal Flow Slider */}
      {filteredCrystals.length === 0 ? (
        <div className="astral-glass flex flex-col items-center justify-center rounded-3xl px-6 py-14 text-center">
          <p className="font-display text-lg font-semibold text-slate-100">No matching stones</p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-full bg-[#d4af37]/15 px-5 py-2 text-xs font-medium text-[#d4af37] ring-1 ring-[#d4af37]/50"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Reset Filters
          </button>
        </div>
      ) : (
        <section aria-label="Crystal Specimen Slider" className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-slate-400">
              Select a specimen to inspect its 3D crystal mesh above
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scrollSlider(-1)}
                aria-label="Scroll crystals left"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => scrollSlider(1)}
                aria-label="Scroll crystals right"
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
            {filteredCrystals.map((crystal) => {
              const inCollection = collectionIds.includes(crystal.id);
              const isFocused = activeCrystal.id === crystal.id;
              const personalNote = notesById[crystal.id] ?? '';

              return (
                <article
                  key={crystal.id}
                  onClick={() => setFocusedCrystalId(crystal.id)}
                  className={`astral-glass-soft flex w-[265px] shrink-0 snap-center cursor-pointer flex-col justify-between rounded-3xl p-4 transition-all duration-200 sm:w-[285px] ${
                    isFocused
                      ? 'scale-[1.02] border-[#d4af37]/70 bg-[#141c38]/80 shadow-[0_14px_34px_rgba(212,175,55,0.12)]'
                      : 'hover:scale-[1.01] hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="relative">
                      <CrystalSpecimenGraphic crystal={crystal} />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleCollection(crystal.id);
                        }}
                        aria-pressed={inCollection}
                        aria-label={
                          inCollection
                            ? `Remove ${crystal.name} from My Collection`
                            : `Add ${crystal.name} to My Collection`
                        }
                        className={`absolute top-2 right-2 flex min-h-[34px] cursor-pointer items-center gap-1 rounded-full px-3 py-1 text-xs font-medium backdrop-blur-md transition-colors ${
                          inCollection
                            ? 'bg-[#070a14]/85 text-[#d4af37] ring-1 ring-[#d4af37]'
                            : 'bg-[#070a14]/70 text-slate-300 hover:text-white'
                        }`}
                      >
                        <Bookmark
                          className={`h-3.5 w-3.5 ${inCollection ? 'fill-current' : ''}`}
                          aria-hidden="true"
                        />
                        <span>{inCollection ? 'Saved' : 'Save'}</span>
                      </button>
                    </div>

                    <div>
                      <h3 className="font-display text-base font-semibold text-slate-50">
                        {crystal.name}
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {crystal.chakra} · Mohs{' '}
                        <span className="astral-tabular">{crystal.mohsHardness}</span>
                      </p>
                    </div>

                    <WaterSafetyBadge safety={crystal.waterSafety} />
                  </div>

                  <input
                    type="text"
                    value={personalNote}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => onUpdateNote(crystal.id, e.target.value)}
                    placeholder={`Notes on ${crystal.name}…`}
                    aria-label={`Personal notes for ${crystal.name}`}
                    className="mt-3 w-full rounded-full bg-[#070a14]/65 px-3.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 ring-1 ring-white/10 focus:ring-[#d4af37] focus:outline-none"
                  />
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
