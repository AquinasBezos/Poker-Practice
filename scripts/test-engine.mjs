// Sanity tests for the poker engine. Run with:  npm run test:engine
import assert from 'node:assert/strict';
import { parseCards } from '../src/poker/cards.js';
import { evaluate, describeScore, categoryOf } from '../src/poker/evaluator.js';
import { outsVsHand, improvementOuts, detectDraws, hitChance } from '../src/poker/outs.js';
import { exactEquityVsHand, equityVsRandom } from '../src/poker/equity.js';
import { createTable, startHand, applyAction, advanceRunout, legal, totalChips, computePots, START_STACK } from '../src/poker/game.js';
import { botDecide } from '../src/poker/bots.js';
import { initialRanges, updateRanges, PLAY_RANKING, PUSH_RANKING, rangeWidth, topRange } from '../src/poker/ranges.js';
import { gradeHeroAction } from '../src/poker/grading.js';
import { classLabel } from '../src/poker/handClasses.js';

let passed = 0;
const test = (name, fn) => {
  try {
    fn();
    passed++;
  } catch (e) {
    console.error(`FAIL ${name}\n`, e);
    process.exitCode = 1;
  }
};
const ev = (s) => evaluate(parseCards(s));
const name = (s) => describeScore(ev(s));

test('hand names', () => {
  assert.equal(name('As Ks Qs Js Ts 2d 3c'), 'Royal Flush');
  assert.equal(name('5h 4h 3h 2h Ah Kd Kc'), 'Straight Flush, Five-high');
  assert.equal(name('9c 9d 9h 9s 2d 3c 4h'), 'Four Nines');
  assert.equal(name('Kc Kd Kh 7s 7d 2c 2h'), 'Full House, Kings full of Sevens');
  assert.equal(name('Kc Kd Kh 7s 7d 7c 2h'), 'Full House, Kings full of Sevens');
  assert.equal(name('Ah 9h 6h 3h 2h Kd Qc'), 'Flush, Ace-high');
  assert.equal(name('Ad 2c 3h 4s 5d Kc Kh'), 'Straight, Five-high');
  assert.equal(name('Td Jc Qh Ks Ad 2c 2h'), 'Straight, Ace-high');
  assert.equal(name('7d 7c 7h Ks 2d 3c 9h'), 'Three Sevens');
  assert.equal(name('Ad Ac 8h 8s 4d 4c 2h'), 'Two Pair, Aces & Eights');
  assert.equal(name('Qd Qc 8h 6s 4d 3c 2h'), 'Pair of Queens');
  assert.equal(name('Ad Jc 8h 6s 4d 3c 2h'), 'Ace-high');
});

test('comparisons and kickers', () => {
  assert.ok(ev('Ad Ac Kh 7s 4d') > ev('Ad Ac Qh 7s 4d'));
  assert.ok(ev('Ad Ac 8h 8s Kd') > ev('Ad Ac 8h 8s Qd'));
  assert.ok(ev('Ad Ac 8h 8s 4d 4c Kh') === ev('Ad Ac 8h 8s Kd 2c 3h'), 'third pair is only a kicker');
  assert.ok(ev('6d 5c 4h 3s 2d') > ev('5d 4c 3h 2s Ad'), '6-high straight beats wheel');
  assert.ok(ev('Ah 9h 6h 3h 2h') < ev('2c 2d 2h 3s 3d'), 'boat beats flush');
  assert.equal(ev('As Kd Qh Jc 9s 3d 2c'), ev('As Kd Qh Jc 9d 4s 2h'), 'board plays identical');
});

test('outs vs a known hand', () => {
  // Flush draw vs top pair: 9 flush outs on the flop
  const hero = parseCards('Ah 5h');
  const villain = parseCards('Kd Qc');
  const board = parseCards('Kh 8h 2c');
  const outs = outsVsHand(hero, villain, board);
  assert.equal(outs.length, 9 + 3, 'nine hearts + three aces');
  // Open-ended straight draw
  const d = detectDraws(parseCards('9c 8d'), parseCards('Ts 7h 2c'));
  assert.ok(d.oesd && !d.gutshot && !d.flushDraw);
  const g = detectDraws(parseCards('9c 8d'), parseCards('Js 7h 2c'));
  assert.ok(g.gutshot && !g.oesd);
  assert.ok(Math.abs(hitChance(9, 2, 47) - 0.3497) < 0.001);
  assert.ok(Math.abs(hitChance(9, 1, 46) - 0.1957) < 0.001);
});

