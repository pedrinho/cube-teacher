// The one-piece pyraminx: a tetrahedron with one sticker per face, the pyraminx's 1x1x1. Every
// move turns the whole piece a third of a turn around its corner (a tip turns it the same as its
// corner), so a state only says which way it is held. A state is a 4-character string of colors,
// one per face in the order F L R D, like the pyraminx's.
import {
  CORNER_POS,
  FACE_CORNERS,
  PYRA_FACES,
  PYRA_SCHEME,
  cornerOf,
  turnVec,
  type PyraFace,
  type PyraMove,
  type PyraState,
  type Vec,
} from "./model";

const sum = (vs: Vec[]): Vec => vs.reduce<Vec>((a, v) => [a[0] + v[0], a[1] + v[1], a[2] + v[2]], [0, 0, 0]);
const close = (a: Vec, b: Vec) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < 1e-9;

export interface Pyra1Sticker {
  face: PyraFace;
  /** The whole face, and its middle. */
  triangle: [Vec, Vec, Vec];
  center: Vec;
  normal: Vec;
}

export const PYRA_1_STICKERS: Pyra1Sticker[] = PYRA_FACES.map((face) => {
  const triangle = FACE_CORNERS[face].map((c) => CORNER_POS[c]) as [Vec, Vec, Vec];
  const center = sum(triangle).map((x) => x / 3) as unknown as Vec;
  // A regular tetrahedron's faces are a third of the way from its center to a corner: the
  // middle of a face, made a unit long, is its normal.
  const length = Math.hypot(...center);
  return { face, triangle, center, normal: center.map((x) => x / length) as unknown as Vec };
});

export const PYRA_1_SOLVED: PyraState = PYRA_FACES.map((f) => PYRA_SCHEME[f]).join("");

/** perm[newIndex] = oldIndex, for the whole piece turned clockwise around a corner. */
function thirdTurn(axis: Vec): number[] {
  const perm = [0, 1, 2, 3];
  PYRA_1_STICKERS.forEach((s, i) => {
    perm[PYRA_1_STICKERS.findIndex((t) => close(t.center, turnVec(s.center, axis)))] = i;
  });
  return perm;
}

const PERMS = new Map<string, number[]>();
for (const corner of ["U", "L", "R", "B"] as const) {
  const q = thirdTurn(CORNER_POS[corner]);
  PERMS.set(`${corner}1`, q);
  PERMS.set(`${corner}3`, q.map((i) => q[i]));
}

export function applyPyra1Move(state: PyraState, m: PyraMove): PyraState {
  const perm = PERMS.get(`${cornerOf(m.base)}${m.amount}`)!;
  return perm.map((i) => state[i]).join("");
}

/**
 * Each face is a single sticker, so its colors never mix: it is solved when it is held the way it
 * started, green in front and yellow at the bottom. Turned any other way, it is scrambled.
 */
export const isPyra1Solved = (state: PyraState) => state === PYRA_1_SOLVED;
