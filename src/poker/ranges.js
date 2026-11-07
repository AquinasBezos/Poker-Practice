// Hand rankings, range construction and the Bayesian-ish range model used
// for the 13x13 heatmaps, bot logic and grading.

import { EQ1, EQ3, EQC } from './preflopData.js';
import { CLASS_COMBOS, TOTAL_COMBOS, classOf } from './handClasses.js';
import { evaluate } from './evaluator.js';
import { detectDraws } from './outs.js';
import { PROFILES, POS_FACTOR } from './profiles.js';
import { legal, normaliseAction, positionOf } from './game.js';

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);

function buildRanking(scores) {
  const order = Array.from({ length: 169 }, (_, i) => i).sort((a, b) => scores[b] - scores[a]);
  const pct = new Float64Array(169);
  let cum = 0;
  for (const i of order) {
    const n = CLASS_COMBOS[i].length;
    pct[i] = (cum + n / 2) / TOTAL_COMBOS;
    cum += n;
  }
  return { order, pct };
}

const normalise = (arr) => {
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  return arr.map((v) => (v - min) / (max - min));
};
const n3 = normalise(EQ3);
const nc = normalise(EQC);

// "Playability" ranking for opening/calling ranges: equity vs a calling range
// (values pairs and big aces) blended with multiway equity (values suited connectors).
// Raw heads-up equity (EQ1) is kept in the data for reference only.
export const PLAY_RANKING = buildRanking(nc.map((v, i) => v + n3[i]));
export const HEADS_UP_EQUITY = EQ1;
// Push/fold ranking: equity when called by a typical calling range.
export const PUSH_RANKING = buildRanking(EQC);
export const PLAY_PCT = PLAY_RANKING.pct;
export const PUSH_PCT = PUSH_RANKING.pct;

// Weights (0..1) for the top `width` fraction of hands under a ranking.
export function topRange(width, pctArr = PLAY_PCT, soft = 0.012) {
  const w = new Float32Array(169);
  for (let i = 0; i < 169; i++) w[i] = soft > 0 ? clamp01((width - pctArr[i]) / soft + 0.5) : pctArr[i] <= width ? 1 : 0;
  return w;
}

export function rangeWidth(weights) {
  let s = 0;
  for (let i = 0; i < 169; i++) s += weights[i] * CLASS_COMBOS[i].length;
  return s / TOTAL_COMBOS;
}

export const fullRange = () => new Float32Array(169).fill(1);
export const initialRanges = (n = 6) => Array.from({ length: n }, fullRange);

function normaliseMax(w) {
  let max = 0;
  for (let i = 0; i < w.length; i++) if (w[i] > max) max = w[i];
  if (max <= 0) return null;
  const out = new Float32Array(w.length);
  for (let i = 0; i < w.length; i++) out[i] = w[i] / max;
  return out;
}

// ---- board strength per class -------------------------------------------------
const strengthCache = new Map();

function lowerBound(arr, x) {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] < x) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}
function upperBound(arr, x) {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] <= x) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

// Average strength (0..1 percentile among all possible holdings, plus a bonus for
// draws) of each class on this board. -1 when every combo is blocked by the board.
export function boardStrengths(board) {
  const key = board.join(',');
  const cached = strengthCache.get(key);
  if (cached) return cached;
  const dead = new Uint8Array(52);
  for (const c of board) dead[c] = 1;
  const combos = [];
  for (let a = 0; a < 52; a++) {
    if (dead[a]) continue;
    for (let b = a + 1; b < 52; b++) {
      if (dead[b]) continue;
      combos.push([a, b, evaluate([a, b, ...board])]);
    }
  }
  const sorted = combos.map((c) => c[2]).sort((x, y) => x - y);
  const N = sorted.length;
  const sums = new Float64Array(169);
  const counts = new Uint16Array(169);
  const drawsMatter = board.length < 5;
  for (const [a, b, sc] of combos) {
    const lo = lowerBound(sorted, sc);
    const hi = upperBound(sorted, sc);
    let s = (lo + (hi - lo) / 2) / N;
    if (drawsMatter) {
      const d = detectDraws([a, b], board);
      let bonus = 0;
      if (d.flushDraw) bonus += 0.22;
      if (d.oesd) bonus += 0.15;
      else if (d.gutshot) bonus += 0.05;
      if (bonus) s = Math.min(0.96, Math.max(s, 0.45) + bonus);
    }
    const cls = classOf(a, b);
    sums[cls] += s;
    counts[cls]++;
  }
  const out = new Float32Array(169);
  for (let i = 0; i < 169; i++) out[i] = counts[i] ? sums[i] / counts[i] : -1;
  if (strengthCache.size > 40) strengthCache.clear();
  strengthCache.set(key, out);
  return out;
}

