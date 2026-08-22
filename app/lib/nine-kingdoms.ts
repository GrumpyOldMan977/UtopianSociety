export type CourtTier = "Gentry" | "Noble" | "Royal";

export type SuitDefinition = {
  id: string;
  name: string;
  tradition: string;
  palette: string;
  color: string;
  ink: string;
  sigil: string;
  virtue: string;
  description: string;
};

export type RankDefinition = {
  value: number;
  title: string;
  alternate?: string;
  tier: CourtTier;
};

export type KingdomCard = {
  id: string;
  suit: SuitDefinition;
  suitIndex: number;
  rank: RankDefinition;
  displayTitle: string;
  artPath?: string;
  artAlt?: string;
};

export const NINE_KINGDOM_SUITS: SuitDefinition[] = [
  { id: "sanctum", name: "Sanctum", tradition: "Christianity", palette: "Crimson red", color: "#9f3e37", ink: "#fff6e8", sigil: "✦", virtue: "Grace with authority", description: "Crimson and candle-gold frame a court of covenant, sacrifice, and grace exercised as responsibility." },
  { id: "mystic", name: "Mystic", tradition: "Buddhism", palette: "Saffron gold", color: "#c68b2e", ink: "#201b13", sigil: "◉", virtue: "Stillness before action", description: "Gold and saffron hold a contemplative court where discipline, compassion, and stillness become forms of strength." },
  { id: "crescent", name: "Crescent", tradition: "Islam", palette: "Devotional green", color: "#327153", ink: "#fff7e8", sigil: "◔", virtue: "Devotion and stewardship", description: "Green and garden light shape a court of devotion, learning, duty, and careful stewardship." },
  { id: "gaian", name: "Gaian", tradition: "Naturalism", palette: "Ivory white", color: "#eee7d5", ink: "#27372e", sigil: "❧", virtue: "Honor in soil", description: "Ivory and living green honor the natural body, the soil, and humanity's place within nature rather than above it." },
  { id: "void", name: "Void", tradition: "Atheism", palette: "Celestial black", color: "#242629", ink: "#f3e7cf", sigil: "●", virtue: "Meaning by our making", description: "Black, charcoal, and starlight define a secular court that makes meaning through evidence, choice, and human responsibility." },
  { id: "scripture", name: "Scripture", tradition: "Judaism / Hebrew tradition", palette: "Deep blue", color: "#285d91", ink: "#fff8e9", sigil: "≡", virtue: "Memory carried forward", description: "Deep blue and illuminated stone carry a court of covenant, study, remembrance, and continuity across generations." },
  { id: "spirit", name: "Spirit", tradition: "Shinto", palette: "Blossom pink", color: "#b7657b", ink: "#fff5ea", sigil: "⌂", virtue: "Reverence in place", description: "Blossom pink and pale violet mark a court alive with place, ancestry, ritual, and sacred presence in the everyday." },
  { id: "current", name: "Current", tradition: "Taoism", palette: "River teal", color: "#2c7b77", ink: "#fff6e8", sigil: "≋", virtue: "Strength without strain", description: "Teal and river-light follow a court of balance, adaptability, and power found by moving with the way of things." },
  { id: "doctrine", name: "Doctrine", tradition: "Scientology", palette: "Silver / chrome", color: "#8a8f92", ink: "#18201d", sigil: "◇", virtue: "The examined path", description: "Silver and chrome form a precise cosmic court of spiritual technology, disciplined self-examination, and ascent through ordered knowledge." },
  { id: "arcane", name: "Arcane", tradition: "Pagan and occult traditions", palette: "Purple / crimson", color: "#664779", ink: "#fff5e8", sigil: "✶", virtue: "Wonder keeps its counsel", description: "Purple and crimson cloak a court of mystery, seasonal power, hidden knowledge, and reverence for the unseen." },
  { id: "logos", name: "Logos", tradition: "Greek philosophy / Stoicism", palette: "Burnished bronze", color: "#9b6b3d", ink: "#fff6e8", sigil: "Ω", virtue: "Order from reason", description: "Bronze and sun-warmed stone establish a court of reason, virtue, endurance, and mastery of the self." },
  { id: "order", name: "Order", tradition: "Confucianism", palette: "Ceremonial jade", color: "#3f765e", ink: "#fff6e8", sigil: "⊞", virtue: "Duty becomes harmony", description: "Jade and ceremonial green shape a relational court where duty, learning, and right conduct sustain social harmony." },
  { id: "cycle", name: "Cycle", tradition: "Hinduism / reincarnation", palette: "Radiant indigo", color: "#4f4f91", ink: "#fff6e8", sigil: "↻", virtue: "Every ending returns", description: "Indigo and radiant jewel tones turn through a court of rebirth, sacred continuity, consequence, and return." },
  { id: "will", name: "Will", tradition: "Existentialism / humanism", palette: "Firelit copper", color: "#a45f3f", ink: "#fff6e8", sigil: "△", virtue: "Choice gives form", description: "Copper and firelit earth define a humanist court in which freedom, responsibility, and chosen purpose give life its form." },
];

