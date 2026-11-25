import {useEffect, useMemo, useRef, useState} from 'react';
import gsap from 'gsap';
import {AlertTriangle, OctagonAlert, RotateCcw, Search} from 'lucide-react';
import {CHAKRAS} from '../data/chakras';
import {CRYSTALS} from '../data/crystals';
import type {ChakraId, CrystalItem, LunarPhaseInfo, WaterSafety} from '../types/astral';
import {filterCrystals} from '../utils/crystalFilter';
import {Crystal3DViewer} from './Crystal3DViewer';
import {CrystalSpecimenGraphic} from './VisualAssets';

interface CrystalVaultTabProps {
  lunar: LunarPhaseInfo;
  initialSearch?: string;
  onActiveCrystalChange?: (crystal: CrystalItem) => void;
}

function SmallMoonGlyph({phase}: {phase: number}) {
  const p = ((phase % 1) + 1) % 1;
  const isWaxing = p <= 0.5;
  const terminatorScale = Math.cos(p * Math.PI * 2);
  const rx = Math.abs(terminatorScale) * 8;

  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" aria-hidden="true">
      <circle cx="10" cy="10" r="8" fill="#0f172a" stroke="#d4af37" strokeOpacity="0.65" strokeWidth="1" />
      {p > 0.02 && p < 0.98 && (
        <>
          <path
            d={isWaxing ? 'M 10 2 A 8 8 0 0 1 10 18 Z' : 'M 10 2 A 8 8 0 0 0 10 18 Z'}
            fill="#e2e8f0"
          />
          {terminatorScale < 0 ? (
            <ellipse cx="10" cy="10" rx={rx} ry="8" fill="#e2e8f0" />
          ) : (
            <ellipse cx="10" cy="10" rx={rx} ry="8" fill="#0f172a" />
          )}
        </>
      )}
    </svg>
  );
}

function WaterSafetyNotice({safety}: {safety: WaterSafety}) {
  if (safety === 'Safe') return null;

  if (safety === 'Caution') {
    return (
      <p className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-300">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Water Safety: Caution</span>
      </p>
    );
  }

  return (
    <p className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-300">
      <OctagonAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>Water Safety: Unsafe / Toxic</span>
    </p>
  );
}

