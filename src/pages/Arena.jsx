import { useCallback, useEffect, useMemo, useState } from 'react';
import PokerTable from '../components/PokerTable.jsx';
import BettingSlider from '../components/BettingSlider.jsx';
import FeedbackBadge, { GRADE_TEXT } from '../components/FeedbackBadge.jsx';
import CoachModal from '../components/CoachModal.jsx';
import { LiveProbability, RangeAnalysis } from '../components/HudPanel.jsx';
import { GlossyButton, GlossySwitch, Panel, StatPill } from '../components/ui.jsx';
import { useArena, heroProfit } from '../store/useArena.js';
import { useSettings } from '../store/useSettings.js';
import { legal, BB, SB } from '../poker/game.js';
import { GRADE_POINTS } from '../poker/grading.js';

const chips = (n) => Math.round(n).toLocaleString('en-US');

function gpaLetter(gpa) {
  if (gpa >= 4.15) return 'A+';
  if (gpa >= 3.5) return 'A';
  if (gpa >= 2.5) return 'B';
  if (gpa >= 1.5) return 'C';
  if (gpa >= 0.5) return 'D';
  return 'F';
}

function defaultRaise(game, L) {
  let target;
  if (game.street === 'preflop') {
    const limpers = game.players.filter((p) => !p.isHero && !p.folded && p.lastAction?.type === 'call').length;
    target = game.raiseCount === 0 ? BB * (2.5 + limpers) : game.currentBet * 3;
  } else {
    target = game.currentBet === 0 ? L.pot * 0.66 : game.currentBet + (L.pot + L.toCall) * 0.75;
  }
  target = Math.round(target / SB) * SB;
  return Math.max(L.minRaiseTo, Math.min(L.maxRaiseTo, target));
}

function ResultBanner({ game }) {
  if (!game.handOver || !game.result) return null;
  const lines = game.result.awards.map((a, i) => {
    const names = a.winners.map((s) => game.players[s].name).join(' & ');
    const verb = a.winners.length > 1 ? 'split' : a.winners[0] === 0 ? 'win' : 'wins';
    return (
      <p key={i} className="font-bold text-slate-700">
        <span className={a.winners.includes(0) ? 'text-lime-600' : 'text-slate-900'}>{names}</span> {verb} {a.side ? 'side pot ' : ''}
        {chips(a.amount)}
        {a.handName ? <span className="font-semibold text-slate-500"> with {a.handName}</span> : <span className="font-semibold text-slate-500"> uncontested</span>}
      </p>
    );
  });
  return <div className="min-w-0 flex-1">{lines}</div>;
}

