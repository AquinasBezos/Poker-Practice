// 6-max No-Limit Hold'em table engine. Pure functions: every action returns a new state.

import { shuffledDeck } from './cards.js';
import { evaluate, describeScore, bestFive } from './evaluator.js';
import { PROFILES, SEAT_ARCHETYPES } from './profiles.js';

export const SB = 5;
export const BB = 10;
export const START_STACK = 1000;
export const NUM_SEATS = 6;
export const POSITIONS = ['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO']; // by offset from the button

function clone(s) {
  return {
    ...s,
    players: s.players.map((p) => ({ ...p, hole: p.hole.slice(), lastAction: p.lastAction ? { ...p.lastAction } : null })),
    board: s.board.slice(),
    deck: s.deck.slice(),
    log: s.log.slice(),
  };
}

export const potTotal = (s) => s.players.reduce((a, p) => a + p.totalBet, 0);
export const positionOf = (s, seat) => POSITIONS[(seat - s.button + NUM_SEATS) % NUM_SEATS];
// 0 = first to act postflop (SB) ... 5 = last (BTN)
export const postflopOrder = (s, seat) => (seat - s.button - 1 + NUM_SEATS * 2) % NUM_SEATS;

export function createTable() {
  return {
    handId: 0,
    button: Math.floor(Math.random() * NUM_SEATS),
    players: SEAT_ARCHETYPES.map((arch, seat) => ({
      seat,
      archetype: arch,
      name: PROFILES[arch].name,
      isHero: seat === 0,
      stack: START_STACK,
      hole: [],
      bet: 0,
      totalBet: 0,
      folded: false,
      allIn: false,
      acted: false,
      lastAction: null,
      revealed: false,
      won: 0,
      handName: null,
      rebought: false,
    })),
    board: [],
    deck: [],
    log: [],
  };
}

function commit(p, amount) {
  const amt = Math.max(0, Math.min(amount, p.stack));
  p.stack -= amt;
  p.bet += amt;
  p.totalBet += amt;
  if (p.stack === 0) p.allIn = true;
  return amt;
}

export function nextToAct(s, fromSeat) {
  for (let i = 1; i <= NUM_SEATS; i++) {
    const seat = (fromSeat + i) % NUM_SEATS;
    const p = s.players[seat];
    if (p.folded || p.allIn) continue;
    if (!p.acted || p.bet < s.currentBet) return seat;
  }
  return -1;
}

export function startHand(table) {
  const button = (table.button + 1) % NUM_SEATS;
  const deck = shuffledDeck();
  const players = table.players.map((p) => {
    const rebought = p.stack < BB;
    return {
      ...p,
      stack: rebought ? START_STACK : p.stack,
      rebought,
      hole: [],
      bet: 0,
      totalBet: 0,
      folded: false,
      allIn: false,
      acted: false,
      lastAction: null,
      revealed: false,
      won: 0,
      handName: null,
    };
  });
  for (let round = 0; round < 2; round++) {
    for (let i = 1; i <= NUM_SEATS; i++) players[(button + i) % NUM_SEATS].hole.push(deck.pop());
  }
  const s = {
    handId: table.handId + 1,
    button,
    street: 'preflop',
    deck,
    board: [],
    players,
    currentBet: 0,
    minRaise: BB,
    raiseCount: 0,
    lastAggressor: -1,
    toAct: -1,
    handOver: false,
    result: null,
    log: [],
  };
  const sbSeat = (button + 1) % NUM_SEATS;
  const bbSeat = (button + 2) % NUM_SEATS;
  for (const [seat, amt, label] of [[sbSeat, SB, 'sb'], [bbSeat, BB, 'bb']]) {
    const p = s.players[seat];
    commit(p, amt);
    p.lastAction = { type: 'blind', label, amount: p.bet, street: 'preflop' };
    s.log.push({ seat, name: p.name, street: 'preflop', type: 'blind', label, amount: p.bet });
  }
  s.currentBet = BB;
  s.lastAggressor = bbSeat;
  s.toAct = nextToAct(s, bbSeat);
  return s;
}

