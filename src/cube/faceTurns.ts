// Rewrites any algorithm (wide moves, slices, whole-cube turns) as outer face turns only, so it
// can be done as a scramble without turning the cube in the hands. The result makes the same cube,
// up to how it is held.
import { applyMove, centers, type Amount, type BaseMove, type Move } from "./model";

// A wide move or a slice is a face turn plus a whole-cube turn, e.g. r = L x and M = R L' x'.
const AS_FACE_TURNS: Partial<Record<BaseMove, [BaseMove, number][]>> = {
  r: [["L", 1], ["x", 1]],
  l: [["R", 1], ["x", -1]],
  u: [["D", 1], ["y", 1]],
  d: [["U", 1], ["y", -1]],
  f: [["B", 1], ["z", 1]],
  b: [["F", 1], ["z", -1]],
  M: [["R", 1], ["L", -1], ["x", -1]],
  E: [["U", 1], ["D", -1], ["y", -1]],
  S: [["F", -1], ["B", 1], ["z", 1]],
};

const amountOf = (n: number) => ((((n % 4) + 4) % 4) as Amount | 0);

export function toFaceTurns(moves: readonly Move[]): Move[] {
  // Track how the cube is held: which fixed face is now at each position.
  let frame = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";
  const out: Move[] = [];
  const emit = (base: BaseMove, turns: number) => {
    const amount = amountOf(turns);
    if (amount === 0) return;
    if (base === "x" || base === "y" || base === "z") {
      frame = applyMove(frame, { base, amount });
      return;
    }
    const fixed = centers(frame)[base as "U"] as BaseMove;
    const last = out[out.length - 1];
    // Merge with the previous turn of the same face (R R → R2, R R' → nothing).
    if (last && last.base === fixed) {
      out.pop();
      const merged = amountOf(last.amount + amount);
      if (merged) out.push({ base: fixed, amount: merged });
    } else {
      out.push({ base: fixed, amount });
    }
  };
  for (const m of moves) {
    const parts = AS_FACE_TURNS[m.base];
    if (parts) for (const [base, sign] of parts) emit(base, sign * m.amount);
    else emit(m.base, m.amount);
  }
  return out;
}
