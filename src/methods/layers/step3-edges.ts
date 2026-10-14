// Step 3 (2ª camada): the four middle layer edges. An edge on top is lined up above its center
// (an upside-down T), then goes right (case 1) or left (case 2). Both cases take a white corner out,
// which goes back with a step 2 case. A stuck edge is pushed out to the top with case 1.
import { applyAlg, centers, parseAlg, type Color, type CubeState, type PieceSlot } from "../../cube/model";
import { U_TURNS, Y_TURNS, rotationTo } from "../../cube/orientation";
import { isSolvedPiece, slotOf } from "../../cube/pieces";
import { ALGS } from "./algs";
import { MIDDLE_EDGES, firstLayerDone, secondLayerDone } from "./goals";
import { Recorder } from "./recorder";
import type { Explain } from "../types";

const at = (slot: PieceSlot, faces: string) => [...slot.name].sort().join("") === [...faces].sort().join("");
const moveCount = (rec: Recorder) =>
  rec.segments.filter((s) => s.kind !== "rotate").reduce((n, s) => n + s.moves.length, 0);

/** Case 1: the edge at the top front goes into the front right slot, then the corner goes back. */
function caseRight(rec: Recorder, caseId: "3.1" | "3.out", explain: Explain) {
  rec.add("alg", ALGS["3.1"], explain, caseId);
  rec.add("alg", ALGS["2.2"], { key: "seg.3.corner2" }, "2.2");
}

/** Puts an edge from the top layer into its place. */
function insertEdge(state: CubeState, piece: Color[]): Recorder {
  const rec = new Recorder(state);
  const slot = slotOf(rec.state, piece);
  const side = slot.faces.findIndex((f) => f !== "U");
  const front = rec.state[slot.stickers[side]] as Color;
  const top = rec.state[slot.stickers[1 - side]] as Color;

  rec.rotate(rotationTo(rec.state, "Y", front), { key: "seg.3.hold", piece, colors: { front } });
  const align = U_TURNS.find((t) => at(slotOf(applyAlg(rec.state, t), piece), "UF"))!;
  if (align.length > 0) rec.add("align", align, { key: "seg.3.align", piece, colors: { front } });

  const c = centers(rec.state);
  if (top === c.R) {
    caseRight(rec, "3.1", { key: "seg.3.1", piece, colors: { side: c.R } });
  } else {
    rec.add("alg", ALGS["3.2"], { key: "seg.3.2", piece, colors: { side: c.L } }, "3.2");
    rec.rotate(parseAlg("y'"), { key: "seg.3.turnCorner" });
    rec.add("alg", ALGS["2.1"], { key: "seg.3.corner1" }, "2.1");
  }
  if (!isSolvedPiece(rec.state, piece)) throw new Error(`Edge ${piece.join("")} not placed`);
  return rec;
}

/** Pushes a stuck edge (wrong place or flipped) out to the top with case 1. */
function kickOut(state: CubeState, piece: Color[]): Recorder {
  const rec = new Recorder(state);
  const turn = Y_TURNS.find((t) => at(slotOf(applyAlg(rec.state, t), piece), "FR"))!;
  rec.rotate(turn, { key: "seg.3.holdStuck", piece });
  caseRight(rec, "3.out", { key: "seg.3.stuck", piece });
  return rec;
}

export function solveSecondLayer(state: CubeState): Recorder {
  const rec = new Recorder(state);
  const c = centers(rec.state);
  if (c.U !== "Y") rec.rotate(rotationTo(rec.state, "Y", c.F === "W" ? c.D : c.F), { key: "seg.3.yellowUp" });

  if (secondLayerDone(rec.state)) {
    rec.add("info", [], { key: "seg.3.done" });
    return rec;
  }

  for (let guard = 0; guard < 12; guard++) {
    const todo = MIDDLE_EDGES.filter((p) => !isSolvedPiece(rec.state, p));
    if (todo.length === 0) break;
    const solved = MIDDLE_EDGES.filter((p) => !todo.includes(p));
    const onTop = todo.filter((p) => slotOf(rec.state, p).faces.includes("U"));
    const plan = onTop.length
      ? onTop.map((p) => insertEdge(rec.state, p)).reduce((a, b) => (moveCount(b) < moveCount(a) ? b : a))
      : kickOut(rec.state, todo[0]);
    for (const seg of plan.segments) rec.add(seg.kind, seg.moves, seg.explain, seg.caseId);
    if (!firstLayerDone(rec.state) || !solved.every((p) => isSolvedPiece(rec.state, p)))
      throw new Error("A solved piece was broken");
  }
  if (!secondLayerDone(rec.state)) throw new Error("Second layer not solved");
  return rec;
}
