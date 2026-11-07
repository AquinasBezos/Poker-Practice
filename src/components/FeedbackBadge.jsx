const STYLES = {
  'A+': 'from-lime-200 via-lime-400 to-green-600 border-lime-100 shadow-lime-500/60',
  A: 'from-emerald-200 via-emerald-400 to-teal-600 border-emerald-100 shadow-emerald-500/60',
  B: 'from-cyan-200 via-cyan-400 to-sky-600 border-cyan-100 shadow-cyan-500/60',
  C: 'from-yellow-200 via-amber-400 to-orange-500 border-amber-100 shadow-amber-500/60',
  D: 'from-orange-200 via-orange-500 to-red-500 border-orange-100 shadow-orange-500/60',
  F: 'from-fuchsia-300 via-pink-500 to-rose-600 border-pink-100 shadow-pink-500/60',
};

const SIZES = {
  xs: 'h-7 w-7 text-xs border-2',
  sm: 'h-10 w-10 text-base border-2',
  md: 'h-16 w-16 text-2xl border-[3px]',
  lg: 'h-24 w-24 text-4xl border-4',
};

export const GRADE_TEXT = {
  'A+': 'text-lime-600',
  A: 'text-emerald-600',
  B: 'text-cyan-600',
  C: 'text-amber-500',
  D: 'text-orange-600',
  F: 'text-rose-600',
};

export default function FeedbackBadge({ grade, size = 'md', animate = true, className = '' }) {
  if (!grade) return null;
  return (
    <div
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-b font-black text-white shadow-lg ${STYLES[grade] || STYLES.B} ${SIZES[size]} ${animate ? 'animate-pop' : ''} ${className}`}
      aria-label={`grade ${grade}`}
      title={`grade ${grade}`}
    >
      <span className="pointer-events-none absolute inset-x-[12%] top-[4%] h-[46%] rounded-full bg-gradient-to-b from-white/90 to-white/10" />
      <span className="pointer-events-none absolute -bottom-1/3 left-1/2 h-2/3 w-2/3 -translate-x-1/2 rounded-full bg-white/20 blur-sm" />
      <span className="relative text-shadow leading-none">{grade}</span>
    </div>
  );
}
