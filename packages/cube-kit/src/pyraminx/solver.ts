// Beginner's method for the Pyraminx, held with yellow on the bottom and green in front:
//   1. Tips: turn each tip to match the center next to it.
//   2. Centers: turn the left, right and back corners so their centers have yellow at the bottom.
//   3. Yellow base: put the three yellow edges in, one at a time.
//   4. Top: solve the last three edges and turn the top to finish.
// Tips are done first, so the bigger turns after carry them along. Steps 3 and 4 have no fixed
// cases: they find the shortest moves that do the job, like the cube's cross.
import type { Segment, Stage } from "../methods/types";
import {
  CENTERS,
  CORNERS,
  EDGES,
  PYRA_SOLVED,
  TIPS,
  applyPyraMove,
  homeColors,
  inPlace,
  invertPyraMove,
  type Corner,
  type PyraBase,
  type PyraEdge,
  type PyraMove,
  type PyraState,
} from "./model";

/** The turns used after the tips: every corner, both ways. */
const TURNS: PyraMove[] = CORNERS.flatMap((base) => [
  { base, amount: 1 as const },
  { base, amount: 3 as const },
]);

const apply = (state: PyraState, moves: readonly PyraMove[]) => moves.reduce(applyPyraMove, state);

function segment(kind: Segment["kind"], moves: PyraMove[], explain: Segment["explain"], before: PyraState): Segment {
  return { kind, moves, explain, before, after: apply(before, moves) };
}

/** The turn (or none) of `base` that makes `done` true, trying none, clockwise, then counterclockwise. */
function turnUntil(state: PyraState, base: PyraBase, done: (s: PyraState) => boolean): PyraMove[] {
  for (const moves of [[], [{ base, amount: 1 }], [{ base, amount: 3 }]] as PyraMove[][])
    if (done(apply(state, moves))) return moves;
  throw new Error(`No turn of ${base} works`);
}

// ---- 1. Tips -------------------------------------------------------------------------------

/** A tip matches when each of its stickers has the color of the center sticker next to it. */
const tipMatches = (state: PyraState, corner: Corner) => TIPS[corner].every((t, k) => state[t] === state[CENTERS[corner][k]]);

function tips(state: PyraState): Stage {
  const moves = CORNERS.flatMap((c) => turnUntil(state, c.toLowerCase() as PyraBase, (s) => tipMatches(s, c)));
  return {
    step: 1,
    segments: [segment(moves.length ? "align" : "info", moves, { key: moves.length ? "py.seg.tips" : "py.seg.tipsDone" }, state)],
  };
}

// ---- 2. Centers ----------------------------------------------------------------------------

const BASE_CORNERS = ["L", "R", "B"] as const satisfies Corner[];

function centers(state: PyraState): Stage {
  const moves: PyraMove[] = [];
  let s = state;
  for (const c of BASE_CORNERS) {
    const turn = turnUntil(s, c, (t) => inPlace(t, CENTERS[c]));
    moves.push(...turn);
    s = apply(s, turn);
  }
  return {
    step: 2,
    segments: [
      segment(moves.length ? "align" : "info", moves, { key: moves.length ? "py.seg.centers" : "py.seg.centersDone" }, state),
    ],
  };
}

// ---- 3. Yellow base ------------------------------------------------------------------------

const BASE_EDGES = EDGES.filter((e) => !e.corners.includes("U"));

/**
 * The state as far as a step cares: the base centers and the tracked edges keep their colors,
 * everything else is blank. Pieces move as a whole, so turns work on these just as on states.
 */
function masked(state: PyraState, tracked: readonly PyraEdge[]): string {
  const out = Array<string>(36).fill(".");
  for (const c of BASE_CORNERS) for (const i of CENTERS[c]) out[i] = state[i];
  const pairs = new Set(tracked.map((e) => pairOf(PYRA_SOLVED, e)));
  for (const e of EDGES) if (pairs.has(pairOf(state, e))) for (const i of e.stickers) out[i] = state[i];
  return out.join("");
}

const pairOf = (state: PyraState, e: PyraEdge) => [state[e.stickers[0]], state[e.stickers[1]]].sort().join("");

/**
 * Moves from every masked state to the one with the tracked edges in place. There are only a
 * few thousand, so a table per set of edges is quick to make; it is kept for the next song.
 */
const tables = new Map<string, Map<string, number>>();
function distances(tracked: readonly PyraEdge[]) {
  const id = tracked.map((e) => EDGES.indexOf(e)).sort().join();
  let table = tables.get(id);
  if (table) return table;
  const goal = masked(PYRA_SOLVED, tracked);
  table = new Map([[goal, 0]]);
  let frontier = [goal];
  for (let depth = 1; frontier.length; depth++) {
    const next: string[] = [];
    for (const s of frontier)
      for (const m of TURNS) {
        const t = applyPyraMove(s, m);
        if (table.has(t)) continue;
        table.set(t, depth);
        next.push(t);
      }
    frontier = next;
  }
  tables.set(id, table);
  return table;
}

