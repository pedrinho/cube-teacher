// Sticker-level model of a 3x3x3 cube.
//
// A state is a 54-character string of colors. Stickers are indexed face by face in the order
// U R F D L B (9 each), row by row as the face is seen in the usual unfolded net:
//   U: looking down, F at the bottom      D: looking up, F at the top
//   F, R, B, L: looking straight at the face, U at the top
// Moves are permutations of those 54 positions, generated from the cube's 3D geometry.

export const FACES = ["U", "R", "F", "D", "L", "B"] as const;
export type Face = (typeof FACES)[number];

export const COLORS = ["W", "Y", "G", "B", "R", "O"] as const;
export type Color = (typeof COLORS)[number];

export type CubeState = string;

type Vec = readonly [number, number, number];

const NORMAL: Record<Face, Vec> = {
  U: [0, 1, 0],
  D: [0, -1, 0],
  R: [1, 0, 0],
  L: [-1, 0, 0],
  F: [0, 0, 1],
  B: [0, 0, -1],
};

// In-plane axes of each face as seen in the net: [rightwards, downwards].
const FACE_AXES: Record<Face, [Vec, Vec]> = {
  U: [[1, 0, 0], [0, 0, 1]],
  D: [[1, 0, 0], [0, 0, -1]],
  F: [[1, 0, 0], [0, -1, 0]],
  B: [[-1, 0, 0], [0, -1, 0]],
  R: [[0, 0, -1], [0, -1, 0]],
  L: [[0, 0, 1], [0, -1, 0]],
};

/** Default colors: white on top, green in front (also cubing.js's default orientation). */
export const DEFAULT_SCHEME: Record<Face, Color> = {
  U: "W",
  R: "R",
  F: "G",
  D: "Y",
  L: "O",
  B: "B",
};

const add = (a: Vec, b: Vec, k = 1): Vec => [a[0] + k * b[0], a[1] + k * b[1], a[2] + k * b[2]];
const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec, b: Vec): Vec => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const key = (p: Vec, n: Vec) => `${p.join(",")}|${n.join(",")}`;

/** Position (cubie coordinates, each -1..1) and outward normal of every sticker. */
export const STICKERS: { face: Face; pos: Vec; normal: Vec }[] = [];
const indexOf = new Map<string, number>();
for (const face of FACES) {
  const [right, down] = FACE_AXES[face];
  for (let i = 0; i < 9; i++) {
    const row = Math.floor(i / 3);
    const col = i % 3;
    const pos = add(add(NORMAL[face], right, col - 1), down, row - 1);
    indexOf.set(key(pos, NORMAL[face]), STICKERS.length);
    STICKERS.push({ face, pos, normal: NORMAL[face] });
  }
}

export const stickerIndex = (face: Face, i: number) => FACES.indexOf(face) * 9 + i;
export const centerIndex = (face: Face) => stickerIndex(face, 4);

/** Clockwise quarter turn (seen from the tip of `axis`) applied to a vector. */
function turnVec(v: Vec, axis: Vec): Vec {
  // Rotation by -90°: v' = a(a·v) - a×v
  const c = cross(axis, v);
  const d = dot(axis, v);
  return [axis[0] * d - c[0], axis[1] * d - c[1], axis[2] * d - c[2]];
}

/** perm[newIndex] = oldIndex, for one clockwise quarter turn. */
function quarterTurn(axis: Vec, inLayer: (pos: Vec) => boolean): number[] {
  const perm = STICKERS.map((_, i) => i);
  STICKERS.forEach((s, i) => {
    if (!inLayer(s.pos)) return;
    const target = indexOf.get(key(turnVec(s.pos, axis), turnVec(s.normal, axis)))!;
    perm[target] = i;
  });
  return perm;
}

const compose = (first: number[], second: number[]) => second.map((i) => first[i]);

export const BASE_MOVES = ["U", "D", "L", "R", "F", "B", "M", "E", "S", "x", "y", "z"] as const;
export type BaseMove = (typeof BASE_MOVES)[number];

const LAYER: Record<BaseMove, [Vec, (p: Vec) => boolean]> = {
  U: [NORMAL.U, (p) => p[1] === 1],
  D: [NORMAL.D, (p) => p[1] === -1],
  R: [NORMAL.R, (p) => p[0] === 1],
  L: [NORMAL.L, (p) => p[0] === -1],
  F: [NORMAL.F, (p) => p[2] === 1],
  B: [NORMAL.B, (p) => p[2] === -1],
  M: [NORMAL.L, (p) => p[0] === 0],
  E: [NORMAL.D, (p) => p[1] === 0],
  S: [NORMAL.F, (p) => p[2] === 0],
  x: [NORMAL.R, () => true],
  y: [NORMAL.U, () => true],
  z: [NORMAL.F, () => true],
};

export type Amount = 1 | 2 | 3; // 3 = counter-clockwise (')
export interface Move {
  base: BaseMove;
  amount: Amount;
}