// ---- range updates on actions ---------------------------------------------------
function preflopFactor(type, raiseCount, pos, prof) {
  const posF = POS_FACTOR[pos] ?? 1;
  if (type === 'raise') {
    if (raiseCount === 0) return topRange(Math.min(0.95, prof.pfr * posF * 1.1));
    if (raiseCount === 1) return topRange(Math.max(0.025, prof.threeBet * 1.2));
    return topRange(Math.max(0.015, prof.threeBet * 0.4));
  }
  if (type === 'call') {
    if (raiseCount === 0) {
      const callR = topRange(Math.min(0.95, prof.vpip * posF * 1.2));
      const raiseR = topRange(prof.pfr * posF);
      return callR.map((w, i) => w * (1 - 0.7 * raiseR[i]));
    }
    const width = raiseCount === 1 ? prof.vpip * 0.6 * (pos === 'BB' ? 1.5 : 1) : Math.max(0.04, prof.vpip * 0.2);
    const callR = topRange(Math.min(0.9, width + prof.threeBet));
    const reraise = topRange(raiseCount === 1 ? prof.threeBet : prof.threeBet * 0.4);
    return callR.map((w, i) => w * (1 - 0.6 * reraise[i]));
  }
  if (type === 'check') {
    const raiseR = topRange(0.12);
    return raiseR.map((w) => 1 - 0.75 * w);
  }
  return null;
}

function postflopFactor(type, strengths, prof) {
  const f = new Float32Array(169);
  const thr = (type === 'raise' ? 0.8 : 0.66) - prof.aggression * 0.12;
  for (let i = 0; i < 169; i++) {
    const s = strengths[i];
    if (s < 0) { f[i] = 0; continue; }
    if (type === 'bet' || type === 'raise') {
      const value = 1 / (1 + Math.exp(-(s - thr) * 14));
      const bluff = s < 0.4 ? prof.bluff * 1.5 : 0;
      f[i] = Math.max(value, bluff, 0.03);
    } else if (type === 'call') {
      f[i] = s < 0.3 ? 0.08 + prof.callDown * 0.6 : s > 0.94 ? 0.55 : 1;
    } else if (type === 'check') {
      f[i] = s > 0.85 ? 0.3 + (1 - prof.aggression) * 0.3 : 1;
    } else {
      f[i] = 1;
    }
  }
  return f;
}

// Returns a new ranges array after `seat` takes `action` in `game` (state *before* the action).
export function updateRanges(ranges, game, seat, action) {
  const p = game.players[seat];
  const prof = PROFILES[p.archetype] || PROFILES.hero;
  const { type } = normaliseAction(game, seat, action);
  if (type === 'fold') return ranges;
  let factor;
  if (game.street === 'preflop') {
    factor = preflopFactor(type, game.raiseCount, positionOf(game, seat), prof);
  } else {
    const L = legal(game, seat);
    const kind = type === 'raise' && L.currentBet === 0 ? 'bet' : type;
    factor = postflopFactor(kind, boardStrengths(game.board), prof);
  }
  if (!factor) return ranges;
  const prev = ranges[seat];
  const prod = new Float32Array(169);
  for (let i = 0; i < 169; i++) prod[i] = prev[i] * factor[i];
  const next = normaliseMax(prod);
  if (!next) return ranges;
  const out = ranges.slice();
  out[seat] = next;
  return out;
}