test('improvement outs heuristic', () => {
  assert.equal(improvementOuts(parseCards('Ah 5h'), parseCards('Kh 8h 2c')).length, 9 + 3);
  assert.equal(improvementOuts(parseCards('Ac Kd'), parseCards('8h 5s 2c')).length, 6, 'two overcards = 6');
  assert.equal(improvementOuts(parseCards('8c 8d'), parseCards('Kh 7s 2c')).length, 2, 'pocket pair to set = 2');
  assert.equal(improvementOuts(parseCards('8c 8d'), parseCards('Kh 8s 2c')).length, 7, 'set to boat/quads on the flop = 7');
  assert.equal(improvementOuts(parseCards('8c 8d'), parseCards('Kh 8s 2c 5d')).length, 10, 'set to boat/quads on the turn = 10');
});

test('exact equity', () => {
  const r = exactEquityVsHand(parseCards('Ah Kh'), parseCards('Qd Qc'), []);
  assert.ok(r.equity >= 0 && r.equity <= 1);
  const f = exactEquityVsHand(parseCards('Ah 5h'), parseCards('Kd Qc'), parseCards('Kh 8h 2c'));
  assert.ok(f.equity > 0.38 && f.equity < 0.48, `nut flush draw + ace vs top pair ~43%: ${f.equity}`);
  const eAA = equityVsRandom(parseCards('As Ad'), [], 1, 4000).equity;
  assert.ok(eAA > 0.82 && eAA < 0.88, `AA vs random ~85%: ${eAA}`);
});

test('rankings', () => {
  assert.equal(classLabel(PLAY_RANKING.order[0]), 'AA');
  assert.equal(classLabel(PUSH_RANKING.order[0]), 'AA');
  const w = rangeWidth(topRange(0.15, PLAY_RANKING.pct, 0));
  assert.ok(Math.abs(w - 0.15) < 0.02, `top 15% width ${w}`);
  console.log('  top 20 playable:', PLAY_RANKING.order.slice(0, 20).map(classLabel).join(' '));
});

test('side pots', () => {
  const players = [
    { seat: 0, totalBet: 100, folded: false },
    { seat: 1, totalBet: 300, folded: false },
    { seat: 2, totalBet: 300, folded: false },
    { seat: 3, totalBet: 50, folded: true },
  ];
  const pots = computePots(players);
  assert.equal(pots.length, 2);
  assert.equal(pots[0].amount, 100 * 3 + 50);
  assert.deepEqual(pots[0].eligible, [0, 1, 2]);
  assert.equal(pots[1].amount, 400);
  assert.deepEqual(pots[1].eligible, [1, 2]);
});

test('simulated hands conserve chips and terminate', () => {
  let table = startHand(createTable());
  let ranges = initialRanges();
  const counts = { showdown: 0, uncontested: 0, actions: 0, grades: {} };
  for (let h = 0; h < 1500; h++) {
    const expected = table.players.reduce((a, p) => a + p.stack + p.totalBet, 0);
    let guard = 0;
    while (!table.handOver) {
      assert.ok(guard++ < 200, 'hand did not terminate');
      if (table.toAct === -1) {
        table = advanceRunout(table);
        continue;
      }
      const seat = table.toAct;
      const action = botDecide(table, seat);
      const L = legal(table, seat);
      if (action.type === 'raise') assert.ok(action.amount >= L.minRaiseTo && action.amount <= L.maxRaiseTo, 'raise in bounds');
      if (seat === 0 && h % 5 === 0) {
        const g = gradeHeroAction(table, ranges, action);
        assert.ok(['A+', 'A', 'B', 'C', 'D', 'F'].includes(g.grade), 'valid grade');
        assert.ok(g.headline && g.coach.length > 0);
        counts.grades[g.grade] = (counts.grades[g.grade] || 0) + 1;
      }
      ranges = updateRanges(ranges, table, seat, action);
      table = applyAction(table, seat, action);
      counts.actions++;
      assert.equal(totalChips(table), expected, 'chips conserved mid-hand');
      for (const p of table.players) assert.ok(p.stack >= 0, 'no negative stacks');
    }
    const after = table.players.reduce((a, p) => a + p.stack, 0);
    assert.equal(after, expected, `chips conserved at end of hand ${h}`);
    counts[table.result.type]++;
    table = startHand(table);
    ranges = initialRanges();
  }
  console.log('  sim:', JSON.stringify(counts));
  const stacks = table.players.map((p) => `${p.name}:${p.stack}`).join(' ');
  console.log('  stacks after 1500 hands (with rebuys):', stacks, '| start', START_STACK);
});

test('cat sanity', () => {
  assert.equal(categoryOf(ev('2c 3d 5h 9s Jd')), 0);
});

console.log(`${passed} test groups passed${process.exitCode ? ' (with failures)' : ''}`);
