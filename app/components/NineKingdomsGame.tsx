"use client";

import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import {
  KINGDOM_NAMES,
  CourtTier,
  NINE_KINGDOM_RANKS,
  NINE_KINGDOM_SUITS,
  NineKingdomGameState,
  NineKingdomPhase,
  KingdomCard,
  arrangeRoyalPairing,
  buryFieldCard,
  buryHandCard,
  createNineKingdomDeck,
  getNineKingdomPhase,
  getPlayableHandMoves,
  getProductiveFieldMoves,
  getRoyalPairings,
  makeNineKingdomDeal,
  moveFieldCard,
  playHandCard,
  snapshotNineKingdomGame,
} from "../lib/nine-kingdoms";
import styles from "../lore/9-kingdoms-solitaire/nine-kingdoms.module.css";

type Selection = { zone: "field" | "hand"; index: number } | null;

const FIRST_DEAL_SEED = 9001;
const GALLERY_STORAGE_KEY = "nine-kingdoms-unlocked-cards-v1";
const COMPLETE_COURT = createNineKingdomDeck();
const COMPLETE_COURT_IDS = new Set(COMPLETE_COURT.map((card) => card.id));

const COURT_TIERS: Array<{ tier: CourtTier; range: string; ranks: string }> = [
  { tier: "Royal", range: "Ranks 10–14", ranks: "Jester · Princess · Prince · Queen · King" },
  { tier: "Noble", range: "Ranks 6–9", ranks: "Knight · Baron/Baroness · Lord/Lady · Duke/Duchess" },
  { tier: "Gentry", range: "Ranks 1–5", ranks: "Page/Maiden · Apprentice/Acolyte · Master/Mistress · Gentleman/Gentlewoman · Squire" },
];

const PHASE_COPY: Record<NineKingdomPhase, { title: string; text: string }> = {
  arrangement: { title: "Forced arrangement", text: "A same-suit royal pairing is exposed. It must enter the Chapel before any other move." },
  court: { title: "Field before hand", text: "Move a higher exposed card only when leaving its Kingdom unveils a new figure or creates a Royal arrangement." },
  invasion: { title: "Royal invasion", text: "No productive court move remains. A higher Royal may now invade when the move advances the court." },
  hand: { title: "The hand opens", text: "The field has no productive move. One reserve card may now enter a Kingdom." },
  deadlock: { title: "The field is silent", text: "No productive move remains. Commit one exposed or reserve card to the Graveyard, or undo and reconsider." },
  victory: { title: "Every court resolved", text: "All 196 figures have been witnessed, the reserve is empty, and the field is silent." },
};

function CardFace({
  card,
  selected = false,
  target = false,
  disabled = false,
  onClick,
  compact = false,
  movable = false,
}: {
  card: KingdomCard;
  selected?: boolean;
  target?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  compact?: boolean;
  movable?: boolean;
}) {
  const cardStyle = {
    "--card-suit": card.suit.color,
    "--card-ink": card.suit.ink,
  } as CSSProperties;
  const className = [styles.card, compact ? styles.cardCompact : "", selected ? styles.cardSelected : "", target ? styles.cardTarget : "", movable ? styles.cardMovable : ""].filter(Boolean).join(" ");
  const contents = <>
    <span className={`${styles.cardArt} ${compact ? styles.cardArtCompact : ""}`}>
      {card.artPath ? <img src={card.artPath} alt="" /> : <span className={styles.cardSigil} aria-hidden="true">{card.suit.sigil}</span>}
    </span>
    <span className={styles.cardCorner}><b>{card.rank.value}</b><i>{card.suit.sigil}</i></span>
    <span className={styles.cardMeta}>
      <span className={styles.cardTitle}>{card.displayTitle}</span>
      <span className={styles.cardHouse}>{card.suit.name}</span>
      {!compact && <span className={styles.cardVirtue}>{card.suit.virtue}</span>}
    </span>
  </>;
  const label = `${card.displayTitle} of ${card.suit.name}, rank ${card.rank.value}, ${card.rank.tier}`;
  return onClick ? (
    <button className={className} style={cardStyle} onClick={onClick} disabled={disabled} aria-pressed={selected} aria-label={label}>
      {contents}
    </button>
  ) : (
    <div className={className} style={cardStyle} aria-label={label}>{contents}</div>
  );
}

