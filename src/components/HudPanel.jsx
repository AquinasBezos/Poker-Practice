import { useEffect, useMemo, useState } from 'react';
import GelBar from './GelBar.jsx';
import RangeMatrix from './RangeMatrix.jsx';
import { CardRow } from './PlayingCard.jsx';
import { Panel, Tabs } from './ui.jsx';
import { equityVsRandom, equityVsRanges } from '../poker/equity.js';
import { improvementOuts, detectDraws, drawLabel, hitChance, ruleOf2And4 } from '../poker/outs.js';
import { evaluate, describeScore } from '../poker/evaluator.js';
import { classOf, classLabel } from '../poker/handClasses.js';
import { PLAY_PCT, rangeWidth } from '../poker/ranges.js';
import { legal } from '../poker/game.js';
import { PROFILES } from '../poker/profiles.js';

const pct = (x, d = 0) => `${(x * 100).toFixed(d)}%`;
const chips = (n) => Math.round(n).toLocaleString('en-US');

export function LiveProbability({ game, ranges, rangeVersion }) {
  const hero = game.players[0];
  const board = game.board;
  const opps = game.players.filter((p) => !p.isHero && !p.folded);
  const oppKey = opps.map((o) => o.seat).join(',');

  const stats = useMemo(() => {
    if (hero.folded || hero.hole.length < 2) return null;
    const eqRandom = equityVsRandom(hero.hole, board, 1, 2500).equity;
    const n = Math.max(1, opps.length);
    const eqField = n > 1 ? equityVsRandom(hero.hole, board, n, 1500).equity : eqRandom;
    const eqRange = opps.length ? equityVsRanges(hero.hole, board, opps.map((o) => ranges[o.seat]), 1200) : 1;
    const outs = improvementOuts(hero.hole, board);
    const toCome = board.length === 3 ? 2 : board.length === 4 ? 1 : 0;
    const unseen = 52 - 2 - board.length;
    const cls = classOf(hero.hole[0], hero.hole[1]);
    return {
      eqRandom,
      eqField,
      eqRange,
      n,
      outs,
      toCome,
      hitNext: toCome ? outs.length / unseen : 0,
      hitRiver: toCome ? hitChance(outs.length, toCome, unseen) : 0,
      rule: toCome ? ruleOf2And4(outs.length, toCome) : 0,
      draw: board.length ? drawLabel(detectDraws(hero.hole, board)) : null,
      made: board.length ? describeScore(evaluate([...hero.hole, ...board])) : `${classLabel(cls)} · top ${pct(PLAY_PCT[cls])} preflop`,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.handId, board.length, oppKey, rangeVersion, hero.folded]);

  const heroTurn = !game.handOver && game.toAct === 0;
  const L = heroTurn ? legal(game, 0) : null;
  const facing = L && L.toCall > 0;
  const required = facing ? L.toCall / (L.pot + L.toCall) : null;

  return (
    <Panel accent="cyan" className="!p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl">live probability</h2>
        <span className="rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-bold lowercase text-cyan-700">{game.street}</span>
      </div>
      {!stats ? (
        <p className="mt-4 rounded-2xl bg-slate-100/80 p-4 text-sm font-semibold text-slate-500">You folded this hand. Watch how the bots play it out.</p>
      ) : (
        <div className="mt-3 space-y-4">
          <div className="rounded-2xl border-2 border-white bg-gradient-to-b from-white to-cyan-50 px-3 py-2 shadow-sm">
            <p className="chip-label">your hand</p>
            <p className="font-extrabold text-slate-800">{stats.made}</p>
            {stats.draw && <p className="text-xs font-bold text-fuchsia-600">+ {stats.draw}</p>}
          </div>

          <GelBar value={stats.eqRandom} color="cyan" label="equity vs a random hand" valueLabel={pct(stats.eqRandom, 1)} />
          {stats.n > 1 && <GelBar value={stats.eqField} color="sky" label={`vs ${stats.n} random hands`} valueLabel={pct(stats.eqField, 1)} />}
          <GelBar
            value={stats.eqRange}
            color={facing ? (stats.eqRange >= required ? 'lime' : 'magenta') : 'violet'}
            label="vs their likely ranges"
            valueLabel={pct(stats.eqRange, 1)}
            marker={facing ? required : null}
            markerLabel={facing ? `need ${pct(required)}` : null}
          />

          <div className="rounded-2xl border-2 border-white bg-white/80 p-3 shadow-sm">
            <div className="flex items-baseline justify-between">
              <p className="chip-label">outs</p>
              <p className="text-2xl font-black text-slate-800">{stats.toCome ? stats.outs.length : '–'}</p>
            </div>
            {stats.toCome > 0 && stats.outs.length > 0 && (
              <>
                <CardRow cards={stats.outs} size="xs" gap="gap-0.5 flex-wrap" className="mt-1" />
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-cyan-50 py-1">
                    <p className="text-[10px] font-bold uppercase text-slate-400">next card</p>
                    <p className="font-black text-cyan-700">{pct(stats.hitNext)}</p>
                  </div>
                  <div className="rounded-xl bg-lime-50 py-1">
                    <p className="text-[10px] font-bold uppercase text-slate-400">by river</p>
                    <p className="font-black text-lime-700">{pct(stats.hitRiver)}</p>
                  </div>
                  <div className="rounded-xl bg-fuchsia-50 py-1">
                    <p className="text-[10px] font-bold uppercase text-slate-400">rule of {stats.toCome === 2 ? 4 : 2}</p>
                    <p className="font-black text-fuchsia-700">{stats.rule}%</p>
                  </div>
                </div>
              </>
            )}
            {stats.toCome > 0 && stats.outs.length === 0 && <p className="mt-1 text-xs text-slate-500">No clean improving cards — your hand is what it is.</p>}
            {!stats.toCome && <p className="mt-1 text-xs text-slate-500">{game.board.length === 0 ? 'Outs appear once the flop is dealt.' : 'River: no more cards to come.'}</p>}
          </div>

          <div className="rounded-2xl border-2 border-white bg-gradient-to-b from-white to-lime-50 p-3 shadow-sm">
            <p className="chip-label">pot odds</p>
            {facing ? (
              <p className="mt-1 text-sm text-slate-700">
                call <b>{chips(L.toCall)}</b> to win <b>{chips(L.pot)}</b> → <b>{(L.pot / L.toCall).toFixed(1)} : 1</b>
                <br />
                you need <b className="text-lime-700">{pct(required, 1)}</b> equity to call
              </p>
            ) : (
              <p className="mt-1 text-sm text-slate-500">{game.handOver ? 'Hand complete.' : heroTurn ? 'No bet to call — you can check for free.' : 'Waiting for action…'}</p>
            )}
          </div>
        </div>
      )}
    </Panel>
  );
}

function describeRange(game, seat) {
  const p = game.players[seat];
  const acts = game.log.filter((l) => l.seat === seat && l.type !== 'blind');
  if (!acts.length) return p.isHero ? 'No voluntary action yet — you could have anything.' : `${p.name} hasn't acted yet: any two cards.`;
  const parts = acts.map((a) => `${a.label}${a.amount && a.type !== 'check' && a.type !== 'fold' ? ` ${a.amount}` : ''} (${a.street})`);
  return `${p.isHero ? 'You' : p.name}: ${parts.join(' → ')}`;
}

export function RangeAnalysis({ game, ranges }) {
  const opps = game.players.filter((p) => !p.isHero && !p.folded);
  const hero = game.players[0];
  const defaultSeat = () => {
    const aggr = [...game.log].reverse().find((l) => l.seat > 0 && (l.type === 'raise' || l.type === 'call') && !game.players[l.seat].folded);
    return aggr ? aggr.seat : opps[0]?.seat ?? 0;
  };
  const [seat, setSeat] = useState(defaultSeat);

  useEffect(() => {
    if (seat !== 0 && game.players[seat]?.folded) setSeat(defaultSeat());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game]);

  useEffect(() => {
    setSeat(defaultSeat());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.handId]);

  const tabs = [
    { value: 0, label: 'you (perceived)', color: 'magenta' },
    ...opps.map((o) => ({ value: o.seat, label: o.name, color: PROFILES[o.archetype].color })),
  ];
  const sel = game.players[seat] || hero;
  const color = sel.isHero ? 'magenta' : PROFILES[sel.archetype].color;
  const heroCls = hero.hole.length === 2 ? classOf(hero.hole[0], hero.hole[1]) : -1;
  const weights = ranges[sel.seat];

  return (
    <Panel accent="magenta" className="!p-5">
      <h2 className="text-xl">range analysis</h2>
      <p className="mt-0.5 text-xs text-slate-500">Heatmap of hands each player is likely to hold, narrowed by every bet, call and check.</p>
      <Tabs className="mt-3" tabs={tabs} value={sel.seat} onChange={setSeat} />
      <RangeMatrix className="mt-3" weights={weights} color={color} highlight={sel.isHero ? heroCls : -1} title={sel.isHero ? 'what opponents put you on' : `${sel.name}'s likely range`} />
      <p className="mt-2 text-xs leading-snug text-slate-500">{describeRange(game, sel.seat)}</p>
      {sel.isHero && heroCls >= 0 && (
        <p className="mt-1 text-xs font-semibold text-fuchsia-600">
          Your actual hand ({classLabel(heroCls)}) is outlined.{' '}
          {weights[heroCls] < 0.15 ? 'It barely fits the story you’re telling — good for bluffs, risky for value.' : 'It fits the range you’re representing.'}
        </p>
      )}
      {!sel.isHero && (
        <p className="mt-1 text-xs font-semibold text-slate-400">
          {PROFILES[sel.archetype].label}: {Math.round(rangeWidth(weights) * 100)}% of hands remain.
        </p>
      )}
    </Panel>
  );
}
