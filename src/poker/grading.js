// Real-time grading of the hero's decisions (A+ .. F) with coach explanations.

import { legal, normaliseAction, positionOf, postflopOrder } from './game.js';
import { classOf, classLabel } from './handClasses.js';
import { PLAY_PCT, rangeWidth } from './ranges.js';
import { equityVsRanges } from './equity.js';
import { improvementOuts, detectDraws, drawLabel, hitChance, ruleOf2And4 } from './outs.js';
import { evaluate, describeScore } from './evaluator.js';

export const GRADES = ['A+', 'A', 'B', 'C', 'D', 'F'];
export const GRADE_POINTS = { 'A+': 4.3, A: 4, B: 3, C: 2, D: 1, F: 0 };
export const isLowGrade = (g) => g === 'C' || g === 'D' || g === 'F';

// Standard-ish 6-max first-in raising ranges (share of all hands).
export const OPEN_RANGE = { UTG: 0.15, HJ: 0.19, CO: 0.27, BTN: 0.43, SB: 0.36, BB: 0.14 };

const pct = (x) => `${Math.round(x * 100)}%`;
const chips = (n) => Math.round(n).toLocaleString('en-US');
const worse = (g, steps = 1) => GRADES[Math.min(GRADES.length - 1, GRADES.indexOf(g) + steps)];
const ladder = (x, steps, last) => {
  for (const [limit, g] of steps) if (x <= limit) return g;
  return last;
};

function result(grade, headline, reason, extra = {}) {
  return { grade, headline, reason, coach: extra.coach || [reason], tip: extra.tip || null, stats: extra.stats || [], bar: extra.bar || null };
}

function actionLabel(type, amount, L) {
  if (type === 'fold') return 'fold';
  if (type === 'check') return 'check';
  if (type === 'call') return L.toCall >= L.stack ? `call all-in ${chips(L.toCall)}` : `call ${chips(L.toCall)}`;
  if (amount >= L.maxRaiseTo) return `all-in ${chips(amount)}`;
  return L.currentBet === 0 ? `bet ${chips(amount)}` : `raise to ${chips(amount)}`;
}

export function gradeHeroAction(game, ranges, rawAction, seat = 0) {
  const hero = game.players[seat];
  const L = legal(game, seat);
  const { type } = normaliseAction(game, seat, rawAction);
  let amount = 0;
  if (type === 'raise') amount = Math.max(L.minRaiseTo, Math.min(Math.round(rawAction.amount || 0), L.maxRaiseTo));
  if (type === 'call') amount = L.toCall;
  const ctx = { game, ranges, hero, L, type, amount, pos: positionOf(game, seat), seat };
  const res = game.street === 'preflop' ? gradePreflop(ctx) : gradePostflop(ctx);
  return {
    ...res,
    action: type,
    actionLabel: actionLabel(type, amount, L),
    street: game.street,
    position: ctx.pos,
    hand: hero.hole.slice(),
    board: game.board.slice(),
    handId: game.handId,
  };
}

