import { RANKS, SUIT_SYMBOLS, SUIT_NAMES, RANK_NAMES, rankOf, suitOf } from '../poker/cards.js';
import { useSettings } from '../store/useSettings.js';

// U+FE0E forces text (not emoji) presentation of the suit glyphs.
const TEXT_VS = '︎';
const FOUR_COLOR = ['text-slate-800', 'text-rose-500', 'text-sky-500', 'text-emerald-600'];
const TWO_COLOR = ['text-slate-800', 'text-rose-500', 'text-rose-500', 'text-slate-800'];

const SIZES = {
  xs: { box: 'h-9 w-[26px] rounded-md', rank: 'text-[13px]', suit: 'text-[11px]', pip: null },
  sm: { box: 'h-14 w-10 rounded-lg', rank: 'text-base', suit: 'text-sm', pip: 'text-lg' },
  md: { box: 'h-[76px] w-[54px] rounded-xl', rank: 'text-xl', suit: 'text-base', pip: 'text-3xl' },
  lg: { box: 'h-[100px] w-[72px] rounded-2xl', rank: 'text-[26px]', suit: 'text-xl', pip: 'text-[40px]' },
};

export default function PlayingCard({ card, hidden = false, size = 'md', highlight = false, dim = false, selected = false, onClick, className = '', style }) {
  const fourColor = useSettings((s) => s.fourColor);
  const S = SIZES[size] || SIZES.md;
  const interactive = typeof onClick === 'function';
  const ring = highlight
    ? 'ring-4 ring-lime-400 shadow-lime-400/60 -translate-y-1'
    : selected
      ? 'ring-4 ring-fuchsia-400 -translate-y-1'
      : '';
  const base = `relative inline-flex shrink-0 select-none overflow-hidden border-2 border-white shadow-[0_4px_10px_-2px_rgba(15,23,42,0.35)] transition duration-200 ${S.box} ${ring} ${dim ? 'opacity-35 grayscale' : ''} ${interactive ? 'cursor-pointer hover:-translate-y-1' : ''} ${className}`;

  if (hidden || card == null || card < 0) {
    return (
      <div className={`${base} card-back`} style={style} aria-label="face-down card">
        <div className="absolute inset-[3px] rounded-[inherit] border border-white/60" />
        <div className="gloss" />
      </div>
    );
  }

  const r = rankOf(card);
  const s = suitOf(card);
  const rank = RANKS[r] === 'T' ? '10' : RANKS[r];
  const color = (fourColor ? FOUR_COLOR : TWO_COLOR)[s];
  const Tag = interactive ? 'button' : 'div';

  return (
    <Tag
      type={interactive ? 'button' : undefined}
      onClick={onClick}
      style={style}
      aria-label={`${RANK_NAMES[r]} of ${SUIT_NAMES[s]}`}
      className={`${base} flex-col bg-gradient-to-b from-white via-white to-slate-100 ${color}`}
    >
      {size === 'xs' ? (
        <span className="m-auto flex flex-col items-center leading-none">
          <span className={`font-extrabold tracking-tighter ${S.rank}`}>{rank}</span>
          <span className={S.suit}>{SUIT_SYMBOLS[s] + TEXT_VS}</span>
        </span>
      ) : (
        <>
          <span className={`absolute left-[7%] top-[3%] flex flex-col items-center font-extrabold leading-none tracking-tighter ${S.rank}`}>
            {rank}
            <span className={`${S.suit} mt-px`}>{SUIT_SYMBOLS[s] + TEXT_VS}</span>
          </span>
          <span className={`absolute bottom-[4%] right-[8%] leading-none ${S.pip}`}>{SUIT_SYMBOLS[s] + TEXT_VS}</span>
        </>
      )}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-[45%] rounded-t-[inherit] bg-gradient-to-b from-white/70 to-white/0" />
    </Tag>
  );
}

export function CardRow({ cards, size = 'md', hidden = false, highlightSet, dimSet, gap = 'gap-1.5', animate = false, slots = 0, className = '' }) {
  const items = [...cards];
  while (items.length < slots) items.push(null);
  return (
    <div className={`flex ${gap} ${className}`}>
      {items.map((c, i) =>
        c == null && slots ? (
          <EmptySlot key={`e${i}`} size={size} />
        ) : (
          <PlayingCard
            key={`${c}-${i}`}
            card={c}
            size={size}
            hidden={hidden}
            highlight={highlightSet ? highlightSet.has(c) : false}
            dim={dimSet ? dimSet.has(c) : false}
            className={animate ? 'animate-dealIn' : ''}
            style={animate ? { animationDelay: `${i * 70}ms` } : undefined}
          />
        ),
      )}
    </div>
  );
}

export function EmptySlot({ size = 'md' }) {
  const S = SIZES[size] || SIZES.md;
  return <div className={`${S.box} shrink-0 border-2 border-dashed border-white/60 bg-white/10`} />;
}
