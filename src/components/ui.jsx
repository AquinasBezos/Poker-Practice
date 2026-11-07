import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { BORDER, GRADIENT, SHADOW, TEXT } from './theme.js';

const BTN_SIZES = {
  sm: 'px-4 py-1.5 text-sm',
  md: 'px-6 py-2.5 text-base',
  lg: 'px-8 py-3.5 text-lg',
  xl: 'px-10 py-4 text-xl',
};

const glossyClasses = (color, size, className) =>
  `relative isolate inline-flex select-none items-center justify-center overflow-hidden rounded-full border-2 bg-gradient-to-b font-bold lowercase tracking-wide shadow-lg transition duration-150 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 disabled:saturate-50 ${GRADIENT[color]} ${BORDER[color]} ${SHADOW[color]} ${
    color === 'silver' ? 'text-slate-700' : 'text-white text-shadow'
  } ${BTN_SIZES[size]} ${className}`;

const Gloss = () => <span className="pointer-events-none absolute inset-x-3 top-[2px] -z-10 h-[48%] rounded-full bg-gradient-to-b from-white/85 to-white/10" />;

export const GlossyButton = forwardRef(function GlossyButton({ color = 'cyan', size = 'md', className = '', children, type = 'button', ...rest }, ref) {
  return (
    <button ref={ref} type={type} className={glossyClasses(color, size, className)} {...rest}>
      <Gloss />
      <span className="relative inline-flex items-center justify-center gap-2">{children}</span>
    </button>
  );
});

export function GlossyLink({ to, color = 'cyan', size = 'md', className = '', children, ...rest }) {
  return (
    <Link to={to} className={glossyClasses(color, size, className)} {...rest}>
      <Gloss />
      <span className="relative inline-flex items-center justify-center gap-2">{children}</span>
    </Link>
  );
}

export function RoundButton({ color = 'cyan', className = '', children, label, ...rest }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`relative isolate grid h-12 w-12 place-items-center overflow-hidden rounded-full border-2 bg-gradient-to-b text-2xl font-black text-white shadow-lg transition hover:brightness-110 active:scale-95 disabled:opacity-40 ${GRADIENT[color]} ${BORDER[color]} ${SHADOW[color]} ${className}`}
      {...rest}
    >
      <span className="pointer-events-none absolute inset-x-1.5 top-[2px] -z-10 h-1/2 rounded-full bg-gradient-to-b from-white/85 to-white/10" />
      <span className="text-shadow leading-none">{children}</span>
    </button>
  );
}

const ACCENT = {
  cyan: 'from-cyan-400 via-sky-400 to-cyan-300',
  lime: 'from-lime-400 via-green-400 to-lime-300',
  magenta: 'from-fuchsia-500 via-pink-400 to-fuchsia-300',
  orange: 'from-orange-500 via-amber-400 to-orange-300',
  violet: 'from-violet-500 via-purple-400 to-violet-300',
  rainbow: 'from-cyan-400 via-fuchsia-400 to-lime-400',
};

export function Panel({ accent, className = '', children, as: Tag = 'section', ...rest }) {
  return (
    <Tag className={`panel p-5 sm:p-6 ${className}`} {...rest}>
      {accent && <div className={`absolute inset-x-10 -top-[2px] h-1.5 rounded-b-full bg-gradient-to-r ${ACCENT[accent]}`} />}
      {children}
    </Tag>
  );
}

export function PageTitle({ kicker, title, subtitle, color = 'cyan', right }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {kicker && (
          <span className={`relative inline-flex overflow-hidden rounded-full border-2 bg-gradient-to-b px-3 py-0.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white shadow-md ${GRADIENT[color]} ${BORDER[color]}`}>
            <span className="pointer-events-none absolute inset-x-2 top-0 h-1/2 rounded-full bg-white/40" />
            <span className="relative text-shadow">{kicker}</span>
          </span>
        )}
        <h1 className="mt-2 text-4xl font-extrabold lowercase leading-none tracking-tight text-slate-800 sm:text-5xl">
          {title}
          <span className={TEXT[color]}>.</span>
        </h1>
        {subtitle && <p className="mt-3 max-w-2xl text-base text-slate-600 sm:text-lg">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

const SWITCH_ON = {
  lime: 'from-lime-300 to-green-600',
  cyan: 'from-cyan-300 to-sky-600',
  magenta: 'from-fuchsia-300 to-pink-600',
  orange: 'from-amber-300 to-orange-600',
};

export function GlossySwitch({ checked, onChange, label, color = 'lime', className = '' }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`group inline-flex items-center gap-3 ${className}`}>
      <span
        className={`relative h-7 w-[52px] shrink-0 overflow-hidden rounded-full border-2 border-white bg-gradient-to-b shadow-inner transition-colors ${checked ? SWITCH_ON[color] : 'from-slate-200 to-slate-400'}`}
      >
        <span className="pointer-events-none absolute inset-x-1 top-0 h-1/2 rounded-full bg-white/40" />
        <span className={`absolute top-[2px] h-5 w-5 rounded-full border border-white bg-gradient-to-b from-white to-slate-200 shadow-md transition-all duration-200 ${checked ? 'left-[26px]' : 'left-[2px]'}`} />
      </span>
      {label && <span className="text-sm font-semibold lowercase text-slate-700">{label}</span>}
    </button>
  );
}

export function StatPill({ label, value, color = 'cyan', className = '' }) {
  return (
    <div className={`panel-tight flex flex-col items-start px-4 py-2 ${className}`}>
      <span className="chip-label">{label}</span>
      <span className={`text-xl font-extrabold leading-tight ${TEXT[color]}`}>{value}</span>
    </div>
  );
}

export function Tabs({ tabs, value, onChange, className = '' }) {
  return (
    <div className={`flex flex-wrap gap-1.5 rounded-full border-2 border-white bg-slate-100/80 p-1 shadow-inner ${className}`} role="tablist">
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(t.value)}
            className={`relative overflow-hidden rounded-full px-3 py-1 text-xs font-bold lowercase transition ${
              active ? `bg-gradient-to-b text-white shadow-md text-shadow ${GRADIENT[t.color || 'cyan']}` : 'text-slate-500 hover:bg-white hover:text-slate-700'
            }`}
          >
            {active && <span className="pointer-events-none absolute inset-x-1 top-0 h-1/2 rounded-full bg-white/40" />}
            <span className="relative">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Bubble({ color = 'cyan', className = '' }) {
  const fills = {
    cyan: 'bg-cyan-400/30',
    lime: 'bg-lime-400/35',
    magenta: 'bg-fuchsia-400/25',
    orange: 'bg-orange-400/30',
    violet: 'bg-violet-400/25',
  };
  return <div aria-hidden className={`pointer-events-none absolute rounded-full ${fills[color]} ${className}`} />;
}