function GuardedCard({ card, layer }: { card: KingdomCard; layer: "Court" | "Castle" }) {
  const cardStyle = {
    "--card-suit": card.suit.color,
  } as CSSProperties;
  return (
    <div className={styles.guardedCard} style={cardStyle} aria-label={`${layer}: ${card.displayTitle} of ${card.suit.name}, rank ${card.rank.value}, guarded`}>
      <span>{layer} · guarded</span>
      <b>{card.rank.value} · {card.displayTitle}</b>
      <i>{card.suit.sigil} {card.suit.name}</i>
    </div>
  );
}

function placementName(depth: number) {
  if (depth === 0) return "Throne · Court · Castle";
  if (depth === 1) return "Court · Castle";
  if (depth === 2) return "Castle";
  return `Below the Castle · depth ${depth + 1}`;
}

function placementExplanation(depth: number, kingdom: KingdomCard[], movable: boolean) {
  if (depth === 0) {
    return movable
      ? "Exposed and eligible to move during the current phase."
      : "Exposed, but waiting while another move or phase has priority.";
  }
  if (depth === 1) {
    return `Guarded by ${kingdom[0].displayTitle}. It becomes the Throne when the current Throne leaves.`;
  }
  if (depth === 2) {
    return `Guarded by ${kingdom[0].displayTitle} and ${kingdom[1].displayTitle}. It enters the Court when the current Throne leaves.`;
  }
  return "Previously revealed, but currently beneath the visible Castle because other cards entered above it.";
}

function KingdomTableauCard({ card, depth, kingdom, movable }: { card: KingdomCard; depth: number; kingdom: KingdomCard[]; movable: boolean }) {
  const cardStyle = {
    "--card-suit": card.suit.color,
    "--card-ink": card.suit.ink,
  } as CSSProperties;
  return (
    <article className={styles.tableauCard} style={cardStyle}>
      <header><span>{placementName(depth)}</span><i>Depth {depth + 1}</i></header>
      <div className={styles.tableauArt}>
        {card.artPath ? (
          <img src={card.artPath} alt={card.artAlt ?? `${card.displayTitle} of ${card.suit.name}`} />
        ) : (
          <div className={styles.tableauArtPlaceholder} aria-label="Full card artwork has not yet been imported">
            <span aria-hidden="true">{card.suit.sigil}</span><i>Portrait awaiting full art</i>
          </div>
        )}
      </div>
      <div className={styles.tableauIdentity}>
        <span>{card.rank.value}</span>
        <div><b>{card.displayTitle}</b><i>{card.suit.name} · {card.rank.tier}</i></div>
      </div>
      <p>{placementExplanation(depth, kingdom, movable)}</p>
    </article>
  );
}

function GalleryCard({ card, unlocked, onOpen }: { card: KingdomCard; unlocked: boolean; onOpen: () => void }) {
  const cardStyle = {
    "--card-suit": card.suit.color,
    "--card-ink": card.suit.ink,
  } as CSSProperties;
  const label = unlocked
    ? `Preview ${card.displayTitle} of ${card.suit.name}, power ${card.rank.value}`
    : `Locked ${card.suit.name} card, power ${card.rank.value}`;

  return (
    <button
      type="button"
      className={`${styles.galleryCard} ${unlocked ? styles.galleryCardUnlocked : styles.galleryCardLocked}`}
      style={cardStyle}
      onClick={onOpen}
      disabled={!unlocked}
      aria-label={label}
    >
      <span className={styles.galleryCardArt}>
        {unlocked && card.artPath ? (
          <img src={card.artPath} alt="" loading="lazy" />
        ) : (
          <span className={unlocked ? styles.galleryMissingArt : styles.galleryLockedArt}>
            <b aria-hidden="true">{card.suit.sigil}</b>
            <i>{unlocked ? "Artwork awaiting import" : "Unseen figure"}</i>
          </span>
        )}
      </span>
      <span className={styles.galleryCardRank}><b>{card.rank.value}</b><i>{card.suit.sigil}</i></span>
      <span className={styles.galleryCardMeta}>
        <b>{unlocked ? card.displayTitle : "Unseen figure"}</b>
        <i>{card.suit.name} · {unlocked ? card.rank.tier : `Power ${card.rank.value}`}</i>
      </span>
    </button>
  );
}