const PERMS = new Map<string, number[]>();
for (const base of BASE_MOVES) {
  const q = quarterTurn(...LAYER[base]);
  const q2 = compose(q, q);
  PERMS.set(`${base}1`, q);
  PERMS.set(`${base}2`, q2);
  PERMS.set(`${base}3`, compose(q2, q));
}

export const isRotation = (m: Move) => m.base === "x" || m.base === "y" || m.base === "z";

export function moveToString(m: Move): string {
  return m.base + (m.amount === 1 ? "" : m.amount === 2 ? "2" : "'");
}

export function parseMove(token: string): Move {
  const match = /^([UDLRFBMESxyz])(2|'|2')?$/.exec(token.trim());
  if (!match) throw new Error(`Unknown move: ${token}`);
  const suffix = match[2] ?? "";
  const amount: Amount = suffix === "" ? 1 : suffix === "'" ? 3 : 2;
  return { base: match[1] as BaseMove, amount };
}

export function parseAlg(alg: string): Move[] {
  return alg
    .split(/\s+/)
    .filter((t) => t.length > 0)
    .map(parseMove);
}

export const algToString = (moves: readonly Move[]) => moves.map(moveToString).join(" ");

export const invertMove = (m: Move): Move => ({ base: m.base, amount: (4 - m.amount) as Amount });
export const invertAlg = (moves: readonly Move[]) => [...moves].reverse().map(invertMove);

export function applyMove(state: CubeState, m: Move): CubeState {
  const perm = PERMS.get(`${m.base}${m.amount}`)!;
  let out = "";
  for (let i = 0; i < 54; i++) out += state[perm[i]];
  return out;
}

export function applyAlg(state: CubeState, alg: string | readonly Move[]): CubeState {
  const moves = typeof alg === "string" ? parseAlg(alg) : alg;
  return moves.reduce(applyMove, state);
}

export function solvedState(scheme: Record<Face, Color> = DEFAULT_SCHEME): CubeState {
  return FACES.map((f) => scheme[f].repeat(9)).join("");
}

export const SOLVED = solvedState();

export function isSolved(state: CubeState): boolean {
  for (let f = 0; f < 6; f++) {
    const c = state[f * 9 + 4];
    for (let i = 0; i < 9; i++) if (state[f * 9 + i] !== c) return false;
  }
  return true;
}

/** Color of each face's center: tells how the cube is being held. */
export function centers(state: CubeState): Record<Face, Color> {
  return Object.fromEntries(FACES.map((f) => [f, state[centerIndex(f)] as Color])) as Record<Face, Color>;
}

// ---- Pieces --------------------------------------------------------------------------------

export interface PieceSlot {
  /** Sticker indices. Corners: U/D sticker first, then clockwise. Edges: U/D (else F/B) sticker first. */
  stickers: number[];
  /** Faces of those stickers, same order. */
  faces: Face[];
  name: string;
}

function slotsWith(count: 2 | 3): PieceSlot[] {
  const byPos = new Map<string, number[]>();
  STICKERS.forEach((s, i) => {
    const nonZero = s.pos.filter((c) => c !== 0).length;
    if (nonZero !== count) return;
    const k = s.pos.join(",");
    byPos.set(k, [...(byPos.get(k) ?? []), i]);
  });
  const rank = (f: Face) => "UDFBRL".indexOf(f);
  return [...byPos.values()].map((idx) => {
    let ordered = [...idx].sort((a, b) => rank(STICKERS[a].face) - rank(STICKERS[b].face));
    if (count === 3) {
      // Keep the U/D sticker first and order the other two clockwise around the corner.
      const [a, b, c] = ordered;
      const p = STICKERS[a].pos;
      const turn = dot(cross(STICKERS[a].normal, STICKERS[b].normal), p);
      ordered = turn < 0 ? [a, b, c] : [a, c, b];
    }
    const faces = ordered.map((i) => STICKERS[i].face);
    return { stickers: ordered, faces, name: faces.join("") };
  });
}

export const EDGE_SLOTS = slotsWith(2);
export const CORNER_SLOTS = slotsWith(3);

export const slotColors = (state: CubeState, slot: PieceSlot) => slot.stickers.map((i) => state[i] as Color);

/** Finds the slot holding the piece with exactly these colors (in any orientation). */
export function findPiece(state: CubeState, colors: readonly Color[]): PieceSlot | undefined {
  const slots = colors.length === 2 ? EDGE_SLOTS : CORNER_SLOTS;
  const want = [...colors].sort().join("");
  return slots.find((s) => slotColors(state, s).sort().join("") === want);
}

/** Random face-turn scramble (no consecutive turns of the same face). */
export function randomScramble(length = 20, random = Math.random): Move[] {
  const faces: BaseMove[] = ["U", "D", "L", "R", "F", "B"];
  const moves: Move[] = [];
  while (moves.length < length) {
    const base = faces[Math.floor(random() * 6)];
    const prev = moves[moves.length - 1];
    if (prev && prev.base === base) continue;
    moves.push({ base, amount: (1 + Math.floor(random() * 3)) as Amount });
  }
  return moves;
}