export function legal(s, seat = s.toAct) {
  const p = s.players[seat];
  const toCall = Math.max(0, Math.min(s.currentBet - p.bet, p.stack));
  const canCheck = p.bet >= s.currentBet;
  const maxRaiseTo = p.bet + p.stack;
  const othersCanAct = s.players.some((o) => o.seat !== seat && !o.folded && !o.allIn);
  const canRaise = maxRaiseTo > s.currentBet && othersCanAct;
  const minRaiseTo = Math.min(Math.max(s.currentBet + s.minRaise, BB), maxRaiseTo);
  return {
    toCall,
    canCheck,
    canRaise,
    minRaiseTo,
    maxRaiseTo,
    pot: potTotal(s),
    currentBet: s.currentBet,
    playerBet: p.bet,
    stack: p.stack,
  };
}

// Normalise an intended action against what's legal.
export function normaliseAction(s, seat, action) {
  const L = legal(s, seat);
  let type = action.type;
  if (type === 'call' && L.canCheck) type = 'check';
  if (type === 'check' && !L.canCheck) type = 'fold';
  if (type === 'raise' && !L.canRaise) type = L.canCheck ? 'check' : 'call';
  if (type === 'fold' && L.canCheck) type = 'check'; // never fold for free
  return { type, amount: action.amount };
}

export function applyAction(state, seat, action) {
  if (state.handOver || state.toAct !== seat) return state;
  const s = clone(state);
  const p = s.players[seat];
  const L = legal(s, seat);
  const { type } = normaliseAction(state, seat, action);
  let label = type;
  let amount = 0;

  switch (type) {
    case 'fold':
      p.folded = true;
      break;
    case 'check':
      break;
    case 'call':
      commit(p, L.toCall);
      amount = p.bet;
      if (p.allIn) label = 'all-in';
      break;
    case 'raise': {
      const wanted = Math.round(Number(action.amount) || L.minRaiseTo);
      const to = Math.max(L.minRaiseTo, Math.min(wanted, L.maxRaiseTo));
      const wasBet = s.currentBet === 0;
      commit(p, to - p.bet);
      const inc = p.bet - s.currentBet;
      if (inc >= s.minRaise) s.minRaise = inc;
      s.currentBet = p.bet;
      s.raiseCount += 1;
      s.lastAggressor = seat;
      for (const o of s.players) if (o.seat !== seat) o.acted = false;
      label = p.allIn ? 'all-in' : wasBet ? 'bet' : 'raise';
      amount = p.bet;
      break;
    }
    default:
      return state;
  }

  p.acted = true;
  p.lastAction = { type, label, amount, street: s.street };
  s.log.push({ seat, name: p.name, street: s.street, type, label, amount, pot: potTotal(s) });

  const live = s.players.filter((o) => !o.folded);
  if (live.length === 1) return finishUncontested(s, live[0]);

  const next = nextToAct(s, seat);
  if (next !== -1) {
    s.toAct = next;
    return s;
  }
  return closeStreet(s);
}

function dealNextStreet(s) {
  if (s.street === 'preflop') {
    s.board.push(s.deck.pop(), s.deck.pop(), s.deck.pop());
    s.street = 'flop';
  } else if (s.street === 'flop') {
    s.board.push(s.deck.pop());
    s.street = 'turn';
  } else if (s.street === 'turn') {
    s.board.push(s.deck.pop());
    s.street = 'river';
  }
  for (const p of s.players) if (!p.folded && !p.allIn) p.lastAction = null;
  s.log.push({ street: s.street, type: 'street', board: s.board.slice() });
}

function closeStreet(s) {
  for (const p of s.players) {
    p.bet = 0;
    p.acted = false;
  }
  s.currentBet = 0;
  s.minRaise = BB;
  s.raiseCount = 0;
  s.lastAggressor = -1;
  if (s.street === 'river') return showdown(s);
  dealNextStreet(s);
  const canAct = s.players.filter((p) => !p.folded && !p.allIn);
  if (canAct.length <= 1) {
    // Everyone (or all but one) is all-in: reveal and run the board out.
    for (const p of s.players) if (!p.folded) p.revealed = true;
    s.toAct = -1;
    return s;
  }
  s.toAct = nextToAct(s, s.button);
  return s;
}

