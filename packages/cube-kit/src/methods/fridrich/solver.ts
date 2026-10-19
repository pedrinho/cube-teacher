// The Fridrich (CFOP) solver: an optimal white cross on the bottom, then the four F2L pairs with
// Cinoto's algorithms, then OLL and PLL, either in one look (full sets) or in two looks.
import {
  CORNER_SLOTS,
  EDGE_SLOTS,
  applyAlg,
  centers,
  isSolved,
  parseAlg,
  slotColors,
  type Color,
  type CubeState,
  type Move,
} from "../../cube/model";
import { EDGE_TABLE, FACE_MOVES, edgeCode, edgeGoal } from "../../cube/edgeMoves";
import { U_TURNS, Y_TURNS, rotationTo } from "../../cube/orientation";
import { isSolvedPiece, slotOf } from "../../cube/pieces";
import { WHITE_EDGES, YELLOW_CORNERS, crossDone, topColorEdges } from "../layers/goals";
import { Recorder } from "../layers/recorder";
import type { Explain, Stage } from "../types";
import { F2L_CASES, OLL_CASES, PLL_CASES } from "./algs";
import {
  PAIRS,
  buildIndex,
  caseKey,
  f2lDone,
  frontRightPair,
  solvedUpToTop,
  topYellow,
  yellowUp,
  type AlgSet,
  type IndexedCase,
} from "./classify";
import { OLL_CORNER_CASES, OLL_EDGES, PLL_CORNER_CASES, PLL_EDGE_CASES } from "./sets";

export type LastLayer = "full" | "twoLook";

// ---- Case lookups (built once) ----------------------------------------------------------------

let indexes: Record<AlgSet, Map<string, IndexedCase>> | null = null;
function index(set: AlgSet) {
  indexes ??= { f2l: buildIndex("f2l", F2L_CASES), oll: buildIndex("oll", OLL_CASES), pll: buildIndex("pll", PLL_CASES) };
  return indexes[set];
}

/** The case of a cube in a set, the top turn to do first, and its algorithm. */
function lookup(set: AlgSet, s: CubeState) {
  const { key, offset } = caseKey(set, s);
  const found = index(set).get(key);
  if (!found) return null;
  return { ...found, pre: U_TURNS[(offset - found.offset + 4) % 4] };
}

const caseId = (set: AlgSet, c: IndexedCase) => `${set}.${set === "pll" ? PLL_CASES[c.index].name : c.index + 1}`;
const caseExplain = (key: "fr.seg.f2l" | "fr.seg.oll" | "fr.seg.pll", c: IndexedCase, set: AlgSet): Explain => ({
  key: c.name && set !== "pll" ? (`${key}Named` as Explain["key"]) : key,
  values: { n: c.index + 1, name: set === "pll" ? PLL_CASES[c.index].name! : (c.name ?? "") },
});

/** The rotation that puts yellow on top, keeping the front unless yellow is in front or behind. */
function yellowUpMoves(s: CubeState): Move[] {
  const c = centers(s);
  return c.U === "Y" ? [] : rotationTo(s, "Y", c.F === "Y" || c.B === "Y" ? c.U : c.F);
}

/** After an algorithm that ends with the cube turned (x, z or wide moves), hold yellow on top again. */
function backToYellowUp(rec: Recorder) {
  rec.rotate(yellowUpMoves(rec.state), { key: "fr.seg.yellowUp" });
}

// ---- 1. Cross on the bottom ---------------------------------------------------------------------

/** Distance tables for the 4 white edges (331,776 codes), one per goal, built when first needed. */
const crossTables = new Map<string, Uint8Array>();
const encode = (codes: number[]) => codes[0] + 24 * codes[1] + 576 * codes[2] + 13824 * codes[3];

function crossTable(goal: number[]): Uint8Array {
  const id = goal.join(",");
  const cached = crossTables.get(id);
  if (cached) return cached;
  const dist = new Uint8Array(331776).fill(255);
  const queue = new Int32Array(331776);
  let head = 0;
  let tail = 0;
  const start = encode(goal);
  dist[start] = 0;
  queue[tail++] = start;
  while (head < tail) {
    const at = queue[head++];
    const codes = [at % 24, Math.floor(at / 24) % 24, Math.floor(at / 576) % 24, Math.floor(at / 13824)];
    for (const table of EDGE_TABLE) {
      const next = encode(codes.map((c) => table[c]));
      if (dist[next] !== 255) continue;
      dist[next] = dist[at] + 1;
      queue[tail++] = next;
    }
  }
  crossTables.set(id, dist);
  return dist;
}

