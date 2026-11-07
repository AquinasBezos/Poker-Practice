import PlayingCard from '../components/PlayingCard.jsx';
import Avatar from '../components/Avatar.jsx';
import FeedbackBadge from '../components/FeedbackBadge.jsx';
import { GlossyLink, Panel } from '../components/ui.jsx';
import { parseCards } from '../poker/cards.js';
import { PROFILES, SEAT_ARCHETYPES } from '../poker/profiles.js';
import { useSettings } from '../store/useSettings.js';

const FAN = parseCards('As Kh Qd Jc Ts');

const FEATURES = [
  {
    to: '/tutorials',
    title: 'tutorial dojo',
    color: 'from-fuchsia-300 via-fuchsia-500 to-pink-600',
    ring: 'shadow-fuchsia-500/30',
    text: 'Bite-size drills for the maths that wins pots: outs, pot odds, MDF, speed reads and push/fold.',
    cta: 'start learning',
    btn: 'magenta',
  },
  {
    to: '/arena',
    title: 'practice arena',
    color: 'from-lime-300 via-lime-500 to-green-600',
    ring: 'shadow-lime-500/30',
    text: 'A 6-max table against five bot personalities. Every decision you make gets an instant A+ to F grade.',
    cta: 'take a seat',
    btn: 'lime',
  },
  {
    to: '/arena',
    title: 'trainer wheels',
    color: 'from-cyan-300 via-cyan-500 to-sky-600',
    ring: 'shadow-cyan-500/30',
    text: 'Toggle a live HUD with your equity, outs and pot odds, plus 13×13 range heatmaps that update with the betting.',
    cta: 'see the hud',
    btn: 'cyan',
  },
];

export default function Home() {
  const scores = useSettings((s) => s.highScores);
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* hero */}
      <section className="panel relative overflow-clip px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-cyan-300/35" />
        <div className="pointer-events-none absolute -bottom-28 right-40 h-64 w-64 rounded-full bg-lime-300/35" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-fuchsia-300/25" />
        <div className="pointer-events-none absolute right-8 top-10 h-16 w-16 rounded-full bg-orange-300/50" />
        <div className="pointer-events-none absolute inset-y-0 right-[30%] w-24 -skew-x-[25deg] bg-gradient-to-b from-white/0 via-white/60 to-white/0" />

        <div className="relative grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-white bg-gradient-to-b from-orange-300 to-orange-500 px-3 py-0.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white shadow-md text-shadow">
              welcome to the
            </span>
            <h1 className="mt-3 text-6xl font-extrabold lowercase leading-[0.9] tracking-tighter text-slate-800 sm:text-8xl">
              poker
              <br />
              <span className="bg-gradient-to-r from-cyan-500 via-sky-500 to-fuchsia-500 bg-clip-text text-transparent">dojo</span>
              <span className="text-lime-500">.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-slate-600 sm:text-xl">
              train your brain. read the board. <span className="font-bold text-slate-800">make the maths do the work.</span>
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <GlossyLink to="/tutorials" color="cyan" size="lg">
                start a lesson
              </GlossyLink>
              <GlossyLink to="/arena" color="lime" size="lg">
                hit the tables
              </GlossyLink>
            </div>
          </div>

          <div className="relative mx-auto h-64 w-full max-w-sm sm:h-72">
            <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-b from-cyan-200/80 to-sky-400/60 shadow-[inset_0_-20px_40px_rgba(8,145,178,0.35)]" />
            <div className="absolute left-1/2 top-[22%] h-20 w-44 -translate-x-1/2 rounded-full bg-white/50" />
            {FAN.map((c, i) => (
              <div
                key={c}
                className="absolute left-1/2 top-1/2 origin-bottom transition-transform duration-300 hover:-translate-y-3"
                style={{ transform: `translate(-50%, -58%) translateX(${(i - 2) * 30}px) rotate(${(i - 2) * 12}deg) translateY(${Math.abs(i - 2) * 6}px)` }}
              >
                <PlayingCard card={c} size="lg" />
              </div>
            ))}
            <FeedbackBadge grade="A+" size="md" className="absolute right-2 top-2 animate-floaty" animate={false} />
            <div className="absolute bottom-2 left-2 animate-floaty-slow rounded-full border-2 border-white bg-white/90 px-3 py-1 text-xs font-bold text-slate-600 shadow-lg">
              equity <span className="text-lime-600">67%</span>
            </div>
          </div>
        </div>
      </section>

      {/* feature tiles */}
      <section className="grid gap-5 md:grid-cols-3">
        {FEATURES.map((f) => (
          <Panel key={f.title} className="flex flex-col overflow-clip">
            <div className={`relative -mx-6 -mt-6 mb-5 h-24 overflow-clip rounded-t-[22px] bg-gradient-to-br ${f.color}`}>
              <div className="absolute -right-6 -top-10 h-28 w-28 rounded-full bg-white/25" />
              <div className="absolute bottom-[-30px] left-6 h-20 w-20 rounded-full bg-white/20" />
              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-white/0" />
              <h2 className="absolute bottom-3 left-6 text-3xl font-extrabold lowercase text-white text-shadow">{f.title}</h2>
            </div>
            <p className="flex-1 text-slate-600">{f.text}</p>
            <GlossyLink to={f.to} color={f.btn} size="sm" className="mt-5 self-start">
              {f.cta} {'→'}
            </GlossyLink>
          </Panel>
        ))}
      </section>

      {/* opponents + records */}
      <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Panel accent="rainbow">
          <h2 className="text-2xl">meet the table</h2>
          <p className="mt-1 text-sm text-slate-500">Five bots, five leaks to exploit. Learn who to bluff and who to value-bet.</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {SEAT_ARCHETYPES.filter((a) => a !== 'hero').map((a) => {
              const p = PROFILES[a];
              return (
                <li key={a} className="flex items-start gap-3 rounded-2xl border-2 border-white bg-white/70 p-3 shadow-sm">
                  <Avatar color={p.color} variant={a} size={52} />
                  <div className="min-w-0">
                    <p className="font-extrabold lowercase text-slate-800">
                      {p.name} <span className="text-xs font-bold text-slate-400">· {p.label}</span>
                    </p>
                    <p className="text-sm leading-snug text-slate-500">{p.blurb}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel accent="lime">
          <h2 className="text-2xl">your records</h2>
          <p className="mt-1 text-sm text-slate-500">Best streaks, saved on this device.</p>
          <dl className="mt-4 space-y-3">
            {[
              ['speed recognition', scores.speed, 'from-fuchsia-300 to-pink-600'],
              ['all-in or fold', scores.pushfold, 'from-amber-300 to-orange-600'],
              ['outs & rule of 2/4', scores.outs, 'from-cyan-300 to-sky-600'],
              ['pot odds & mdf', scores.potodds, 'from-lime-300 to-green-600'],
            ].map(([label, val, grad]) => (
              <div key={label} className="flex items-center justify-between rounded-2xl border-2 border-white bg-white/70 px-4 py-2 shadow-sm">
                <dt className="font-semibold lowercase text-slate-600">{label}</dt>
                <dd className={`relative grid h-10 min-w-[2.5rem] place-items-center overflow-hidden rounded-full border-2 border-white bg-gradient-to-b px-2 text-lg font-black text-white shadow text-shadow ${grad}`}>
                  <span className="absolute inset-x-1 top-0 h-1/2 rounded-full bg-white/40" />
                  <span className="relative">{val || 0}</span>
                </dd>
              </div>
            ))}
          </dl>
        </Panel>
      </section>
    </div>
  );
}
