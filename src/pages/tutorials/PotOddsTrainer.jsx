import { useMemo, useState } from 'react';
import { CardRow } from '../../components/PlayingCard.jsx';
import FeedbackBadge from '../../components/FeedbackBadge.jsx';
import GelBar from '../../components/GelBar.jsx';
import { GlossyButton, PageTitle, Panel, StatPill } from '../../components/ui.jsx';
import { shuffledDeck, rankOf, pick, shuffle } from '../../poker/cards.js';
import { evaluate, categoryOf } from '../../poker/evaluator.js';
import { detectDraws, drawLabel, drawOuts } from '../../poker/outs.js';
import { useSettings } from '../../store/useSettings.js';

const pct = (x, d = 0) => `${(x * 100).toFixed(d)}%`;
const round5 = (x) => Math.max(5, Math.round(x / 5) * 5);

const requiredEquity = (pot, bet) => bet / (pot + 2 * bet);
const mdf = (pot, bet) => pot / (pot + bet);

const POTS = [60, 80, 100, 120, 150, 200, 240, 300, 400];
const FRACS = [0.25, 0.33, 0.5, 0.66, 0.75, 1, 1.25, 1.5];

function genDrawSpot() {
  for (let attempt = 0; attempt < 8000; attempt++) {
    const deck = shuffledDeck();
    const hero = [deck[0], deck[1]];
    const board = deck.slice(2, 6);
    if (categoryOf(evaluate([...hero, ...board])) > 1) continue;
    if (new Set(board.map(rankOf)).size < 4) continue;
    const d = detectDraws(hero, board);
    if (!(d.flushDraw || d.oesd || d.gutshot)) continue;
    const outs = drawOuts(hero, board);
    if (outs.length < 4 || outs.length > 15) continue;
    return { hero, board, outs: outs.length, draw: drawLabel(d) };
  }
  return null;
}

function choices(correct, distractors) {
  const seen = new Set([Math.round(correct * 100)]);
  const opts = [{ v: correct, ok: true }];
  for (const d of distractors) {
    const k = Math.round(d * 100);
    if (k <= 0 || k >= 100 || seen.has(k)) continue;
    seen.add(k);
    opts.push({ v: d, ok: false });
    if (opts.length === 4) break;
  }
  let bump = 0.07;
  while (opts.length < 4) {
    const v = Math.min(0.95, Math.max(0.05, correct + (opts.length % 2 ? bump : -bump)));
    const k = Math.round(v * 100);
    if (!seen.has(k)) {
      seen.add(k);
      opts.push({ v, ok: false });
    }
    bump += 0.05;
  }
  return shuffle(opts);
}

function genQuestion() {
  const pot = pick(POTS);
  const bet = round5(pot * pick(FRACS));
  const type = pick(['call', 'call', 'mdf', 'need']);
  if (type === 'call') {
    const spot = genDrawSpot();
    if (spot) {
      const equity = spot.outs / 46;
      return { type, pot, bet, ...spot, equity, required: requiredEquity(pot, bet) };
    }
  }
  if (type === 'mdf') {
    return { type, pot, bet, options: choices(mdf(pot, bet), [requiredEquity(pot, bet), bet / (pot + bet), 1 - bet / pot, bet / pot]) };
  }
  return { type: 'need', pot, bet, options: choices(requiredEquity(pot, bet), [bet / (pot + bet), bet / pot, mdf(pot, bet), bet / (pot + 3 * bet)]) };
}

const QUICK = [0.25, 0.33, 0.5, 0.66, 0.75, 1, 1.5, 2];

