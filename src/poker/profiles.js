// Player archetypes. The numbers drive both the bot decision logic and
// the range model that estimates what each player is likely holding.
//   vpip      share of hands played voluntarily
//   pfr       share of hands open-raised preflop
//   threeBet  share of hands re-raised vs an open
//   aggression 0..1 tendency to bet/raise for value
//   bluff     0..1 tendency to bet/raise with air
//   callDown  0..1 stickiness when facing bets

export const PROFILES = {
  hero: {
    name: 'you',
    label: 'Hero',
    color: 'magenta',
    blurb: 'That’s you. Opponents read you as a solid regular.',
    vpip: 0.25, pfr: 0.2, threeBet: 0.07, aggression: 0.55, bluff: 0.15, callDown: 0.4,
    limps: false, openSize: 2.5, betSizes: [0.5, 0.75],
  },
  nit: {
    name: 'Ice',
    label: 'Nit',
    color: 'cyan',
    blurb: 'Plays only premium hands and folds to pressure. When Ice bets, believe it.',
    vpip: 0.13, pfr: 0.1, threeBet: 0.03, aggression: 0.35, bluff: 0.03, callDown: 0.2,
    limps: false, openSize: 3, betSizes: [0.5, 0.66],
  },
  maniac: {
    name: 'Blaze',
    label: 'Maniac',
    color: 'orange',
    blurb: 'Raises constantly with big sizes and lots of bluffs. Call down lighter.',
    vpip: 0.55, pfr: 0.42, threeBet: 0.16, aggression: 0.9, bluff: 0.4, callDown: 0.55,
    limps: false, openSize: 4, betSizes: [0.75, 1, 1.3],
  },
  station: {
    name: 'Sticky',
    label: 'Calling Station',
    color: 'lime',
    blurb: 'Calls far too often and rarely raises. Value-bet thin, never bluff.',
    vpip: 0.5, pfr: 0.06, threeBet: 0.02, aggression: 0.15, bluff: 0.03, callDown: 0.92,
    limps: true, openSize: 2.5, betSizes: [0.33, 0.5],
  },
  shark: {
    name: 'Fin',
    label: 'Shark (TAG)',
    color: 'sky',
    blurb: 'Tight-aggressive regular. Balanced, positional and tough to read.',
    vpip: 0.23, pfr: 0.19, threeBet: 0.07, aggression: 0.62, bluff: 0.14, callDown: 0.38,
    limps: false, openSize: 2.5, betSizes: [0.33, 0.5, 0.75],
  },
  rookie: {
    name: 'Pixel',
    label: 'Rookie',
    color: 'violet',
    blurb: 'Loose and unpredictable — limps a lot and chases draws.',
    vpip: 0.38, pfr: 0.13, threeBet: 0.04, aggression: 0.4, bluff: 0.12, callDown: 0.62,
    limps: true, openSize: 3, betSizes: [0.4, 0.6, 1],
  },
};

// Seat 0 is always the hero; seats increase clockwise.
export const SEAT_ARCHETYPES = ['hero', 'nit', 'maniac', 'station', 'shark', 'rookie'];

// How much wider than "normal" each position opens (relative to the CO).
export const POS_FACTOR = { UTG: 0.65, HJ: 0.8, CO: 1.0, BTN: 1.45, SB: 1.15, BB: 1.0 };
