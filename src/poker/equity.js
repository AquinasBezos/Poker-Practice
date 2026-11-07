// Equity calculators: Monte Carlo vs random hands / weighted ranges, and exact vs a known hand.

import { evaluate } from './evaluator.js';
import { CLASS_COMBOS } from './handClasses.js';

function liveDeck(dead) {
  const d = new Uint8Array(52);
  for (const c of dead) d[c] = 1;
  const out = [];
  for (let i = 0; i < 52; i++) if (!d[i]) out.push(i);
  return out;
}

// Equity of `hero` vs `opponents` uniformly random hands.
export function equityVsRandom(hero, board, opponents = 1, iterations = 2000) {
  const buf = liveDeck([...hero, ...board]);
  const n = buf.length;
  const need = 5 - board.length;
  const k = need + 2 * opponents;
  let win = 0;
  let tie = 0;
  let eq = 0;
  const full = new Array(5);
  for (let i = 0; i < board.length; i++) full[i] = board[i];
  for (let it = 0; it < iterations; it++) {
    for (let i = 0; i < k; i++) {
      const j = i + Math.floor(Math.random() * (n - i));
      const t = buf[i]; buf[i] = buf[j]; buf[j] = t;
    }
    for (let i = 0; i < need; i++) full[board.length + i] = buf[i];
    const hs = evaluate([hero[0], hero[1], ...full]);
    let lost = false;
    let ties = 0;
    for (let o = 0; o < opponents; o++) {
      const os = evaluate([buf[need + 2 * o], buf[need + 2 * o + 1], ...full]);
      if (os > hs) { lost = true; break; }
      if (os === hs) ties++;
    }
    if (!lost) {
      if (ties === 0) { win++; eq += 1; }
      else { tie++; eq += 1 / (ties + 1); }
    }
  }
  return { win: win / iterations, tie: tie / iterations, equity: eq / iterations };
}

// Build a cumulative weighted combo list from a 169-class weight array.
export function buildComboList(weights, dead = []) {
  const deadSet = new Uint8Array(52);
  for (const c of dead) deadSet[c] = 1;
  const a = [];
  const b = [];
  const cum = [];
  let total = 0;
  for (let i = 0; i < 169; i++) {
    const w = weights[i];
    if (!(w > 0.001)) continue;
    for (const [x, y] of CLASS_COMBOS[i]) {
      if (deadSet[x] || deadSet[y]) continue;
      total += w;
      a.push(x);
      b.push(y);
      cum.push(total);
    }
  }
  return { a, b, cum, total };
}

function sampleIdx(list) {
  const r = Math.random() * list.total;
  let lo = 0;
  let hi = list.cum.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (list.cum[mid] < r) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

// Equity of `hero` vs several opponents, each holding a hand drawn from a weighted range.
// `ranges` is an array of 169-length weight arrays (null = random hand).
export function equityVsRanges(hero, board, ranges, iterations = 1500) {
  if (!ranges.length) return 1;
  const dead = [...hero, ...board];
  const lists = ranges.map((w) => (w ? buildComboList(w, dead) : null));
  const need = 5 - board.length;
  const used = new Uint8Array(52);
  const full = new Array(5);
  const opp = new Array(ranges.length * 2);
  let eq = 0;
  let valid = 0;
  for (let it = 0; it < iterations; it++) {
    used.fill(0);
    for (const c of dead) used[c] = 1;
    let ok = true;
    for (let o = 0; o < lists.length; o++) {
      const list = lists[o];
      let x = -1;
      let y = -1;
      let tries = 0;
      do {
        if (list && list.total > 0) {
          const idx = sampleIdx(list);
          x = list.a[idx];
          y = list.b[idx];
        } else {
          x = Math.floor(Math.random() * 52);
          y = Math.floor(Math.random() * 52);
        }
        tries++;
      } while ((x === y || used[x] || used[y]) && tries < 25);
      if (x === y || used[x] || used[y]) { ok = false; break; }
      used[x] = 1;
      used[y] = 1;
      opp[2 * o] = x;
      opp[2 * o + 1] = y;
    }
    if (!ok) continue;
    for (let i = 0; i < board.length; i++) full[i] = board[i];
    for (let i = 0; i < need; i++) {
      let c;
      do { c = Math.floor(Math.random() * 52); } while (used[c]);
      used[c] = 1;
      full[board.length + i] = c;
    }
    const hs = evaluate([hero[0], hero[1], ...full]);
    let lost = false;
    let ties = 0;
    for (let o = 0; o < lists.length; o++) {
      const os = evaluate([opp[2 * o], opp[2 * o + 1], ...full]);
      if (os > hs) { lost = true; break; }
      if (os === hs) ties++;
    }
    valid++;
    if (!lost) eq += 1 / (ties + 1);
  }
  return valid ? eq / valid : 0.5;
}

// Exact enumeration of every runout vs one known hand.
export function exactEquityVsHand(hero, villain, board) {
  const deck = liveDeck([...hero, ...villain, ...board]);
  const need = 5 - board.length;
  let win = 0;
  let tie = 0;
  let total = 0;
  const run = (fb) => {
    const h = evaluate([...hero, ...fb]);
    const v = evaluate([...villain, ...fb]);
    total++;
    if (h > v) win++;
    else if (h === v) tie++;
  };
  if (need <= 0) run(board);
  else if (need === 1) for (const c of deck) run([...board, c]);
  else if (need === 2) {
    for (let i = 0; i < deck.length; i++) for (let j = i + 1; j < deck.length; j++) run([...board, deck[i], deck[j]]);
  } else {
    // Preflop: too many runouts to enumerate, so sample them.
    const buf = deck.slice();
    for (let it = 0; it < 20000; it++) {
      for (let i = 0; i < need; i++) {
        const j = i + Math.floor(Math.random() * (buf.length - i));
        const t = buf[i]; buf[i] = buf[j]; buf[j] = t;
      }
      run([...board, ...buf.slice(0, need)]);
    }
  }
  return { win: win / total, tie: tie / total, equity: (win + tie / 2) / total };
}
