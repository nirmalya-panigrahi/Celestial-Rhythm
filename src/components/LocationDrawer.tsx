import {useState, type FormEvent} from 'react';
import {Clock, LocateFixed, RotateCcw, X} from 'lucide-react';
import {CITY_PRESETS} from '../data/planetaryData';
import type {CityPreset, GeoLocationState} from '../types/astral';

interface LocationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  location: GeoLocationState;
  onSelectPreset: (preset: CityPreset) => void;
  onRequestGps: () => void;
  onSetManualCoords: (lat: number, lon: number, label?: string) => boolean;
  customTimeIso: string | null;
  onSetTimeOverride: (iso: string | null) => void;
}

function toLocalDateTimeInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export function LocationDrawer({
  isOpen,
  onClose,
  location,
  onSelectPreset,
  onRequestGps,
  onSetManualCoords,
  customTimeIso,
  onSetTimeOverride,
}: LocationDrawerProps) {
  const [latInput, setLatInput] = useState(String(location.latitude));
  const [lonInput, setLonInput] = useState(String(location.longitude));
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleManualSubmit = (e: FormEvent) => {
    e.preventDefault();
    const lat = Number(latInput);
    const lon = Number(lonInput);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setFormError('Latitude must be -90 to 90 and longitude -180 to 180.');
      return;
    }
    setFormError(null);
    onSetManualCoords(lat, lon);
  };

  return (
    <section
      aria-label="Observer Location and Time Settings"
      className="relative z-20 border-b border-white/10 bg-[#0b1020]/85 backdrop-blur-xl"
    >
      <div className="mx-auto max-w-[1280px] px-4 py-5 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-base font-semibold tracking-wide text-slate-100">
              Observer Coordinates &amp; Solar Time
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Planetary hours depend on exact local sunrise and sunset for your latitude and longitude.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close location settings"
            className="flex min-h-[40px] min-w-[40px] cursor-pointer items-center justify-center rounded-full bg-white/[0.05] text-slate-300 ring-1 ring-white/10 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Column 1: GPS & City Presets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-300">Quick City Presets</span>
              <button
                type="button"
                onClick={onRequestGps}
                disabled={location.loading}
                className="flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-full bg-[#d4af37]/15 px-3.5 py-1.5 text-xs font-medium text-[#d4af37] ring-1 ring-[#d4af37]/45 transition-colors hover:bg-[#d4af37]/25 disabled:opacity-50 whitespace-nowrap"
              >
                <LocateFixed className="h-3.5 w-3.5" aria-hidden="true" />
                {location.loading ? 'Locating…' : 'Use GPS'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {CITY_PRESETS.map((preset) => {
                const selected = location.label.startsWith(preset.name);
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      onSelectPreset(preset);
                      setLatInput(String(preset.latitude));
                      setLonInput(String(preset.longitude));
                      setFormError(null);
                    }}
                    className={`min-h-[38px] cursor-pointer rounded-2xl px-3 py-1.5 text-left text-xs transition-colors ${
                      selected
                        ? 'bg-[#d4af37]/15 text-amber-100 ring-1 ring-[#d4af37]'
                        : 'bg-white/[0.04] text-slate-300 ring-1 ring-white/10 hover:ring-white/25 hover:text-white'
                    }`}
                  >
                    <span className="block truncate font-medium">{preset.name}</span>
                    <span className="text-[11px] text-slate-400">{preset.region}</span>
                  </button>
                );
              })}
            </div>

            {location.error && (
              <p role="alert" className="text-xs text-amber-300">
                {location.error}
              </p>
            )}
          </div>

          {/* Column 2: Manual Coordinates */}
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <span className="block text-xs font-medium text-slate-300">
              Manual Latitude &amp; Longitude
            </span>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs text-slate-400">
                Latitude
                <input
                  type="number"
                  step="0.0001"
                  value={latInput}
                  onChange={(e) => setLatInput(e.target.value)}
                  className="astral-tabular mt-1 w-full rounded-2xl bg-[#070a14]/70 px-3.5 py-2 text-sm text-slate-100 ring-1 ring-white/15 focus:ring-[#d4af37] focus:outline-none"
                />
              </label>
              <label className="block text-xs text-slate-400">
                Longitude
                <input
                  type="number"
                  step="0.0001"
                  value={lonInput}
                  onChange={(e) => setLonInput(e.target.value)}
                  className="astral-tabular mt-1 w-full rounded-2xl bg-[#070a14]/70 px-3.5 py-2 text-sm text-slate-100 ring-1 ring-white/15 focus:ring-[#d4af37] focus:outline-none"
                />
              </label>
            </div>
            {formError && (
              <p role="alert" className="text-xs text-rose-300">
                {formError}
              </p>
            )}
            <button
              type="submit"
              className="min-h-[40px] cursor-pointer rounded-full bg-white/[0.06] px-4 py-2 text-xs font-medium text-slate-100 ring-1 ring-white/15 transition-colors hover:ring-[#d4af37]/60 hover:bg-white/10"
            >
              Apply Coordinates
            </button>
          </form>

          {/* Column 3: Optional Date/Time Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
                <Clock className="h-3.5 w-3.5 text-[#8ab4f8]" aria-hidden="true" />
                Time Preview
              </span>
              {customTimeIso && (
                <button
                  type="button"
                  onClick={() => onSetTimeOverride(null)}
                  className="flex cursor-pointer items-center gap-1 text-xs text-[#d4af37] hover:underline"
                >
                  <RotateCcw className="h-3 w-3" aria-hidden="true" />
                  Return to Live
                </button>
              )}
            </div>
            <label className="block text-xs text-slate-400">
              Simulate Local Date &amp; Time
              <input
                type="datetime-local"
                value={customTimeIso ?? toLocalDateTimeInputValue(new Date())}
                onChange={(e) => onSetTimeOverride(e.target.value || null)}
                className="astral-tabular mt-1 w-full rounded-2xl bg-[#070a14]/70 px-3.5 py-2 text-sm text-slate-100 ring-1 ring-white/15 focus:ring-[#d4af37] focus:outline-none"
              />
            </label>
            <p className="text-xs text-slate-400">
              {customTimeIso
                ? 'Preview mode active. Solar hours and lunar phase reflect the selected timestamp.'
                : 'Synced to live local system clock.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
