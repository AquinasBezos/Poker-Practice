import { useCallback, useEffect, useRef, useState } from 'react';
import { CardRow } from '../../components/PlayingCard.jsx';
import FeedbackBadge from '../../components/FeedbackBadge.jsx';
import GelBar from '../../components/GelBar.jsx';
import RangeMatrix from '../../components/RangeMatrix.jsx';
import { GlossyButton, PageTitle, Panel, StatPill } from '../../components/ui.jsx';
import { shuffledDeck, pick } from '../../poker/cards.js';
import { classOf, classLabel } from '../../poker/handClasses.js';
import { PF_POSITIONS, PF_STACKS, PUSH_CHART, pushDecision, pushRangeWeights } from '../../poker/pushfold.js';
import { useSettings } from '../../store/useSettings.js';

const DECISION_MS = 7000;
const LIVES = 3;
const TABLE_ORDER = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

function genSpot() {
  const pos = pick(PF_POSITIONS);
  const stack = pick(PF_STACKS);
  const thr = PUSH_CHART[pos][stack];
  const wantNear = Math.random() < 0.55;
  for (let i = 0; i < 200; i++) {
    const deck = shuffledDeck();
    const hole = [deck[0], deck[1]];
    const cls = classOf(hole[0], hole[1]);
    const d = pushDecision(cls, pos, stack);
    if (wantNear && Math.abs(d.pct - thr) > 0.14) continue;
    return { hole, pos, stack, cls, ...d };
  }
  const deck = shuffledDeck();
  const hole = [deck[0], deck[1]];
  const cls = classOf(hole[0], hole[1]);
  return { hole, pos, stack, cls, ...pushDecision(cls, pos, stack) };
}

function MiniTable({ pos }) {
  const me = TABLE_ORDER.indexOf(pos);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {TABLE_ORDER.map((p, i) => {
        const state = i < me ? 'folded' : i === me ? 'you' : 'behind';
        return (
          <span
            key={p}
            className={`relative grid h-11 w-11 place-items-center overflow-hidden rounded-full border-2 text-[10px] font-black shadow ${
              state === 'you'
                ? 'border-orange-100 bg-gradient-to-b from-amber-300 to-orange-600 text-white text-shadow scale-110'
                : state === 'folded'
                  ? 'border-white bg-slate-200 text-slate-400 line-through'
                  : 'border-white bg-gradient-to-b from-white to-cyan-100 text-cyan-700'
            }`}
          >
            <span className="pointer-events-none absolute inset-x-1 top-0 h-1/2 rounded-full bg-white/40" />
            <span className="relative">{p}</span>
          </span>
        );
      })}
    </div>
  );
}

