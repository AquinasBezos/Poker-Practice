import PlayingCard, { CardRow } from './PlayingCard.jsx';
import Avatar from './Avatar.jsx';
import useMedia from './useMedia.js';
import { PROFILES } from '../poker/profiles.js';
import { positionOf, potTotal } from '../poker/game.js';

const chips = (n) => Math.round(n).toLocaleString('en-US');

// Seat anchor points (% of the table box), clockwise from the hero at the bottom.
const SEAT_POS = [
  { x: 50, y: 83 },
  { x: 8.5, y: 66 },
  { x: 12, y: 27 },
  { x: 50, y: 15 },
  { x: 88, y: 27 },
  { x: 91.5, y: 66 },
];
const CENTER = { x: 50, y: 47 };
const toward = (p, t) => ({ x: p.x + (CENTER.x - p.x) * t, y: p.y + (CENTER.y - p.y) * t });

const ACTION_STYLE = {
  fold: 'from-slate-300 to-slate-500 border-slate-100',
  check: 'from-cyan-300 to-sky-600 border-cyan-100',
  call: 'from-cyan-300 to-sky-600 border-cyan-100',
  bet: 'from-lime-300 to-green-600 border-lime-100',
  raise: 'from-amber-300 to-orange-600 border-orange-100',
  'all-in': 'from-fuchsia-400 to-pink-600 border-fuchsia-100',
  sb: 'from-violet-300 to-violet-600 border-violet-100',
  bb: 'from-violet-300 to-violet-600 border-violet-100',
};

