const chips = (n) => Math.round(n).toLocaleString('en-US');

// Raise-size picker: glossy slider plus pot-fraction presets.
export default function BettingSlider({ min, max, value, onChange, pot, toCall, currentBet, step = 5, disabled = false }) {
  const clamp = (v) => Math.max(min, Math.min(max, Math.round(v / step) * step));
  // Pot-sized raise maths: raise to = current bet + fraction x (pot after calling)
  const potTo = (frac) => clamp(currentBet + frac * (pot + toCall));
  const presets = [
    { label: '⅓', v: potTo(1 / 3) },
    { label: '½', v: potTo(0.5) },
    { label: '⅔', v: potTo(2 / 3) },
    { label: 'pot', v: potTo(1) },
    { label: 'all-in', v: max },
  ];
  const span = Math.max(1, max - min);
  return (
    <div className={`w-full ${disabled ? 'pointer-events-none opacity-40' : ''}`}>
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => onChange(p.v)}
            className={`rounded-full border-2 px-2.5 py-0.5 text-xs font-bold lowercase shadow-sm transition hover:-translate-y-px ${
              value === p.v ? 'border-lime-200 bg-gradient-to-b from-lime-300 to-lime-600 text-white text-shadow' : 'border-white bg-gradient-to-b from-white to-slate-100 text-slate-600'
            }`}
          >
            {p.label}
          </button>
        ))}
        <span className="ml-auto rounded-full bg-slate-800/80 px-3 py-0.5 text-sm font-extrabold text-white shadow-inner">
          {value >= max ? 'all-in ' : currentBet === 0 ? 'bet ' : 'to '}
          {chips(value)}
        </span>
      </div>
      <input
        type="range"
        className="gel-range w-full"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
        aria-label="raise amount"
        style={{
          background: `linear-gradient(to right, #a3e635 0%, #65a30d ${((value - min) / span) * 100}%, #e2e8f0 ${((value - min) / span) * 100}%)`,
        }}
      />
      <div className="mt-1 flex justify-between text-[11px] font-semibold text-slate-400">
        <span>min {chips(min)}</span>
        <span>max {chips(max)}</span>
      </div>
    </div>
  );
}
