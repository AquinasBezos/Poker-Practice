import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import BackgroundShapes from './BackgroundShapes.jsx';
import { GlossySwitch } from './ui.jsx';
import { useSettings } from '../store/useSettings.js';

export function Logo({ small = false }) {
  return (
    <NavLink to="/" className="group flex items-center gap-2.5" aria-label="poker dojo home">
      <span className={`relative grid place-items-center overflow-hidden rounded-full border-[3px] border-white bg-gradient-to-b from-cyan-300 to-sky-600 shadow-lg shadow-cyan-500/40 ${small ? 'h-9 w-9' : 'h-12 w-12'}`}>
        <span className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-fuchsia-400/80" />
        <span className="absolute -bottom-1 -left-1 h-4 w-4 rounded-full bg-lime-400/90" />
        <span className={`relative font-black text-white text-shadow ${small ? 'text-lg' : 'text-2xl'}`}>{'♠︎'}</span>
        <span className="absolute inset-x-1 top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/80 to-white/0" />
      </span>
      <span className={`font-extrabold lowercase leading-none tracking-tight text-slate-800 ${small ? 'text-xl' : 'text-[28px]'}`}>
        poker<span className="text-cyan-500">dojo</span>
      </span>
    </NavLink>
  );
}

const Icon = {
  home: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M12 3 2.5 11h2.7v9h5.3v-5.5h3V20h5.3v-9h2.7z" /></svg>
  ),
  dojo: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M12 3 1 8.5 12 14l9-4.5V16h2V8.5zM5 12.7v3.8C6.8 18.4 9.3 19.5 12 19.5s5.2-1.1 7-3V12.7L12 16.2z" /></svg>
  ),
  arena: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><circle cx="12" cy="12" r="9.5" /><circle cx="12" cy="12" r="5.5" fill="#fff" opacity=".9" /><circle cx="12" cy="12" r="3" /><path d="M11 1.8h2v3.4h-2zM11 18.8h2v3.4h-2zM1.8 11h3.4v2H1.8zM18.8 11h3.4v2h-3.4z" fill="#fff" opacity=".9" /></svg>
  ),
};

const NAV = [
  { to: '/', label: 'home', icon: 'home', color: 'from-cyan-300 to-sky-600', end: true },
  {
    to: '/tutorials',
    label: 'tutorial dojo',
    icon: 'dojo',
    color: 'from-fuchsia-300 to-pink-600',
    end: true,
    children: [
      { to: '/tutorials/outs', label: 'outs & rule of 2/4', dot: 'bg-cyan-400' },
      { to: '/tutorials/pot-odds', label: 'pot odds & mdf', dot: 'bg-lime-400' },
      { to: '/tutorials/speed', label: 'speed recognition', dot: 'bg-fuchsia-400' },
      { to: '/tutorials/push-fold', label: 'all-in or fold', dot: 'bg-orange-400' },
    ],
  },
  { to: '/arena', label: 'practice arena', icon: 'arena', color: 'from-lime-300 to-green-600' },
];

function Sidebar({ open, onClose }) {
  const settings = useSettings();
  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-sky-900/20 backdrop-blur-sm lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r-2 border-white bg-white/85 px-5 pb-6 pt-6 shadow-2xl shadow-cyan-900/10 backdrop-blur-xl transition-transform duration-300 lg:sticky lg:top-0 lg:z-20 lg:h-screen lg:translate-x-0 lg:shadow-none ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between">
          <Logo />
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-500 lg:hidden" aria-label="close menu">
            {'✕'}
          </button>
        </div>

        <div className="pointer-events-none absolute -right-10 top-28 h-24 w-24 rounded-full bg-cyan-300/30" />
        <div className="pointer-events-none absolute -left-8 bottom-40 h-20 w-20 rounded-full bg-fuchsia-300/25" />

        <nav className="relative mt-8 flex-1 space-y-2 overflow-y-auto pr-1" aria-label="main">
          {NAV.map((item) => (
            <div key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 overflow-hidden rounded-2xl border-2 px-3 py-2.5 text-[17px] font-bold lowercase transition ${
                    isActive ? 'border-white bg-gradient-to-r from-white to-cyan-50 text-slate-900 shadow-md' : 'border-transparent text-slate-600 hover:border-white hover:bg-white/70'
                  }`
                }
              >
                <span className={`relative grid h-9 w-9 place-items-center overflow-hidden rounded-full border-2 border-white bg-gradient-to-b text-white shadow ${item.color}`}>
                  <span className="absolute inset-x-1 top-0 h-1/2 rounded-full bg-white/40" />
                  <span className="relative">{Icon[item.icon]}</span>
                </span>
                {item.label}
              </NavLink>
              {item.children && (
                <div className="ml-7 mt-1 space-y-0.5 border-l-2 border-dashed border-cyan-200 pl-4">
                  {item.children.map((c) => (
                    <NavLink
                      key={c.to}
                      to={c.to}
                      className={({ isActive }) =>
                        `flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold lowercase transition ${isActive ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:bg-white/70 hover:text-slate-800'}`
                      }
                    >
                      <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />
                      {c.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="relative mt-4 space-y-3 rounded-3xl border-2 border-white bg-gradient-to-b from-white/90 to-cyan-50/80 p-4 shadow-inner">
          <p className="chip-label">settings</p>
          <GlossySwitch label="4-colour deck" checked={settings.fourColor} onChange={() => settings.toggle('fourColor')} color="cyan" />
          <GlossySwitch label="coach notes" checked={settings.coachNotes} onChange={() => settings.toggle('coachNotes')} color="orange" />
          <GlossySwitch label="trainer wheels" checked={settings.trainerWheels} onChange={() => settings.toggle('trainerWheels')} color="lime" />
        </div>
      </aside>
    </>
  );
}

export default function Layout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen">
      <BackgroundShapes />
      <header className="sticky top-0 z-30 flex items-center justify-between border-b-2 border-white bg-white/80 px-4 py-2.5 backdrop-blur-xl lg:hidden">
        <Logo small />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-full border-2 border-white bg-gradient-to-b from-cyan-300 to-sky-600 text-white shadow-md"
          aria-label="open menu"
        >
          <span className="absolute inset-x-1 top-0 h-1/2 rounded-full bg-white/40" />
          <svg viewBox="0 0 24 24" className="relative h-5 w-5" fill="currentColor"><path d="M3 6h18v2.5H3zm0 5h18v2.5H3zm0 5h18v2.5H3z" /></svg>
        </button>
      </header>
      <div className="flex">
        <Sidebar open={open} onClose={() => setOpen(false)} />
        <main className="min-w-0 flex-1 px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:pt-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
