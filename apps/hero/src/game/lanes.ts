// The highway's lanes: one per face. Every move goes in the lane of the face it turns. Slices go
// with the face they follow (M with L, E with D, S with F), wide moves with their face, and
// whole-cube turns take every lane.
import { moveLayer, type BaseMove, type Face, type Move } from "cube-kit/cube/model";

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

/**
 * How the turn looks from the front: the front stickers of an R go up, of a U go left; F turns
 * clockwise. A half turn shows the quarter-turn direction (either way works).
 */
export type Arrow = "up" | "down" | "left" | "right" | "cw" | "ccw";

export function arrowOf(move: Move): Arrow {
  const { axis } = moveLayer(move.base);
  const sign = move.amount === 3 ? -1 : 1;
  // Axis toward the viewer: clockwise seen from its tip is clockwise seen from the front.
  if (axis[2] !== 0) return axis[2] * sign > 0 ? "cw" : "ccw";
  // Otherwise follow the front center sticker: a clockwise turn moves a point p by -(axis × p).
  // With p = (0, 0, 1): -(axis × p) = (-axis[1], axis[0], 0).
  const vx = -axis[1] * sign;
  const vy = axis[0] * sign;
  if (vy !== 0) return vy > 0 ? "up" : "down";
  return vx > 0 ? "right" : "left";
}

// ---- Keys -----------------------------------------------------------------------------------
// The home row turns a face clockwise; the key above it turns it the other way ('). Left hand
// plays L U F, right hand D B R. Either key does a half turn, and the space bar turns the whole cube.
// Keys are physical positions (KeyboardEvent.code), so they sit in the same place on any layout.

export const KEYS: Record<Lane, { turn: string; prime: string }> = {
  L: { turn: "KeyS", prime: "KeyW" },
  U: { turn: "KeyD", prime: "KeyE" },
  F: { turn: "KeyF", prime: "KeyR" },
  D: { turn: "KeyJ", prime: "KeyU" },
  B: { turn: "KeyK", prime: "KeyI" },
  R: { turn: "KeyL", prime: "KeyO" },
};
export const ROTATION_KEY = "Space";

/** What a key asks for: a lane turned one way or the other, or a whole-cube turn. */
export type KeyAction = { lane: Lane; prime: boolean } | { lane: "all" };

export function actionOf(code: string): KeyAction | null {
  if (code === ROTATION_KEY) return { lane: "all" };
  for (const lane of LANES) {
    if (KEYS[lane].turn === code) return { lane, prime: false };
    if (KEYS[lane].prime === code) return { lane, prime: true };
  }
  return null;
}

/** Whether a key plays a move: right lane, right direction (any direction for half turns). */
export function keyMatches(action: KeyAction, move: Move): boolean {
  const lane = laneOf(move);
  if (action.lane !== lane) return false;
  if (action.lane === "all") return true;
  return move.amount === 2 || action.prime === (move.amount === 3);
}

/** The key to show on a note. */
export function keyFor(move: Move): string {
  const lane = laneOf(move);
  if (lane === "all") return ROTATION_KEY;
  return move.amount === 3 ? KEYS[lane].prime : KEYS[lane].turn;
}

/** "KeyS" → "S", "Space" → "Space". */
export const keyLabel = (code: string) => code.replace(/^Key/, "");
