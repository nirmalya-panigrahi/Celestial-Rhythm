import {useState} from 'react';
import chakraMandalaImg from '../assets/images/chakra_mandala_sacred_1795601845440.jpg';
import cosmicNebulaImg from '../assets/images/cosmic_nebula_banner_1795601845261.jpg';
import crystalMalachiteImg from '../assets/images/crystal_malachite_copper_1795601846171.jpg';
import crystalQuartzImg from '../assets/images/crystal_quartz_amethyst_1795601845715.jpg';
import crystalSeleniteImg from '../assets/images/crystal_selenite_moonstone_1795601847296.jpg';
import type {ChakraId, CrystalItem} from '../types/astral';

export const STUDIO_IMAGES = {
  cosmicNebula: cosmicNebulaImg,
  chakraMandala: chakraMandalaImg,
  quartzAmethyst: crystalQuartzImg,
  malachiteCopper: crystalMalachiteImg,
  seleniteMoonstone: crystalSeleniteImg,
} as const;

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export function ResilientImage({
  src,
  alt,
  className = '',
  fallbackLabel = '',
}: ResilientImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#131d3a] to-[#070a14] text-xs text-slate-400 ${className}`}
      >
        {fallbackLabel || alt}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

interface ChakraSymbolProps {
  chakraId: ChakraId;
  colorHex: string;
  size?: number;
  className?: string;
}

const PETAL_COUNT: Record<ChakraId, number> = {
  Root: 4,
  Sacral: 6,
  'Solar Plexus': 10,
  Heart: 12,
  Throat: 16,
  'Third Eye': 2,
  Crown: 24,
};

export function ChakraSymbol({
  chakraId,
  colorHex,
  size = 52,
  className = '',
}: ChakraSymbolProps) {
  const petals = PETAL_COUNT[chakraId];
  const angles = Array.from({length: petals}, (_, i) => (i * 360) / petals);

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={`aura-${chakraId.replace(/\s+/g, '')}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={colorHex} stopOpacity="0.38" />
          <stop offset="100%" stopColor={colorHex} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill={`url(#aura-${chakraId.replace(/\s+/g, '')})`} />
      <circle
        cx="32"
        cy="32"
        r="24"
        fill="none"
        stroke={colorHex}
        strokeOpacity="0.48"
        strokeWidth="1"
      />
      {angles.map((deg) => (
        <ellipse
          key={deg}
          cx="32"
          cy="14"
          rx={petals > 12 ? 2.1 : 3.4}
          ry={petals === 2 ? 9 : 6.5}
          transform={`rotate(${deg} 32 32)`}
          fill={colorHex}
          fillOpacity="0.18"
          stroke={colorHex}
          strokeOpacity="0.82"
          strokeWidth="0.9"
        />
      ))}
      {chakraId === 'Root' && (
        <rect x="23" y="23" width="18" height="18" fill="none" stroke={colorHex} strokeWidth="1.2" />
      )}
      {chakraId === 'Sacral' && (
        <path
          d="M 24 30 A 9 9 0 0 0 40 30 A 7 7 0 0 1 24 30 Z"
          fill={colorHex}
          fillOpacity="0.4"
          stroke={colorHex}
          strokeWidth="1"
        />
      )}
      {chakraId === 'Solar Plexus' && (
        <polygon points="22,25 42,25 32,42" fill="none" stroke={colorHex} strokeWidth="1.2" />
      )}
      {chakraId === 'Heart' && (
        <>
          <polygon points="32,20 42,38 22,38" fill="none" stroke={colorHex} strokeWidth="1" />
          <polygon points="22,26 42,26 32,44" fill="none" stroke={colorHex} strokeWidth="1" />
        </>
      )}
      <circle cx="32" cy="32" r="4.5" fill={colorHex} fillOpacity="0.88" />
    </svg>
  );
}

export const CRYSTAL_PALETTES: Record<string, [string, string, string]> = {
  'clear-quartz': ['#ffffff', '#cbd5e1', '#64748b'],
  amethyst: ['#e9d5ff', '#9333ea', '#3b0764'],
  'rose-quartz': ['#fce7f3', '#f472b6', '#9d174d'],
  citrine: ['#fef08a', '#f59e0b', '#92400e'],
  'smoky-quartz': ['#e2e8f0', '#64748b', '#1e293b'],
  'black-tourmaline': ['#94a3b8', '#334155', '#090d16'],
  selenite: ['#ffffff', '#e2e8f0', '#94a3b8'],
  pyrite: ['#fef9c3', '#d4af37', '#713f12'],
  malachite: ['#6ee7b7', '#059669', '#022c22'],
  azurite: ['#93c5fd', '#2563eb', '#172554'],
  chrysocolla: ['#a5f3fc', '#06b6d4', '#164e63'],
  'lapis-lazuli': ['#93c5fd', '#1d4ed8', '#172554'],
  labradorite: ['#5eead4', '#3b82f6', '#1e293b'],
  moonstone: ['#f0f9ff', '#93c5fd', '#475569'],
  sunstone: ['#fed7aa', '#ea580c', '#7c2d12'],
  carnelian: ['#fecaca', '#ea580c', '#7c2d12'],
  'red-jasper': ['#fca5a5', '#dc2626', '#450a0a'],
  'green-aventurine': ['#bbf7d0', '#10b981', '#064e3b'],
  'tigers-eye': ['#fde047', '#b45309', '#451a03'],
  obsidian: ['#94a3b8', '#334155', '#020617'],
  hematite: ['#f1f5f9', '#64748b', '#0f172a'],
  fluorite: ['#c4b5fd', '#14b8a6', '#312e81'],
  lepidolite: ['#fae8ff', '#a855f7', '#581c87'],
  aquamarine: ['#e0f2fe', '#38bdf8', '#0369a1'],
  peridot: ['#ecfccb', '#84cc16', '#365314'],
  garnet: ['#fecdd3', '#e11d48', '#4c0519'],
  rhodochrosite: ['#fce7f3', '#f43f5e', '#881337'],
  rhodonite: ['#fbcfe8', '#db2777', '#1e293b'],
  kyanite: ['#dbeafe', '#2563eb', '#1e3a8a'],
  celestite: ['#f0f9ff', '#7dd3fc', '#0284c7'],
};

export function CrystalSpecimenGraphic({
  crystal,
  large = false,
}: {
  crystal: CrystalItem;
  large?: boolean;
}) {
  const [light, mid, dark] = CRYSTAL_PALETTES[crystal.id] ?? ['#e2e8f0', '#64748b', '#1e293b'];
  const uid = `${crystal.id}-${large ? 'lg' : 'sm'}`;
  const sys = crystal.crystalSystem.toLowerCase();

  return (
    <div
      className={`relative flex w-full items-center justify-center overflow-hidden rounded-2xl ${
        large ? 'h-48' : 'h-36'
      }`}
    >
      {/* Ambient mineral glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute h-28 w-28 rounded-full opacity-30 blur-2xl"
        style={{backgroundColor: mid}}
      />

      <svg
        viewBox="0 0 180 130"
        className={`relative drop-shadow-[0_12px_20px_rgba(0,0,0,0.6)] ${
          large ? 'h-44 w-56' : 'h-32 w-44'
        }`}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`body-${uid}`} x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor={light} stopOpacity="0.95" />
            <stop offset="48%" stopColor={mid} stopOpacity="0.92" />
            <stop offset="100%" stopColor={dark} stopOpacity="0.98" />
          </linearGradient>
          <linearGradient id={`refract-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.65" />
            <stop offset="50%" stopColor={light} stopOpacity="0.25" />
            <stop offset="100%" stopColor={dark} stopOpacity="0.05" />
          </linearGradient>
          <radialGradient id={`core-${uid}`} cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="55%" stopColor={mid} stopOpacity="0.18" />
            <stop offset="100%" stopColor={dark} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Subtle dark basalt matrix base */}
        <polygon
          points="36,104 62,94 118,94 144,104 126,116 54,116"
          fill="#0f172a"
          stroke="#ffffff"
          strokeOpacity="0.1"
          strokeWidth="0.7"
        />

        {sys.includes('isometric') ? (
          /* 3-Cube Isometric Pyrite / Fluorite / Garnet Cluster (18 optical facets) */
          <g>
            {/* Left satellite cube */}
            <polygon points="56,48 76,58 56,68 36,58" fill={light} fillOpacity="0.88" />
            <polygon points="36,58 56,68 56,96 36,86" fill={mid} fillOpacity="0.9" />
            <polygon points="56,68 76,58 76,86 56,96" fill={dark} fillOpacity="0.95" />
            {/* Right satellite cube */}
            <polygon points="124,46 144,56 124,66 104,56" fill={light} fillOpacity="0.85" />
            <polygon points="104,56 124,66 124,96 104,86" fill={mid} fillOpacity="0.88" />
            <polygon points="124,66 144,56 144,86 124,96" fill={dark} fillOpacity="0.96" />
            {/* Center Hero Cube */}
            <polygon points="90,22 122,38 90,54 58,38" fill={`url(#refract-${uid})`} />
            <polygon points="90,22 122,38 90,54 58,38" fill={light} fillOpacity="0.6" />
            <polygon points="58,38 90,54 90,100 58,84" fill={`url(#body-${uid})`} />
            <polygon points="90,54 122,38 122,84 90,100" fill={dark} fillOpacity="0.92" />
            <polygon points="62,42 86,54 86,94 62,82" fill={`url(#core-${uid})`} />
            <polyline
              points="90,22 122,38 122,84 90,100 58,84 58,38 90,22"
              fill="none"
              stroke="#ffffff"
              strokeOpacity="0.45"
              strokeWidth="0.9"
            />
            <line x1="90" y1="54" x2="90" y2="100" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="0.8" />
          </g>
        ) : crystal.id === 'malachite' ? (
          /* Concentric Botryoidal Malachite Cluster */
          <g>
            <ellipse cx="90" cy="68" rx="48" ry="34" fill={dark} stroke={light} strokeOpacity="0.3" />
            <circle cx="74" cy="64" r="24" fill={mid} stroke={light} strokeWidth="1.6" strokeOpacity="0.75" />
            <circle cx="74" cy="64" r="16" fill={dark} stroke={light} strokeWidth="1.3" strokeOpacity="0.8" />
            <circle cx="74" cy="64" r="9" fill={mid} stroke={light} strokeWidth="1.1" />
            <circle cx="74" cy="64" r="3.5" fill={light} />
            <circle cx="110" cy="54" r="17" fill={mid} stroke={light} strokeWidth="1.4" strokeOpacity="0.7" />
            <circle cx="110" cy="54" r="10" fill={dark} stroke={light} strokeWidth="1.1" />
            <circle cx="110" cy="54" r="4" fill={light} />
            <circle cx="104" cy="80" r="13" fill={mid} stroke={light} strokeWidth="1.1" strokeOpacity="0.65" />
            <circle cx="104" cy="80" r="6" fill={dark} stroke={light} strokeWidth="0.9" />
            <ellipse cx="78" cy="50" rx="18" ry="8" fill="#ffffff" fillOpacity="0.16" />
          </g>
        ) : sys.includes('monoclinic') || sys.includes('triclinic') || sys.includes('orthorhombic') ? (
          /* Radiating Multi-Blade Satin / Feldspar Cluster */
          <g>
            <polygon points="50,36 62,30 78,100 62,102" fill={dark} fillOpacity="0.9" />
            <polygon points="130,34 118,28 102,100 118,102" fill={mid} fillOpacity="0.85" />
            <polygon points="68,20 84,16 90,102 72,102" fill={`url(#body-${uid})`} />
            <polygon points="104,22 118,28 104,102 90,102" fill={mid} fillOpacity="0.9" />
            {/* Hero central crystal blade */}
            <polygon points="82,12 100,15 104,104 78,104" fill={`url(#body-${uid})`} />
            <polygon points="82,12 91,18 91,104 78,104" fill={`url(#refract-${uid})`} />
            <polygon points="91,18 100,15 104,104 91,104" fill={dark} fillOpacity="0.35" />
            {/* Fine longitudinal striations */}
            <line x1="85" y1="20" x2="83" y2="98" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="0.7" />
            <line x1="94" y1="20" x2="96" y2="98" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="0.7" />
          </g>
        ) : sys.includes('amorphous') ? (
          /* Conchoidal Obsidian Glassy Fracture Cluster */
          <g>
            <polygon points="60,44 82,22 96,102 52,100" fill={dark} />
            <polygon points="88,16 122,48 112,102 74,102 68,46" fill={`url(#body-${uid})`} />
            <polygon points="88,16 98,52 74,102 68,46" fill={`url(#refract-${uid})`} />
            <path d="M 88 16 Q 92 52 74 102" fill="none" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="0.9" />
            <path d="M 70 50 Q 94 58 120 48" fill="none" stroke={light} strokeOpacity="0.35" strokeWidth="0.8" />
          </g>
        ) : (
          /* 5-Point Terminated Hexagonal Quartz / Beryl Cluster (22 facets) */
          <g>
            {/* Left & Right secondary points */}
            <polygon points="44,50 56,42 66,102 48,102" fill={dark} fillOpacity="0.88" />
            <polygon points="56,42 60,52 66,102 56,102" fill={mid} fillOpacity="0.75" />
            <polygon points="134,46 120,38 112,102 130,102" fill={mid} fillOpacity="0.85" />
            {/* Mid-left & mid-right points */}
            <polygon points="64,30 78,24 82,102 60,102" fill={`url(#body-${uid})`} />
            <polygon points="116,28 102,22 96,102 118,102" fill={dark} fillOpacity="0.85" />
            {/* Hero central doubly-faceted point */}
            <polygon points="90,10 107,32 104,104 76,104 73,32" fill={`url(#body-${uid})`} />
            <polygon points="90,10 90,104 76,104 73,32" fill={`url(#refract-${uid})`} />
            <polygon points="90,10 107,32 90,40 73,32" fill={light} fillOpacity="0.62" />
            <polygon points="90,10 90,40 73,32" fill="#ffffff" fillOpacity="0.45" />
            <polygon points="90,40 107,32 104,104 90,104" fill={dark} fillOpacity="0.28" />
            <polyline
              points="90,10 107,32 104,104 76,104 73,32 90,10"
              fill="none"
              stroke="#ffffff"
              strokeOpacity="0.42"
              strokeWidth="0.85"
            />
            <line x1="90" y1="10" x2="90" y2="104" stroke="#ffffff" strokeOpacity="0.32" strokeWidth="0.75" />
          </g>
        )}

        {/* Specular star glints on facets */}
        <circle cx="90" cy="24" r="1.4" fill="#ffffff" fillOpacity="0.85" />
        <circle cx="76" cy="48" r="1" fill="#ffffff" fillOpacity="0.65" />
      </svg>
    </div>
  );
}
