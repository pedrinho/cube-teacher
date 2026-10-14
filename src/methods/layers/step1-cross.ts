// Step 1 (Cruz): white cross on top, one edge at a time. The cube is turned so the edge's other
// color faces you, then the shortest moves put it at the top front without breaking the
// edges already placed.
import { EDGE_SLOTS, applyAlg, centers, movePerm, type Amount, type BaseMove, type Color, type CubeState, type Move } from "../../cube/model";
import { rotationTo } from "../../cube/orientation";
import { homeOf, isSolvedPiece, slotOf } from "../../cube/pieces";
import { WHITE_EDGES, crossDone } from "./goals";
import { Recorder } from "./recorder";

// When two solutions are equally short, prefer the faces kids use most.
const MOVES: Move[] = (["F", "R", "U", "L", "B", "D"] as BaseMove[]).flatMap((base) =>
  ([1, 3, 2] as Amount[]).map((amount) => ({ base, amount })),
);

// An edge's position and orientation, encoded as slot * 2 + (index of its white sticker in the slot).
const STICKER_CODE = new Map<number, number>();
EDGE_SLOTS.forEach((slot, i) => slot.stickers.forEach((st, k) => STICKER_CODE.set(st, i * 2 + k)));

const EDGE_TABLE: number[][] = MOVES.map((m) => {
  const dest: number[] = [];
  movePerm(m).forEach((oldIndex, newIndex) => (dest[oldIndex] = newIndex));
  return Array.from({ length: 24 }, (_, code) => STICKER_CODE.get(dest[EDGE_SLOTS[code >> 1].stickers[code & 1]])!);
});

function codeOf(state: CubeState, piece: Color[]): number {
  const slot = slotOf(state, piece);
  return EDGE_SLOTS.indexOf(slot) * 2 + slot.stickers.findIndex((i) => state[i] === "W");
}

function goalOf(state: CubeState, piece: Color[]): number {
  const home = homeOf(state, piece);
  const c = centers(state);
  return EDGE_SLOTS.indexOf(home) * 2 + home.faces.findIndex((f) => c[f] === "W");
}

/** Shortest face turns that bring every tracked edge to its goal. */
function search(start: number[], goal: number[]): Move[] {
  const enc = (codes: number[]) => codes.reduce((acc, c, i) => acc + c * 24 ** i, 0);
  const goalKey = enc(goal);
  const startKey = enc(start);
  if (startKey === goalKey) return [];
  const parent = new Map<number, [number, number]>([[startKey, [-1, -1]]]);
  let frontier = [start];
  while (frontier.length > 0) {
    const next: number[][] = [];
    for (const codes of frontier) {
      const key = enc(codes);
      const last = parent.get(key)![1];
      for (let mi = 0; mi < MOVES.length; mi++) {
        if (last >= 0 && MOVES[last].base === MOVES[mi].base) continue;
        const moved = codes.map((c) => EDGE_TABLE[mi][c]);
        const k = enc(moved);
        if (parent.has(k)) continue;
        parent.set(k, [key, mi]);
        if (k === goalKey) {
          const path: Move[] = [];
          for (let at = k; at !== startKey; at = parent.get(at)![0]) path.unshift(MOVES[parent.get(at)![1]]);
          return path;
        }
        next.push(moved);
      }
    }
    frontier = next;
  }
  throw new Error("No way to place the edge");
}

/** A rotation that puts `up` on top, keeping the current front when it can. */
function holdUp(state: CubeState, up: Color): Move[] {
  const c = centers(state);
  if (c.U === up) return [];
  const front = c.F === up || c.B === up ? c.U : c.F;
  return rotationTo(state, up, front);
}

export function solveCross(state: CubeState): Recorder {
  const rec = new Recorder(state);
  const up = holdUp(rec.state, "W");
  rec.rotate(up, { key: "seg.1.whiteUp", colors: { front: centers(applyAlg(rec.state, up)).F } });

  if (crossDone(rec.state)) {
    rec.add("info", [], { key: "seg.1.done" });
    return rec;
  }

  for (;;) {
    const solved = WHITE_EDGES.filter((p) => isSolvedPiece(rec.state, p));
    const todo = WHITE_EDGES.filter((p) => !solved.includes(p));
    if (todo.length === 0) break;
    // Place next the edge that needs the fewest moves.
    let best: { piece: Color[]; turn: Move[]; moves: Move[] } | null = null;
    for (const piece of todo) {
      const turn = rotationTo(rec.state, "W", piece[1]);
      const held = applyAlg(rec.state, turn);
      const tracked = [...solved, piece];
      const moves = search(
        tracked.map((p) => codeOf(held, p)),
        tracked.map((p) => goalOf(held, p)),
      );
      if (!best || moves.length < best.moves.length || (moves.length === best.moves.length && turn.length < best.turn.length))
        best = { piece, turn, moves };
    }
    const { piece, turn, moves } = best!;
    rec.rotate(turn, { key: "seg.1.rotate", piece, colors: { front: piece[1] } });
    rec.add("intuitive", moves, { key: "seg.1.edge", piece, colors: { front: piece[1] } });
  }
  if (!crossDone(rec.state)) throw new Error("Cross not solved");
  return rec;
}
