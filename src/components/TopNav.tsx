import {MapPin} from 'lucide-react';
import type {TabId} from '../types/astral';

interface TopNavProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  locationLabel: string;
  onToggleLocationDrawer: () => void;
  isLocationOpen: boolean;
}

const TABS: Array<{id: TabId; label: string}> = [
  {id: 'now', label: 'Now'},
  {id: 'chakras', label: 'Chakra Sessions'},
  {id: 'crystals', label: 'Crystal Vault'},
];

export function TopNav({
  activeTab,
  onSelectTab,
  locationLabel,
  onToggleLocationDrawer,
  isLocationOpen,
}: TopNavProps) {
  return (
    <header className="relative z-20 border-b border-white/10 bg-[#070a14]/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:flex-nowrap sm:gap-8 sm:px-6">
        {/* Zone 1: Single text element wordmark */}
        <span className="font-display text-lg font-semibold tracking-wider text-slate-100 whitespace-nowrap shrink-0 sm:text-xl">
          Astral Hours
        </span>

        {/* Zone 2: Clean typography navigation tabs */}
        <nav aria-label="Primary sections" className="order-3 flex w-full items-center justify-center gap-6 border-t border-white/10 pt-2.5 sm:order-2 sm:w-auto sm:border-t-0 sm:pt-0 sm:gap-8">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative min-h-[40px] cursor-pointer py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d4af37] ${
                  isActive ? 'text-[#d4af37]' : 'text-slate-300 hover:text-white'
                }`}
              >
                {tab.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[1px] h-[2px] rounded-full bg-[#d4af37]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single primary utility button */}
        <div className="order-2 flex items-center shrink-0 sm:order-3">
          <button
            type="button"
            onClick={onToggleLocationDrawer}
            aria-expanded={isLocationOpen}
            className="flex min-h-[40px] max-w-[200px] cursor-pointer items-center gap-2 rounded-full bg-white/[0.06] px-4 py-2 text-xs font-medium text-slate-200 ring-1 ring-white/10 transition-colors hover:ring-[#d4af37]/60 hover:text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4af37]"
          >
            <MapPin className="h-3.5 w-3.5 shrink-0 text-[#d4af37]" aria-hidden="true" />
            <span className="truncate">{locationLabel}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
