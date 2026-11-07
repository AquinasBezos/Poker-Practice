// Simplified first-in push/fold chart for 6-max (no ante), loosely modelled on
// Nash shove ranges. Values are the share of hands to move all-in when folded to you.

import { PUSH_PCT, topRange } from './ranges.js';

export const PF_POSITIONS = ['UTG', 'HJ', 'CO', 'BTN', 'SB'];
export const PF_STACKS = [3, 5, 7, 10, 12, 15];

export const PUSH_CHART = {
  UTG: { 3: 0.35, 5: 0.24, 7: 0.18, 10: 0.14, 12: 0.12, 15: 0.1 },
  HJ: { 3: 0.42, 5: 0.29, 7: 0.22, 10: 0.18, 12: 0.15, 15: 0.13 },
  CO: { 3: 0.52, 5: 0.37, 7: 0.3, 10: 0.24, 12: 0.21, 15: 0.18 },
  BTN: { 3: 0.65, 5: 0.5, 7: 0.42, 10: 0.34, 12: 0.3, 15: 0.26 },
  SB: { 3: 0.9, 5: 0.75, 7: 0.65, 10: 0.55, 12: 0.48, 15: 0.42 },
};

export const BORDERLINE = 0.025;

export function pushDecision(cls, pos, stack) {
  const pct = PUSH_PCT[cls];
  const thr = PUSH_CHART[pos][stack];
  return { shove: pct <= thr, pct, thr, borderline: Math.abs(pct - thr) < BORDERLINE };
}

export const pushRangeWeights = (pos, stack) => topRange(PUSH_CHART[pos][stack], PUSH_PCT, 0);