export const NINE_KINGDOM_RANKS: RankDefinition[] = [
  { value: 1, title: "Page", alternate: "Maiden", tier: "Gentry" },
  { value: 2, title: "Apprentice", alternate: "Acolyte", tier: "Gentry" },
  { value: 3, title: "Master", alternate: "Mistress", tier: "Gentry" },
  { value: 4, title: "Gentleman", alternate: "Gentlewoman", tier: "Gentry" },
  { value: 5, title: "Squire", tier: "Gentry" },
  { value: 6, title: "Knight", tier: "Noble" },
  { value: 7, title: "Baron", alternate: "Baroness", tier: "Noble" },
  { value: 8, title: "Lord", alternate: "Lady", tier: "Noble" },
  { value: 9, title: "Duke", alternate: "Duchess", tier: "Noble" },
  { value: 10, title: "Jester", tier: "Royal" },
  { value: 11, title: "Princess", tier: "Royal" },
  { value: 12, title: "Prince", tier: "Royal" },
  { value: 13, title: "Queen", tier: "Royal" },
  { value: 14, title: "King", tier: "Royal" },
];

export const KINGDOM_NAMES = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];

export function isRoyal(card: KingdomCard | undefined): boolean {
  return card?.rank.tier === "Royal";
}

function cardArtworkPath(suit: SuitDefinition, rank: RankDefinition, displayTitle: string): string | undefined {
  if (suit.id === "gaian") return undefined;
  const titleSlug = displayTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const power = String(rank.value).padStart(2, "0");
  return `/images/lore/9-kingdoms-solitaire/cards/${suit.id}/${suit.id}-${power}-${titleSlug}.webp`;
}

export function createNineKingdomDeck(): KingdomCard[] {
  return NINE_KINGDOM_SUITS.flatMap((suit, suitIndex) =>
    NINE_KINGDOM_RANKS.map((rank) => {
      const displayTitle = rank.alternate && suitIndex % 2 === 1 ? rank.alternate : rank.title;
      return {
        id: `${suit.id}-${rank.value}`,
        suit,
        suitIndex,
        rank,
        displayTitle,
        artPath: cardArtworkPath(suit, rank, displayTitle),
        artAlt: `${displayTitle} of the ${suit.name} court`,
      };
    }),
  );
}

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffledNineKingdomDeck(seed: number): KingdomCard[] {
  const deck = createNineKingdomDeck();
  const random = seededRandom(seed);
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }
  return deck;
}

export type NineKingdomGameState = {
  seed: number;
  kingdoms: KingdomCard[][];
  hand: KingdomCard[];
  chapel: KingdomCard[];
  graveyard: KingdomCard[];
  revealedIds: string[];
  visitedPositions: string[];
  moves: number;
};

