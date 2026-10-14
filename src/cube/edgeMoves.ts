// Fast tracking of a few edges through face turns, for the cross searches. An edge's position and
// orientation are one number: slot * 2 + (index, in the slot, of its white sticker).
import { EDGE_SLOTS, centers, movePerm, type Amount, type BaseMove, type Color, type CubeState, type Move } from "./model";
import { homeOf, slotOf } from "./pieces";

// When two solutions are equally short, prefer the faces kids use most.
export const FACE_MOVES: Move[] = (["F", "R", "U", "L", "B", "D"] as BaseMove[]).flatMap((base) =>
  ([1, 3, 2] as Amount[]).map((amount) => ({ base, amount })),
);

const STICKER_CODE = new Map<number, number>();
EDGE_SLOTS.forEach((slot, i) => slot.stickers.forEach((st, k) => STICKER_CODE.set(st, i * 2 + k)));

/** EDGE_TABLE[move][code] = the edge's code after the move (moves as in FACE_MOVES). */
export const EDGE_TABLE: number[][] = FACE_MOVES.map((m) => {
  const dest: number[] = [];
  movePerm(m).forEach((oldIndex, newIndex) => (dest[oldIndex] = newIndex));
  return Array.from({ length: 24 }, (_, code) => STICKER_CODE.get(dest[EDGE_SLOTS[code >> 1].stickers[code & 1]])!);
});

/** Where a white edge is now. */
export function edgeCode(state: CubeState, piece: Color[]): number {
  const slot = slotOf(state, piece);
  return EDGE_SLOTS.indexOf(slot) * 2 + slot.stickers.findIndex((i) => state[i] === "W");
}

/** Where a white edge belongs, white sticker against the white center. */
export function edgeGoal(state: CubeState, piece: Color[]): number {
  const home = homeOf(state, piece);
  const c = centers(state);
  return EDGE_SLOTS.indexOf(home) * 2 + home.faces.findIndex((f) => c[f] === "W");
}
