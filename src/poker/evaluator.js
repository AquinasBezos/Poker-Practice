// Texas Hold'em hand evaluator for 5, 6 or 7 cards.
// Returns a single comparable integer: higher = stronger hand.
// score = category * 16^5 + kicker ranks (base 16), category 0 (high card) .. 8 (straight flush)

import { RANK_NAMES, RANK_PLURALS } from './cards.js';

export const CATEGORY_NAMES = [
  'High Card',
  'Pair',
  'Two Pair',
  'Three of a Kind',
  'Straight',
  'Flush',
  'Full House',
  'Four of a Kind',
  'Straight Flush',
];

const CAT_BASE = 16 ** 5;

// mask: 13-bit rank mask. Returns rank index of the straight's top card, or -1.
export function straightHigh(mask) {
  const m = (mask << 1) | ((mask >> 12) & 1); // bit 0 = ace-low
  for (let h = 13; h >= 4; h--) {
    if (((m >> (h - 4)) & 31) === 31) return h - 1;
  }
  return -1;
}

function score(cat, ks) {
  let v = cat;
  for (let i = 0; i < 5; i++) v = v * 16 + (ks[i] !== undefined && ks[i] >= 0 ? ks[i] : 0);
  return v;
}

export const categoryOf = (s) => Math.floor(s / CAT_BASE);

export function kickersOf(s) {
  const ks = [];
  let v = s;
  for (let i = 0; i < 5; i++) {
    ks.unshift(v % 16);
    v = Math.floor(v / 16);
  }
  return ks;
}

export function evaluate(cards) {
  const rc = new Int8Array(13);
  const sc = new Int8Array(4);
  const sm = new Int32Array(4);
  let mask = 0;
  for (let i = 0; i < cards.length; i++) {
    const c = cards[i];
    const r = c >> 2;
    const s = c & 3;
    rc[r]++;
    sc[s]++;
    sm[s] |= 1 << r;
    mask |= 1 << r;
  }

  let fs = -1;
  for (let s = 0; s < 4; s++) if (sc[s] >= 5) fs = s;
  if (fs >= 0) {
    const h = straightHigh(sm[fs]);
    if (h >= 0) return score(8, [h]);
  }

  let q = -1, t1 = -1, t2 = -1, p1 = -1, p2 = -1;
  for (let r = 12; r >= 0; r--) {
    const n = rc[r];
    if (n === 4) { if (q < 0) q = r; }
    else if (n === 3) { if (t1 < 0) t1 = r; else if (t2 < 0) t2 = r; }
    else if (n === 2) { if (p1 < 0) p1 = r; else if (p2 < 0) p2 = r; }
  }

  if (q >= 0) {
    let k = -1;
    for (let r = 12; r >= 0; r--) if (r !== q && rc[r] > 0) { k = r; break; }
    return score(7, [q, k]);
  }
  if (t1 >= 0 && (t2 >= 0 || p1 >= 0)) return score(6, [t1, Math.max(t2, p1)]);
  if (fs >= 0) {
    const ks = [];
    for (let r = 12; r >= 0 && ks.length < 5; r--) if (sm[fs] & (1 << r)) ks.push(r);
    return score(5, ks);
  }
  const sh = straightHigh(mask);
  if (sh >= 0) return score(4, [sh]);
  if (t1 >= 0) {
    const ks = [t1];
    for (let r = 12; r >= 0 && ks.length < 3; r--) if (r !== t1 && rc[r] > 0) ks.push(r);
    return score(3, ks);
  }
  if (p1 >= 0 && p2 >= 0) {
    let k = -1;
    for (let r = 12; r >= 0; r--) if (r !== p1 && r !== p2 && rc[r] > 0) { k = r; break; }
    return score(2, [p1, p2, k]);
  }
  if (p1 >= 0) {
    const ks = [p1];
    for (let r = 12; r >= 0 && ks.length < 4; r--) if (r !== p1 && rc[r] > 0) ks.push(r);
    return score(1, ks);
  }
  const ks = [];
  for (let r = 12; r >= 0 && ks.length < 5; r--) if (rc[r] > 0) ks.push(r);
  return score(0, ks);
}

export function categoryName(s) {
  const cat = categoryOf(s);
  if (cat === 8 && kickersOf(s)[0] === 12) return 'Royal Flush';
  return CATEGORY_NAMES[cat];
}

export function describeScore(s) {
  const cat = categoryOf(s);
  const k = kickersOf(s);
  switch (cat) {
    case 8: return k[0] === 12 ? 'Royal Flush' : `Straight Flush, ${RANK_NAMES[k[0]]}-high`;
    case 7: return `Four ${RANK_PLURALS[k[0]]}`;
    case 6: return `Full House, ${RANK_PLURALS[k[0]]} full of ${RANK_PLURALS[k[1]]}`;
    case 5: return `Flush, ${RANK_NAMES[k[0]]}-high`;
    case 4: return `Straight, ${RANK_NAMES[k[0]]}-high`;
    case 3: return `Three ${RANK_PLURALS[k[0]]}`;
    case 2: return `Two Pair, ${RANK_PLURALS[k[0]]} & ${RANK_PLURALS[k[1]]}`;
    case 1: return `Pair of ${RANK_PLURALS[k[0]]}`;
    default: return `${RANK_NAMES[k[0]]}-high`;
  }
}

export const handName = (cards) => describeScore(evaluate(cards));

function combinations(arr, k) {
  const out = [];
  const pickIdx = (start, chosen) => {
    if (chosen.length === k) { out.push(chosen.map((i) => arr[i])); return; }
    for (let i = start; i <= arr.length - (k - chosen.length); i++) pickIdx(i + 1, [...chosen, i]);
  };
  pickIdx(0, []);
  return out;
}

// The five cards that make the best hand (for highlighting at showdown).
export function bestFive(cards) {
  if (cards.length <= 5) return cards.slice();
  let best = -1;
  let bestSet = null;
  for (const combo of combinations(cards, 5)) {
    const s = evaluate(combo);
    if (s > best) { best = s; bestSet = combo; }
  }
  return bestSet;
}
