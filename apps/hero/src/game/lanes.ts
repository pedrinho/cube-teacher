// The highway's lanes. On the cube there is one per face, and every move goes in the lane of the
// face it turns. Slices go with the face they follow (M with L, E with D, S with F), wide moves
// with their face, and whole-cube turns take every lane. On the pyraminx there is one per corner,
// for its turns and its tip's.
import type { BaseMove, Face, Move } from "cube-kit/cube/model";

/** Lanes from left to right: L and R on their own sides, the other faces in between. */
export const LANES = ["L", "U", "F", "D", "B", "R"] as const satisfies readonly Face[];
export type Lane = (typeof LANES)[number];

/** The pyraminx's corners, left to right as it is held: front left, top, back, front right. */
export const PYRAMINX_LANES = ["L", "U", "B", "R"] as const satisfies readonly Lane[];

export type NoteShape = "face" | "wide" | "slice" | "rotation" | "tip";

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
}

export const CUBE_TRACK: Track = { lanes: LANES, letters: LETTERS, laneOf, shapeOf };

/** Pyraminx moves are U L R B; the tips (u l r b) use their corner's lane and letter. */
export const PYRAMINX_TRACK: Track = {
  lanes: PYRAMINX_LANES,
  letters: ["U", "L", "R", "B"],
  laneOf: (move) => move.base.toUpperCase() as Lane,
  shapeOf: (move) => (move.base === move.base.toUpperCase() ? "face" : "tip"),
};

/** The lane where a key's notes come down ("all" for X, Y and Z), if the puzzle plays it. */
export function laneOfKey(code: string, keys: KeyMap, track: Track = CUBE_TRACK): Lane | "all" | null {
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
