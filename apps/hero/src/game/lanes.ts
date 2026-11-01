// The highway's lanes: one per face, and every move goes in the lane of the face it turns. Slices go
// with the face they follow (M with L, E with D, S with F), wide moves with their face, and
// whole-cube turns take every lane. Each puzzle only has the lanes it plays: the 1x1x2 one for its
// top and one for its bottom (the 1x1x3's middle layer, E, comes down D's lane, and the 1x1x4's wide
// u and d their face's), the 1x2x2 one for each side (the 1x2x3's middle row, E, in D's, and the
// 1x3x3's middle column, M, in L's), the 2x2x3 one for its top, front, bottom and right (E in D's
// again), the 2x2x2 its left, top, front and right, and the 1x1x1 a single wide one, played with the
// space bar.
import type { BaseMove, Face, Move } from "cube-kit/cube/model";

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
// Twelve letters are played: the faces U D L R F B, the middle layers M E S and the whole-cube
// turns X Y Z. R, R' and R2 are all R; wide moves (r) are their face's letter. Each letter has a
// key, its own by default (R is the R key), and the player can move it to another letter or
// number key. Keys are physical positions (KeyboardEvent.code).

export const LETTERS = ["U", "D", "L", "R", "F", "B", "M", "E", "S", "X", "Y", "Z"] as const;
export type Letter = (typeof LETTERS)[number];

/** The key (KeyboardEvent.code) that plays each letter. */
export type KeyMap = Record<Letter, string>;

export const DEFAULT_KEYS = Object.fromEntries(LETTERS.map((l) => [l, `Key${l}`])) as KeyMap;

/** How a letter is used: a face, a middle layer or a whole-cube turn. */
export const kindOf = (letter: Letter) => ("UDLRFB".includes(letter) ? "face" : "MES".includes(letter) ? "slice" : "turn");

/** The letter a move is played with. */
export const letterOf = (move: Move) => move.base.toUpperCase() as Letter;

/** How a letter's notes are written: x, y and z are lower case. */
export const moveOfLetter = (letter: Letter) => ("XYZ".includes(letter) ? letter.toLowerCase() : letter) as BaseMove;

/** The key that plays a move. */
export const keyFor = (move: Move, keys: KeyMap) => keys[letterOf(move)];

/** A pressed key as the game sees it: the numpad's numbers are the same as the number row's. */
export const gameKey = (code: string) => code.replace(/^Numpad(\d)$/, "Digit$1");

/** Keys a letter can move to: the letter and number keys. Space and Esc pause the song. */
export const isBindableKey = (code: string) => /^(Key[A-Z]|Digit\d)$/.test(code);

/** What is printed on a key. */
export const keyLabel = (code: string) => code.replace(/^(Key|Digit)/, "");

/** The letter a key plays, if any. */
export const letterOfKey = (code: string, keys: KeyMap): Letter | undefined => LETTERS.find((l) => keys[l] === code);

// ---- Tracks ---------------------------------------------------------------------------------

/** How a puzzle's moves come down the highway: its lanes, the letters it plays, and where. */
export interface Track {
  lanes: readonly Lane[];
  letters: readonly Letter[];
  laneOf: (move: Move) => Lane | "all";
  shapeOf: (move: Move) => NoteShape;
  /** One wide lane, like the space bar: its notes and its receptor go across the whole road. */
  bar?: boolean;
}

/** Every 1x1x1 note spins the whole cube (y), on the one lane. */
export const CUBE_1_TRACK: Track = { lanes: ["U"], letters: ["Y"], laneOf: () => "all", shapeOf: () => "rotation", bar: true };

/** The 1x1x2's top turns with U and its bottom with D, each in its lane. */
export const CUBE_1x2_TRACK: Track = { lanes: ["U", "D"], letters: ["U", "D"], laneOf, shapeOf };

/** The 1x1x3 is a 1x1x2 with a middle layer: E, outlined notes in D's lane. */
export const CUBE_1x3_TRACK: Track = { lanes: ["U", "D"], letters: ["U", "D", "E"], laneOf, shapeOf };

/** The 1x1x4 plays U and D, and the wide u and d (big notes) on the same keys. */
export const CUBE_1x4_TRACK: Track = { lanes: ["U", "D"], letters: ["U", "D"], laneOf, shapeOf };

/** The 1x2x2 turns its four sides, halfway: R2 and L2, U2 and D2. */
export const CUBE_1x2x2_TRACK: Track = { lanes: ["L", "U", "D", "R"], letters: ["U", "D", "L", "R"], laneOf, shapeOf };

/** The 1x2x3 is a 1x2x2 with a middle row: E2, outlined notes in D's lane. */
export const CUBE_1x2x3_TRACK: Track = { lanes: ["L", "U", "D", "R"], letters: ["U", "D", "E", "L", "R"], laneOf, shapeOf };

/** The 1x3x3 is a 1x2x3 with a middle column: M2, outlined notes in L's lane. */
export const CUBE_1x3x3_TRACK: Track = { lanes: ["L", "U", "D", "R"], letters: ["U", "D", "E", "L", "R", "M"], laneOf, shapeOf };

/** The 2x2x3 turns U, E and D a quarter, and R2 and F2 halfway: the front gets a lane of its own. */
export const CUBE_2x2x3_TRACK: Track = { lanes: ["U", "F", "D", "R"], letters: ["U", "D", "E", "R", "F"], laneOf, shapeOf };

/** The 2x2x2 turns every side a quarter; its song plays the left, top, front and right. */
export const CUBE_2x2x2_TRACK: Track = { lanes: ["L", "U", "F", "R"], letters: ["U", "L", "R", "F"], laneOf, shapeOf };

/** The lane where a key's notes come down ("all" for X, Y and Z), if the puzzle plays it. */
export function laneOfKey(code: string, keys: KeyMap, track: Track): Lane | "all" | null {
  const letter = letterOfKey(code, keys);
  return letter && track.letters.includes(letter) ? track.laneOf({ base: moveOfLetter(letter), amount: 1 }) : null;
}

/** Gives a letter a new key. The letter that had that key takes the old one, so keys never clash. */
export function rebind(keys: KeyMap, letter: Letter, code: string): KeyMap {
  const other = letterOfKey(code, keys);
  return { ...keys, ...(other && { [other]: keys[letter] }), [letter]: code };
}

/** Whether a stored value is a usable key map: every letter on its own letter or number key. */
export function isKeyMap(value: unknown): value is KeyMap {
  if (typeof value !== "object" || value === null) return false;
  const codes = LETTERS.map((l) => (value as Record<string, unknown>)[l]);
  return codes.every((c) => typeof c === "string" && isBindableKey(c)) && new Set(codes).size === LETTERS.length;
}
