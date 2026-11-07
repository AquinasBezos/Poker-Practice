import { create } from 'zustand';
import { createTable, startHand, applyAction, advanceRunout, BB, START_STACK } from '../poker/game.js';
import { botDecide } from '../poker/bots.js';
import { initialRanges, updateRanges } from '../poker/ranges.js';
import { gradeHeroAction, isLowGrade } from '../poker/grading.js';

// Practice Arena state. Lives in a store so a hand in progress survives
// navigating to a tutorial and back.
export const useArena = create((set, get) => ({
  game: null,
  ranges: null,
  rangeVersion: 0,
  history: [],
  lastGrade: null,
  coach: null,
  buyIns: 1,
  hands: 0,

  ensureSession: () => {
    if (!get().game) get().newSession();
  },

  newSession: () => {
    const game = startHand(createTable());
    set({
      game,
      ranges: initialRanges(),
      rangeVersion: get().rangeVersion + 1,
      history: [],
      lastGrade: null,
      coach: null,
      buyIns: 1,
      hands: 1,
    });
  },

  nextHand: () => {
    const { game, buyIns, hands, rangeVersion } = get();
    if (!game) return get().newSession();
    const heroBust = game.players[0].stack < BB;
    set({
      game: startHand(game),
      ranges: initialRanges(),
      rangeVersion: rangeVersion + 1,
      lastGrade: null,
      coach: null,
      buyIns: buyIns + (heroBust ? 1 : 0),
      hands: hands + 1,
    });
  },

  heroAction: (action, { coachNotes = true } = {}) => {
    const { game, ranges, history, rangeVersion } = get();
    if (!game || game.handOver || game.toAct !== 0) return;
    const grade = gradeHeroAction(game, ranges, action);
    const record = { ...grade, id: `${game.handId}-${history.length}-${Date.now()}` };
    set({
      game: applyAction(game, 0, action),
      ranges: updateRanges(ranges, game, 0, action),
      rangeVersion: rangeVersion + 1,
      history: [record, ...history].slice(0, 60),
      lastGrade: record,
      coach: coachNotes && isLowGrade(grade.grade) ? record : null,
    });
  },

  botAction: () => {
    const { game, ranges, rangeVersion } = get();
    if (!game || game.handOver || game.toAct <= 0) return;
    const seat = game.toAct;
    const action = botDecide(game, seat);
    set({
      game: applyAction(game, seat, action),
      ranges: updateRanges(ranges, game, seat, action),
      rangeVersion: rangeVersion + 1,
    });
  },

  runout: () => {
    const { game } = get();
    if (!game || game.handOver || game.toAct !== -1) return;
    set({ game: advanceRunout(game) });
  },

  dismissCoach: () => set({ coach: null }),
}));

export const heroProfit = (state) =>
  state.game ? state.game.players[0].stack + (state.game.handOver ? 0 : state.game.players[0].totalBet) - START_STACK * state.buyIns : 0;
