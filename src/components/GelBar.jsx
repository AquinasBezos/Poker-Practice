import { BAR } from './theme.js';

// Glossy "gel" progress bar with an optional marker (e.g. the equity you need).
export default function GelBar({ value = 0, color = 'cyan', label, valueLabel, marker, markerLabel, height = 'h-5', className = '' }) {
  const v = Math.max(0, Math.min(1, value || 0));
  const m = marker == null ? null : Math.max(0, Math.min(1, marker));
  return (
    <div className={className}>
      {(label || valueLabel) && (
        <div className="mb-1 flex items-baseline justify-between gap-2">
          {label && <span className="chip-label">{label}</span>}
          {valueLabel != null && <span className="text-sm font-extrabold text-slate-700">{valueLabel}</span>}
        </div>
      )}
      <div className={`relative ${height} w-full rounded-full border-2 border-white bg-gradient-to-b from-slate-200 to-slate-100 shadow-[inset_0_2px_4px_rgba(15,23,42,0.18)]`}>
        <div
          className={`absolute inset-y-0 left-0 overflow-hidden rounded-full bg-gradient-to-b transition-[width] duration-500 ease-out ${BAR[color]}`}
          style={{ width: `${v * 100}%` }}
        >
          <span className="absolute inset-x-1 top-[1px] h-1/2 rounded-full bg-gradient-to-b from-white/80 to-white/10" />
        </div>
        {m != null && (
          <div className="absolute -top-1.5 -bottom-1.5 w-1 -translate-x-1/2 rounded-full bg-slate-800 shadow ring-2 ring-white" style={{ left: `${m * 100}%` }}>
            {markerLabel && (
              <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-800 px-1.5 py-px text-[10px] font-bold text-white">
                {markerLabel}
              </span>
            )}
          </div>
        )}
      </div>
      {m != null && markerLabel && <div className="h-5" />}
    </div>
  );
}