export type RoyalPairing = { source: number; target: number; label: string };
export type FieldMove = { source: number; target: number };
export type HandMove = { handIndex: number; target: number };
export type NineKingdomPhase = "arrangement" | "court" | "invasion" | "hand" | "deadlock" | "victory";

export function gamePositionKey(state: Pick<NineKingdomGameState, "kingdoms" | "hand" | "chapel" | "graveyard">): string {
  const kingdoms = state.kingdoms.map((kingdom) => kingdom.map((card) => card.id).join(",")).join("|");
  const hand = state.hand.map((card) => card.id).join(",");
  const chapel = state.chapel.map((card) => card.id).join(",");
  const graveyard = state.graveyard.map((card) => card.id).join(",");
  return `${kingdoms}::${hand}::${chapel}::${graveyard}`;
}

export function makeNineKingdomDeal(seed: number): NineKingdomGameState {
  const deck = shuffledNineKingdomDeck(seed);
  const hand = deck.slice(0, 7);
  const field = deck.slice(7);
  const kingdoms = Array.from({ length: 9 }, (_, kingdomIndex) =>
    field.filter((_, index) => index % 9 === kingdomIndex),
  );
  const state: NineKingdomGameState = {
    seed,
    kingdoms,
    hand,
    chapel: [],
    graveyard: [],
    revealedIds: [...hand.map((card) => card.id), ...kingdoms.flatMap((kingdom) => kingdom.slice(0, 3).map((card) => card.id))],
    visitedPositions: [],
    moves: 0,
  };
  return { ...state, visitedPositions: [gamePositionKey(state)] };
}

export function snapshotNineKingdomGame(state: NineKingdomGameState): NineKingdomGameState {
  return {
    ...state,
    kingdoms: state.kingdoms.map((kingdom) => [...kingdom]),
    hand: [...state.hand],
    chapel: [...state.chapel],
    graveyard: [...state.graveyard],
    revealedIds: [...state.revealedIds],
    visitedPositions: [...(state.visitedPositions ?? [])],
  };
}

export function revealExposedCards(state: NineKingdomGameState): NineKingdomGameState {
  const revealed = new Set(state.revealedIds);
  state.kingdoms.forEach((kingdom) => {
    kingdom.slice(0, 3).forEach((card) => revealed.add(card.id));
  });
  state.hand.forEach((card) => revealed.add(card.id));
  return { ...state, revealedIds: [...revealed] };
}

function exposedCards(state: NineKingdomGameState): Array<KingdomCard | undefined> {
  return state.kingdoms.map((kingdom) => kingdom[0]);
}

export function getRoyalPairings(state: NineKingdomGameState): RoyalPairing[] {
  const exposed = exposedCards(state);
  const pairs: RoyalPairing[] = [];
  exposed.forEach((card, source) => {
    if (!card) return;
    exposed.forEach((other, target) => {
      if (!other || target <= source || card.suit.id !== other.suit.id) return;
      const values = [card.rank.value, other.rank.value].sort((a, b) => b - a).join("-");
      if (values === "14-13") pairs.push({ source, target, label: "King and Queen" });
      if (values === "13-12") pairs.push({ source, target, label: "Queen and Prince" });
    });
  });
  return pairs;
}

function canMoveOnto(source: KingdomCard, target: KingdomCard | undefined): boolean {
  return target ? source.rank.value > target.rank.value : isRoyal(source);
}

function rawFieldMoves(state: NineKingdomGameState, invasions: boolean): FieldMove[] {
  const exposed = exposedCards(state);
  const moves: FieldMove[] = [];
  exposed.forEach((sourceCard, source) => {
    if (!sourceCard) return;
    exposed.forEach((targetCard, target) => {
      if (source === target || !canMoveOnto(sourceCard, targetCard)) return;
      const royalConflict = isRoyal(sourceCard) && isRoyal(targetCard);
      if (royalConflict === invasions) moves.push({ source, target });
    });
  });
  return moves;
}