function ChipStack({ amount, small }) {
  return (
    <div className="flex items-center gap-1 rounded-full border-2 border-white bg-white/90 py-0.5 pl-0.5 pr-2 shadow-md">
      <span className={`relative grid place-items-center rounded-full border-2 border-dashed border-white bg-gradient-to-b from-orange-300 to-orange-600 ${small ? 'h-4 w-4' : 'h-5 w-5'}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
      </span>
      <span className={`font-extrabold text-slate-700 ${small ? 'text-[11px]' : 'text-xs'}`}>{chips(amount)}</span>
    </div>
  );
}

function Seat({ game, player, wide, winners, winningSet }) {
  const pos = SEAT_POS[player.seat];
  const prof = PROFILES[player.archetype];
  const isHero = player.isHero;
  const toAct = !game.handOver && game.toAct === player.seat;
  const won = winners.has(player.seat);
  const showFace = isHero || player.revealed;
  const label = player.lastAction?.label;
  const position = positionOf(game, player.seat);
  const avatarSize = wide ? (isHero ? 64 : 54) : isHero ? 48 : 40;
  const cardSize = isHero ? (wide ? 'md' : 'sm') : wide ? 'sm' : 'xs';

  return (
    <div className="absolute z-10 flex flex-col items-center" style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}>
      {/* hole cards */}
      <div className={`mb-[-10px] flex ${isHero ? 'gap-1' : '-space-x-3'} ${player.folded ? 'opacity-30' : ''}`}>
        {player.hole.length > 0 &&
          player.hole.map((c, i) =>
            player.folded && !isHero ? null : (
              <PlayingCard
                key={`${game.handId}-${i}`}
                card={c}
                hidden={!showFace}
                size={cardSize}
                highlight={game.handOver && winningSet.has(c) && won}
                className={`animate-dealIn ${!isHero && i === 1 ? 'rotate-6' : !isHero ? '-rotate-6' : ''}`}
                style={{ animationDelay: `${(player.seat * 2 + i) * 40}ms` }}
              />
            ),
          )}
      </div>

      {/* avatar */}
      <div className={`relative rounded-full ${toAct ? 'animate-glowPulse' : ''} ${won ? 'ring-4 ring-lime-400 ring-offset-2' : ''} ${player.folded ? 'opacity-50 grayscale' : ''}`}>
        <Avatar color={prof.color} variant={player.archetype} size={avatarSize} />
        {position === 'BTN' && (
          <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full border-2 border-slate-200 bg-gradient-to-b from-white to-slate-200 text-[10px] font-black text-slate-700 shadow">
            D
          </span>
        )}
      </div>

      {/* name plate */}
      <div className={`-mt-2 flex min-w-[84px] flex-col items-center rounded-2xl border-2 px-2.5 py-0.5 shadow-md ${isHero ? 'border-fuchsia-200 bg-gradient-to-b from-white to-fuchsia-50' : 'border-white bg-gradient-to-b from-white to-slate-100'}`}>
        <span className="flex items-center gap-1 text-[11px] font-extrabold lowercase leading-tight text-slate-700">
          {player.name}
          <span className="rounded-full bg-slate-800/80 px-1 text-[9px] font-bold uppercase text-white">{position}</span>
        </span>
        <span className={`text-xs font-extrabold leading-tight ${player.stack === 0 && !game.handOver ? 'text-fuchsia-600' : 'text-slate-500'}`}>
          {player.allIn && !game.handOver ? 'all-in' : chips(player.stack)}
        </span>
      </div>
      {wide && !isHero && <span className="mt-0.5 text-[10px] font-semibold lowercase text-white/90 text-shadow">{prof.label}</span>}

      {/* action bubble / result */}
      {game.handOver && won ? (
        <span className="absolute -top-3 left-1/2 z-20 -translate-x-1/2 animate-pop whitespace-nowrap rounded-full border-2 border-lime-100 bg-gradient-to-b from-lime-300 to-green-600 px-2.5 py-0.5 text-xs font-black text-white shadow-lg text-shadow">
          +{chips(player.won)}
        </span>
      ) : (
        label &&
        !(game.handOver && player.handName) && (
          <span
            className={`absolute -top-3 left-1/2 z-20 -translate-x-1/2 animate-pop whitespace-nowrap rounded-full border-2 bg-gradient-to-b px-2 py-0.5 text-[11px] font-bold lowercase text-white shadow-md text-shadow ${ACTION_STYLE[label] || ACTION_STYLE.call}`}
          >
            {label}
          </span>
        )
      )}
      {game.handOver && player.handName && !player.folded && (
        <span className={`mt-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold ${won ? 'bg-lime-500 text-white' : 'bg-white/80 text-slate-600'}`}>{player.handName}</span>
      )}
    </div>
  );
}

export default function PokerTable({ game }) {
  const wide = useMedia('(min-width: 640px)');
  if (!game) return null;
  const pot = potTotal(game);
  const streetBets = game.players.reduce((a, p) => a + p.bet, 0);
  const winners = new Set();
  if (game.handOver && game.result) for (const a of game.result.awards) for (const s of a.winners) winners.add(s);
  const winningSet = new Set(game.result?.winningCards || []);

  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-4xl sm:aspect-[16/11]">
      {/* table */}
      <div className="felt-rim absolute inset-x-[9%] inset-y-[16%] rounded-[999px] p-2.5 shadow-[0_25px_60px_-20px_rgba(8,145,178,0.65)] sm:inset-x-[11%] sm:inset-y-[17%] sm:p-3.5">
        <div className="felt relative h-full w-full overflow-clip rounded-[999px] border-4 border-cyan-200/70 shadow-[inset_0_6px_30px_rgba(8,51,68,0.45)]">
          <div className="absolute -left-10 top-1/3 h-40 w-40 rounded-full bg-lime-300/25" />
          <div className="absolute -right-6 bottom-0 h-28 w-28 rounded-full bg-fuchsia-300/25" />
          <div className="absolute inset-x-[18%] top-[6%] h-[32%] rounded-[999px] bg-gradient-to-b from-white/35 to-white/0" />
          <span className="absolute bottom-[12%] left-1/2 -translate-x-1/2 select-none text-sm font-extrabold lowercase tracking-[0.3em] text-white/35 sm:text-lg">
            poker dojo
          </span>
        </div>
      </div>

      {/* board + pot */}
      <div className="absolute left-1/2 top-[47%] z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-full border-2 border-white/80 bg-slate-900/40 px-3 py-0.5 text-xs font-extrabold lowercase text-white shadow-inner backdrop-blur sm:text-sm">
            pot {chips(pot)}
          </span>
          {streetBets > 0 && streetBets !== pot && (
            <span className="hidden rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-bold text-white sm:inline">
              in middle {chips(pot - streetBets)}
            </span>
          )}
        </div>
        <CardRow
          cards={game.board}
          slots={5}
          size={wide ? 'md' : 'sm'}
          gap={wide ? 'gap-1.5' : 'gap-1'}
          highlightSet={game.handOver ? winningSet : undefined}
          animate
        />
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/80 text-shadow">{game.street === 'showdown' ? 'showdown' : game.street}</span>
      </div>

      {/* bets in front of players */}
      {game.players.map((p) =>
        p.bet > 0 ? (
          <div
            key={`bet${p.seat}`}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2 animate-rise"
            style={{ left: `${toward(SEAT_POS[p.seat], 0.42).x}%`, top: `${toward(SEAT_POS[p.seat], p.seat === 0 ? 0.36 : 0.42).y}%` }}
          >
            <ChipStack amount={p.bet} small={!wide} />
          </div>
        ) : null,
      )}

      {game.players.map((p) => (
        <Seat key={p.seat} game={game} player={p} wide={wide} winners={winners} winningSet={winningSet} />
      ))}
    </div>
  );
}