// ------------------------------------------------------------------- preflop
function gradePreflop({ game, ranges, hero, L, type, pos, seat }) {
  const cls = classOf(hero.hole[0], hero.hole[1]);
  const hand = classLabel(cls);
  const p = PLAY_PCT[cls];
  const topTxt = `top ${pct(p)}`;
  const stats = [
    { label: 'hand', value: hand },
    { label: 'strength', value: topTxt },
    { label: 'position', value: pos },
  ];

  if (game.raiseCount === 0) {
    // Big blind with the option (everyone limped or folded).
    if (L.canCheck) {
      if (type === 'raise') {
        if (p <= 0.14) return result('A+', 'Value raise from the big blind', `${hand} (${topTxt}) is strong enough to punish the limpers.`, { stats });
        if (p <= 0.25) return result('A', 'Nice isolation raise', `${hand} (${topTxt}) plays well in a bigger pot against limpers.`, { stats });
        if (p <= 0.4) return result('B', 'A bit ambitious', `${hand} (${topTxt}) is playable, but raising out of position with it is optimistic.`, { stats });
        return result('C', 'Raising junk out of position', `${hand} is only ${topTxt}.`, {
          stats,
          coach: [
            `${hand} ranks in the ${topTxt} of starting hands. Raising it from the big blind builds a bigger pot that you will play out of position with a weak hand.`,
            'You already have a free look at the flop — take it.',
          ],
          tip: 'With a free option and a weak hand, just check.',
        });
      }
      if (p <= 0.06) return result('B', 'Missed value', `${hand} is a premium (${topTxt}). Raise the limpers to build a pot while you're ahead.`, { stats });
      if (p <= 0.14) return result('A', 'Fine check', `Checking ${hand} is OK, though an isolation raise is also strong.`, { stats });
      return result('A+', 'Free flop', `With ${hand} (${topTxt}) take the free flop.`, { stats });
    }

    const limpers = game.players.filter((o) => o.seat !== seat && !o.folded && o.lastAction?.type === 'call').length;
    const W = OPEN_RANGE[pos] * (limpers ? 0.8 : 1);
    const chartTxt = `a standard ${pos} ${limpers ? 'raising range over limpers' : 'opening range'} (about the top ${pct(W)})`;
    stats.push({ label: `${pos} range`, value: `top ${pct(W)}` });
    const early = pos === 'UTG' || pos === 'HJ';

    if (type === 'raise') {
      if (p <= W * 0.6) return result('A+', 'Textbook raise', `${hand} is ${topTxt} — a clear raise from ${pos}.`, { stats });
      if (p <= W) return result('A', 'Good open', `${hand} (${topTxt}) is inside ${chartTxt}.`, { stats });
      if (p <= W * 1.3) return result('B', 'Slightly loose open', `${hand} (${topTxt}) is just outside ${chartTxt}. Fine now and then.`, { stats });
      const g = ladder(p, [[W * 1.8, 'C'], [W * 2.6, 'D']], 'F');
      return result(g, 'Opening too loose', `${hand} is outside ${chartTxt}.`, {
        stats,
        coach: [
          `${hand} only ranks in the ${topTxt} of starting hands, which is outside ${chartTxt}.`,
          early
            ? 'From early position four or five players still act behind you. Weak hands get dominated when called and often have to play out of position.'
            : 'Raising weak hands too often bleeds chips when you get called or 3-bet.',
        ],
        tip: 'Tighten up in early position; open wider on the button and cutoff.',
      });
    }

    if (type === 'call') {
      if (limpers > 0) {
        if (p <= W) return result('C', 'Raise, don’t over-limp', `${hand} is strong enough to isolate the limper(s).`, {
          stats,
          coach: [`${hand} (${topTxt}) is good enough to raise over limpers. Calling lets everyone see a cheap flop and gives up the initiative.`],
          tip: 'Punish limpers with a raise to about 4bb plus 1bb per limper.',
        });
        if (p <= 0.45) return result('B', 'Speculative over-limp', `Over-limping ${hand} for a cheap multiway flop is acceptable.`, { stats });
        return result('D', 'Limping trash', `${hand} (${topTxt}) is too weak even for a cheap multiway pot.`, {
          stats,
          coach: [`${hand} only ranks in the ${topTxt}. Even at a cheap price, weak offsuit hands rarely make strong enough hands to win multiway pots.`],
          tip: 'Fold weak offsuit hands preflop.',
        });
      }
      if (pos === 'SB') {
        if (p <= W * 0.7) return result('C', 'Limping a raising hand', `${hand} (${topTxt}) should be raised from the small blind.`, {
          stats,
          coach: [`${hand} is ${topTxt} — too good to just complete. Raise and make the big blind pay to see a flop.`],
          tip: 'Raise strong hands from the SB; complete only speculative ones.',
        });
        if (p <= 0.6) return result('B', 'Small-blind complete', `Completing ${hand} at a discount is reasonable.`, { stats });
        return result('C', 'Completing junk', `${hand} (${topTxt}) is too weak, even at half price.`, {
          stats,
          coach: [`${hand} only ranks in the ${topTxt}. You'll be out of position for every street with a weak hand.`],
          tip: 'Fold the bottom 40% of hands in the small blind.',
        });
      }
      const g = p <= W * 1.6 ? 'C' : p <= 0.7 ? 'D' : 'F';
      return result(g, p <= W ? 'Limping a raising hand' : 'Passive open-limp', `Open-limping ${hand} gives up the initiative.`, {
        stats,
        coach: [
          p <= W
            ? `${hand} (${topTxt}) is good enough to open-raise. Limping lets the blinds see a cheap flop and gives up the initiative.`
            : `${hand} (${topTxt}) is outside ${chartTxt}. Open-limping it invites a raise behind and leaves you with a weak hand in a bloated pot.`,
        ],
        tip: 'When the action is folded to you: raise or fold, don’t limp.',
      });
    }

    // fold
    if (p <= W * 0.4) return result('F', 'Folded a premium!', `${hand} is ${topTxt}.`, {
      stats,
      coach: [`${hand} is ${topTxt} — one of the best hands you can be dealt. From ${pos} it is a mandatory raise.`],
      tip: 'Never fold premium hands preflop when the pot is unopened.',
    });
    if (p <= W * 0.75) return result('D', 'Way too tight', `${hand} (${topTxt}) is a solid open from ${pos}.`, {
      stats,
      coach: [`${hand} ranks in the ${topTxt} of starting hands, comfortably inside ${chartTxt}. Folding it gives up a clearly profitable raise.`],
      tip: `Learn the ${pos} opening range — it is wider than you think.`,
    });
    if (p <= W) return result('C', 'Missed an open', `${hand} (${topTxt}) sits inside ${chartTxt}.`, {
      stats,
      coach: [`${hand} (${topTxt}) sits inside ${chartTxt}. Folding it gives up profit, especially if the blinds are tight.`],
      tip: 'Raise every hand inside your positional opening range.',
    });
    if (p <= W * 1.25) return result('B', 'Close fold', `${hand} is borderline from ${pos}; folding is fine.`, { stats });
    if (p <= W * 1.6) return result('A', 'Good fold', `${hand} (${topTxt}) is outside ${chartTxt}.`, { stats });
    return result('A+', 'Easy fold', `${hand} (${topTxt}) is well outside ${chartTxt}.`, { stats });
  }

  // ---- facing a raise
  const aggressor = game.players[game.lastAggressor];
  const invested = game.players.filter((o) => o.seat !== seat && !o.folded && (o.lastAction?.type === 'call' || o.lastAction?.type === 'raise'));
  const opps = invested.length ? invested : [aggressor];
  const eq = equityVsRanges(hero.hole, [], opps.map((o) => ranges[o.seat]), 1500);
  const required = L.toCall / (L.pot + L.toCall);
  const inPos = postflopOrder(game, seat) > postflopOrder(game, aggressor.seat);
  const R = pos === 'BB' ? 0.85 : inPos ? 0.92 : 0.8;
  const realized = eq * R;
  const margin = realized - required;
  const reraise = game.raiseCount >= 2 ? '4-bet' : '3-bet';
  const villainTxt = `${aggressor.name}'s ${game.raiseCount >= 2 ? 're-raising' : 'raising'} range (about the top ${pct(rangeWidth(ranges[aggressor.seat]))})`;
  const fStats = [
    { label: 'hand', value: hand },
    { label: 'equity', value: pct(eq) },
    { label: 'realised', value: pct(realized) },
    { label: 'needed', value: pct(required) },
  ];
  const bar = { value: realized, marker: required, label: 'realised equity vs price' };
  const oopNote = inPos ? '' : ' Out of position you realise less of your equity, because you act first on every street.';

  if (type === 'raise') {
    if (eq >= 0.58) return result('A+', `Value ${reraise}`, `${hand} has ${pct(eq)} equity vs ${villainTxt}.`, { stats: fStats, bar });
    if (eq >= 0.5) return result('A', `Strong ${reraise}`, `${hand} is ahead of ${villainTxt} (${pct(eq)}).`, { stats: fStats, bar });
    if (margin >= 0 || p <= 0.1) return result('B', `Reasonable ${reraise}`, `${hand} works as a semi-bluff ${reraise}: ${pct(eq)} equity when called plus fold equity.`, { stats: fStats, bar });
    const g = margin >= -0.08 ? 'C' : eq < 0.3 && game.raiseCount >= 2 ? 'F' : 'D';
    return result(g, `Loose ${reraise}`, `${hand} has only ${pct(eq)} equity vs ${villainTxt}.`, {
      stats: fStats,
      bar,
      coach: [
        `You re-raised ${hand}, which has only ${pct(eq)} equity against ${villainTxt}.`,
        'When a tight range continues against your re-raise you are usually dominated, and you have bloated the pot with a weak hand.',
      ],
      tip: `${reraise} for value with hands that beat their calling range; bluff only with blockers like suited aces.`,
    });
  }

  if (type === 'call') {
    if (margin >= 0) {
      if (eq >= 0.6 && game.raiseCount === 1 && L.canRaise) {
        return result('B', `Consider a ${reraise}`, `${hand} has ${pct(eq)} vs ${villainTxt} — re-raise for value.`, { stats: fStats, bar });
      }
      return result(margin >= 0.08 ? 'A+' : 'A', 'Profitable call', `You need ${pct(required)} and realise about ${pct(realized)} with ${hand}.`, { stats: fStats, bar });
    }
    if (margin >= -0.04) return result('B', 'Marginal call', `Close spot: you need ${pct(required)} and realise about ${pct(realized)}.`, { stats: fStats, bar });
    const g = margin >= -0.1 ? 'C' : margin >= -0.18 ? 'D' : 'F';
    return result(g, 'Calling too wide', `${hand} doesn't have the equity to call.`, {
      stats: fStats,
      bar,
      coach: [
        `You called ${chips(L.toCall)} to win ${chips(L.pot)}, so you needed ${pct(required)} equity.`,
        `${hand} has ${pct(eq)} raw equity against ${villainTxt}, and you only realise about ${pct(realized)} of it.${oopNote}`,
      ],
      tip: 'Versus a raise, continue with hands that are ahead of the raiser’s range — not just any two cards.',
    });
  }

  // fold
  if (margin <= -0.05) return result('A+', 'Disciplined fold', `${hand} only realises ${pct(realized)}; you needed ${pct(required)}.`, { stats: fStats, bar });
  if (margin <= 0) return result('A', 'Good fold', `Slightly short of the ${pct(required)} you needed.`, { stats: fStats, bar });
  if (margin <= 0.04) return result('B', 'Close fold', `Marginal: ${pct(realized)} realised vs ${pct(required)} needed.`, { stats: fStats, bar });
  let g = margin <= 0.1 ? 'C' : margin <= 0.18 ? 'D' : 'F';
  if (eq >= 0.6) g = 'F';
  return result(g, 'Folding too much', `${hand} had enough equity to continue.`, {
    stats: fStats,
    bar,
    coach: [
      `You only needed ${pct(required)} equity to call, and ${hand} realises about ${pct(realized)} against ${villainTxt}.`,
      eq >= 0.55 ? `You were actually ahead of their range (${pct(eq)}). This was a spot to re-raise, not fold.` : 'Folding here throws away a profitable spot.',
    ],
    tip: 'Price matters: the cheaper the call, the wider you can defend.',
  });
}

