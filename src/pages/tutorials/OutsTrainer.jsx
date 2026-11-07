import { useState } from 'react';
import { CardRow } from '../../components/PlayingCard.jsx';
import FeedbackBadge from '../../components/FeedbackBadge.jsx';
import GelBar from '../../components/GelBar.jsx';
import { GlossyButton, PageTitle, Panel, RoundButton, StatPill } from '../../components/ui.jsx';
import { shuffledDeck, rankOf, suitOf } from '../../poker/cards.js';
import { evaluate, describeScore, categoryOf } from '../../poker/evaluator.js';
import { outsVsHand, detectDraws, drawLabel, hitChance, ruleOf2And4 } from '../../poker/outs.js';
import { exactEquityVsHand } from '../../poker/equity.js';
import { useSettings } from '../../store/useSettings.js';

function generateScenario() {
  for (let attempt = 0; attempt < 6000; attempt++) {
    const deck = shuffledDeck();
    const hero = [deck[0], deck[1]];
    const villain = [deck[2], deck[3]];
    const boardSize = Math.random() < 0.6 ? 3 : 4;
    const board = deck.slice(4, 4 + boardSize);
    const hs = evaluate([...hero, ...board]);
    const vs = evaluate([...villain, ...board]);
    if (hs >= vs || categoryOf(vs) < 1) continue;
    const outs = outsVsHand(hero, villain, board);
    if (outs.length < 2 || outs.length > 17) continue;
    const draws = detectDraws(hero, board);
    const drawy = draws.flushDraw || draws.oesd || draws.gutshot;
    if (!drawy && Math.random() < 0.65) continue;
    const toCome = 5 - boardSize;
    const unseen = 52 - 4 - boardSize;
    return {
      hero,
      villain,
      board,
      outs: outs.sort((a, b) => suitOf(a) - suitOf(b) || rankOf(b) - rankOf(a)),
      toCome,
      unseen,
      hit: hitChance(outs.length, toCome, unseen),
      equity: exactEquityVsHand(hero, villain, board).equity,
      heroName: describeScore(hs),
      villainName: describeScore(vs),
      draw: drawLabel(draws),
    };
  }
  return generateScenario();
}

const outsGrade = (diff) => (diff === 0 ? 'A+' : diff === 1 ? 'A' : diff === 2 ? 'B' : diff <= 4 ? 'C' : diff <= 6 ? 'D' : 'F');
const pctGrade = (diff) => (diff <= 2 ? 'A+' : diff <= 4 ? 'A' : diff <= 7 ? 'B' : diff <= 11 ? 'C' : diff <= 16 ? 'D' : 'F');

const COMMON = [
  ['flush draw', 9],
  ['open-ended straight draw', 8],
  ['gutshot', 4],
  ['two overcards', 6],
  ['set → full house (flop)', 7],
  ['flush + straight draw', 15],
];