export function NineKingdomsGame() {
  const [game, setGame] = useState<NineKingdomGameState>(() => makeNineKingdomDeal(FIRST_DEAL_SEED));
  const [history, setHistory] = useState<NineKingdomGameState[]>([]);
  const [selected, setSelected] = useState<Selection>(null);
  const [notice, setNotice] = useState("Nine Kingdoms stand before you. Read the field before touching the hand.");
  const [rulesOpen, setRulesOpen] = useState(false);
  const [inspectedKingdom, setInspectedKingdom] = useState<number | null>(null);
  const [unlockedIds, setUnlockedIds] = useState<string[]>(() => game.revealedIds);
  const [gallerySuit, setGallerySuit] = useState("unlocked");
  const [previewCardId, setPreviewCardId] = useState<string | null>(null);
  const kingdomDialogRef = useRef<HTMLDialogElement>(null);
  const galleryDialogRef = useRef<HTMLDialogElement>(null);

  const pairings = useMemo(() => getRoyalPairings(game), [game]);
  const courtMoves = useMemo(() => getProductiveFieldMoves(game, false), [game]);
  const invasions = useMemo(() => getProductiveFieldMoves(game, true), [game]);
  const handMoves = useMemo(() => getPlayableHandMoves(game), [game]);
  const phase = getNineKingdomPhase(game);
  const phaseCopy = PHASE_COPY[phase];
  const progress = Math.round((game.revealedIds.length / 196) * 100);
  const unlockedSet = useMemo(() => new Set(unlockedIds), [unlockedIds]);
  const unlockedCount = unlockedSet.size;
  const galleryProgress = Math.round((unlockedCount / COMPLETE_COURT.length) * 100);
  const selectedGallerySuit = NINE_KINGDOM_SUITS.find((suit) => suit.id === gallerySuit);
  const galleryCards = gallerySuit === "unlocked"
    ? COMPLETE_COURT.filter((card) => unlockedSet.has(card.id))
    : COMPLETE_COURT.filter((card) => card.suit.id === gallerySuit);
  const previewCard = previewCardId ? COMPLETE_COURT.find((card) => card.id === previewCardId) : undefined;

  const activeFieldMoves = phase === "court" ? courtMoves : phase === "invasion" ? invasions : [];
  const movableKingdoms = new Set<number>();
  if (phase === "arrangement") pairings.forEach((pair) => { movableKingdoms.add(pair.source); movableKingdoms.add(pair.target); });
  if (phase === "court" || phase === "invasion") activeFieldMoves.forEach((move) => movableKingdoms.add(move.source));
  if (phase === "deadlock") game.kingdoms.forEach((kingdom, index) => { if (kingdom[0]) movableKingdoms.add(index); });
  const revealedSet = new Set(game.revealedIds);
  const inspectedCards = inspectedKingdom === null ? [] : game.kingdoms[inspectedKingdom];
  const inspectedRevealed = inspectedCards
    .map((card, depth) => ({ card, depth }))
    .filter(({ card }) => revealedSet.has(card.id));
  const legalTargets = new Set<number>();
  if (selected?.zone === "field") {
    if (phase === "arrangement") {
      pairings.forEach((pair) => {
        if (pair.source === selected.index) legalTargets.add(pair.target);
        if (pair.target === selected.index) legalTargets.add(pair.source);
      });
    } else {
      activeFieldMoves.filter((move) => move.source === selected.index).forEach((move) => legalTargets.add(move.target));
    }
  }
  if (selected?.zone === "hand" && phase === "hand") {
    handMoves.filter((move) => move.handIndex === selected.index).forEach((move) => legalTargets.add(move.target));
  }

  const availableMoveCount = phase === "arrangement"
    ? pairings.length
    : phase === "court" || phase === "invasion"
      ? activeFieldMoves.length
      : phase === "hand"
        ? handMoves.length
        : phase === "deadlock"
          ? game.kingdoms.filter((kingdom) => kingdom[0]).length
          : 0;

  useEffect(() => {
    const dialog = kingdomDialogRef.current;
    if (inspectedKingdom !== null && dialog && !dialog.open) dialog.showModal();
  }, [inspectedKingdom]);

  useEffect(() => {
    setUnlockedIds((previous) => {
      let stored: string[] = [];
      try {
        const parsed = JSON.parse(window.localStorage.getItem(GALLERY_STORAGE_KEY) ?? "[]");
        if (Array.isArray(parsed)) stored = parsed.filter((id): id is string => typeof id === "string" && COMPLETE_COURT_IDS.has(id));
      } catch {
        stored = [];
      }
      const merged = [...new Set([...stored, ...previous, ...game.revealedIds])];
      try {
        window.localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(merged));
      } catch {
        // The collection still works for this session when device storage is unavailable.
      }
      return merged.length === previous.length && merged.every((id, index) => id === previous[index]) ? previous : merged;
    });
  }, [game.revealedIds]);

  useEffect(() => {
    const dialog = galleryDialogRef.current;
    if (previewCard && dialog && !dialog.open) dialog.showModal();
  }, [previewCard]);

  function turnInstruction() {
    if (phase === "arrangement" && pairings[0]) {
      const pair = pairings[0];
      const source = game.kingdoms[pair.source][0];
      const target = game.kingdoms[pair.target][0];
      return `Required: unite ${source.displayTitle} in Kingdom ${KINGDOM_NAMES[pair.source]} with ${target.displayTitle} in Kingdom ${KINGDOM_NAMES[pair.target]}.`;
    }
    if ((phase === "court" || phase === "invasion") && activeFieldMoves[0]) {
      const move = activeFieldMoves[0];
      const source = game.kingdoms[move.source][0];
      const target = game.kingdoms[move.target][0];
      return `Try this: move ${source.displayTitle} ${source.rank.value} from Kingdom ${KINGDOM_NAMES[move.source]} onto ${target.displayTitle} ${target.rank.value} in Kingdom ${KINGDOM_NAMES[move.target]}.`;
    }
    if (phase === "hand" && handMoves[0]) {
      const move = handMoves[0];
      const card = game.hand[move.handIndex];
      return `The field has no productive move. Play ${card.displayTitle} ${card.rank.value} from your hand into Kingdom ${KINGDOM_NAMES[move.target]}.`;
    }
    if (phase === "deadlock") return game.hand.length
      ? "No productive move remains. Select a reserve card or Throne, then commit it to the Graveyard."
      : "No productive move remains. Select one Throne, then commit it to the Graveyard to reveal the Court beneath.";
    return "Every figure has been unveiled, the reserve resolved, and the field silenced. Begin a new deal whenever you are ready.";
  }

  function commit(next: NineKingdomGameState, message: string) {
    setHistory((entries) => [...entries.slice(-59), snapshotNineKingdomGame(game)]);
    setGame(next);
    setSelected(null);
    setNotice(message);
  }

  function chooseField(index: number) {
    const card = game.kingdoms[index][0];
    if (phase === "victory") return;

    if (selected && legalTargets.has(index)) {
      if (selected.zone === "hand") {
        const played = game.hand[selected.index];
        commit(playHandCard(game, { handIndex: selected.index, target: index }), `${played.displayTitle} of ${played.suit.name} entered Kingdom ${KINGDOM_NAMES[index]} from the hand.`);
        return;
      }

      const sourceIndex = selected.index;
      const sourceCard = game.kingdoms[sourceIndex][0];
      const pairing = pairings.find((pair) =>
        (pair.source === sourceIndex && pair.target === index) || (pair.target === sourceIndex && pair.source === index),
      );
      if (phase === "arrangement" && pairing) {
        commit(arrangeRoyalPairing(game, pairing), `${pairing.label} of ${sourceCard.suit.name} entered the Chapel. Two Kingdoms reveal what waited beneath.`);
        return;
      }

      const action = phase === "invasion" ? "invaded" : "guarded";
      commit(moveFieldCard(game, { source: sourceIndex, target: index }), `${sourceCard.displayTitle} of ${sourceCard.suit.name} ${action} Kingdom ${KINGDOM_NAMES[index]} and unveiled a new figure.`);
      return;
    }

    if (!card) return;

    if (selected?.zone === "field" && selected.index === index) {
      setSelected(null);
      setNotice("Selection cleared.");
      return;
    }

    const canSelect = phase === "deadlock"
      || (phase === "arrangement" && pairings.some((pair) => pair.source === index || pair.target === index))
      || activeFieldMoves.some((move) => move.source === index);
    if (canSelect) {
      setSelected({ zone: "field", index });
      setNotice(phase === "deadlock" ? `${card.displayTitle} is marked for the Graveyard.` : `${card.displayTitle} selected. Marked Kingdoms are legal destinations.`);
    } else {
      setNotice(phase === "hand" ? "The field has no productive move. Choose a card from the hand." : "That card cannot unveil a figure or complete the required arrangement.");
    }
  }

  function chooseHand(index: number) {
    const card = game.hand[index];
    if (!card) return;
    if (phase === "deadlock") {
      setSelected({ zone: "hand", index });
      setNotice(`${card.displayTitle} is marked for the Graveyard.`);
      return;
    }
    if (phase !== "hand") {
      setNotice("The hand remains closed while a productive field move is available.");
      return;
    }
    if (!handMoves.some((move) => move.handIndex === index)) {
      setNotice(`${card.displayTitle} has no legal Kingdom to enter.`);
      return;
    }
    setSelected({ zone: "hand", index });
    setNotice(`${card.displayTitle} selected from the hand. Marked Kingdoms can receive it.`);
  }

  function burySelected() {
    if (phase !== "deadlock" || !selected) return;
    const card = selected.zone === "field" ? game.kingdoms[selected.index][0] : game.hand[selected.index];
    if (!card) return;
    const next = selected.zone === "field" ? buryFieldCard(game, selected.index) : buryHandCard(game, selected.index);
    commit(next, `${card.displayTitle} of ${card.suit.name} passed to the Graveyard. The court will now be read again.`);
  }

  function hint() {
    if (phase === "arrangement" && pairings[0]) {
      setSelected({ zone: "field", index: pairings[0].source });
      setNotice(`Arrangement required: unite the ${pairings[0].label} of ${game.kingdoms[pairings[0].source][0].suit.name}.`);
      return;
    }
    if ((phase === "court" || phase === "invasion") && activeFieldMoves[0]) {
      const move = activeFieldMoves[0];
      const card = game.kingdoms[move.source][0];
      setSelected({ zone: "field", index: move.source });
      setNotice(`Consider moving the ${card.displayTitle} of ${card.suit.name} to Kingdom ${KINGDOM_NAMES[move.target]}.`);
      return;
    }
    if (phase === "hand" && handMoves[0]) {
      const move = handMoves[0];
      setSelected({ zone: "hand", index: move.handIndex });
      setNotice(`The ${game.hand[move.handIndex].displayTitle} of ${game.hand[move.handIndex].suit.name} can enter Kingdom ${KINGDOM_NAMES[move.target]}.`);
      return;
    }
    if (phase === "deadlock") {
      if (game.hand[0]) {
        setSelected({ zone: "hand", index: 0 });
        setNotice(`No productive move remains. The ${game.hand[0].displayTitle} of ${game.hand[0].suit.name} is marked for the Graveyard.`);
        return;
      }
      const candidates = game.kingdoms.map((kingdom, index) => ({ card: kingdom[0], index })).filter((entry) => entry.card);
      candidates.sort((a, b) => a.card.rank.value - b.card.rank.value);
      if (candidates[0]) {
        setSelected({ zone: "field", index: candidates[0].index });
        setNotice(`No productive move remains. The lowest exposed rank is marked for the Graveyard.`);
      }
    }
  }

  function undo() {
    const previous = history.at(-1);
    if (!previous) return;
    setGame(previous);
    setHistory((entries) => entries.slice(0, -1));
    setSelected(null);
    setNotice("The last decree was withdrawn.");
  }

  function newDeal() {
    const nextSeed = game.seed + 1;
    setGame(makeNineKingdomDeal(nextSeed));
    setHistory([]);
    setSelected(null);
    setInspectedKingdom(null);
    setNotice(`A new court has been dealt. Chronicle ${nextSeed - FIRST_DEAL_SEED + 1} begins.`);
  }

  return (
    <>
    <section className={styles.gameShell} aria-labelledby="game-board-title">
      <header className={styles.gameHeader}>
        <div>
          <span className={styles.kicker}>Playable lore · Prototype chronicle</span>
          <h2 id="game-board-title">The Nine Kingdoms</h2>
          <p>Unveil a 196-card court. The field speaks before the hand.</p>
        </div>
        <div className={styles.gameActions}>
          <button onClick={undo} disabled={!history.length}>Undo</button>
          <button onClick={hint} disabled={phase === "victory"}>Show this move</button>
          <button onClick={() => setRulesOpen((open) => !open)} aria-expanded={rulesOpen} aria-controls="nine-kingdom-rules">{rulesOpen ? "Close rules" : "Rules"}</button>
          <button className={styles.newDeal} onClick={newDeal}>New deal</button>
        </div>
      </header>

      {rulesOpen && (
        <section className={styles.rulesPanel} id="nine-kingdom-rules">
          <div><b>1 · Make progress</b><p>Higher ranks may guard lower ranks only when the move unveils a new figure or creates a required Royal arrangement. Repeated court positions are forbidden.</p></div>
          <div><b>2 · Honor arrangements</b><p>A same-suit King and Queen, or Queen and Prince, must enter the Chapel before other play.</p></div>
          <div><b>3 · Invade last</b><p>Royal-on-Royal invasion opens only after productive ordinary moves are exhausted. The reserve opens when the field can reveal nothing new.</p></div>
          <div><b>4 · Resolve the court</b><p>Victory requires all 196 figures unveiled, an empty reserve, and a silent field. At deadlock, an exposed or reserve card may pass into the Graveyard.</p></div>
        </section>
      )}

      <div className={styles.statusBar}>
        <div className={styles.phase}>
          <span>{phaseCopy.title}</span>
          <p>{phaseCopy.text}</p>
        </div>
        <div className={styles.progress}>
          <span><b>{game.revealedIds.length}</b> / 196 unveiled</span>
          <div role="progressbar" aria-valuemin={0} aria-valuemax={196} aria-valuenow={game.revealedIds.length}><i style={{ width: `${progress}%` }} /></div>
        </div>
        <div className={styles.gameStats}><span>{availableMoveCount} legal {availableMoveCount === 1 ? "move" : "moves"}</span><span>{game.moves} turns</span><span>{game.hand.length} in hand</span></div>
      </div>

      <section className={styles.turnGuide} aria-label="How to take this turn">
        <div><span>Do this now</span><p>{turnInstruction()}</p></div>
        <ol>
          <li><b>1</b> Click a Throne marked <em>can move</em>.</li>
          <li><b>2</b> Click one of the glowing destinations.</li>
          <li><b>3</b> The Court rises and a new Castle card appears.</li>
        </ol>
      </section>

      <p className={styles.notice} aria-live="polite">{notice}</p>

      <div className={styles.kingdomGrid} aria-label="Nine Kingdom field">
        {game.kingdoms.map((kingdom, index) => {
          const card = kingdom[0];
          const courtCard = kingdom[1];
          const castleCard = kingdom[2];
          const isSelected = selected?.zone === "field" && selected.index === index;
          const isTarget = legalTargets.has(index);
          const isMovable = movableKingdoms.has(index);
          return (
            <article className={`${styles.kingdom} ${isTarget ? styles.kingdomTarget : ""}`} key={KINGDOM_NAMES[index]}>
              <button
                type="button"
                className={styles.kingdomHeader}
                onClick={() => setInspectedKingdom(index)}
                aria-haspopup="dialog"
                aria-label={`Open details for Kingdom ${KINGDOM_NAMES[index]}`}
              >
                <span>Kingdom · open map</span><b>{KINGDOM_NAMES[index]}</b><i>{kingdom.length} cards · details</i>
              </button>
              <div className={styles.throneLabel}><span>Throne · {isMovable ? "can move" : "waiting"}</span><i>Only this card moves</i></div>
              <div className={styles.cardWell}>
                {card ? (
                  <CardFace card={card} selected={isSelected} target={isTarget} movable={isMovable} onClick={() => chooseField(index)} />
                ) : (
                  <button className={`${styles.emptyThrone} ${isTarget ? styles.cardTarget : ""}`} onClick={() => chooseField(index)} disabled={!isTarget} aria-label={`Empty throne in Kingdom ${KINGDOM_NAMES[index]}`}>
                    <span>♔</span><b>Empty Throne</b><i>Royalty may claim it</i>
                  </button>
                )}
                <div className={styles.guardedLayers}>
                  {courtCard ? <GuardedCard card={courtCard} layer="Court" /> : <div className={styles.missingLayer}>Court cleared</div>}
                  {castleCard ? <GuardedCard card={castleCard} layer="Castle" /> : <div className={styles.missingLayer}>Castle cleared</div>}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {inspectedKingdom !== null && (
        <dialog
          ref={kingdomDialogRef}
          className={styles.kingdomDialog}
          aria-labelledby="kingdom-dialog-title"
          aria-describedby="kingdom-dialog-description"
          onClose={() => setInspectedKingdom(null)}
          onClick={(event) => {
            if (event.target === event.currentTarget) kingdomDialogRef.current?.close();
          }}
        >
          <div className={styles.kingdomDialogPanel}>
            <header className={styles.kingdomDialogHeader}>
              <div>
                <span>Live Kingdom map</span>
                <h3 id="kingdom-dialog-title">Kingdom {KINGDOM_NAMES[inspectedKingdom]}</h3>
                <p id="kingdom-dialog-description">Every revealed card still present in this Kingdom, shown at its current depth.</p>
              </div>
              <button type="button" autoFocus onClick={() => kingdomDialogRef.current?.close()} aria-label={`Close details for Kingdom ${KINGDOM_NAMES[inspectedKingdom]}`}>Close</button>
            </header>

            <section className={styles.kingdomHierarchy} aria-labelledby="current-placement-title">
              <header>
                <div><span>Court hierarchy · highest power at the apex</span><h4 id="current-placement-title">The revealed Kingdom</h4></div>
                <p><b>{inspectedRevealed.length}</b> revealed · <b>{inspectedCards.length - inspectedRevealed.length}</b> concealed</p>
              </header>
              <aside className={styles.positionKey}>
                <b>Position and class are different:</b> the badge on each card shows where it physically sits—Throne, Court, Castle, or deeper—while the pyramid shows its social class and power range.
              </aside>
              {inspectedRevealed.length ? (
                <div className={styles.hierarchyPyramid}>
                  {COURT_TIERS.map(({ tier, range, ranks }) => {
                    const tierCards = inspectedRevealed
                      .filter(({ card }) => card.rank.tier === tier)
                      .sort((left, right) => right.card.rank.value - left.card.rank.value);
                    return (
                      <section className={styles.hierarchyTier} data-tier={tier.toLowerCase()} key={tier}>
                        <header><div><span>{range}</span><h5>{tier}</h5></div><p>{ranks}</p></header>
                        <div className={styles.tierCards}>
                          {tierCards.length ? tierCards.map(({ card, depth }) => (
                            <KingdomTableauCard key={card.id} card={card} depth={depth} kingdom={inspectedCards} movable={movableKingdoms.has(inspectedKingdom)} />
                          )) : <p className={styles.emptyTier}>No revealed {tier} card in this Kingdom.</p>}
                        </div>
                      </section>
                    );
                  })}
                </div>
              ) : (
                <p className={styles.emptyKingdomDetail}>This Kingdom is empty. Its Throne may receive Royalty when the rules permit.</p>
              )}
            </section>
          </div>
        </dialog>
      )}

      <div className={styles.lowerCourt}>
        <section className={styles.reserve} aria-labelledby="hand-title">
          <header><div><span>Reserve</span><h3 id="hand-title">The seven-card hand</h3></div><p>{phase === "hand" ? "The field can reveal nothing new. Choose." : phase === "deadlock" ? "No card can enter. One may be released." : "Sealed while the field can progress."}</p></header>
          <div className={styles.handCards}>
            {game.hand.length ? game.hand.map((card, index) => (
              <CardFace key={card.id} card={card} compact selected={selected?.zone === "hand" && selected.index === index} onClick={() => chooseHand(index)} disabled={phase !== "hand" && phase !== "deadlock"} />
            )) : <p className={styles.zoneEmpty}>The hand has entered the Kingdoms.</p>}
          </div>
        </section>

        <aside className={styles.destinations}>
          <section>
            <span className={styles.zoneSigil}>✧</span>
            <div><b>The Chapel</b><p>Honored arrangements</p><strong>{game.chapel.length}</strong></div>
          </section>
          <section>
            <span className={styles.zoneSigil}>†</span>
            <div><b>The Graveyard</b><p>Deadlock releases</p><strong>{game.graveyard.length}</strong></div>
          </section>
          {phase === "deadlock" && (
            <button className={styles.buryButton} onClick={burySelected} disabled={!selected}>Commit selected card</button>
          )}
        </aside>
      </div>

      <footer className={styles.prototypeNote}>
        <b>Lore Edition · Rules prototype 0.1</b>
        <p>This first implementation resolves the original open questions with a transparent playable ruleset. Future chronicles can refine Court, Castle, Chapel, and Jester powers without erasing this record.</p>
      </footer>
    </section>
    <section className={styles.courtIndex} aria-labelledby="court-index-title">
      <header>
        <span className={styles.kicker}>The complete court · living gallery</span>
        <h2 id="court-index-title">Fourteen traditions. One hierarchy.</h2>
        <p>The suits are symbolic courts, not a judgment that one worldview outranks another. Rank governs the game; every figure you encounter becomes part of your permanent gallery on this device.</p>
      </header>

      <section className={styles.collectionSummary} aria-label="Gallery collection progress">
        <div>
          <span>Your unveiled court</span>
          <strong>{unlockedCount} <i>/ {COMPLETE_COURT.length} collected</i></strong>
          <p>Cards unlock when they first appear in your hand, Court, Castle, or Throne. New deals can reveal figures you have never encountered.</p>
        </div>
        <div className={styles.collectionProgress}>
          <b>{galleryProgress}%</b>
          <div role="progressbar" aria-valuemin={0} aria-valuemax={COMPLETE_COURT.length} aria-valuenow={unlockedCount}><i style={{ width: `${galleryProgress}%` }} /></div>
          <span>Saved only in this browser</span>
        </div>
      </section>

      <nav className={styles.galleryFilters} aria-label="Choose a court to browse">
        <button
          type="button"
          className={gallerySuit === "unlocked" ? styles.galleryFilterActive : ""}
          style={{ "--suit-color": "#a68045" } as CSSProperties}
          aria-pressed={gallerySuit === "unlocked"}
          onClick={() => setGallerySuit("unlocked")}
        >
          <span aria-hidden="true">✧</span><b>All unlocked</b><i>{unlockedCount} figures</i>
        </button>
        {NINE_KINGDOM_SUITS.map((suit) => {
          const suitCount = COMPLETE_COURT.filter((card) => card.suit.id === suit.id && unlockedSet.has(card.id)).length;
          return (
            <button
              type="button"
              key={suit.id}
              className={gallerySuit === suit.id ? styles.galleryFilterActive : ""}
              style={{ "--suit-color": suit.color } as CSSProperties}
              aria-pressed={gallerySuit === suit.id}
              onClick={() => setGallerySuit(suit.id)}
            >
              <span aria-hidden="true">{suit.sigil}</span><b>{suit.name}</b><i>{suitCount} / 14</i>
            </button>
          );
        })}
      </nav>

      <section className={styles.galleryPanel} aria-labelledby="gallery-panel-title">
        <header
          className={styles.galleryPanelHeader}
          style={{ "--suit-color": selectedGallerySuit?.color ?? "#a68045" } as CSSProperties}
        >
          <div className={styles.galleryCourtIdentity}>
            <span className={styles.galleryCourtSigil} aria-hidden="true">{selectedGallerySuit?.sigil ?? "✧"}</span>
            <div>
              <h3 id="gallery-panel-title">{selectedGallerySuit ? selectedGallerySuit.name : "All unveiled figures"}</h3>
              <p className={styles.galleryCourtTradition}>{selectedGallerySuit ? selectedGallerySuit.tradition : "Every symbolic court"}</p>
            </div>
          </div>
          <div className={styles.galleryCourtDescription}>
            <p>{selectedGallerySuit ? selectedGallerySuit.description : "The figures you have encountered across all fourteen traditions, gathered into one living court."}</p>
            <div>
              {selectedGallerySuit && <><span>{selectedGallerySuit.palette}</span><i aria-hidden="true">·</i><span>{selectedGallerySuit.virtue}</span><i aria-hidden="true">·</i></>}
              <span>{selectedGallerySuit ? `${galleryCards.filter((card) => unlockedSet.has(card.id)).length} of 14 discovered` : `${unlockedCount} figures discovered`}</span>
            </div>
          </div>
        </header>
        <div className={styles.galleryGrid}>
          {galleryCards.map((card) => {
            const unlocked = unlockedSet.has(card.id);
            return <GalleryCard key={card.id} card={card} unlocked={unlocked} onOpen={() => setPreviewCardId(card.id)} />;
          })}
        </div>
      </section>

      <div className={styles.rankRibbon} aria-label="Court hierarchy reference">
        {(["Gentry", "Noble", "Royal"] as const).map((tier) => (
          <section key={tier}><h3>{tier}</h3><ol>{NINE_KINGDOM_RANKS.filter((rank) => rank.tier === tier).map((rank) => <li key={rank.value}><b>{rank.value}</b><span>{rank.title}{rank.alternate ? ` / ${rank.alternate}` : ""}</span></li>)}</ol></section>
        ))}
      </div>

      {previewCard && (
        <dialog
          ref={galleryDialogRef}
          className={styles.galleryDialog}
          aria-labelledby="gallery-preview-title"
          onClose={() => setPreviewCardId(null)}
          onClick={(event) => {
            if (event.target === event.currentTarget) galleryDialogRef.current?.close();
          }}
        >
          <div className={styles.galleryDialogPanel} style={{ "--card-suit": previewCard.suit.color } as CSSProperties}>
            <div className={styles.galleryPreviewArt}>
              {previewCard.artPath ? (
                <img src={previewCard.artPath} alt={previewCard.artAlt ?? `${previewCard.displayTitle} of ${previewCard.suit.name}`} />
              ) : (
                <div><span aria-hidden="true">{previewCard.suit.sigil}</span><p>Artwork awaiting import</p></div>
              )}
            </div>
            <aside className={styles.galleryPreviewCopy}>
              <button type="button" autoFocus onClick={() => galleryDialogRef.current?.close()}>Close</button>
              <span>{previewCard.rank.tier} · Power {previewCard.rank.value}</span>
              <h3 id="gallery-preview-title">{previewCard.displayTitle}</h3>
              <h4>{previewCard.suit.name}</h4>
              <p>{previewCard.suit.tradition}</p>
              <blockquote>{previewCard.suit.virtue}</blockquote>
              <small>Unlocked by encountering this figure in play.</small>
            </aside>
          </div>
        </dialog>
      )}
    </section>
    </>
  );
}