// Called repeatedly while toAct === -1 to deal the remaining streets of an all-in runout.
export function advanceRunout(state) {
  if (state.handOver || state.toAct !== -1) return state;
  const s = clone(state);
  if (s.street === 'river') return showdown(s);
  dealNextStreet(s);
  s.toAct = -1;
  return s;
}

// Main pot + side pots from each player's total contribution.
export function computePots(players) {
  const levels = [...new Set(players.filter((p) => !p.folded && p.totalBet > 0).map((p) => p.totalBet))].sort((a, b) => a - b);
  const pots = [];
  let prev = 0;
  for (const lvl of levels) {
    let amount = 0;
    const contrib = {};
    for (const p of players) {
      const c = Math.max(0, Math.min(p.totalBet, lvl) - prev);
      if (c > 0) contrib[p.seat] = c;
      amount += c;
    }
    const eligible = players.filter((p) => !p.folded && p.totalBet >= lvl).map((p) => p.seat);
    pots.push({ amount, eligible, contrib });
    prev = lvl;
  }
  return pots;
}

function orderFromButton(s, seats) {
  return seats.slice().sort((a, b) => postflopOrder(s, a) - postflopOrder(s, b));
}

function showdown(s) {
  s.street = 'showdown';
  s.toAct = -1;
  for (const p of s.players) p.bet = 0;
  const scores = new Map();
  for (const p of s.players) {
    if (p.folded) continue;
    const sc = evaluate([...p.hole, ...s.board]);
    scores.set(p.seat, sc);
    p.handName = describeScore(sc);
    p.revealed = true;
  }
  const awards = [];
  let topScore = -1;
  let topSeat = -1;
  for (const pot of computePots(s.players)) {
    if (pot.amount <= 0) continue;
    // A pot only one player could win and only they paid into = uncalled bet, returned.
    if (pot.eligible.length === 1 && pot.contrib[pot.eligible[0]] === pot.amount) {
      s.players[pot.eligible[0]].stack += pot.amount;
      continue;
    }
    let best = -1;
    let winners = [];
    for (const seat of pot.eligible) {
      const sc = scores.get(seat);
      if (sc > best) { best = sc; winners = [seat]; }
      else if (sc === best) winners.push(seat);
    }
    winners = orderFromButton(s, winners);
    const share = Math.floor(pot.amount / winners.length);
    let remainder = pot.amount - share * winners.length;
    for (const seat of winners) {
      let amt = share;
      if (remainder > 0) { amt += remainder; remainder = 0; }
      s.players[seat].stack += amt;
      s.players[seat].won += amt;
    }
    awards.push({ amount: pot.amount, winners, handName: describeScore(best), side: awards.length > 0 });
    if (best > topScore) { topScore = best; topSeat = winners[0]; }
  }
  s.handOver = true;
  s.result = {
    type: 'showdown',
    awards,
    winningCards: topSeat >= 0 ? bestFive([...s.players[topSeat].hole, ...s.board]) : [],
  };
  s.log.push({ street: 'showdown', type: 'result', awards });
  return s;
}

function finishUncontested(s, winner) {
  const pot = potTotal(s);
  const othersMax = Math.max(0, ...s.players.filter((p) => p.seat !== winner.seat).map((p) => p.totalBet));
  const returned = Math.max(0, winner.totalBet - othersMax);
  winner.stack += pot;
  winner.won = pot - returned;
  for (const p of s.players) p.bet = 0;
  s.toAct = -1;
  s.handOver = true;
  s.result = { type: 'uncontested', awards: [{ amount: pot - returned, winners: [winner.seat], handName: null }], winningCards: [] };
  s.log.push({ street: s.street, type: 'result', awards: s.result.awards });
  return s;
}

export const totalChips = (s) => s.players.reduce((a, p) => a + p.stack + (s.handOver ? 0 : p.totalBet), 0);
