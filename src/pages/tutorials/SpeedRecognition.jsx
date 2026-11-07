import { useCallback, useEffect, useRef, useState } from 'react';
import { CardRow } from '../../components/PlayingCard.jsx';
import GelBar from '../../components/GelBar.jsx';
import { GlossyButton, PageTitle, Panel, StatPill } from '../../components/ui.jsx';
import { shuffledDeck } from '../../poker/cards.js';
import { evaluate, describeScore, categoryOf, bestFive } from '../../poker/evaluator.js';
import { useSettings } from '../../store/useSettings.js';

const ROUND_MS = 5000;

function genRound(streak) {
  const wantClose = Math.random() < Math.min(0.85, 0.35 + streak * 0.05);
  let fallback = null;
  for (let attempt = 0; attempt < 300; attempt++) {
    const deck = shuffledDeck();
    const board = deck.slice(0, 5);
    const hands = [deck.slice(5, 7), deck.slice(7, 9), deck.slice(9, 11)];
    const scores = hands.map((h) => evaluate([...h, ...board]));
    const sorted = [...scores].sort((a, b) => b - a);
    if (sorted[0] === sorted[1]) continue;
    const winner = scores.indexOf(sorted[0]);
    const round = { board, hands, scores, winner, names: scores.map(describeScore), best: bestFive([...hands[winner], ...board]) };
    if (!fallback) fallback = round;
    if (wantClose && categoryOf(sorted[0]) - categoryOf(sorted[1]) > 1) continue;
    return round;
  }
  return fallback;
}

const POD_COLORS = [
  'from-cyan-200 via-cyan-400 to-sky-600 border-cyan-100',
  'from-fuchsia-200 via-fuchsia-400 to-pink-600 border-fuchsia-100',
  'from-lime-200 via-lime-400 to-green-600 border-lime-100',
];

