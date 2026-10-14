// Identifies F2L, OLL and PLL cases by simulation. A case gets a canonical key that doesn't change
// when the top layer is turned (and, for PLL, when the top colors are rotated), so a cube can be
// matched to the algorithm that solves it, together with the top turn to do first.
import {
  applyAlg,
  centers,
  invertAlg,
  isSolved,
  parseAlg,
  stickerIndex,
  type Color,
  type CubeState,
  type Face,
  type Move,
} from "../../cube/model";
import { U_TURNS, rotationTo } from "../../cube/orientation";
import { isSolvedPiece, slotOf } from "../../cube/pieces";
import { YELLOW_UP } from "../layers/pictures";
import { SIDE_COLORS, crossDone } from "../layers/goals";
import type { AlgCase } from "./algs";

export type AlgSet = "f2l" | "oll" | "pll";

/** The same cube held with yellow on top (keeping the front when possible). */
export function yellowUp(s: CubeState): CubeState {
  const c = centers(s);
  if (c.U === "Y") return s;
  return applyAlg(s, rotationTo(s, "Y", c.F === "Y" || c.B === "Y" ? c.U : c.F));
}

/** The four F2L pairs: a white corner and the edge between the same two side colors. */
export const PAIRS: Color[][][] = SIDE_COLORS.map((c, i) => {
  const next = SIDE_COLORS[(i + 1) % 4];
  return [["W", c, next], [c, next]];
});
const pairSolved = (s: CubeState, [corner, edge]: Color[][]) => isSolvedPiece(s, corner) && isSolvedPiece(s, edge);
/** The pair whose place is the front right slot. */
export function frontRightPair(s: CubeState): Color[][] {
  const c = centers(s);
  return [["W", c.F, c.R], [c.F, c.R]];
}
const samePair = (a: Color[][], b: Color[][]) => [...a[0]].sort().join("") === [...b[0]].sort().join("");

export const f2lDone = (s: CubeState) => crossDone(s) && PAIRS.every((p) => pairSolved(s, p));
const SIDES: Face[] = ["F", "R", "B", "L"];
const TOP: number[] = [
  ...Array.from({ length: 9 }, (_, i) => stickerIndex("U", i)),
  ...SIDES.flatMap((f) => [0, 1, 2].map((i) => stickerIndex(f, i))),
];
const SIDE_TOP: number[] = TOP.slice(9);
export const topYellow = (s: CubeState) => TOP.slice(0, 9).every((i) => s[i] === centers(s).U);
export const solvedUpToTop = (s: CubeState) => U_TURNS.some((u) => isSolved(applyAlg(s, u)));

/** What has to be true before an algorithm of the set is used, and after. */
function before(set: AlgSet, s: CubeState): boolean {
  if (set === "f2l") {
    const fr = frontRightPair(s);
    return crossDone(s) && !pairSolved(s, fr) && PAIRS.filter((p) => !samePair(p, fr)).every((p) => pairSolved(s, p));
  }
  if (!f2lDone(s)) return false;
  return set === "oll" ? !topYellow(s) : topYellow(s) && !solvedUpToTop(s);
}

function after(set: AlgSet, s: CubeState): boolean {
  if (set === "f2l") return f2lDone(s);
  if (set === "oll") return f2lDone(s) && topYellow(s);
  return solvedUpToTop(s);
}

/** Key of one position of the case (no top turn applied). */
function rawKeys(set: AlgSet, s: CubeState): string[] {
  const c = centers(s);
  if (set === "f2l") {
    const [corner, edge] = frontRightPair(s);
    const cs = slotOf(s, corner);
    const es = slotOf(s, edge);
    const name = (n: string) => [...n].sort().join("");
    return [`${name(cs.name)}${cs.stickers.findIndex((i) => s[i] === "W")}-${name(es.name)}${es.stickers.findIndex((i) => s[i] === c.F)}`];
  }
  if (set === "oll") return [TOP.map((i) => (s[i] === c.U ? "1" : "0")).join("")];
  // PLL: the side colors of the top row, also with the colors rotated around the cube.
  const order = [c.F, c.R, c.B, c.L];
  return [0, 1, 2, 3].map((shift) => SIDE_TOP.map((i) => (order.indexOf(s[i] as Color) + shift) % 4).join(""));
}

/** The canonical key of a case, and how many quarter turns of the top (U) lead to it. */
export function caseKey(set: AlgSet, s: CubeState): { key: string; offset: number } {
  let best = { key: "", offset: 0 };
  U_TURNS.forEach((u, offset) => {
    for (const key of rawKeys(set, applyAlg(s, u))) if (!best.key || key < best.key) best = { key, offset };
  });
  return best;
}

export interface Classified {
  key: string;
  /** Top turns from the canonical position to the position this algorithm starts from. */
  offset: number;
  /** A cube this algorithm solves, held as the algorithm expects (yellow on top). */
  setup: CubeState;
}

/**
 * Finds which case an algorithm solves, or null if it doesn't solve a case of the set.
 * The algorithm starts with yellow on top and blue in front; algorithms with x, z or wide moves
 * may end with the cube held differently, so the case is built by undoing the algorithm from
 * that end position.
 */
export function classifyAlg(set: AlgSet, alg: string): Classified | null {
  const moves = parseAlg(alg);
  const end = centers(applyAlg(YELLOW_UP, moves));
  const solvedAtEnd = applyAlg(YELLOW_UP, rotationTo(YELLOW_UP, end.U, end.F));
  const setup = applyAlg(solvedAtEnd, invertAlg(moves));
  if (!before(set, setup) || !after(set, yellowUp(applyAlg(setup, moves)))) return null;
  return { ...caseKey(set, setup), setup };
}

export interface IndexedCase {
  /** Position in the guide's list (0-based). */
  index: number;
  name?: string;
  alg: Move[];
  offset: number;
  setup: CubeState;
}

/** Case key → the case's main algorithm (the first one that checks out). */
export function buildIndex(set: AlgSet, cases: AlgCase[]): Map<string, IndexedCase> {
  const index = new Map<string, IndexedCase>();
  cases.forEach((c, i) => {
    for (const alg of c.algs) {
      const found = classifyAlg(set, alg);
      if (!found) continue;
      if (!index.has(found.key)) index.set(found.key, { index: i, name: c.name, alg: parseAlg(alg), offset: found.offset, setup: found.setup });
      break;
    }
  });
  return index;
}