export default function Arena() {
  const game = useArena((s) => s.game);
  const ranges = useArena((s) => s.ranges);
  const rangeVersion = useArena((s) => s.rangeVersion);
  const history = useArena((s) => s.history);
  const lastGrade = useArena((s) => s.lastGrade);
  const coach = useArena((s) => s.coach);
  const hands = useArena((s) => s.hands);
  const profit = useArena(heroProfit);
  const trainerWheels = useSettings((s) => s.trainerWheels);
  const coachNotes = useSettings((s) => s.coachNotes);
  const toggle = useSettings((s) => s.toggle);
  const { ensureSession, newSession, nextHand, heroAction, botAction, runout, dismissCoach } = useArena.getState();

  useEffect(() => {
    ensureSession();
  }, [ensureSession]);

  // Drive the bots and all-in runouts. Paused while a coach note is open.
  useEffect(() => {
    if (!game || game.handOver || coach) return undefined;
    if (game.toAct === -1) {
      const t = setTimeout(runout, 1100);
      return () => clearTimeout(t);
    }
    if (game.toAct !== 0) {
      const heroOut = game.players[0].folded;
      const t = setTimeout(botAction, heroOut ? 280 : 550 + Math.random() * 550);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [game, coach, runout, botAction]);

  const heroTurn = !!game && !game.handOver && game.toAct === 0;
  const L = heroTurn ? legal(game, 0) : null;
  const [raiseTo, setRaiseTo] = useState(0);
  useEffect(() => {
    if (heroTurn && L) setRaiseTo(defaultRaise(game, L));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroTurn, game?.handId, game?.street, game?.currentBet]);

  const act = useCallback(
    (type) => {
      if (!heroTurn) return;
      heroAction({ type, amount: raiseTo }, { coachNotes });
    },
    [heroTurn, heroAction, raiseTo, coachNotes],
  );

  useEffect(() => {
    const onKey = (e) => {
      if (coach || e.target.tagName === 'INPUT') return;
      const k = e.key.toLowerCase();
      if (heroTurn) {
        if (k === 'f' && L && !L.canCheck) act('fold');
        else if (k === 'c') act(L.canCheck ? 'check' : 'call');
        else if (k === 'r' && L.canRaise) act('raise');
      } else if (game?.handOver && (k === ' ' || k === 'n' || k === 'enter')) {
        e.preventDefault();
        nextHand();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const gpa = useMemo(() => (history.length ? history.reduce((a, h) => a + GRADE_POINTS[h.grade], 0) / history.length : null), [history]);

  if (!game) return null;
  const hero = game.players[0];
  const waiting = !game.handOver && !heroTurn;
  const toActName = waiting && game.toAct >= 0 ? game.players[game.toAct].name : null;

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex rounded-full border-2 border-lime-100 bg-gradient-to-b from-lime-300 to-green-600 px-3 py-0.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white shadow-md text-shadow">
            6-max · blinds {SB}/{BB}
          </span>
          <h1 className="mt-2 text-4xl font-extrabold lowercase leading-none tracking-tight text-slate-800 sm:text-5xl">
            practice arena<span className="text-lime-500">.</span>
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <StatPill label="hand" value={`#${hands}`} color="cyan" />
          <StatPill label="profit" value={`${profit >= 0 ? '+' : ''}${(profit / BB).toFixed(1)}bb`} color={profit >= 0 ? 'lime' : 'magenta'} />
          <div className="panel-tight flex items-center gap-2 px-3 py-1.5">
            <div>
              <span className="chip-label block">avg grade</span>
              <span className={`text-xl font-extrabold leading-tight ${gpa == null ? 'text-slate-400' : GRADE_TEXT[gpaLetter(gpa)]}`}>{gpa == null ? '–' : gpaLetter(gpa)}</span>
            </div>
          </div>
          <div className="panel-tight px-4 py-2.5">
            <GlossySwitch label="trainer wheels" checked={trainerWheels} onChange={() => toggle('trainerWheels')} color="lime" />
          </div>
        </div>
      </div>

      <div className={`grid gap-6 ${trainerWheels ? 'xl:grid-cols-[minmax(0,1fr)_370px]' : ''}`}>
        <div className="min-w-0 space-y-5">
          <Panel className="overflow-clip !p-2 sm:!p-4">
            <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-lime-200/40" />
            <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-fuchsia-200/30" />
            <PokerTable game={game} />
          </Panel>

          {/* action bar */}
          <Panel className="!p-4 sm:!p-5" accent={heroTurn ? 'lime' : undefined}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="flex min-w-0 items-center gap-3 lg:w-[38%]">
                {lastGrade ? (
                  <>
                    <FeedbackBadge key={lastGrade.id} grade={lastGrade.grade} size="md" />
                    <div className="min-w-0">
                      <p className="truncate text-lg font-extrabold lowercase text-slate-800">{lastGrade.headline}</p>
                      <p className="line-clamp-2 text-sm text-slate-500">
                        <span className="font-semibold text-slate-700">{lastGrade.actionLabel}:</span> {lastGrade.reason}
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-sm font-semibold text-slate-500">Make a decision and the coach will grade it from A+ to F.</p>
                )}
              </div>

              <div className="min-w-0 flex-1">
                {game.handOver ? (
                  <div className="flex flex-wrap items-center gap-4">
                    <ResultBanner game={game} />
                    <GlossyButton color="cyan" size="lg" onClick={nextHand} autoFocus>
                      deal next hand
                    </GlossyButton>
                  </div>
                ) : heroTurn ? (
                  <div className="space-y-3">
                    {L.canRaise && (
                      <BettingSlider min={L.minRaiseTo} max={L.maxRaiseTo} value={raiseTo} onChange={setRaiseTo} pot={L.pot} toCall={L.toCall} currentBet={L.currentBet} />
                    )}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      <GlossyButton color="red" size="lg" className="w-full whitespace-nowrap !px-2 !text-base sm:!px-6 sm:!text-lg" onClick={() => act('fold')} disabled={L.canCheck} title="F">
                        fold
                      </GlossyButton>
                      <GlossyButton color="cyan" size="lg" className="w-full whitespace-nowrap !px-2 !text-base sm:!px-6 sm:!text-lg" onClick={() => act(L.canCheck ? 'check' : 'call')} title="C">
                        {L.canCheck ? 'check' : L.toCall >= L.stack ? `all-in ${chips(L.toCall)}` : `call ${chips(L.toCall)}`}
                      </GlossyButton>
                      <GlossyButton color={raiseTo >= L.maxRaiseTo ? 'magenta' : 'orange'} size="lg" className="w-full whitespace-nowrap !px-2 !text-base sm:!px-6 sm:!text-lg" onClick={() => act('raise')} disabled={!L.canRaise} title="R">
                        {raiseTo >= L.maxRaiseTo ? 'all-in' : L.currentBet === 0 ? `bet ${chips(raiseTo)}` : `raise ${chips(raiseTo)}`}
                      </GlossyButton>
                    </div>
                    <p className="hidden text-right text-[11px] font-semibold text-slate-400 sm:block">keys: F fold · C check/call · R bet/raise</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-slate-500">
                    <span className="flex gap-1">
                      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-cyan-400" />
                      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-fuchsia-400 [animation-delay:120ms]" />
                      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-lime-400 [animation-delay:240ms]" />
                    </span>
                    <span className="font-semibold lowercase">
                      {hero.folded ? 'you folded — fast-forwarding' : toActName ? `${toActName} is thinking…` : 'dealing…'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Panel>

          {/* report card */}
          <Panel className="!p-4 sm:!p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl">report card</h2>
              <div className="flex items-center gap-3">
                <GlossySwitch label="coach notes" checked={coachNotes} onChange={() => toggle('coachNotes')} color="orange" />
                <GlossyButton color="silver" size="sm" onClick={newSession}>
                  new session
                </GlossyButton>
              </div>
            </div>
            {history.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Your graded decisions will appear here.</p>
            ) : (
              <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {history.slice(0, 24).map((h) => (
                  <li key={h.id} className="shrink-0">
                    <button
                      type="button"
                      title={`${h.street}: ${h.actionLabel} — ${h.headline}`}
                      onClick={() => useArena.setState({ coach: h })}
                      className="flex flex-col items-center gap-1 rounded-2xl border-2 border-white bg-white/70 px-2 py-1.5 shadow-sm transition hover:-translate-y-0.5"
                    >
                      <FeedbackBadge grade={h.grade} size="sm" animate={false} />
                      <span className="max-w-[72px] truncate text-[10px] font-bold lowercase text-slate-500">{h.actionLabel}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-1 text-[11px] text-slate-400">Tap any badge to re-read its coach note.</p>
          </Panel>
        </div>

        {trainerWheels && (
          <aside className="min-w-0 space-y-5">
            <LiveProbability game={game} ranges={ranges} rangeVersion={rangeVersion} />
            <RangeAnalysis game={game} ranges={ranges} />
          </aside>
        )}
      </div>

      <CoachModal note={coach} onClose={dismissCoach} />
    </div>
  );
}
