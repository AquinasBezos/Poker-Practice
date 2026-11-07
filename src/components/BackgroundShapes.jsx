// Fixed decorative backdrop: white canvas, overlapping translucent circles and sweeping swooshes.
export default function BackgroundShapes() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-white via-sky-50 to-cyan-50">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="bg-swoosh-a" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#22d3ee" />
            <stop offset="0.5" stopColor="#38bdf8" />
            <stop offset="1" stopColor="#a3e635" />
          </linearGradient>
          <linearGradient id="bg-swoosh-b" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#e879f9" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
          <linearGradient id="bg-band" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#67e8f9" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="bg-orb" cx="0.35" cy="0.3" r="0.7">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="0.4" stopColor="#ffffff" stopOpacity="0.15" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        <polygon points="980,0 1260,0 640,1000 360,1000" fill="url(#bg-band)" opacity="0.22" />
        <polygon points="1300,0 1380,0 780,1000 700,1000" fill="url(#bg-band)" opacity="0.18" />

        <g className="origin-center animate-floaty-slow">
          <circle cx="1420" cy="130" r="240" fill="#22d3ee" opacity="0.2" />
          <circle cx="1420" cy="130" r="240" fill="url(#bg-orb)" />
        </g>
        <g className="animate-floaty">
          <circle cx="1180" cy="300" r="90" fill="#e879f9" opacity="0.16" />
          <circle cx="560" cy="80" r="70" fill="#fb923c" opacity="0.2" />
          <circle cx="560" cy="80" r="70" fill="url(#bg-orb)" />
        </g>
        <circle cx="160" cy="210" r="150" fill="#d946ef" opacity="0.1" />
        <circle cx="160" cy="210" r="110" fill="none" stroke="#ffffff" strokeWidth="6" opacity="0.8" />
        <circle cx="1300" cy="820" r="200" fill="#a3e635" opacity="0.18" />
        <circle cx="1300" cy="820" r="200" fill="url(#bg-orb)" />
        <circle cx="1460" cy="640" r="40" fill="#fb923c" opacity="0.25" />
        <circle cx="380" cy="880" r="120" fill="#22d3ee" opacity="0.14" />

        <path d="M-100 760 C 300 560, 760 960, 1700 560 L1700 1100 L-100 1100 Z" fill="url(#bg-swoosh-a)" opacity="0.2" />
        <path d="M-100 860 C 420 700, 900 1040, 1700 740 L1700 1100 L-100 1100 Z" fill="url(#bg-swoosh-b)" opacity="0.14" />
        <path d="M-100 820 C 360 640, 820 1000, 1700 640" fill="none" stroke="#ffffff" strokeWidth="5" opacity="0.9" />
      </svg>
    </div>
  );
}
