// The corner twist pyraminx: a tetrahedron of just four corners, a pyraminx that's all tips. Each
// face is cut into three kites, one per corner, by a Y from its middle to the middles of its sides,
// and a move twists one corner a third of a turn in place, its three kites going round, while
// nothing else moves (a tip turns it the same as its corner: it's all tip). A state is a
// 12-character string of colors, three per face in the order F L R D, each face's kites in the
// order of its corners (top, left, right), like the pyraminx's.
import {
  CORNERS,
  CORNER_POS,
  FACE_CORNERS,
  PYRA_FACES,
  PYRA_SCHEME,
  cornerOf,
  turnVec,
  type Corner,
  type PyraFace,
  type PyraMove,
  type PyraState,
  type Vec,
} from "./model";

const mean = (vs: Vec[]): Vec => {
  const [x, y, z] = vs.reduce((a, v) => [a[0] + v[0], a[1] + v[1], a[2] + v[2]], [0, 0, 0]);
  return [x / vs.length, y / vs.length, z / vs.length];
};
const close = (a: Vec, b: Vec) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < 1e-9;

export interface PyraTwistSticker {
  face: PyraFace;
  corner: Corner;
  /** The kite: its corner, the middle of one side, the middle of the face, the middle of the other. */
  outline: [Vec, Vec, Vec, Vec];
  center: Vec;
  normal: Vec;
}

export const PYRA_TWIST_STICKERS: PyraTwistSticker[] = PYRA_FACES.flatMap((face) => {
  const corners = FACE_CORNERS[face];
  const middle = mean(corners.map((c) => CORNER_POS[c]));
  // A regular tetrahedron's faces are a third of the way from its center to a corner: the middle
  // of a face, made a unit long, is its normal.
  const length = Math.hypot(...middle);
  const normal = middle.map((x) => x / length) as unknown as Vec;
  return corners.map((corner, k) => {
    const at = CORNER_POS[corner];
    const next = mean([at, CORNER_POS[corners[(k + 1) % 3]]]);
    const previous = mean([at, CORNER_POS[corners[(k + 2) % 3]]]);
    const outline: [Vec, Vec, Vec, Vec] = [at, next, middle, previous];
    return { face, corner, outline, center: mean(outline), normal };
  });
});

export const PYRA_TWIST_SOLVED: PyraState = PYRA_TWIST_STICKERS.map((s) => PYRA_SCHEME[s.face]).join("");

/** perm[newIndex] = oldIndex, for a corner twisted clockwise, as seen looking at it. */
function thirdTurn(corner: Corner): number[] {
  const axis = CORNER_POS[corner];
  const perm = PYRA_TWIST_STICKERS.map((_, i) => i);
  PYRA_TWIST_STICKERS.forEach((s, i) => {
    if (s.corner !== corner) return;
    const to = PYRA_TWIST_STICKERS.findIndex((t) => close(t.center, turnVec(s.center, axis)));
    if (to < 0) throw new Error("A twist moved a kite off the puzzle");
    perm[to] = i;
  });
  return perm;
}

const PERMS = new Map<string, number[]>();
for (const corner of CORNERS) {
  const q = thirdTurn(corner);
  PERMS.set(`${corner}1`, q);
  PERMS.set(`${corner}3`, q.map((i) => q[i]));
}

export function applyPyraTwistMove(state: PyraState, m: PyraMove): PyraState {
  const perm = PERMS.get(`${cornerOf(m.base)}${m.amount}`)!;
  return perm.map((i) => state[i]).join("");
}

/**
 * Solved when every face is one color. The corners only twist in place, so that's only when all
 * four are back the way they started: a face's three corners share just its own color.
 */
export function isPyraTwistSolved(state: PyraState): boolean {
  for (let f = 0; f < 12; f += 3) if (state[f + 1] !== state[f] || state[f + 2] !== state[f]) return false;
  return true;
}
