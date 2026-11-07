import { useId } from 'react';
import { HEX } from './theme.js';

// Colourful vector silhouettes. Each archetype gets a small accessory.
function Accessory({ variant, dark }) {
  switch (variant) {
    case 'nit': // beanie
      return (
        <g>
          <path d="M19.5 22 C 19.5 9.5, 44.5 9.5, 44.5 22 Z" fill={dark} />
          <rect x="18.5" y="19.5" width="27" height="4.5" rx="2.2" fill="#fff" opacity=".85" />
          <circle cx="32" cy="10" r="3.4" fill="#fff" />
        </g>
      );
    case 'maniac': // spiky hair
      return <path d="M19.5 23 L21 10 L25.5 16.5 L28 5.5 L32 15 L35.5 5 L38.5 15.5 L43 9 L44.5 23 Z" fill={dark} />;
    case 'station': // headphones
      return (
        <g>
          <path d="M18.5 28 C 18.5 10, 45.5 10, 45.5 28" stroke={dark} strokeWidth="3.2" fill="none" strokeLinecap="round" />
          <rect x="15" y="24" width="7" height="10" rx="3.5" fill={dark} />
          <rect x="42" y="24" width="7" height="10" rx="3.5" fill={dark} />
        </g>
      );
    case 'shark': // shades + fin
      return (
        <g>
          <path d="M28 15.5 L36 4 L38.5 15.5 Z" fill={dark} />
          <rect x="21.5" y="23" width="9.5" height="5.5" rx="2.6" fill="#0f172a" />
          <rect x="33" y="23" width="9.5" height="5.5" rx="2.6" fill="#0f172a" />
          <rect x="30" y="24.3" width="4" height="1.6" fill="#0f172a" />
          <rect x="23" y="23.8" width="3" height="1.4" rx=".7" fill="#fff" opacity=".7" />
        </g>
      );
    case 'rookie': // propeller cap
      return (
        <g>
          <path d="M20.5 20.5 C 21.5 12, 42.5 12, 43.5 20.5 Z" fill={dark} />
          <rect x="31.2" y="7.5" width="1.6" height="5" fill={dark} />
          <ellipse cx="27" cy="7.4" rx="5" ry="1.7" fill="#facc15" />
          <ellipse cx="37" cy="7.4" rx="5" ry="1.7" fill="#f472b6" />
        </g>
      );
    case 'hero': // star badge
      return <path d="M32 44.5 l2.1 4.3 4.7.7 -3.4 3.3 .8 4.7 -4.2-2.2 -4.2 2.2 .8-4.7 -3.4-3.3 4.7-.7z" fill="#fff" opacity=".95" />;
    case 'coach': // whistle cap
      return (
        <g>
          <path d="M19 21 C 20 11, 44 11, 45 21 Z" fill={dark} />
          <path d="M44 20.5 L52 21.5 L44 23 Z" fill={dark} />
          <circle cx="32" cy="48" r="3" fill="#facc15" stroke="#fff" strokeWidth="1" />
          <path d="M26 39 L32 46 L38 39" stroke="#fff" strokeWidth="1.2" fill="none" />
        </g>
      );
    default:
      return null;
  }
}

export default function Avatar({ color = 'cyan', variant = 'hero', size = 64, className = '' }) {
  const id = useId().replace(/:/g, '');
  const [light, dark] = HEX[color] || HEX.cyan;
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden>
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={light} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
        <radialGradient id={`b${id}`} cx=".32" cy=".25" r=".95">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor={light} stopOpacity=".55" />
        </radialGradient>
        <clipPath id={`c${id}`}>
          <circle cx="32" cy="32" r="29" />
        </clipPath>
      </defs>
      <circle cx="32" cy="32" r="31.5" fill="#fff" />
      <circle cx="32" cy="32" r="29" fill={`url(#b${id})`} />
      <g clipPath={`url(#c${id})`}>
        <circle cx="52" cy="12" r="13" fill={light} opacity=".45" />
        <circle cx="9" cy="44" r="8" fill={light} opacity=".35" />
        <path d="M7.5 66 C 8.5 47, 19.5 39.5, 32 39.5 C 44.5 39.5, 55.5 47, 56.5 66 Z" fill={`url(#g${id})`} />
        <circle cx="32" cy="26" r="11.5" fill={`url(#g${id})`} />
        <Accessory variant={variant} dark={dark} />
      </g>
      <ellipse cx="32" cy="15" rx="21" ry="10" fill="#fff" opacity=".32" />
      <circle cx="32" cy="32" r="29" fill="none" stroke={dark} strokeOpacity=".45" strokeWidth="2" />
    </svg>
  );
}