export default function SpeedRecognition() {
  const [phase, setPhase] = useState('ready'); // ready | playing | over
  const [round, setRound] = useState(() => genRound(0));
  const [streak, setStreak] = useState(0);
  const [remaining, setRemaining] = useState(ROUND_MS);
  const [picked, setPicked] = useState(null);
  const [flash, setFlash] = useState(null);
  const [reason, setReason] = useState(null);
  const best = useSettings((s) => s.highScores.speed);
  const submitScore = useSettings((s) => s.submitScore);
  const startRef = useRef(0);
  const lockRef = useRef(false);

  const endGame = useCallback(
    (why, choice) => {
      lockRef.current = true;
      setPicked(choice);
      setReason(why);
      setPhase('over');
      submitScore('speed', streak);
    },
    [streak, submitScore],
  );

  // countdown
  useEffect(() => {
    if (phase !== 'playing') return undefined;
    let raf;
    const tick = () => {
      const left = ROUND_MS - (performance.now() - startRef.current);
      if (left <= 0) {
        setRemaining(0);
        if (!lockRef.current) endGame('timeout', null);
        return;
      }
      setRemaining(left);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, round, endGame]);

  const start = () => {
    setStreak(0);
    setRound(genRound(0));
    setPicked(null);
    setReason(null);
    setFlash(null);
    lockRef.current = false;
    startRef.current = performance.now();
    setRemaining(ROUND_MS);
    setPhase('playing');
  };

  const choose = useCallback(
    (i) => {
      if (phase !== 'playing' || lockRef.current) return;
      if (i === round.winner) {
        lockRef.current = true;
        setFlash(i);
        const s = streak + 1;
        setStreak(s);
        setTimeout(() => {
          setRound(genRound(s));
          setFlash(null);
          lockRef.current = false;
          startRef.current = performance.now();
          setRemaining(ROUND_MS);
        }, 380);
      } else {
        endGame('wrong', i);
      }
    },
    [phase, round, streak, endGame],
  );

  useEffect(() => {
    const onKey = (e) => {
      if (['1', '2', '3'].includes(e.key)) choose(Number(e.key) - 1);
      if ((e.key === ' ' || e.key === 'Enter') && phase !== 'playing') {
        e.preventDefault();
        start();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const frac = remaining / ROUND_MS;
  const timerColor = frac > 0.5 ? 'lime' : frac > 0.25 ? 'orange' : 'magenta';
  const showResult = phase === 'over';
  const bestSet = new Set(showResult ? round.best : []);

  return (
    <div className="mx-auto max-w-5xl">
      <PageTitle
        kicker="lesson 3"
        title="speed hand recognition"
        color="magenta"
        subtitle="One board, three hands, five seconds. Click (or press 1, 2, 3) the strongest hand. One mistake ends the run."
        right={
          <div className="flex gap-3">
            <StatPill label="streak" value={streak} color="magenta" />
            <StatPill label="high score" value={Math.max(best, phase === 'over' ? streak : 0)} color="cyan" />
          </div>
        }
      />

      <Panel accent="magenta" className="overflow-clip">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-fuchsia-200/40" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-cyan-200/40" />

        <div className="relative">
          <GelBar value={phase === 'ready' ? 1 : frac} color={timerColor} label="time" valueLabel={phase === 'ready' ? '5.0s' : `${(remaining / 1000).toFixed(1)}s`} height="h-6" />

          <div className="mt-6 flex flex-col items-center rounded-3xl border-4 border-white bg-gradient-to-b from-cyan-400 via-cyan-500 to-sky-700 px-4 py-6 shadow-inner">
            <p className="chip-label !text-white/80">the board</p>
            <div className={`mt-2 ${phase === 'ready' ? 'opacity-40 blur-[2px]' : ''}`}>
              <CardRow cards={round.board} size="lg" gap="gap-1.5 sm:gap-2.5" highlightSet={showResult ? bestSet : undefined} />
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {round.hands.map((h, i) => {
              const isWinner = i === round.winner;
              const ring =
                flash === i
                  ? 'ring-8 ring-lime-300 scale-105'
                  : showResult && isWinner
                    ? 'ring-8 ring-lime-300'
                    : showResult && picked === i
                      ? 'ring-8 ring-rose-300 animate-shake'
                      : '';
              return (
                <button
                  key={`${round.board.join()}-${i}`}
                  type="button"
                  disabled={phase !== 'playing'}
                  onClick={() => choose(i)}
                  className={`group relative flex flex-col items-center overflow-hidden rounded-[2rem] border-4 bg-gradient-to-b p-4 pb-3 shadow-xl transition duration-150 enabled:hover:-translate-y-1 enabled:active:scale-95 disabled:cursor-default ${POD_COLORS[i]} ${ring} ${
                    phase === 'ready' ? 'opacity-50' : ''
                  }`}
                >
                  <span className="pointer-events-none absolute inset-x-4 top-1 h-1/3 rounded-full bg-gradient-to-b from-white/70 to-white/0" />
                  <span className="relative mb-2 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-sm font-black text-slate-700 shadow">{i + 1}</span>
                  <CardRow cards={h} size="lg" hidden={phase === 'ready'} highlightSet={showResult && isWinner ? bestSet : undefined} />
                  <span className={`relative mt-3 min-h-[1.5rem] rounded-full px-3 py-0.5 text-sm font-bold ${showResult ? 'bg-white/90 text-slate-700' : 'text-transparent'}`}>
                    {showResult ? round.names[i] : ' '}
                  </span>
                </button>
              );
            })}
          </div>

          {phase !== 'playing' && (
            <div className="mt-6 flex flex-col items-center gap-3 text-center">
              {phase === 'over' && (
                <div className="animate-pop">
                  <p className="text-3xl font-extrabold lowercase text-slate-800">
                    {reason === 'timeout' ? 'out of time!' : 'not that one!'} <span className="text-fuchsia-500">streak: {streak}</span>
                  </p>
                  <p className="mt-1 text-slate-500">
                    The winner was hand {round.winner + 1}: <b className="text-slate-700">{round.names[round.winner]}</b>
                  </p>
                </div>
              )}
              <GlossyButton color="magenta" size="xl" onClick={start} autoFocus>
                {phase === 'ready' ? 'start' : 'play again'}
              </GlossyButton>
              <p className="text-xs font-semibold text-slate-400">press space to {phase === 'ready' ? 'start' : 'retry'}</p>
            </div>
          )}
        </div>
      </Panel>

      <Panel className="mt-6" accent="cyan">
        <h2 className="text-xl">speed-read checklist</h2>
        <div className="mt-3 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
          <p>
            <b className="text-slate-800">1. flush check.</b> Three or more of one suit on board? Look for players holding that suit first.
          </p>
          <p>
            <b className="text-slate-800">2. paired board.</b> A pair on board makes full houses and quads possible — trips become boats.
          </p>
          <p>
            <b className="text-slate-800">3. kickers.</b> Same pair? The highest unpaired card decides. If the board plays, it&rsquo;s a chop.
          </p>
        </div>
      </Panel>
    </div>
  );
}
