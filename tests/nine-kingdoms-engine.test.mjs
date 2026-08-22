import assert from "node:assert/strict";
import test from "node:test";

import {
  arrangeRoyalPairing,
  buryFieldCard,
  buryHandCard,
  gamePositionKey,
  getNineKingdomPhase,
  getPlayableHandMoves,
  getProductiveFieldMoves,
  getRoyalPairings,
  makeNineKingdomDeal,
  moveFieldCard,
  playHandCard,
} from "../app/lib/nine-kingdoms.ts";

function followRequiredMove(game) {
  const phase = getNineKingdomPhase(game);
  if (phase === "arrangement") return arrangeRoyalPairing(game, getRoyalPairings(game)[0]);
  if (phase === "court") return moveFieldCard(game, getProductiveFieldMoves(game, false)[0]);
  if (phase === "invasion") return moveFieldCard(game, getProductiveFieldMoves(game, true)[0]);
  if (phase === "hand") return playHandCard(game, getPlayableHandMoves(game)[0]);
  if (phase === "deadlock" && game.hand.length) return buryHandCard(game, 0);
  if (phase === "deadlock") {
    const kingdomIndex = game.kingdoms.findIndex((kingdom) => kingdom[0]);
    assert.notEqual(kingdomIndex, -1, "a non-victory deadlock must have a card that can be released");
    return buryFieldCard(game, kingdomIndex);
  }
  return game;
}

test("the default deal reaches the seven-card hand without repeating a court position", () => {
  let game = makeNineKingdomDeal(9001);
  const positions = new Set([gamePositionKey(game)]);

  for (let turn = 0; turn < 196; turn += 1) {
    const phase = getNineKingdomPhase(game);
    if (phase === "hand") {
      assert.equal(game.hand.length, 7);
      assert.ok(game.revealedIds.length > 34, "field play should unveil figures before the hand opens");
      return;
    }
    assert.ok(["arrangement", "court", "invasion"].includes(phase), `unexpected phase before the hand opened: ${phase}`);
    game = followRequiredMove(game);
    const position = gamePositionKey(game);
    assert.equal(positions.has(position), false, "a required move recreated an earlier court position");
    positions.add(position);
  }

  assert.fail("the reserve did not open within a complete court's worth of progressive moves");
});

test("deadlock may release an unplayable reserve card", () => {
  let game = makeNineKingdomDeal(9001);
  for (let turn = 0; turn < 196 && getNineKingdomPhase(game) !== "deadlock"; turn += 1) {
    game = followRequiredMove(game);
  }

  assert.equal(getNineKingdomPhase(game), "deadlock");
  assert.ok(game.hand.length > 0, "the default fixture should retain an unplayable reserve card");
  const handBefore = game.hand.length;
  const graveyardBefore = game.graveyard.length;
  game = buryHandCard(game, 0);
  assert.equal(game.hand.length, handBefore - 1);
  assert.equal(game.graveyard.length, graveyardBefore + 1);
});

test("twenty consecutive deals terminate without repeated positions", () => {
  for (let seed = 9001; seed < 9021; seed += 1) {
    let game = makeNineKingdomDeal(seed);
    const positions = new Set([gamePositionKey(game)]);

    for (let turn = 0; turn < 400 && getNineKingdomPhase(game) !== "victory"; turn += 1) {
      game = followRequiredMove(game);
      const position = gamePositionKey(game);
      assert.equal(positions.has(position), false, `deal ${seed} repeated a court position`);
      positions.add(position);
    }

    assert.equal(getNineKingdomPhase(game), "victory", `deal ${seed} did not reach victory`);
    assert.equal(game.hand.length, 0, `deal ${seed} reached victory with cards in reserve`);
    assert.equal(game.revealedIds.length, 196, `deal ${seed} reached victory before unveiling the complete court`);
  }
});