/** The shortest face turns that make the white cross. */
export function optimalCross(state: CubeState): Move[] {
  const table = crossTable(WHITE_EDGES.map((p) => edgeGoal(state, p)));
  let codes = WHITE_EDGES.map((p) => edgeCode(state, p));
  const moves: Move[] = [];
  while (table[encode(codes)] > 0) {
    const d = table[encode(codes)];
    const k = EDGE_TABLE.findIndex((t) => table[encode(codes.map((c) => t[c]))] === d - 1);
    codes = codes.map((c) => EDGE_TABLE[k][c]);
    moves.push(FACE_MOVES[k]);
  }
  return moves;
}

function solveCross(state: CubeState): Recorder {
  const rec = new Recorder(state);
  rec.rotate(yellowUpMoves(rec.state), { key: "fr.seg.flip" });
  if (crossDone(rec.state)) {
    rec.add("info", [], { key: "fr.seg.crossDone" });
    return rec;
  }
  const moves = optimalCross(rec.state);
  rec.add("intuitive", moves, { key: "fr.seg.cross", values: { n: moves.length } });
  return rec;
}

// ---- 2. F2L ----------------------------------------------------------------------------------------

const DFR = CORNER_SLOTS.find((c) => [...c.name].sort().join("") === "DFR")!;
const FR = EDGE_SLOTS.find((e) => [...e.name].sort().join("") === "FR")!;

const inTopOrFrontRight = (s: CubeState, piece: Color[]) => {
  const faces = slotOf(s, piece).faces;
  return faces.includes("U") || (faces.includes("F") && faces.includes("R") && !faces.includes("L"));
};

function solveF2L(state: CubeState): Recorder {
  const rec = new Recorder(state);
  if (f2lDone(rec.state)) {
    rec.add("info", [], { key: "fr.seg.f2lDone" });
    return rec;
  }
  for (let guard = 0; guard < 12 && !f2lDone(rec.state); guard++) {
    const before = PAIRS.filter(([corner, edge]) => isSolvedPiece(rec.state, corner) && isSolvedPiece(rec.state, edge));
    type Plan = { turn: Move[]; held: CubeState; c: NonNullable<ReturnType<typeof lookup>>; cost: number; corner: Color[] };
    let best: Plan | null = null;
    for (const turn of Y_TURNS) {
      const held = applyAlg(rec.state, turn);
      const [corner, edge] = frontRightPair(held);
      if (isSolvedPiece(held, corner) && isSolvedPiece(held, edge)) continue;
      if (!inTopOrFrontRight(held, corner) || !inTopOrFrontRight(held, edge)) continue;
      const c = lookup("f2l", held);
      if (!c) continue;
      const cost = c.pre.length + c.alg.length + (turn.length > 0 ? 0.5 : 0);
      if (!best || cost < best.cost) best = { turn, held, c, cost, corner };
    }
    if (best) {
      rec.rotate(best.turn, { key: "fr.seg.slot", piece: best.corner });
      if (best.c.pre.length) rec.add("align", best.c.pre, { key: "fr.seg.align" });
      rec.add("alg", best.c.alg, caseExplain("fr.seg.f2l", best.c, "f2l"), caseId("f2l", best.c));
    } else {
      // Every unsolved pair has a piece stuck in another pair's slot. Hold a slot that has a piece
      // of another pair at the front right, and take it out with R U R'.
      const sameColors = (a: Color[], b: Color[]) => [...a].sort().join("") === [...b].sort().join("");
      const turn = Y_TURNS.find((t) => {
        const held = applyAlg(rec.state, t);
        const [corner, edge] = frontRightPair(held);
        const c = slotColors(held, DFR);
        const e = slotColors(held, FR);
        return (c.includes("W") && !sameColors(c, corner)) || (!e.includes("Y") && !sameColors(e, edge));
      })!;
      rec.rotate(turn, { key: "fr.seg.slotStuck" });
      rec.add("alg", "R U R'", { key: "fr.seg.extract" }, "f2l.4");
    }
    backToYellowUp(rec);
    if (!crossDone(rec.state) || !before.every(([corner, edge]) => isSolvedPiece(rec.state, corner) && isSolvedPiece(rec.state, edge)))
      throw new Error("F2L broke a solved piece");
  }
  if (!f2lDone(rec.state)) throw new Error("F2L not solved");
  return rec;
}

// ---- 3. OLL ----------------------------------------------------------------------------------------

function addCase(rec: Recorder, set: AlgSet, key: "fr.seg.oll" | "fr.seg.pll", c: NonNullable<ReturnType<typeof lookup>>) {
  if (c.pre.length) rec.add("align", c.pre, { key: "fr.seg.align" });
  rec.add("alg", c.alg, caseExplain(key, c, set), caseId(set, c));
  backToYellowUp(rec);
}

