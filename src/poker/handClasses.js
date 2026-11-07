// The 169 starting-hand classes laid out as the standard 13x13 matrix.
// Row/col 0 = Ace ... 12 = Two. Diagonal = pairs, above diagonal = suited, below = offsuit.

import { rankOf, suitOf } from './cards.js';

export const MATRIX_RANKS = 'AKQJT98765432';
export const TOTAL_COMBOS = 1326;

export function classOf(c1, c2) {
  const r1 = 12 - rankOf(c1);
  const r2 = 12 - rankOf(c2);
  const hi = Math.min(r1, r2);
  const lo = Math.max(r1, r2);
  if (hi === lo) return hi * 13 + hi;
  return suitOf(c1) === suitOf(c2) ? hi * 13 + lo : lo * 13 + hi;
}

export function classLabel(i) {
  const r = Math.floor(i / 13);
  const c = i % 13;
  if (r === c) return MATRIX_RANKS[r] + MATRIX_RANKS[c];
  if (c > r) return MATRIX_RANKS[r] + MATRIX_RANKS[c] + 's';
  return MATRIX_RANKS[c] + MATRIX_RANKS[r] + 'o';
}

export function classKind(i) {
  const r = Math.floor(i / 13);
  const c = i % 13;
  if (r === c) return 'pair';
  return c > r ? 'suited' : 'offsuit';
}

export const CLASS_COMBOS = (() => {
  const arr = Array.from({ length: 169 }, () => []);
  for (let a = 0; a < 52; a++) {
    for (let b = a + 1; b < 52; b++) arr[classOf(a, b)].push([a, b]);
  }
  return arr;
})();

export const comboCount = (i) => CLASS_COMBOS[i].length;
