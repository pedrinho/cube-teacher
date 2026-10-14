// Step 1 (Cruz): white cross on top, one edge at a time. The cube is turned so the edge's other
// color faces you, then the shortest moves put it at the top front without breaking the
// edges already placed.
import { applyAlg, centers, type Color, type CubeState, type Move } from "../../cube/model";
import { EDGE_TABLE, FACE_MOVES as MOVES, edgeCode as codeOf, edgeGoal as goalOf } from "../../cube/edgeMoves";
import { rotationTo } from "../../cube/orientation";
import { isSolvedPiece } from "../../cube/pieces";
import { WHITE_EDGES, crossDone } from "./goals";
import { Recorder } from "./recorder";

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
