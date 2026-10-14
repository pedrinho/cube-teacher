// A scramble for a practice case: the moves that set the case up, done as outer face turns from a
// solved cube held white on top, green in front (the app's usual scramble position).
import { toFaceTurns } from "../cube/faceTurns";
import type { Move } from "../cube/model";

export function scrambleFor(setupMoves: Move[], topTurn: Move[]): Move[] {
  return toFaceTurns([...setupMoves, ...topTurn]);
}
