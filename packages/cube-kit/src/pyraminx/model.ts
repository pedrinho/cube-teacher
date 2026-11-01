// Sticker-level model of a Pyraminx, the pyramid puzzle.
//
// It is held with yellow on the bottom and green in front, so its corners are U (top), L and R
// (front left and front right) and B (back). A state is a 36-character string of colors, 9 per
// face in the order F L R D. Each face is read from its top corner, row by row, as seen from
// outside with that corner up:
//
//          0            0, 4 and 8 are tips (the little corner pieces),
//        1 2 3          2, 5 and 7 are centers (the middle part of a corner, with three colors),
//      4 5 6 7 8        1, 3 and 6 are edges.
//
// Moves turn around a corner, clockwise as seen looking at that corner: U turns the top two
// layers (the tip, its center and the three edges around it), u turns only the tip. Like the
// cube's, moves are permutations of the stickers, generated from the puzzle's 3D geometry.
import type { Color } from "../cube/model";

export const CORNERS = ["U", "L", "R", "B"] as const;
export type Corner = (typeof CORNERS)[number];

export const PYRA_FACES = ["F", "L", "R", "D"] as const;
export type PyraFace = (typeof PYRA_FACES)[number];

export type PyraState = string;

export type Vec = readonly [number, number, number];

const S = Math.sqrt(2 / 3);
const T = Math.SQRT2 / 3;

/** The corners of a regular tetrahedron with its center at the origin, 1 from each corner. */
export const CORNER_POS: Record<Corner, Vec> = {
  U: [0, 1, 0],
  L: [-S, -1 / 3, T],
  R: [S, -1 / 3, T],
  B: [0, -1 / 3, -2 * T],
};

/** Each face's corners as seen from outside: the top one, then left and right. */
export const FACE_CORNERS: Record<PyraFace, [Corner, Corner, Corner]> = {
  F: ["U", "L", "R"],
  L: ["U", "B", "L"],
  R: ["U", "R", "B"],
  D: ["B", "R", "L"],
};

export const PYRA_SCHEME: Record<PyraFace, Color> = { F: "G", L: "R", R: "B", D: "Y" };

export type PieceKind = "tip" | "center" | "edge";

export interface PyraSticker {
  face: PyraFace;
  kind: PieceKind;
  /** The corner a tip or center belongs to, or the two corners an edge lies between. */
  corners: Corner[];
  /** The sticker's triangle on the surface, and its middle point. */
  triangle: [Vec, Vec, Vec];
  center: Vec;
  normal: Vec;
}

const add = (a: Vec, b: Vec, k = 1): Vec => [a[0] + k * b[0], a[1] + k * b[1], a[2] + k * b[2]];
const sub = (a: Vec, b: Vec) => add(a, b, -1);
const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const scale = (a: Vec, k: number): Vec => [a[0] * k, a[1] * k, a[2] * k];
const cross = (a: Vec, b: Vec): Vec => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const normalize = (a: Vec) => scale(a, 1 / Math.sqrt(dot(a, a)));

export const PYRA_STICKERS: PyraSticker[] = [];
for (const face of PYRA_FACES) {
  const [top, left, right] = FACE_CORNERS[face];
  const [a, l, r] = [CORNER_POS[top], CORNER_POS[left], CORNER_POS[right]];
  // Points of the face's grid: i thirds of the way toward the left corner, j toward the right one.
  const P = (i: number, j: number) => add(add(a, sub(l, a), i / 3), sub(r, a), j / 3);
  const up = (i: number, j: number): [Vec, Vec, Vec] => [P(i, j), P(i + 1, j), P(i, j + 1)];
  const down = (i: number, j: number): [Vec, Vec, Vec] => [P(i + 1, j), P(i, j + 1), P(i + 1, j + 1)];
  const normal = normalize(cross(sub(l, a), sub(r, a)));
  const pieces: [[Vec, Vec, Vec], PieceKind, Corner[]][] = [
    [up(0, 0), "tip", [top]],
    [up(1, 0), "edge", [top, left]],
    [down(0, 0), "center", [top]],
    [up(0, 1), "edge", [top, right]],
    [up(2, 0), "tip", [left]],
    [down(1, 0), "center", [left]],
    [up(1, 1), "edge", [left, right]],
    [down(0, 1), "center", [right]],
    [up(0, 2), "tip", [right]],
  ];
  for (const [triangle, kind, corners] of pieces) {
    const center = scale(add(add(triangle[0], triangle[1]), triangle[2]), 1 / 3);
    PYRA_STICKERS.push({ face, kind, corners, triangle, center, normal });
  }
}

export const PYRA_MOVES = ["U", "L", "R", "B", "u", "l", "r", "b"] as const;
export type PyraBase = (typeof PYRA_MOVES)[number];

/** A move: amount 1 is clockwise, 3 is counterclockwise ('), like the cube's moves. */
export interface PyraMove {
  base: PyraBase;
  amount: 1 | 3;
}

export const cornerOf = (base: PyraBase) => base.toUpperCase() as Corner;
export const isTip = (base: PyraBase) => base !== base.toUpperCase();

/**
 * How far along a corner's axis a move cuts: a sticker turns when its middle point is farther
 * toward the corner than this. The corner is at 1 and the opposite face at -1/3; the cuts are a
 * third and two thirds of the way down.
 */
export const cutOf = (base: PyraBase) => (isTip(base) ? 5 / 9 : 1 / 9);