/** Shortest moves that put the tracked edges in place, top turns first when that's as short. */
function descend(state: PyraState, tracked: readonly PyraEdge[]): PyraMove[] {
  const table = distances(tracked);
  let s = masked(state, tracked);
  const moves: PyraMove[] = [];
  for (let d = table.get(s)!; d > 0; d--) {
    const m = TURNS.find((m) => table.get(applyPyraMove(s, m)) === d - 1)!;
    moves.push(m);
    s = applyPyraMove(s, m);
  }
  return moves;
}

/** Splits off the top turns at the start of an insertion: they line the edge up. */
function splitAlign(moves: PyraMove[]) {
  let k = 0;
  while (k < moves.length && moves[k].base === "U") k++;
  return [moves.slice(0, k), moves.slice(k)];
}

function base(state: PyraState): Stage {
  const segments: Segment[] = [];
  let s = state;
  let todo = BASE_EDGES.filter((e) => !inPlace(s, e.stickers));
  if (todo.length === 0) segments.push(segment("info", [], { key: "py.seg.baseDone" }, s));
  while (todo.length) {
    const done = BASE_EDGES.filter((e) => !todo.includes(e));
    // The edge that goes in with the fewest moves, keeping the ones already in.
    const options = todo.map((edge) => ({ edge, moves: descend(s, [...done, edge]) }));
    const best = options.reduce((a, b) => (b.moves.length < a.moves.length ? b : a));
    // Named yellow first, like the cube's white pieces.
    const piece = homeColors(best.edge.stickers).sort((a, b) => Number(b === "Y") - Number(a === "Y"));
    const [align, insert] = splitAlign(best.moves);
    if (align.length) {
      segments.push(segment("align", align, { key: "py.seg.edgeAlign", piece }, s));
      s = apply(s, align);
    }
    segments.push(segment("intuitive", insert, { key: "py.seg.edge", piece }, s));
    s = apply(s, insert);
    todo = todo.filter((e) => e !== best.edge && !inPlace(s, e.stickers));
  }
  return { step: 3, segments };
}

// ---- 4. Top --------------------------------------------------------------------------------

/** How deep the table of states near solved goes; with the search below it covers any pyraminx (11 moves). */
const NEAR = 6;
let near: Map<PyraState, PyraMove[]> | null = null;

/** Every state up to NEAR moves from solved, with the moves that solve it. */
function nearSolved() {
  if (near) return near;
  near = new Map([[PYRA_SOLVED, []]]);
  let frontier = [PYRA_SOLVED];
  for (let depth = 0; depth < NEAR; depth++) {
    const next: PyraState[] = [];
    for (const s of frontier) {
      const toSolved = near.get(s)!;
      for (const m of TURNS) {
        const t = applyPyraMove(s, m);
        if (near.has(t)) continue;
        near.set(t, [invertPyraMove(m), ...toSolved]);
        next.push(t);
      }
    }
    frontier = next;
  }
  return near;
}

/**
 * Shortest solve with corner turns (the tips must already be done): look a few moves ahead
 * until the table is reached. The table has every state that close to solved, so the first
 * level that reaches it holds a shortest solve. The top always takes fewer moves than NEAR, so
 * there it is found right away.
 */
export function solveTurns(start: PyraState): PyraMove[] {
  const table = nearSolved();
  let level = new Map<PyraState, PyraMove[]>([[start, []]]);
  const seen = new Set([start]);
  for (let depth = 0; depth <= 11 - NEAR; depth++) {
    let best: PyraMove[] | null = null;
    for (const [s, path] of level) {
      const rest = table.get(s);
      if (rest && (!best || path.length + rest.length < best.length)) best = [...path, ...rest];
    }
    if (best) return best;
    const next = new Map<PyraState, PyraMove[]>();
    for (const [s, path] of level)
      for (const m of TURNS) {
        if (m.base === path[path.length - 1]?.base) continue;
        const t = applyPyraMove(s, m);
        if (seen.has(t)) continue;
        seen.add(t);
        next.set(t, [...path, m]);
      }
    level = next;
  }
  throw new Error("Not a pyraminx that can be solved");
}

function top(state: PyraState): Stage {
  if (state === PYRA_SOLVED) return { step: 4, segments: [segment("info", [], { key: "py.seg.done" }, state)] };
  const moves = solveTurns(state);
  // Top turns at the end just line the top up.
  let k = moves.length;
  while (k > 0 && moves[k - 1].base === "U") k--;
  const segments: Segment[] = [];
  let s = state;
  if (k > 0) {
    segments.push(segment("intuitive", moves.slice(0, k), { key: "py.seg.top", values: { n: k } }, s));
    s = apply(s, moves.slice(0, k));
  }
  if (k < moves.length) segments.push(segment("align", moves.slice(k), { key: "py.seg.topAlign" }, s));
  return { step: 4, segments };
}

// ---- The whole solve ---------------------------------------------------------------------------

export function solvePyraminx(start: PyraState): Stage[] {
  const stages: Stage[] = [];
  let state = start;
  for (const step of [tips, centers, base, top]) {
    const stage = step(state);
    stages.push(stage);
    state = stage.segments[stage.segments.length - 1].after;
  }
  return stages;
}
