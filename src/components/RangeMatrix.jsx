import { classLabel } from '../poker/handClasses.js';
import { rangeWidth } from '../poker/ranges.js';
import { HEX } from './theme.js';

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// 13x13 heatmap of a range. `weights` is a 169-length array of 0..1.
export default function RangeMatrix({ weights, color = 'cyan', highlight = -1, title, showWidth = true, compact = false, className = '' }) {
  const [, dark] = HEX[color] || HEX.cyan;
  const [r, g, b] = hexToRgb(dark);
  const width = weights ? rangeWidth(weights) : 0;
  return (
    <div className={className}>
      {(title || showWidth) && (
        <div className="mb-2 flex items-baseline justify-between gap-2">
          {title && <span className="chip-label">{title}</span>}
          {showWidth && <span className="text-xs font-bold text-slate-500">{(width * 100).toFixed(1)}% of hands</span>}
        </div>
      )}
      <div className="grid gap-[2px] rounded-xl border-2 border-white bg-white/60 p-1 shadow-inner" style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}>
        {Array.from({ length: 169 }, (_, i) => {
          const w = weights ? weights[i] : 0;
          const on = w > 0.02;
          const isHi = i === highlight;
          const row = Math.floor(i / 13);
          const col = i % 13;
          const pair = row === col;
          return (
            <div
              key={i}
              title={`${classLabel(i)} — ${Math.round(w * 100)}%`}
              className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-[3px] font-bold leading-none tracking-tighter ${
                compact ? 'text-[6px] sm:text-[7px]' : 'text-[7px] sm:text-[8.5px]'
              } ${isHi ? 'z-10 ring-2 ring-fuchsia-500 ring-offset-1' : ''}`}
              style={{
                background: on ? `rgba(${r}, ${g}, ${b}, ${0.18 + 0.82 * w})` : pair ? '#eef2f7' : '#f8fafc',
                color: on && w > 0.45 ? '#fff' : '#94a3b8',
              }}
            >
              {on && w > 0.45 && <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-white/25" />}
              <span className="relative">{classLabel(i)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