/** Clockwise third of a turn, seen from the tip of `axis` (a unit vector). */
export function turnVec(v: Vec, axis: Vec): Vec {
  // Rodrigues' rotation by -120°.
  const cos = -1 / 2;
  const sin = -Math.sqrt(3) / 2;
  return add(add(scale(v, cos), cross(axis, v), sin), axis, dot(axis, v) * (1 - cos));
}

const nearest = (p: Vec) => {
  const i = PYRA_STICKERS.findIndex((s) => dot(sub(s.center, p), sub(s.center, p)) < 1e-9);
  if (i < 0) throw new Error("A turn moved a sticker off the puzzle");
  return i;
};

const compose = (first: number[], second: number[]) => second.map((i) => first[i]);

/** perm[newIndex] = oldIndex, for one clockwise turn. */
function thirdTurn(base: PyraBase): number[] {
  const axis = CORNER_POS[cornerOf(base)];
  const perm = PYRA_STICKERS.map((_, i) => i);
  PYRA_STICKERS.forEach((s, i) => {
    if (dot(s.center, axis) > cutOf(base)) perm[nearest(turnVec(s.center, axis))] = i;
  });
  return perm;
}

const PERMS = new Map<string, number[]>();
for (const base of PYRA_MOVES) {
  const q = thirdTurn(base);
  PERMS.set(`${base}1`, q);
  PERMS.set(`${base}3`, compose(q, q));
}

/** Sticker permutation of a move: perm[newIndex] = oldIndex. */
export const pyraPerm = (m: PyraMove): readonly number[] => PERMS.get(`${m.base}${m.amount}`)!;

export function applyPyraMove(state: PyraState, m: PyraMove): PyraState {
  const perm = PERMS.get(`${m.base}${m.amount}`)!;
  let out = "";
  for (let i = 0; i < 36; i++) out += state[perm[i]];
  return out;
}

export function applyPyraAlg(state: PyraState, alg: string | readonly PyraMove[]): PyraState {
  const moves = typeof alg === "string" ? parsePyraAlg(alg) : alg;
  return moves.reduce(applyPyraMove, state);
}

/** Reads moves like "U L' r b'", with or without spaces. */
export function parsePyraAlg(alg: string): PyraMove[] {
  const text = alg.replace(/[‘’′`´]/g, "'");
  const moves: PyraMove[] = [];
  const token = /\s*([ULRBulrb])(')?\s*/y;
  let i = 0;
  while (i < text.length) {
    token.lastIndex = i;
    const match = token.exec(text);
    if (!match) throw new Error(`Unknown move at "${text.slice(i)}"`);
    moves.push({ base: match[1] as PyraBase, amount: match[2] ? 3 : 1 });
    i += match[0].length;
  }
  return moves;
}

export const pyraMoveToString = (m: PyraMove) => m.base + (m.amount === 3 ? "'" : "");
export const invertPyraMove = (m: PyraMove): PyraMove => ({ base: m.base, amount: m.amount === 1 ? 3 : 1 });

export const PYRA_SOLVED: PyraState = PYRA_FACES.map((f) => PYRA_SCHEME[f].repeat(9)).join("");

export function isPyraSolved(state: PyraState): boolean {
  for (let f = 0; f < 4; f++) for (let i = 1; i < 9; i++) if (state[f * 9 + i] !== state[f * 9]) return false;
  return true;
}

// ---- Pieces --------------------------------------------------------------------------------

/** Sticker indices of a corner's tip, or of its center, one per face around the corner. */
const stickersOf = (kind: "tip" | "center", corner: Corner) =>
  PYRA_STICKERS.flatMap((s, i) => (s.kind === kind && s.corners[0] === corner ? [i] : []));

export const TIPS: Record<Corner, number[]> = Object.fromEntries(CORNERS.map((c) => [c, stickersOf("tip", c)])) as Record<
  Corner,
  number[]
>;
export const CENTERS: Record<Corner, number[]> = Object.fromEntries(
  CORNERS.map((c) => [c, stickersOf("center", c)]),
) as Record<Corner, number[]>;

export interface PyraEdge {
  /** The two corners it lies between. */
  corners: [Corner, Corner];
  stickers: [number, number];
}

export const EDGES: PyraEdge[] = [];
PYRA_STICKERS.forEach((s, i) => {
  if (s.kind !== "edge") return;
  const known = EDGES.find((e) => e.corners.every((c) => s.corners.includes(c)));
  if (known) known.stickers[1] = i;
  else EDGES.push({ corners: [s.corners[0], s.corners[1]], stickers: [i, -1] });
});

/** Whether these stickers have their solved colors. */
export const inPlace = (state: PyraState, stickers: readonly number[]) => stickers.every((i) => state[i] === PYRA_SOLVED[i]);

/** The colors of a piece when solved: its place's colors. */
export const homeColors = (stickers: readonly number[]) => stickers.map((i) => PYRA_SOLVED[i] as Color);

/** Random scramble: turns of the four corners (never the same one twice in a row), then the tips. */
export function randomPyraScramble(length = 14, random = Math.random): PyraMove[] {
  const moves: PyraMove[] = [];
  while (moves.length < length) {
    const base = CORNERS[Math.floor(random() * 4)];
    if (moves.length && moves[moves.length - 1].base === base) continue;
    moves.push({ base, amount: random() < 0.5 ? 1 : 3 });
  }
  for (const corner of CORNERS) {
    const turn = Math.floor(random() * 3);
    if (turn > 0) moves.push({ base: corner.toLowerCase() as PyraBase, amount: turn === 1 ? 1 : 3 });
  }
  return moves;
}
