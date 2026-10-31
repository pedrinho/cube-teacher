// Sticker-level model of a small cuboid: the 1x1x1, 1x1x2 and 1x1x3 of Cube Hero's first levels,
// and others like the 2x2x1 later.
//
// Built from its geometry, like the 3x3's: cubies sit on a grid centered on the origin (at halves
// when a side is even), every outer side of a cubie has a sticker, and moves are permutations of
// the stickers. A state is a string of colors, one per sticker, face by face in the order U R F D L
// B. Moves are written like the cube's (U, D, E, y…), and a cuboid only makes the quarter turns that
// keep its shape: around an axis whose cross-section is square. A 1x1x2 turns U, D and y; a 1x1x3
// also turns its middle layer, E, which like the cube's turns the way D does.
import { DEFAULT_SCHEME, FACES, type BaseMove, type Face, type Move, type Vec } from "../cube/model";

const NORMAL: Record<Face, Vec> = {
  U: [0, 1, 0],
  D: [0, -1, 0],
  R: [1, 0, 0],
  L: [-1, 0, 0],
  F: [0, 0, 1],
  B: [0, 0, -1],
};

const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec, b: Vec): Vec => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
// + 0 turns -0 into 0, so keys match.
const key = (p: Vec, n: Vec) => `${p.map((c) => c + 0).join(",")}|${n.map((c) => c + 0).join(",")}`;

/** Clockwise quarter turn (seen from the tip of `axis`) applied to a vector. */
function turnVec(v: Vec, axis: Vec): Vec {
  const c = cross(axis, v);
  const d = dot(axis, v);
  return [axis[0] * d - c[0], axis[1] * d - c[1], axis[2] * d - c[2]];
}

const compose = (first: number[], second: number[]) => second.map((i) => first[i]);

/** The moves a cuboid can know: its outer layers, middle layers and whole-cuboid turns. */
const CUBOID_MOVES = ["U", "D", "R", "L", "F", "B", "M", "E", "S", "x", "y", "z"] as const satisfies readonly BaseMove[];

/** Which axis (0 = x, 1 = y, 2 = z) a move turns around. */
const AXIS_OF: Record<(typeof CUBOID_MOVES)[number], number> = {
  U: 1, D: 1, E: 1, y: 1,
  R: 0, L: 0, M: 0, x: 0,
  F: 2, B: 2, S: 2, z: 2,
};

/** The face each middle layer turns like, as on the cube: M like L, E like D, S like F. */
const SLICE_FACE: Partial<Record<BaseMove, Face>> = { M: "L", E: "D", S: "F" };

export interface Cuboid {
  /** Cubies along x, y and z (right, up, front). */
  dims: Vec;
  /** Where each cubie sits. */
  cubies: Vec[];
  /** Position (its cubie's) and outward normal of every sticker. */
  stickers: { face: Face; pos: Vec; normal: Vec }[];
  solved: string;
  /** The moves it can make. */
  moves: BaseMove[];
  apply: (state: string, move: Move) => string;
  /** The rotation axis of a move and which cubie positions it turns. */
  moveLayer: (base: BaseMove) => { axis: Vec; inLayer: (pos: Vec) => boolean };
  isSolved: (state: string) => boolean;
}

export function makeCuboid(dims: Vec): Cuboid {
  const half = dims.map((n) => (n - 1) / 2);
  const cubies: Vec[] = [];
  for (let x = -half[0]; x <= half[0]; x++)
    for (let y = -half[1]; y <= half[1]; y++) for (let z = -half[2]; z <= half[2]; z++) cubies.push([x + 0, y + 0, z + 0]);

  const stickers: Cuboid["stickers"] = [];
  const indexOf = new Map<string, number>();
  for (const face of FACES) {
    const normal = NORMAL[face];
    const axis = normal.findIndex((c) => c !== 0);
    for (const pos of cubies) {
      if (pos[axis] !== half[axis] * normal[axis]) continue;
      indexOf.set(key(pos, normal), stickers.length);
      stickers.push({ face, pos, normal });
    }
  }

  // A quarter turn keeps the shape when the two other sides are the same length. A middle layer
  // needs a middle: an odd number of layers, at least three.
  const moves = CUBOID_MOVES.filter((m) => {
    const axis = AXIS_OF[m];
    const [a, b] = [0, 1, 2].filter((i) => i !== axis);
    return dims[a] === dims[b] && (!SLICE_FACE[m] || (dims[axis] >= 3 && dims[axis] % 2 === 1));
  });

  const layer = (base: BaseMove): { axis: Vec; inLayer: (pos: Vec) => boolean } => {
    if (base === "x" || base === "y" || base === "z") {
      return { axis: NORMAL[base === "x" ? "R" : base === "y" ? "U" : "F"], inLayer: () => true };
    }
    const slice = SLICE_FACE[base];
    if (slice) {
      const normal = NORMAL[slice];
      const axis = normal.findIndex((c) => c !== 0);
      return { axis: normal, inLayer: (p) => p[axis] === 0 };
    }
    const normal = NORMAL[base as Face];
    const axis = normal.findIndex((c) => c !== 0);
    return { axis: normal, inLayer: (p) => p[axis] === half[axis] * normal[axis] };
  };

  const perms = new Map<string, number[]>();
  for (const base of moves) {
    const { axis, inLayer } = layer(base);
    const q = stickers.map((_, i) => i);
    stickers.forEach((s, i) => {
      if (inLayer(s.pos)) q[indexOf.get(key(turnVec(s.pos, axis), turnVec(s.normal, axis)))!] = i;
    });
    const q2 = compose(q, q);
    perms.set(`${base}1`, q);
    perms.set(`${base}2`, q2);
    perms.set(`${base}3`, compose(q2, q));
  }

  const apply = (state: string, m: Move) => {
    const perm = perms.get(`${m.base}${m.amount}`);
    if (!perm) throw new Error(`A ${dims.join("x")} can't turn ${m.base}`);
    let out = "";
    for (let i = 0; i < perm.length; i++) out += state[perm[i]];
    return out;
  };

  const isSolved = (state: string) =>
    FACES.every((face) => {
      const own = stickers.flatMap((s, i) => (s.face === face ? [state[i]] : []));
      return own.every((c) => c === own[0]);
    });

  const solved = stickers.map((s) => DEFAULT_SCHEME[s.face]).join("");
  return { dims, cubies, stickers, solved, moves, apply, moveLayer: layer, isSolved };
}

export const CUBE_1 = makeCuboid([1, 1, 1]);
/** Two cubies, one on top of the other. */
export const CUBE_1x2 = makeCuboid([1, 2, 1]);
/** Three cubies, one on top of the other. */
export const CUBE_1x3 = makeCuboid([1, 3, 1]);

export const CUBOIDS = { "1x1x1": CUBE_1, "1x1x2": CUBE_1x2, "1x1x3": CUBE_1x3 } as const;
export type CuboidId = keyof typeof CUBOIDS;
