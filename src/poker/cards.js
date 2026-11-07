// Card representation: integer 0..51  ->  rank * 4 + suit
// rank 0..12 = 2..A, suit 0..3 = spades, hearts, diamonds, clubs

export const RANKS = '23456789TJQKA';
export const SUITS = 'shdc';
export const SUIT_SYMBOLS = ['♠', '♥', '♦', '♣'];
export const SUIT_NAMES = ['spades', 'hearts', 'diamonds', 'clubs'];
export const RANK_NAMES = ['Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Jack', 'Queen', 'King', 'Ace'];
export const RANK_PLURALS = ['Twos', 'Threes', 'Fours', 'Fives', 'Sixes', 'Sevens', 'Eights', 'Nines', 'Tens', 'Jacks', 'Queens', 'Kings', 'Aces'];

export const rankOf = (c) => c >> 2;
export const suitOf = (c) => c & 3;
export const makeCard = (rank, suit) => rank * 4 + suit;

export const cardToString = (c) => RANKS[rankOf(c)] + SUITS[suitOf(c)];
export const cardsToString = (cards) => cards.map(cardToString).join(' ');

export function parseCard(str) {
  const r = RANKS.indexOf(str[0].toUpperCase());
  const s = SUITS.indexOf(str[1].toLowerCase());
  if (r < 0 || s < 0) throw new Error(`Bad card: ${str}`);
  return makeCard(r, s);
}

export const parseCards = (str) => str.trim().split(/\s+/).filter(Boolean).map(parseCard);

export function newDeck() {
  return Array.from({ length: 52 }, (_, i) => i);
}

export function shuffle(arr, rng = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

export function shuffledDeck(exclude = []) {
  const ex = new Set(exclude);
  return shuffle(newDeck().filter((c) => !ex.has(c)));
}

export const randInt = (n) => Math.floor(Math.random() * n);
export const pick = (arr) => arr[randInt(arr.length)];