function moveFieldCardWithoutCompletingTurn(state: NineKingdomGameState, move: FieldMove): NineKingdomGameState {
  const next = snapshotNineKingdomGame(state);
  const card = next.kingdoms[move.source].shift();
  if (card) next.kingdoms[move.target].unshift(card);
  return next;
}

function moveMakesProgress(state: NineKingdomGameState, move: FieldMove): boolean {
  const next = moveFieldCardWithoutCompletingTurn(state, move);
  if ((state.visitedPositions ?? []).includes(gamePositionKey(next))) return false;
  const known = new Set(state.revealedIds);
  const unveilsFigure = next.kingdoms.some((kingdom) => kingdom.slice(0, 3).some((card) => !known.has(card.id)));
  const createsRoyalArrangement = getRoyalPairings(next).length > 0;
  return unveilsFigure || createsRoyalArrangement;
}

export function getProductiveFieldMoves(state: NineKingdomGameState, invasions: boolean): FieldMove[] {
  return rawFieldMoves(state, invasions).filter((move) => moveMakesProgress(state, move));
}

export function getPlayableHandMoves(state: NineKingdomGameState): HandMove[] {
  const exposed = exposedCards(state);
  return state.hand.flatMap((card, handIndex) =>
    exposed.flatMap((targetCard, target) =>
      canMoveOnto(card, targetCard) ? [{ handIndex, target }] : [],
    ),
  );
}

export function getNineKingdomPhase(state: NineKingdomGameState): NineKingdomPhase {
  if (getRoyalPairings(state).length) return "arrangement";
  if (getProductiveFieldMoves(state, false).length) return "court";
  if (getProductiveFieldMoves(state, true).length) return "invasion";
  if (getPlayableHandMoves(state).length) return "hand";
  if (state.revealedIds.length === NINE_KINGDOM_SUITS.length * NINE_KINGDOM_RANKS.length && state.hand.length === 0) return "victory";
  return "deadlock";
}

function completeTurn(previous: NineKingdomGameState, next: NineKingdomGameState): NineKingdomGameState {
  const revealed = revealExposedCards({ ...next, moves: previous.moves + 1 });
  const position = gamePositionKey(revealed);
  return { ...revealed, visitedPositions: [...(previous.visitedPositions ?? []), position] };
}

export function moveFieldCard(state: NineKingdomGameState, move: FieldMove): NineKingdomGameState {
  return completeTurn(state, moveFieldCardWithoutCompletingTurn(state, move));
}

export function arrangeRoyalPairing(state: NineKingdomGameState, pairing: RoyalPairing): NineKingdomGameState {
  const next = snapshotNineKingdomGame(state);
  const first = next.kingdoms[pairing.source].shift();
  const second = next.kingdoms[pairing.target].shift();
  if (first && second) next.chapel.push(first, second);
  return completeTurn(state, next);
}

export function playHandCard(state: NineKingdomGameState, move: HandMove): NineKingdomGameState {
  const next = snapshotNineKingdomGame(state);
  const card = next.hand.splice(move.handIndex, 1)[0];
  if (card) next.kingdoms[move.target].unshift(card);
  return completeTurn(state, next);
}

export function buryFieldCard(state: NineKingdomGameState, kingdomIndex: number): NineKingdomGameState {
  const next = snapshotNineKingdomGame(state);
  const card = next.kingdoms[kingdomIndex].shift();
  if (card) next.graveyard.push(card);
  return completeTurn(state, next);
}

export function buryHandCard(state: NineKingdomGameState, handIndex: number): NineKingdomGameState {
  const next = snapshotNineKingdomGame(state);
  const card = next.hand.splice(handIndex, 1)[0];
  if (card) next.graveyard.push(card);
  return completeTurn(state, next);
}