function solveOLL(state: CubeState, mode: LastLayer): Recorder {
  const rec = new Recorder(state);
  backToYellowUp(rec);
  if (topYellow(rec.state)) {
    rec.add("info", [], { key: "fr.seg.ollSkip" });
    return rec;
  }
  if (mode === "twoLook") {
    // Edges first: a line from left to right, or an L at the back left; a dot becomes one of them.
    for (let guard = 0; guard < 4 && topColorEdges(rec.state).length < 4; guard++) {
      const shape = (s: CubeState, a: string, b: string) => {
        const up = topColorEdges(s);
        return up.length === 2 && up.includes(a) && up.includes(b);
      };
      const line = U_TURNS.find((u) => shape(applyAlg(rec.state, u), "UL", "UR"));
      const ell = U_TURNS.find((u) => shape(applyAlg(rec.state, u), "UB", "UL"));
      if (line) {
        if (line.length) rec.add("align", line, { key: "fr.seg.lineAlign" });
        rec.add("alg", OLL_EDGES.line, { key: "fr.seg.line" }, "oll2.line");
      } else if (ell) {
        if (ell.length) rec.add("align", ell, { key: "fr.seg.ellAlign" });
        rec.add("alg", OLL_EDGES.ell, { key: "fr.seg.ell" }, "oll2.ell");
      } else {
        rec.add("alg", OLL_EDGES.line, { key: "fr.seg.dot" }, "oll2.dot");
      }
    }
    if (topYellow(rec.state)) return rec;
    const c = lookup("oll", rec.state);
    if (!c || !OLL_CORNER_CASES.includes(c.index)) throw new Error("Not a corner OLL case");
    addCase(rec, "oll", "fr.seg.oll", c);
  } else {
    const c = lookup("oll", rec.state);
    if (!c) throw new Error("Unknown OLL case");
    addCase(rec, "oll", "fr.seg.oll", c);
  }
  if (!topYellow(rec.state) || !f2lDone(rec.state)) throw new Error("OLL not solved");
  return rec;
}

// ---- 4. PLL ----------------------------------------------------------------------------------------

const cornersInPlace = (s: CubeState) => U_TURNS.some((u) => YELLOW_CORNERS.every((p) => isSolvedPiece(applyAlg(s, u), p)));

function solvePLL(state: CubeState, mode: LastLayer): Recorder {
  const rec = new Recorder(state);
  backToYellowUp(rec);
  if (!solvedUpToTop(rec.state)) {
    if (mode === "twoLook" && !cornersInPlace(rec.state)) {
      // Corners first: try T and Y from each top turn, keep the one that puts the corners in place.
      let best: { pre: Move[]; i: number } | null = null;
      for (const i of PLL_CORNER_CASES)
        for (const pre of U_TURNS) {
          const alg = parseAlg(PLL_CASES[i].algs[0]);
          if (!cornersInPlace(yellowUp(applyAlg(applyAlg(rec.state, pre), alg)))) continue;
          if (!best || pre.length < best.pre.length) best = { pre, i };
        }
      if (!best) throw new Error("No corner PLL fits");
      if (best.pre.length) rec.add("align", best.pre, { key: "fr.seg.align" });
      const name = PLL_CASES[best.i].name!;
      rec.add("alg", PLL_CASES[best.i].algs[0], { key: "fr.seg.pllCorners", values: { name } }, `pll.${name}`);
      backToYellowUp(rec);
    }
    if (!solvedUpToTop(rec.state)) {
      const c = lookup("pll", rec.state);
      if (!c || (mode === "twoLook" && !PLL_EDGE_CASES.includes(c.index))) throw new Error("Unknown PLL case");
      addCase(rec, "pll", "fr.seg.pll", c);
    }
  } else if (!isSolved(rec.state)) {
    rec.add("info", [], { key: "fr.seg.pllSkip" });
  }
  const auf = U_TURNS.find((u) => isSolved(applyAlg(rec.state, u)));
  if (!auf) throw new Error("PLL not solved");
  if (auf.length) rec.add("align", auf, { key: "fr.seg.auf" });
  if (!isSolved(rec.state)) throw new Error("Cube not solved");
  return rec;
}

// ---- All together ----------------------------------------------------------------------------------

export function solveFridrich(state: CubeState, mode: LastLayer = "full"): Stage[] {
  const steps = [solveCross, solveF2L, (s: CubeState) => solveOLL(s, mode), (s: CubeState) => solvePLL(s, mode)];
  const stages: Stage[] = [];
  let current = state;
  steps.forEach((step, i) => {
    const rec = step(current);
    stages.push({ step: i + 1, segments: rec.segments });
    current = rec.state;
  });
  return stages;
}
