// Outs, draws and hit-probability helpers.

import { rankOf, suitOf } from './cards.js';
import { evaluate, categoryOf, kickersOf, straightHigh } from './evaluator.js';

// Cards that put `hero` strictly ahead of a known `villain` hand on the next card.
export function outsVsHand(hero, villain, board) {
  const dead = new Set([...hero, ...villain, ...board]);
  const outs = [];
  for (let c = 0; c < 52; c++) {
    if (dead.has(c)) continue;
    const b = [...board, c];
    if (evaluate([...hero, ...b]) > evaluate([...villain, ...b])) outs.push(c);
  }
  return outs;
}

// Flush / straight draw detection (hole cards must contribute).
export function detectDraws(hole, board) {
  const res = { flushDraw: false, oesd: false, gutshot: false, backdoorFlush: false, straightRanks: 0 };
  if (board.length < 3 || board.length >= 5) return res;
  const all = [...hole, ...board];
  const curCat = categoryOf(evaluate(all));

  if (curCat < 5) {
    for (let s = 0; s < 4; s++) {
      let n = 0;
      let hn = 0;
      for (const c of all) if (suitOf(c) === s) n++;
      for (const c of hole) if (suitOf(c) === s) hn++;
      if (n === 4 && hn >= 1) res.flushDraw = true;
      if (n === 3 && hn === 2 && board.length === 3) res.backdoorFlush = true;
    }
  }

  if (curCat < 4) {
    let mask = 0;
    let bmask = 0;
    for (const c of all) mask |= 1 << rankOf(c);
    for (const c of board) bmask |= 1 << rankOf(c);
    let count = 0;
    for (let r = 0; r < 13; r++) {
      if (mask & (1 << r)) continue;
      if (straightHigh(mask | (1 << r)) >= 0 && straightHigh(bmask | (1 << r)) < 0) count++;
    }
    res.straightRanks = count;
    if (count >= 2) res.oesd = true;
    else if (count === 1) res.gutshot = true;
  }
  return res;
}

export function drawLabel(d) {
  const parts = [];
  if (d.flushDraw) parts.push('flush draw');
  if (d.oesd) parts.push('open-ended straight draw');
  else if (d.gutshot) parts.push('gutshot');
  if (parts.length === 2) return `combo draw (${parts.join(' + ')})`;
  return parts[0] || null;
}

// "Improvement outs" for the HUD when the opponent's hand is unknown.
// A card counts if it lifts hero to a better category in a way that uses the hole cards:
// straights/flushes/boats that beat the board, sets/trips with a hole card,
// two pair made with both hole cards, or a new top pair.
export function improvementOuts(hole, board) {
  if (board.length < 3 || board.length >= 5) return [];
  const dead = new Set([...hole, ...board]);
  const curCat = categoryOf(evaluate([...hole, ...board]));
  const holeRanks = new Set(hole.map(rankOf));
  const outs = [];
  for (let c = 0; c < 52; c++) {
    if (dead.has(c)) continue;
    const nb = [...board, c];
    const ns = evaluate([...hole, ...nb]);
    const nCat = categoryOf(ns);
    if (nCat <= curCat) continue;
    if (nCat <= categoryOf(evaluate(nb))) continue; // the board plays
    const k = kickersOf(ns);
    let real = false;
    if (nCat >= 4) real = true;
    else if (nCat === 3) real = holeRanks.has(k[0]);
    else if (nCat === 2) real = holeRanks.has(k[0]) && holeRanks.has(k[1]);
    else if (nCat === 1) {
      const maxBoard = Math.max(...nb.map(rankOf));
      real = holeRanks.has(k[0]) && k[0] >= maxBoard;
    }
    if (real) outs.push(c);
  }
  return outs;
}

// Cards that complete a straight or flush for hero (used by the pot-odds drill).
export function drawOuts(hole, board) {
  const dead = new Set([...hole, ...board]);
  const outs = [];
  for (let c = 0; c < 52; c++) {
    if (dead.has(c)) continue;
    const nb = [...board, c];
    const nCat = categoryOf(evaluate([...hole, ...nb]));
    if (nCat >= 4 && nCat <= 5 && nCat > categoryOf(evaluate(nb))) outs.push(c);
  }
  return outs;
}

// Exact probability of hitting at least one of `outs` with `cardsToCome` cards from `unseen`.
export function hitChance(outs, cardsToCome, unseen) {
  if (cardsToCome <= 0 || outs <= 0) return 0;
  if (cardsToCome === 1) return outs / unseen;
  return 1 - ((unseen - outs) * (unseen - outs - 1)) / (unseen * (unseen - 1));
}

// The classic shortcut: outs x4 on the flop (two cards to come), x2 on the turn.
export const ruleOf2And4 = (outs, cardsToCome) => Math.min(100, outs * (cardsToCome >= 2 ? 4 : 2));