export function CrystalVaultTab({
  lunar,
  initialSearch = '',
  onActiveCrystalChange,
}: CrystalVaultTabProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [chakraFilter, setChakraFilter] = useState<ChakraId | 'All'>('All');
  const [safetyFilter, setSafetyFilter] = useState<WaterSafety | 'All'>('All');
  const [focusedCrystalId, setFocusedCrystalId] = useState<string>(CRYSTALS[0].id);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const heroStageRef = useRef<HTMLDivElement | null>(null);

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
        myCollectionOnly: false,
        collectionIds: [],
      }),
    [searchQuery, chakraFilter, safetyFilter],
  );

  const activeCrystal = useMemo(() => {
    return (
      filteredCrystals.find((c) => c.id === focusedCrystalId) ??
      filteredCrystals[0] ??
      CRYSTALS[0]
    );
  }, [filteredCrystals, focusedCrystalId]);

  useEffect(() => {
    onActiveCrystalChange?.(activeCrystal);
  }, [activeCrystal, onActiveCrystalChange]);

  // GSAP entrance timeline on tab load
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
        '[data-gsap-vault-hero]',
        {opacity: 0, scale: 0.95},
        {opacity: 1, scale: 1, duration: 0.5, clearProps: 'transform'},
      ).fromTo(
        '[data-gsap-vault-stagger]',
        {opacity: 0, y: 8},
        {opacity: 1, y: 0, duration: 0.42, stagger: 0.03, clearProps: 'transform'},
        '-=0.3',
      );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  // Subtle transition when selecting a new crystal into the 3D viewer
  useEffect(() => {
    const el = heroStageRef.current;
    if (!el) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    gsap.fromTo(
      el,
      {opacity: 0.45, scale: 0.96},
      {opacity: 1, scale: 1, duration: 0.42, ease: 'power2.out', clearProps: 'transform'},
    );
  }, [activeCrystal.id]);

  const resetFilters = () => {
    setSearchQuery('');
    setChakraFilter('All');
    setSafetyFilter('All');
  };

  return (
    <div ref={rootRef} className="space-y-8 py-2">
      {/* 1. Slim Single-Line Moon Indicator */}
      <div
        aria-label="Lunar Charging and Cleansing Window"
        className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d4af37]/15 pb-3 text-xs text-slate-300"
      >
        <div className="flex items-center gap-2.5">
          <SmallMoonGlyph phase={lunar.phase} />
          <span className="font-medium text-slate-100">{lunar.phaseName}</span>
          <span aria-hidden="true" className="text-slate-600">
            ·
          </span>
          <span className="text-[#d4af37]">{lunar.headline}</span>
        </div>

        <span className="astral-tabular text-slate-400">
          {lunar.illuminationPercent}% illuminated
        </span>
      </div>

      {/* 2. Single Control Row: Underlined Search, Underlined Select, Text Water-Safe Toggles */}
      <section
        aria-label="Crystal Search and Filters"
        className="flex flex-wrap items-center gap-x-6 gap-y-4 border-b border-[#d4af37]/15 pb-4"
      >
        <div className="relative min-w-[200px] flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-0 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="text"
            role="searchbox"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 30 stones…"
            aria-label="Search crystals"
            className="min-h-[38px] w-full border-b border-[#d4af37]/25 bg-transparent pr-2 pl-6 text-sm text-slate-100 placeholder:text-slate-500 focus:border-[#d4af37] focus:outline-none"
          />
        </div>

        <select
          id="chakra-filter"
          aria-label="Filter by Chakra"
          value={chakraFilter}
          onChange={(e) => setChakraFilter(e.target.value as ChakraId | 'All')}
          className="min-h-[38px] cursor-pointer border-b border-[#d4af37]/25 bg-[#070a14] pr-4 text-xs text-slate-200 focus:border-[#d4af37] focus:outline-none"
        >
          <option value="All">All Chakras</option>
          {CHAKRAS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.id} Chakra
            </option>
          ))}
        </select>

        <div className="flex items-center gap-4" role="group" aria-label="Filter by water safety">
          {(['All', 'Safe', 'Caution', 'Unsafe / Toxic'] as const).map((option) => {
            const active = safetyFilter === option;
            const label =
              option === 'All'
                ? 'All'
                : option === 'Safe'
                  ? 'Water-Safe'
                  : option === 'Caution'
                    ? 'Caution'
                    : 'Dry Only';
            return (
              <button
                key={option}
                type="button"
                onClick={() => setSafetyFilter(option)}
                aria-pressed={active}
                className={`min-h-[36px] cursor-pointer border-b-2 pb-1 text-xs transition-colors whitespace-nowrap ${
                  active
                    ? 'border-[#d4af37] font-semibold text-[#d4af37]'
                    : 'border-transparent text-slate-400 hover:text-slate-100'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <span className="astral-tabular ml-auto text-xs text-slate-400">
          Showing {filteredCrystals.length} of {CRYSTALS.length} stones
        </span>
      </section>

      {/* 3. Open 3D Crystal Specimen Inspector (Zero Container Box) */}
      {filteredCrystals.length > 0 && (
        <section
          ref={heroStageRef}
          data-gsap-vault-hero
          aria-label="3D Crystal Specimen Inspector"
          className="grid items-center gap-8 border-b border-[#d4af37]/15 pb-8 lg:grid-cols-12"
        >
          <div className="lg:col-span-6">
            <Crystal3DViewer crystal={activeCrystal} />
          </div>

          <div className="space-y-4 lg:col-span-6">
            <div>
              <p className="astral-tabular text-xs text-slate-400">
                {activeCrystal.chakra} Chakra · Mohs {activeCrystal.mohsHardness}
              </p>
              <h2 className="astral-headline mt-1 text-3xl font-semibold text-slate-50">
                {activeCrystal.name}
              </h2>
            </div>

            <p className="max-w-lg text-sm leading-relaxed text-slate-300">
              {activeCrystal.cleansingMethod}
            </p>

            <WaterSafetyNotice safety={activeCrystal.waterSafety} />
          </div>
        </section>
      )}

      {/* 4. Floating Gem Gallery (Zero Card Boxes, Zero Borders, Soft Radial Glows) */}
      {filteredCrystals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <p className="font-display text-lg font-semibold text-slate-100">No matching stones</p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 inline-flex min-h-[40px] cursor-pointer items-center gap-2 border-b border-[#d4af37] pb-1 text-xs font-medium text-[#d4af37]"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Reset Filters
          </button>
        </div>
      ) : (
        <section aria-label="Crystal Specimen Gallery">
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
            {filteredCrystals.map((crystal, idx) => {
              const isFocused = activeCrystal.id === crystal.id;
              return (
                <button
                  key={crystal.id}
                  type="button"
                  data-gsap-vault-stagger
                  onClick={() => setFocusedCrystalId(crystal.id)}
                  aria-pressed={isFocused}
                  className={`group flex cursor-pointer flex-col items-center text-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d4af37] ${
                    idx % 2 === 1 ? 'sm:translate-y-3' : ''
                  }`}
                >
                  <CrystalSpecimenGraphic crystal={crystal} selected={isFocused} />
                  <h3
                    className={`font-display mt-1 border-b pb-0.5 text-sm transition-colors ${
                      isFocused
                        ? 'border-[#d4af37] font-semibold text-[#d4af37]'
                        : 'border-transparent font-medium text-slate-200 group-hover:text-white'
                    }`}
                  >
                    {crystal.name}
                  </h3>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