export default function OutsTrainer() {
  const [sc, setSc] = useState(generateScenario);
  const [phase, setPhase] = useState('outs');
  const [outsGuess, setOutsGuess] = useState(8);
  const [pctGuess, setPctGuess] = useState(30);
  const [streak, setStreak] = useState(0);
  const [tally, setTally] = useState({ rounds: 0, close: 0 });
  const best = useSettings((s) => s.highScores.outs);
  const submitScore = useSettings((s) => s.submitScore);

  const n = sc.outs.length;
  const exactPct = sc.hit * 100;
  const rule = ruleOf2And4(n, sc.toCome);
  const adjusted = sc.toCome === 2 && n > 8 ? rule - (n - 8) : rule;
  const outsDiff = Math.abs(outsGuess - n);
  const pDiff = Math.abs(pctGuess - exactPct);

  const reveal = () => {
    setPhase('reveal');
    const good = outsDiff <= 1;
    const nextStreak = good ? streak + 1 : 0;
    setStreak(nextStreak);
    submitScore('outs', nextStreak);
    setTally((t) => ({ rounds: t.rounds + 1, close: t.close + (good ? 1 : 0) }));
  };

  const next = () => {
    setSc(generateScenario());
    setPhase('outs');
    setOutsGuess(8);
    setPctGuess(30);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle
        kicker="lesson 1"
        title="outs & the rule of 2 and 4"
        color="cyan"
        subtitle="You're behind. Count the cards that put you ahead, then estimate your chance of hitting one."
        right={
          <div className="flex gap-3">
            <StatPill label="streak" value={streak} color="cyan" />
            <StatPill label="best" value={best} color="magenta" />
            <StatPill label="accuracy" value={tally.rounds ? `${Math.round((tally.close / tally.rounds) * 100)}%` : '–'} color="lime" />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Panel accent="cyan" className="overflow-clip">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-200/40" />
          {/* table strip */}
          <div className="relative overflow-hidden rounded-3xl border-4 border-white bg-gradient-to-b from-cyan-400 via-cyan-500 to-sky-700 p-4 shadow-inner sm:p-6">
            <div className="pointer-events-none absolute inset-x-10 top-0 h-1/3 rounded-b-full bg-white/25" />
            <div className="relative grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
              <div>
                <p className="chip-label !text-white/80">villain shows</p>
                <CardRow cards={sc.villain} size="md" className="mt-1" />
                <p className="mt-1 text-sm font-bold text-white text-shadow">{sc.villainName}</p>
              </div>
              <div className="sm:justify-self-center">
                <p className="chip-label !text-white/80">
                  board · {sc.toCome === 2 ? 'flop — two cards to come' : 'turn — one card to come'}
                </p>
                <CardRow cards={sc.board} slots={5} size="md" className="mt-1" animate key={sc.board.join()} />
              </div>
            </div>
            <div className="relative mt-5 flex flex-wrap items-end gap-4">
              <div>
                <p className="chip-label !text-white/80">your hand</p>
                <CardRow cards={sc.hero} size="lg" className="mt-1" />
              </div>
              <div className="mb-2 rounded-2xl bg-white/90 px-4 py-2 shadow">
                <p className="text-sm font-extrabold text-slate-800">{sc.heroName}</p>
                <p className="text-xs font-semibold text-slate-500">{phase === 'reveal' && sc.draw ? sc.draw : 'currently behind'}</p>
              </div>
            </div>
          </div>

          {/* step 1: outs */}
          {phase === 'outs' && (
            <div className="relative mt-6 animate-rise">
              <h2 className="text-2xl">step 1 — how many outs?</h2>
              <p className="text-sm text-slate-500">Cards that would put you ahead of villain on the very next card.</p>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <RoundButton color="silver" label="fewer outs" onClick={() => setOutsGuess((v) => Math.max(0, v - 1))}>
                  <span className="text-slate-600">{'−'}</span>
                </RoundButton>
                <div className="grid h-20 w-24 place-items-center rounded-3xl border-4 border-white bg-gradient-to-b from-cyan-50 to-cyan-100 text-5xl font-black text-cyan-700 shadow-inner">
                  {outsGuess}
                </div>
                <RoundButton color="cyan" label="more outs" onClick={() => setOutsGuess((v) => Math.min(25, v + 1))}>
                  +
                </RoundButton>
                <div className="flex flex-wrap gap-1.5">
                  {[4, 6, 8, 9, 12, 15].map((v) => (
                    <button key={v} type="button" onClick={() => setOutsGuess(v)} className="rounded-full border-2 border-white bg-white px-3 py-1 text-sm font-bold text-slate-600 shadow-sm hover:bg-cyan-50">
                      {v}
                    </button>
                  ))}
                </div>
                <GlossyButton color="cyan" size="lg" className="ml-auto" onClick={() => setPhase('percent')}>
                  lock in {'→'}
                </GlossyButton>
              </div>
            </div>
          )}

          {/* step 2: percentage */}
          {phase === 'percent' && (
            <div className="relative mt-6 animate-rise">
              <h2 className="text-2xl">step 2 — chance to hit by the river?</h2>
              <p className="text-sm text-slate-500">
                You said <b>{outsGuess} outs</b>. Use the rule of {sc.toCome === 2 ? '4' : '2'}: outs × {sc.toCome === 2 ? 4 : 2}.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-5">
                <input
                  type="range"
                  min={0}
                  max={80}
                  value={pctGuess}
                  onChange={(e) => setPctGuess(Number(e.target.value))}
                  className="gel-range cyan min-w-[200px] flex-1"
                  aria-label="estimated percentage"
                  style={{ background: `linear-gradient(to right, #22d3ee 0%, #0e7490 ${(pctGuess / 80) * 100}%, #e2e8f0 ${(pctGuess / 80) * 100}%)` }}
                />
                <div className="grid h-16 w-24 place-items-center rounded-3xl border-4 border-white bg-gradient-to-b from-cyan-50 to-cyan-100 text-3xl font-black text-cyan-700 shadow-inner">
                  {pctGuess}%
                </div>
                <GlossyButton color="lime" size="lg" onClick={reveal}>
                  reveal
                </GlossyButton>
              </div>
            </div>
          )}

          {/* reveal */}
          {phase === 'reveal' && (
            <div className="relative mt-6 animate-rise space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-4 rounded-3xl border-2 border-white bg-white/80 p-4 shadow">
                  <FeedbackBadge grade={outsGrade(outsDiff)} />
                  <div>
                    <p className="chip-label">outs</p>
                    <p className="text-lg font-extrabold text-slate-800">
                      {n} outs <span className="text-sm font-semibold text-slate-500">(you said {outsGuess})</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 rounded-3xl border-2 border-white bg-white/80 p-4 shadow">
                  <FeedbackBadge grade={pctGrade(pDiff)} />
                  <div>
                    <p className="chip-label">chance to hit</p>
                    <p className="text-lg font-extrabold text-slate-800">
                      {exactPct.toFixed(1)}% <span className="text-sm font-semibold text-slate-500">(you said {pctGuess}%)</span>
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="chip-label mb-2">your {n} outs</p>
                <CardRow cards={sc.outs} size="xs" gap="gap-1 flex-wrap" />
              </div>

              <div className="space-y-3 rounded-3xl border-2 border-white bg-gradient-to-b from-white to-cyan-50 p-4 shadow-inner">
                <GelBar value={rule / 100} color="cyan" label={`rule of ${sc.toCome === 2 ? 4 : 2}: ${n} × ${sc.toCome === 2 ? 4 : 2}`} valueLabel={`${rule}%`} />
                {adjusted !== rule && (
                  <GelBar value={adjusted / 100} color="violet" label={`with the "minus (outs − 8)" correction`} valueLabel={`${adjusted}%`} />
                )}
                <GelBar value={sc.hit} color="lime" label={`exact: hit at least one of ${n} outs from ${sc.unseen} unseen cards`} valueLabel={`${exactPct.toFixed(1)}%`} />
                <GelBar value={sc.equity} color="magenta" label="true equity vs villain (incl. runner-runner & chops)" valueLabel={`${(sc.equity * 100).toFixed(1)}%`} />
              </div>
              <div className="flex justify-end">
                <GlossyButton color="cyan" size="lg" onClick={next} autoFocus>
                  next hand {'→'}
                </GlossyButton>
              </div>
            </div>
          )}
        </Panel>

        <aside className="space-y-6">
          <Panel accent="lime">
            <h2 className="text-xl">how it works</h2>
            <ol className="mt-3 space-y-3 text-sm text-slate-600">
              <li className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-b from-cyan-300 to-sky-600 font-black text-white">1</span>
                <span>An <b>out</b> is any unseen card that turns your losing hand into the winner.</span>
              </li>
              <li className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-b from-lime-300 to-green-600 font-black text-white">2</span>
                <span>
                  On the <b>flop</b> (two cards to come): <b>outs × 4</b> ≈ % to hit by the river.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-b from-fuchsia-300 to-pink-600 font-black text-white">3</span>
                <span>
                  On the <b>turn</b> (one card to come): <b>outs × 2</b> ≈ % to hit on the river.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-b from-amber-300 to-orange-600 font-black text-white">4</span>
                <span>
                  Big draws overshoot ×4. With more than 8 outs, subtract (outs − 8): 15 outs → 60 − 7 = <b>53%</b>.
                </span>
              </li>
            </ol>
          </Panel>
          <Panel accent="magenta">
            <h2 className="text-xl">common draws</h2>
            <ul className="mt-3 space-y-1.5">
              {COMMON.map(([label, outs]) => (
                <li key={label} className="flex items-center justify-between rounded-2xl bg-white/70 px-3 py-1.5 text-sm">
                  <span className="font-semibold text-slate-600">{label}</span>
                  <span className="font-black text-slate-800">{outs}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-slate-500">Watch for "dirty" outs: a card that completes your draw but also improves villain to something better doesn't count.</p>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
