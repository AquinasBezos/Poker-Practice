// Bot decision logic. Each archetype's numbers live in profiles.js.

import { legal, positionOf, BB } from './game.js';
import { PROFILES, POS_FACTOR } from './profiles.js';
import { PLAY_PCT } from './ranges.js';
import { classOf } from './handClasses.js';
import { equityVsRandom } from './equity.js';
import { detectDraws } from './outs.js';

const round5 = (x) => Math.round(x / 5) * 5;

function raiseTo(L, target) {
  let to = round5(target);
  to = Math.max(L.minRaiseTo, Math.min(to, L.maxRaiseTo));
  if (to > L.maxRaiseTo * 0.7) to = L.maxRaiseTo; // just commit
  return { type: 'raise', amount: to };
}

const checkOrFold = (L) => (L.canCheck ? { type: 'check' } : { type: 'fold' });
const checkOrCall = (L) => (L.canCheck ? { type: 'check' } : { type: 'call' });
const pickSize = (prof) => prof.betSizes[Math.floor(Math.random() * prof.betSizes.length)];

export function botDecide(game, seat) {
  const p = game.players[seat];
  const prof = PROFILES[p.archetype] || PROFILES.shark;
  const L = legal(game, seat);
  const pos = positionOf(game, seat);
  return game.street === 'preflop' ? preflop(game, p, prof, L, pos) : postflop(game, p, prof, L);
}

function preflop(game, p, prof, L, pos) {
  const pct = PLAY_PCT[classOf(p.hole[0], p.hole[1])];
  const x = pct + (Math.random() - 0.5) * 0.05;
  const posF = POS_FACTOR[pos] ?? 1;

  if (game.raiseCount === 0) {
    const limpers = game.players.filter((o) => o.seat !== p.seat && !o.folded && o.lastAction?.type === 'call').length;
    const openW = prof.pfr * posF;
    if (x < openW && L.canRaise) return raiseTo(L, BB * (prof.openSize + limpers));
    if (L.canCheck) return { type: 'check' };
    const limpW = prof.vpip * posF;
    if (x < limpW && (prof.limps || pos === 'SB')) return { type: 'call' };
    return { type: 'fold' };
  }

  // Facing one or more raises.
  const deep = game.raiseCount >= 2;
  const raiseBB = game.currentBet / BB;
  const sizeAdj = Math.max(0.45, Math.min(1.1, 1 - (raiseBB - 3) * 0.05));
  const commitFrac = L.toCall / Math.max(1, L.stack + L.playerBet);
  const threeW = prof.threeBet * (deep ? 0.35 : 1);
  let callW = prof.vpip * (deep ? 0.22 : 0.5) * sizeAdj;
  if (pos === 'BB') callW *= 1.35;
  if (commitFrac > 0.4) callW *= 0.45; // facing a big shove
  if (x < threeW && L.canRaise) {
    return raiseTo(L, game.currentBet * (deep ? 2.3 : 3) + (L.pot - game.currentBet - L.playerBet) * 0.3);
  }
  if (x < threeW + callW) return checkOrCall(L);
  return checkOrFold(L);
}

function postflop(game, p, prof, L) {
  const opps = game.players.filter((o) => o.seat !== p.seat && !o.folded).length;
  const n = Math.min(opps, 3);
  const eq = equityVsRandom(p.hole, game.board, n, 240).equity;
  // Normalise multiway equity so thresholds mean roughly the same thing at any table size.
  const strength = Math.min(1, (eq * (n + 1)) / 2);
  const d = detectDraws(p.hole, game.board);
  const strongDraw = game.street !== 'river' && (d.flushDraw || d.oesd);
  const r = Math.random();
  const pot = L.pot;

  if (L.toCall === 0) {
    const valueThr = 0.62 - prof.aggression * 0.12;
    if (L.canRaise && strength > valueThr && r < 0.5 + prof.aggression * 0.5) {
      return raiseTo(L, pot * pickSize(prof));
    }
    if (L.canRaise && strongDraw && r < prof.aggression * 0.7) return raiseTo(L, pot * pickSize(prof));
    if (L.canRaise && strength < 0.4 && r < prof.bluff * (opps === 1 ? 1 : 0.4)) {
      return raiseTo(L, pot * pickSize(prof));
    }
    return { type: 'check' };
  }

  const potOdds = L.toCall / (pot + L.toCall);
  const betFrac = L.toCall / Math.max(1, pot - L.toCall);
  const need = potOdds * (1.3 - prof.callDown * 0.8) + (betFrac > 1 ? 0.05 : 0) + 0.05;
  const adj = strength - (game.raiseCount >= 2 ? 0.1 : 0);
  const raiseSize = () => game.currentBet + (pot + L.toCall) * (0.6 + Math.random() * 0.4) * (prof.aggression > 0.8 ? 1.3 : 1);

  if (L.canRaise && adj > 0.84 - prof.aggression * 0.12 && r < 0.3 + prof.aggression * 0.5) return raiseTo(L, raiseSize());
  if (L.canRaise && strongDraw && r < prof.aggression * 0.2) return raiseTo(L, raiseSize());
  if (L.canRaise && prof.bluff > 0.3 && r < prof.bluff * 0.15) return raiseTo(L, raiseSize());

  let drawEq = 0;
  if (strongDraw) {
    drawEq = d.flushDraw && d.oesd ? 0.32 : d.flushDraw ? 0.19 : 0.17;
    if (game.street === 'flop') drawEq *= 1.8;
  }
  if (adj >= need || drawEq >= potOdds * 0.9) return { type: 'call' };
  if (prof.callDown > 0.8 && strength > 0.25 && r < 0.65) return { type: 'call' };
  return { type: 'fold' };
}