// ------------------------------------------------------------------ postflop
function gradePostflop({ game, ranges, hero, L, type, amount, seat }) {
  const opps = game.players.filter((o) => o.seat !== seat && !o.folded);
  const eq = equityVsRanges(hero.hole, game.board, opps.map((o) => ranges[o.seat]), 1500);
  const made = describeScore(evaluate([...hero.hole, ...game.board]));
  const draws = detectDraws(hero.hole, game.board);
  const dLabel = drawLabel(draws);
  const outs = improvementOuts(hero.hole, game.board).length;
  const toCome = game.street === 'flop' ? 2 : game.street === 'turn' ? 1 : 0;
  const unseen = 52 - 2 - game.board.length;
  const hit = hitChance(outs, toCome, unseen);
  const facing = L.toCall > 0;
  const required = facing ? L.toCall / (L.pot + L.toCall) : 0;
  const strongDraw = toCome > 0 && (draws.flushDraw || draws.oesd);
  const implied = strongDraw ? 0.04 : 0;
  const station = opps.find((o) => o.archetype === 'station');
  const handTxt = dLabel ? `${made} with a ${dLabel}` : made;
  const vsTxt = opps.length === 1 ? `${opps[0].name}'s likely range` : `the likely ranges of your ${opps.length} opponents`;
  const drawSentence =
    outs > 0 && toCome > 0
      ? `You have ${outs} out${outs === 1 ? '' : 's'}${dLabel ? ` (${dLabel})` : ''}: the Rule of ${toCome === 2 ? 4 : 2} says about ${ruleOf2And4(outs, toCome)}% to improve (exact: ${pct(hit)}).`
      : null;
  const stats = [
    { label: 'your hand', value: made },
    { label: 'equity vs range', value: pct(eq) },
  ];
  if (facing) stats.push({ label: 'needed', value: pct(required) });
  if (outs && toCome) stats.push({ label: 'outs', value: String(outs) });

  if (facing) {
    const potBefore = Math.max(1, L.pot - (L.currentBet - L.playerBet));
    const sizeTxt = `a ${pct(L.toCall / potBefore)}-pot bet`;
    const bar = { value: eq, marker: required, label: 'equity vs pot odds' };
    const margin = eq + implied - required;
    const odds = ((L.pot) / L.toCall).toFixed(1);

    if (type === 'fold') {
      if (margin < -0.05) return result('A+', 'Disciplined fold', `Facing ${sizeTxt} you needed ${pct(required)}; ${handTxt} had about ${pct(eq)}.`, { stats, bar });
      if (margin < 0) return result('A', 'Correct fold', `You needed ${pct(required)} and had about ${pct(eq)}.`, { stats, bar });
      if (margin < 0.05) return result('B', 'Close fold', `Borderline: about ${pct(eq)} equity vs ${pct(required)} needed.`, { stats, bar });
      const g = margin < 0.15 ? 'C' : margin < 0.25 ? 'D' : 'F';
      return result(g, 'You folded the best price', `${handTxt} had enough equity to call.`, {
        stats,
        bar,
        coach: [
          `You folded ${handTxt} with about ${pct(eq)} equity against ${vsTxt}.`,
          `You were getting ${odds}-to-1 on a call, so you only needed ${pct(required)} equity to break even.`,
          ...(drawSentence ? [drawSentence] : []),
        ],
        tip: 'Required equity = call ÷ (pot + call). If you have more than that, calling makes money long-term.',
      });
    }

    if (type === 'call') {
      if (margin >= 0) {
        if (eq >= 0.72 && L.canRaise) return result('B', 'Too passive', `With about ${pct(eq)} equity you're well ahead — raise for value.`, { stats, bar });
        return result(margin >= 0.08 ? 'A+' : 'A', 'Profitable call', `Needed ${pct(required)}, had about ${pct(eq)}${implied ? ' plus implied odds' : ''}.`, { stats, bar });
      }
      if (margin >= -0.05) return result('B', 'Marginal call', `Close: about ${pct(eq)} equity vs ${pct(required)} needed.`, { stats, bar });
      const g = margin >= -0.12 ? 'C' : margin >= -0.2 ? 'D' : 'F';
      return result(g, 'Calling without the odds', `You needed ${pct(required)} but had about ${pct(eq)}.`, {
        stats,
        bar,
        coach: [
          `You called ${chips(L.toCall)} into a pot of ${chips(potBefore)} (${sizeTxt}). You needed ${pct(required)} equity, but ${handTxt} only had about ${pct(eq)} against ${vsTxt}.`,
          ...(drawSentence ? [drawSentence] : []),
        ],
        tip: 'Compare your equity to the price. If equity < call ÷ (pot + call), folding saves money.',
      });
    }

    // raise
    if (eq >= 0.65) return result('A+', 'Value raise', `${handTxt} has about ${pct(eq)} vs ${vsTxt}.`, { stats, bar });
    if (eq >= 0.55) return result('A', 'Strong raise', `You're ahead of ${vsTxt} (${pct(eq)}).`, { stats, bar });
    if (strongDraw && !station) return result('B', 'Semi-bluff raise', `Raising your ${dLabel} adds fold equity on top of ${outs} outs.`, { stats, bar });
    if (eq >= required + 0.08 && !station) return result('B', 'Thin raise', `About ${pct(eq)} equity — a thin but defensible raise.`, { stats, bar });
    let g = eq >= required ? 'C' : eq >= 0.2 ? 'D' : 'F';
    if (station) g = worse(g);
    return result(g, 'Raising too light', `${handTxt} has only ${pct(eq)} equity.`, {
      stats,
      bar,
      coach: [
        `You raised with ${handTxt}, which has only about ${pct(eq)} equity against ${vsTxt}.`,
        station
          ? `${station.name} is a calling station — they almost never fold, so bluff-raises just burn chips.`
          : opps.length > 1
            ? 'Bluff-raises need fold equity, and multiway pots rarely fold.'
            : 'When a player bets and you raise light, you usually get called by better or re-raised.',
        ...(drawSentence ? [drawSentence] : []),
      ],
      tip: 'Raise for value with strong hands or good draws; fold the rest.',
    });
  }

  // ---- unbet pot: check or bet
  if (type === 'check') {
    if (eq >= 0.75) {
      const g = station && eq >= 0.85 ? 'C' : 'B';
      return result(g, 'Missed value', `With about ${pct(eq)} equity, bet so worse hands can pay you.`, {
        stats,
        coach: [
          `You checked ${handTxt}, which has about ${pct(eq)} equity against ${vsTxt}.`,
          station ? `${station.name} calls with almost anything — that's exactly who you value-bet against.` : 'Strong hands want to build the pot.',
        ],
        tip: 'Bet your strong hands; let weaker hands call you.',
      });
    }
    if (eq < 0.45) return result('A+', 'Pot control', `Checking ${made} keeps the pot small with a modest hand.`, { stats });
    return result('A', 'Fine check', `A medium-strength hand (${pct(eq)}) is happy to check.`, { stats });
  }

  // bet
  const betFrac = amount / Math.max(1, L.pot);
  if (eq >= 0.6) return result('A+', 'Value bet', `${handTxt} has about ${pct(eq)} vs ${vsTxt}.`, { stats });
  if (eq >= 0.5) return result('A', 'Good bet', `You're ahead of ${vsTxt} (${pct(eq)}).`, { stats });
  if (strongDraw) {
    return result(opps.length === 1 && !station ? 'A' : 'B', 'Semi-bluff', `Betting your ${dLabel} wins now or improves later (${outs} outs).`, { stats });
  }
  if (eq >= 0.38) return result('B', 'Thin bet', `About ${pct(eq)} equity — thin, but OK.`, { stats });
  let g = opps.length === 1 ? (betFrac <= 0.8 ? 'B' : 'C') : opps.length === 2 ? 'D' : 'F';
  if (station) g = worse(g, 2);
  if (betFrac > 1.2) g = worse(g);
  if (g === 'B') return result('B', 'Small heads-up bluff', `A cheap stab heads-up can take the pot down, but you have only ${pct(eq)} if called.`, { stats });
  return result(g, 'Bluffing into the wrong spot', `${handTxt} has only ${pct(eq)} equity.`, {
    stats,
    coach: [
      `You bet ${chips(amount)} (${pct(betFrac)} pot) with ${handTxt}, which has about ${pct(eq)} equity against ${vsTxt}.`,
      station
        ? `${station.name} is a calling station — bluffing a player who never folds is lighting chips on fire.`
        : opps.length > 1
          ? `With ${opps.length} opponents, someone usually has a piece of the board. Bluffs work best heads-up.`
          : 'Big bluffs need a believable story and fold equity.',
      ...(drawSentence ? [drawSentence] : []),
    ],
    tip: 'Bluff heads-up against folders; value-bet against callers.',
  });
}