function Calculator() {
  const [pot, setPot] = useState(100);
  const [frac, setFrac] = useState(0.5);
  const bet = Math.round(pot * frac);
  const need = requiredEquity(pot, bet);
  const def = mdf(pot, bet);
  return (
    <Panel accent="lime">
      <h2 className="text-xl">the pot odds machine</h2>
      <p className="mt-1 text-sm text-slate-500">Drag the sliders and watch the price change.</p>
      <div className="mt-4 space-y-4">
        <label className="block">
          <span className="flex justify-between text-sm font-bold text-slate-600">
            <span>pot</span>
            <span>{pot}</span>
          </span>
          <input type="range" className="gel-range cyan mt-1 w-full" min={20} max={500} step={10} value={pot} onChange={(e) => setPot(Number(e.target.value))} aria-label="pot size" />
        </label>
        <label className="block">
          <span className="flex justify-between text-sm font-bold text-slate-600">
            <span>villain bets</span>
            <span>
              {bet} ({Math.round(frac * 100)}% pot)
            </span>
          </span>
          <input type="range" className="gel-range magenta mt-1 w-full" min={0.1} max={2} step={0.05} value={frac} onChange={(e) => setFrac(Number(e.target.value))} aria-label="bet size" />
        </label>
      </div>
      <div className="mt-5 space-y-3 rounded-3xl border-2 border-white bg-gradient-to-b from-white to-lime-50 p-4 shadow-inner">
        <p className="text-sm text-slate-600">
          You call <b>{bet}</b> to win <b>{pot + bet}</b> → pot odds <b>{((pot + bet) / Math.max(1, bet)).toFixed(1)} : 1</b>
        </p>
        <GelBar value={need} color="lime" label="equity needed to call = bet ÷ (pot + 2×bet)" valueLabel={pct(need, 1)} />
        <GelBar value={def} color="cyan" label="minimum defence frequency = pot ÷ (pot + bet)" valueLabel={pct(def, 1)} />
        <GelBar value={bet / (pot + bet)} color="magenta" label="a bluff must work this often = bet ÷ (pot + bet)" valueLabel={pct(bet / (pot + bet), 1)} />
      </div>
      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400">
            <th className="py-1">bet size</th>
            <th>need</th>
            <th>mdf</th>
          </tr>
        </thead>
        <tbody>
          {QUICK.map((f) => (
            <tr key={f} className={`border-t border-white ${Math.abs(f - frac) < 0.03 ? 'bg-lime-100/70 font-bold' : ''}`}>
              <td className="py-1 font-semibold text-slate-600">{Math.round(f * 100)}% pot</td>
              <td className="text-slate-800">{pct(requiredEquity(1, f))}</td>
              <td className="text-slate-800">{pct(mdf(1, f))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

export default function PotOddsTrainer() {
  const [q, setQ] = useState(genQuestion);
  const [answer, setAnswer] = useState(null);
  const [streak, setStreak] = useState(0);
  const [tally, setTally] = useState({ n: 0, ok: 0 });
  const best = useSettings((s) => s.highScores.potodds);
  const submitScore = useSettings((s) => s.submitScore);

  const verdict = useMemo(() => {
    if (!answer) return null;
    if (q.type === 'call') {
      const shouldCall = q.equity >= q.required;
      const close = Math.abs(q.equity - q.required) < 0.015;
      const said = answer === 'call';
      const correct = said === shouldCall || close;
      const grade = correct ? (close ? 'A' : 'A+') : Math.abs(q.equity - q.required) < 0.04 ? 'C' : 'F';
      return { correct, grade, shouldCall, close };
    }
    const chosen = q.options[answer];
    return { correct: chosen.ok, grade: chosen.ok ? 'A+' : 'F' };
  }, [answer, q]);

  const choose = (a) => {
    if (answer != null) return;
    setAnswer(a);
    let ok;
    if (q.type === 'call') ok = (a === 'call') === q.equity >= q.required || Math.abs(q.equity - q.required) < 0.015;
    else ok = q.options[a].ok;
    const s = ok ? streak + 1 : 0;
    setStreak(s);
    submitScore('potodds', s);
    setTally((t) => ({ n: t.n + 1, ok: t.ok + (ok ? 1 : 0) }));
  };

  const next = () => {
    setQ(genQuestion());
    setAnswer(null);
  };

  const potBox = (
    <div className="flex flex-wrap gap-3">
      <span className="rounded-full border-2 border-white bg-slate-900/60 px-4 py-1 text-sm font-extrabold text-white shadow-inner">pot {q.pot}</span>
      <span className="rounded-full border-2 border-white bg-gradient-to-b from-amber-300 to-orange-600 px-4 py-1 text-sm font-extrabold text-white shadow text-shadow">
        villain bets {q.bet} ({Math.round((q.bet / q.pot) * 100)}% pot)
      </span>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle
        kicker="lesson 2"
        title="pot odds & bet sizing"
        color="lime"
        subtitle="Every call is a price. Learn what equity each bet size demands, and how often you must defend so you can't be bluffed off your hand."
        right={
          <div className="flex gap-3">
            <StatPill label="streak" value={streak} color="lime" />
            <StatPill label="best" value={best} color="magenta" />
            <StatPill label="accuracy" value={tally.n ? `${Math.round((tally.ok / tally.n) * 100)}%` : '–'} color="cyan" />
          </div>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Panel accent="cyan" className="overflow-clip">
          <div className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-lime-200/40" />
          <div className="relative">
            <span className="chip-label">{q.type === 'call' ? 'call or fold?' : q.type === 'mdf' ? 'minimum defence frequency' : 'required equity'}</span>

            {q.type === 'call' ? (
              <>
                <h2 className="mt-1 text-2xl">it&rsquo;s the turn. do you call?</h2>
                <p className="mt-1 text-sm text-slate-500">You put villain on a strong made hand: you only win if you complete your draw on the river. No implied odds.</p>
                <div className="mt-4 flex flex-wrap items-end gap-5 rounded-3xl border-4 border-white bg-gradient-to-b from-cyan-400 via-cyan-500 to-sky-700 p-4 shadow-inner">
                  <div>
                    <p className="chip-label !text-white/80">your hand</p>
                    <CardRow cards={q.hero} size="lg" className="mt-1" />
                  </div>
                  <div>
                    <p className="chip-label !text-white/80">board</p>
                    <CardRow cards={q.board} slots={5} size="md" className="mt-1" animate key={q.board.join()} />
                  </div>
                </div>
                <div className="mt-4">{potBox}</div>
                {answer == null && (
                  <div className="mt-6 flex flex-wrap gap-3">
                    <GlossyButton color="lime" size="lg" onClick={() => choose('call')}>
                      call {q.bet}
                    </GlossyButton>
                    <GlossyButton color="magenta" size="lg" onClick={() => choose('fold')}>
                      fold
                    </GlossyButton>
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 className="mt-1 text-2xl">
                  {q.type === 'mdf' ? 'how often must you continue so villain can’t profit with any two cards?' : 'what equity do you need to call?'}
                </h2>
                <div className="mt-4">{potBox}</div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {q.options.map((o, i) => {
                    const state = answer == null ? 'idle' : o.ok ? 'right' : answer === i ? 'wrong' : 'idle';
                    return (
                      <GlossyButton
                        key={i}
                        color={state === 'right' ? 'lime' : state === 'wrong' ? 'magenta' : 'silver'}
                        size="lg"
                        className={`w-full ${answer != null && state === 'idle' ? 'opacity-50' : ''} ${state === 'wrong' ? 'animate-shake' : ''}`}
                        onClick={() => choose(i)}
                        disabled={answer != null && state === 'idle'}
                      >
                        {pct(o.v)}
                      </GlossyButton>
                    );
                  })}
                </div>
              </>
            )}

            {verdict && (
              <div className="mt-6 animate-rise rounded-3xl border-2 border-white bg-gradient-to-b from-white to-cyan-50 p-5 shadow-inner">
                <div className="flex items-center gap-4">
                  <FeedbackBadge grade={verdict.grade} />
                  <div>
                    <p className="text-2xl font-extrabold lowercase text-slate-800">{verdict.correct ? (verdict.close ? 'close one — either is fine' : 'spot on!') : 'not quite'}</p>
                    {q.type === 'call' && (
                      <p className="text-sm font-semibold text-slate-500">
                        the right play: <span className="text-slate-800">{verdict.close ? 'it’s a coin-flip decision' : verdict.shouldCall ? 'call' : 'fold'}</span>
                      </p>
                    )}
                  </div>
                </div>

                {q.type === 'call' ? (
                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    <p>
                      <b>1. the price:</b> call {q.bet} ÷ (pot {q.pot} + bet {q.bet} + call {q.bet}) = <b>{pct(q.required, 1)}</b> equity needed.
                    </p>
                    <p>
                      <b>2. your equity:</b> {q.draw} = {q.outs} outs ÷ 46 unseen = <b>{pct(q.equity, 1)}</b>{' '}
                      <span className="text-slate-500">(rule of 2: {q.outs * 2}%)</span>
                    </p>
                    <p>
                      <b>3. compare:</b> {pct(q.equity, 1)} {q.equity >= q.required ? '≥' : '<'} {pct(q.required, 1)} →{' '}
                      <b>{q.equity >= q.required ? 'call is profitable' : 'fold saves money'}</b>
                    </p>
                    <GelBar value={q.equity} marker={q.required} markerLabel={`need ${pct(q.required)}`} color={q.equity >= q.required ? 'lime' : 'magenta'} label="your equity vs the price" valueLabel={pct(q.equity, 1)} />
                  </div>
                ) : q.type === 'mdf' ? (
                  <div className="mt-4 space-y-2 text-sm text-slate-700">
                    <p>
                      <b>MDF = pot ÷ (pot + bet)</b> = {q.pot} ÷ ({q.pot} + {q.bet}) = <b>{pct(mdf(q.pot, q.bet), 1)}</b>
                    </p>
                    <p>
                      If you fold more than {pct(1 - mdf(q.pot, q.bet))} of your range, villain profits by betting <i>any two cards</i>. Bigger bets → you can fold more
                      often.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-2 text-sm text-slate-700">
                    <p>
                      <b>needed equity = call ÷ final pot</b> = {q.bet} ÷ ({q.pot} + {q.bet} + {q.bet}) = <b>{pct(requiredEquity(q.pot, q.bet), 1)}</b>
                    </p>
                    <p>Remember to include your own call in the final pot. A pot-sized bet always needs 33%; half-pot needs 25%.</p>
                  </div>
                )}
                <div className="mt-5 flex justify-end">
                  <GlossyButton color="cyan" size="lg" onClick={next} autoFocus>
                    next question {'→'}
                  </GlossyButton>
                </div>
              </div>
            )}
          </div>
        </Panel>
        <Calculator />
      </div>
    </div>
  );
}
