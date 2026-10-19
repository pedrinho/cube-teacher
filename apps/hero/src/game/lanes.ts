// The highway's lanes: one per face. Every move goes in the lane of the face it turns. Slices go
// with the face they follow (M with L, E with D, S with F), wide moves with their face, and
// whole-cube turns take every lane.
import { BASE_MOVES, type BaseMove, type Face, type Move } from "cube-kit/cube/model";

/** Lanes from left to right: L and R on their own sides, the other faces in between. */
export const LANES = ["L", "U", "F", "D", "B", "R"] as const satisfies readonly Face[];
export type Lane = (typeof LANES)[number];

export type NoteShape = "face" | "wide" | "slice" | "rotation";

const SLICE_LANE: Partial<Record<BaseMove, Lane>> = { M: "L", E: "D", S: "F" };

export function laneOf(move: Move): Lane | "all" {
  const { base } = move;
  if (base === "x" || base === "y" || base === "z") return "all";
  return SLICE_LANE[base] ?? (base.toUpperCase() as Lane);
}

export function shapeOf(move: Move): NoteShape {
  const { base } = move;
  if (base === "x" || base === "y" || base === "z") return "rotation";
  if (base in SLICE_LANE) return "slice";
  return base === base.toLowerCase() ? "wide" : "face";
}

// ---- Keys -----------------------------------------------------------------------------------
// Every move is played with its own letter, so the note says which key to press: R, R' and R2
// are the R key, the middle layer M is the M key, the whole-cube turn y is the Y key. Wide moves
// (r) use their face's letter. Keys are physical positions (KeyboardEvent.code).

/** The key that plays a move. */
export const keyFor = (move: Move) => `Key${move.base.toUpperCase()}`;

/** Every key the game listens to: U D L R F B, M E S and X Y Z. */
export const GAME_KEYS: ReadonlySet<string> = new Set(BASE_MOVES.map((base) => keyFor({ base, amount: 1 })));

/** The lane where a key's notes come down ("all" for X, Y and Z). */
export function laneOfKey(code: string): Lane | "all" | null {
  if (!GAME_KEYS.has(code)) return null;
  const letter = code.slice("Key".length);
  const base = ("XYZ".includes(letter) ? letter.toLowerCase() : letter) as BaseMove;
  return laneOf({ base, amount: 1 });
}