export default function PushFold() {
  const [phase, setPhase] = useState('ready'); // ready | deciding | feedback | over
  const [spot, setSpot] = useState(genSpot);
  const [lives, setLives] = useState(LIVES);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [remaining, setRemaining] = useState(DECISION_MS);
  const [result, setResult] = useState(null);
  const best = useSettings((s) => s.highScores.pushfold);
  const submitScore = useSettings((s) => s.submitScore);
  const startRef = useRef(0);
  const timeoutRef = useRef(null);

  const deal = useCallback(() => {
    setSpot(genSpot());
    setResult(null);
    startRef.current = performance.now();
    setRemaining(DECISION_MS);
    setPhase('deciding');
  }, []);

  const start = () => {
    setLives(LIVES);
    setStreak(0);
    setScore(0);
    deal();
  };

  const decide = useCallback(
    (choice) => {
      if (phase !== 'deciding') return;
      const timedOut = choice === null;
      const correct = !timedOut && (spot.borderline || (choice === 'shove') === spot.shove);
      const res = { choice, timedOut, correct, grade: correct ? (spot.borderline ? 'A' : 'A+') : timedOut ? 'F' : Math.abs(spot.pct - spot.thr) < 0.06 ? 'C' : 'F' };
      setResult(res);
      if (correct) {
        const s = score + 1;
        setScore(s);
        setStreak(streak + 1);
        submitScore('pushfold', s);
        setPhase('feedback');
        timeoutRef.current = setTimeout(deal, spot.borderline ? 1600 : 900);
      } else {
        const l = lives - 1;
        setLives(l);
        setStreak(0);
        setPhase(l <= 0 ? 'over' : 'feedback');
      }
    },
    [phase, spot, score, streak, lives, submitScore, deal],
  );

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  useEffect(() => {
    if (phase !== 'deciding') return undefined;
    let raf;
    const tick = () => {
      const left = DECISION_MS - (performance.now() - startRef.current);
      if (left <= 0) {
        setRemaining(0);
        decide(null);
        return;
      }
      setRemaining(left);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, decide]);

  useEffect(() => {
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      if (phase === 'deciding' && (k === 's' || k === 'a')) decide('shove');
      if (phase === 'deciding' && k === 'f') decide('fold');
      if ((k === ' ' || k === 'enter') && (phase === 'ready' || phase === 'over')) {
        e.preventDefault();
        start();
      }
      if ((k === ' ' || k === 'enter') && phase === 'feedback' && result && !result.correct) {
        e.preventDefault();
        deal();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const frac = remaining / DECISION_MS;
  const hand = classLabel(spot.cls);
  const showChart = (phase === 'feedback' || phase === 'over') && result && (!result.correct || spot.borderline);

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle
        kicker="lesson 4"
        title="all-in or fold"
        color="orange"
        subtitle="Short-stack survival mode. It's folded to you: shove or fold before the timer runs out. Three lives. Keys: S = shove, F = fold."
        right={
          <div className="flex gap-3">
            <StatPill label="score" value={score} color="orange" />
            <StatPill label="best" value={best} color="magenta" />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Panel accent="orange" className="overflow-clip">
          <div className="pointer-events-none absolute -right-20 -top-16 h-56 w-56 rounded-full bg-orange-200/40" />
          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2" aria-label={`${lives} lives left`}>
                {Array.from({ length: LIVES }, (_, i) => (
                  <span
                    key={i}
                    className={`relative grid h-10 w-10 place-items-center overflow-hidden rounded-full border-2 border-white text-lg shadow transition ${
                      i < lives ? 'bg-gradient-to-b from-rose-300 to-pink-600 text-white' : 'scale-90 bg-slate-200 text-slate-400'
                    }`}
                  >
                    <span className="pointer-events-none absolute inset-x-1 top-0 h-1/2 rounded-full bg-white/40" />
                    <span className="relative">{'♥︎'}</span>
                  </span>
                ))}
              </div>
              <span className="text-sm font-bold text-slate-500">
                streak <span className="text-xl font-black text-orange-500">{streak}</span>
              </span>
            </div>

            <GelBar className="mt-4" value={phase === 'deciding' ? frac : phase === 'ready' ? 1 : 0} color={frac > 0.5 ? 'lime' : frac > 0.25 ? 'orange' : 'magenta'} height="h-5" />

            <div className="mt-5 rounded-3xl border-4 border-white bg-gradient-to-b from-cyan-400 via-cyan-500 to-sky-700 p-5 shadow-inner">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="chip-label !text-white/80">your seat</p>
                  <div className="mt-1">
                    <MiniTable pos={spot.pos} />
                  </div>
                </div>
                <div className="relative grid h-24 w-24 place-items-center overflow-hidden rounded-full border-4 border-white bg-gradient-to-b from-lime-300 to-green-600 text-center shadow-xl">
                  <span className="pointer-events-none absolute inset-x-2 top-1 h-1/2 rounded-full bg-white/40" />
                  <span className="relative leading-none text-white text-shadow">
                    <span className="block text-4xl font-black">{spot.stack}</span>
                    <span className="text-xs font-bold uppercase tracking-wider">big blinds</span>
                  </span>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-end gap-4">
                <CardRow cards={spot.hole} size="lg" hidden={phase === 'ready'} key={spot.hole.join()} animate />
                {phase !== 'ready' && <span className="mb-2 rounded-full bg-white/90 px-3 py-1 text-lg font-black text-slate-800 shadow">{hand}</span>}
              </div>
            </div>

            {phase === 'deciding' && (
              <div className="mt-6 grid grid-cols-2 gap-4">
                <GlossyButton color="orange" size="xl" className="w-full" onClick={() => decide('shove')}>
                  all-in
                </GlossyButton>
                <GlossyButton color="silver" size="xl" className="w-full" onClick={() => decide('fold')}>
                  fold
                </GlossyButton>
              </div>
            )}

            {(phase === 'feedback' || phase === 'over') && result && (
              <div className="mt-6 flex animate-rise flex-wrap items-center gap-4 rounded-3xl border-2 border-white bg-gradient-to-b from-white to-orange-50 p-4 shadow-inner">
                <FeedbackBadge grade={result.grade} />
                <div className="min-w-0 flex-1">
                  <p className="text-xl font-extrabold lowercase text-slate-800">
                    {result.timedOut ? 'too slow!' : result.correct ? (spot.borderline ? 'borderline — either works' : 'correct!') : 'wrong call'}
                  </p>
                  <p className="text-sm text-slate-600">
                    From the {spot.pos} with {spot.stack}bb the chart shoves the top <b>{Math.round(spot.thr * 100)}%</b>. {hand} ranks in the top{' '}
                    <b>{Math.round(spot.pct * 100)}%</b> → <b>{spot.shove ? 'shove' : 'fold'}</b>.
                  </p>
                </div>
                {phase === 'feedback' && !result.correct && (
                  <GlossyButton color="cyan" onClick={deal} autoFocus>
                    continue
                  </GlossyButton>
                )}
              </div>
            )}

            {phase === 'over' && (
              <div className="mt-6 flex animate-pop flex-col items-center gap-2 text-center">
                <p className="text-3xl font-extrabold lowercase text-slate-800">
                  busted! final score <span className="text-orange-500">{score}</span>
                </p>
                <GlossyButton color="orange" size="xl" onClick={start} autoFocus>
                  play again
                </GlossyButton>
              </div>
            )}

            {phase === 'ready' && (
              <div className="mt-6 flex flex-col items-center gap-2">
                <GlossyButton color="orange" size="xl" onClick={start} autoFocus>
                  start survival
                </GlossyButton>
                <p className="text-xs font-semibold text-slate-400">press space to start</p>
              </div>
            )}
          </div>
        </Panel>

        <aside className="space-y-6">
          <Panel accent="cyan">
            {showChart ? (
              <>
                <h2 className="text-xl">the chart</h2>
                <p className="mb-3 mt-1 text-sm text-slate-500">
                  {spot.pos}, {spot.stack}bb: shove top {Math.round(spot.thr * 100)}%. Your hand is outlined.
                </p>
                <RangeMatrix weights={pushRangeWeights(spot.pos, spot.stack)} color="orange" highlight={spot.cls} />
              </>
            ) : (
              <>
                <h2 className="text-xl">why push or fold?</h2>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  <li>
                    Under ~15bb, raising and folding to a re-raise burns too much of your stack. <b>All-in or fold</b> keeps it simple and maximises fold equity.
                  </li>
                  <li>
                    <b>Later position = wider range.</b> Fewer players left to wake up with a big hand.
                  </li>
                  <li>
                    <b>Shorter stack = wider range.</b> The blinds you steal are a bigger share of your stack, and callers need less to call.
                  </li>
                  <li className="text-xs text-slate-400">Charts here are simplified, Nash-inspired, no-ante ranges for a 6-max table.</li>
                </ul>
              </>
            )}
          </Panel>
          <Panel accent="lime">
            <h2 className="text-xl">chart cheat-sheet</h2>
            <table className="mt-3 w-full text-center text-xs">
              <thead>
                <tr className="text-slate-400">
                  <th className="py-1 text-left">pos</th>
                  {PF_STACKS.map((s) => (
                    <th key={s}>{s}bb</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PF_POSITIONS.map((p) => (
                  <tr key={p} className="border-t border-white">
                    <td className="py-1 text-left font-bold text-slate-600">{p}</td>
                    {PF_STACKS.map((s) => (
                      <td key={s} className={`font-semibold ${p === spot.pos && s === spot.stack && phase !== 'ready' ? 'rounded bg-orange-200 text-orange-800' : 'text-slate-700'}`}>
                        {Math.round(PUSH_CHART[p][s] * 100)}%
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
