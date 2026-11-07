import { GlossyLink, PageTitle, Panel } from '../components/ui.jsx';
import { useSettings } from '../store/useSettings.js';

const MODULES = [
  {
    to: '/tutorials/outs',
    key: 'outs',
    title: 'outs & the rule of 2 and 4',
    glyph: '4×',
    color: 'cyan',
    grad: 'from-cyan-300 via-cyan-500 to-sky-600',
    text: 'Count the cards that win you the pot, then turn them into a percentage with a shortcut you can do at the table.',
    skills: ['counting outs', 'rule of 2 & 4', 'exact odds'],
    scoreLabel: 'best streak',
  },
  {
    to: '/tutorials/pot-odds',
    key: 'potodds',
    title: 'pot odds & bet sizing',
    glyph: '%',
    color: 'lime',
    grad: 'from-lime-300 via-lime-500 to-green-600',
    text: 'Is the call profitable? Compare the price to your equity, and learn how often you must defend (MDF).',
    skills: ['required equity', 'MDF', 'call or fold'],
    scoreLabel: 'best streak',
  },
  {
    to: '/tutorials/speed',
    key: 'speed',
    title: 'speed hand recognition',
    glyph: '5s',
    color: 'magenta',
    grad: 'from-fuchsia-300 via-fuchsia-500 to-pink-600',
    text: 'Three hands, one board, five seconds. Click the strongest hand before the timer runs dry.',
    skills: ['hand rankings', 'board reading', 'kickers'],
    scoreLabel: 'high score',
  },
  {
    to: '/tutorials/push-fold',
    key: 'pushfold',
    title: 'all-in or fold',
    glyph: '♥︎',
    color: 'orange',
    grad: 'from-amber-300 via-orange-500 to-orange-600',
    text: 'Short-stack survival. Shove or fold from every seat at 3–15 big blinds, checked against a push chart.',
    skills: ['push/fold charts', 'position', 'stack depth'],
    scoreLabel: 'best run',
  },
];

export default function TutorialHub() {
  const scores = useSettings((s) => s.highScores);
  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle
        kicker="tutorial dojo"
        title="pick a drill"
        color="magenta"
        subtitle="Each module teaches one idea, then drills it until it's automatic. Short sessions, every day, beat marathon grinds."
      />
      <div className="grid gap-6 md:grid-cols-2">
        {MODULES.map((m, i) => (
          <Panel key={m.to} className="group flex flex-col overflow-clip transition hover:-translate-y-1" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-b from-white/0 to-white/0 opacity-60" />
            <div className="flex items-start gap-4">
              <div className={`relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-white bg-gradient-to-b shadow-xl ${m.grad}`}>
                <span className="absolute inset-x-2 top-1 h-1/2 rounded-full bg-gradient-to-b from-white/80 to-white/0" />
                <span className="absolute -bottom-3 -right-3 h-10 w-10 rounded-full bg-white/20" />
                <span className="relative text-2xl font-black text-white text-shadow">{m.glyph}</span>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-2xl leading-tight text-slate-800">{m.title}</h2>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.skills.map((s) => (
                    <span key={s} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold lowercase text-slate-500">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-4 flex-1 text-slate-600">{m.text}</p>
            <div className="mt-5 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500">
                {m.scoreLabel}: <span className="text-lg font-black text-slate-800">{scores[m.key] || 0}</span>
              </span>
              <GlossyLink to={m.to} color={m.color}>
                start {'→'}
              </GlossyLink>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
