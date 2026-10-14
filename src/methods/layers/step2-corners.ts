// Step 2 (1ª camada): white on the bottom, then each white corner goes into its place with
// Cinoto's three cases. The case is found by trying the documented moves, so the solver always
// uses exactly the moves taught in the lesson.
import { applyAlg, centers, type Color, type CubeState, type PieceSlot } from "../../cube/model";
import { U_TURNS, Y_TURNS, rotationTo } from "../../cube/orientation";
import { homeOf, isSolvedPiece, slotOf } from "../../cube/pieces";
import { ALGS } from "./algs";
import { WHITE_CORNERS, WHITE_EDGES, firstLayerDone } from "./goals";
import { Recorder } from "./recorder";

const at = (slot: PieceSlot, faces: string) => [...slot.name].sort().join("") === [...faces].sort().join("");
const moveCount = (rec: Recorder) =>
  rec.segments.filter((s) => s.kind !== "rotate").reduce((n, s) => n + s.moves.length, 0);

/** Puts one white corner in place, starting with yellow on top. */
function placeCorner(state: CubeState, piece: Color[]): Recorder {
  const rec = new Recorder(state);

  // Stuck in the bottom layer (wrong place or turned): take it out to the top first.
  if (slotOf(rec.state, piece).faces.includes("D")) {
    const turn = Y_TURNS.find((t) => at(slotOf(applyAlg(rec.state, t), piece), "DFR"))!;
    rec.rotate(turn, { key: "seg.2.holdStuck", piece });
    rec.add("alg", ALGS["2.1"], { key: "seg.2.stuck", piece }, "2.out");
  }

  // Hold the cube so the corner's place is at the bottom, front right.
  const turn = Y_TURNS.find((t) => at(homeOf(applyAlg(rec.state, t), piece), "DFR"))!;
  const held = centers(applyAlg(rec.state, turn));
  rec.rotate(turn, { key: "seg.2.hold", piece, colors: { front: held.F, right: held.R } });

  // Turn the top until the corner is right above its place.
  const align = U_TURNS.find((t) => at(slotOf(applyAlg(rec.state, t), piece), "UFR"))!;
  if (align.length > 0) rec.add("align", align, { key: "seg.2.align", piece });

  if (isSolvedPiece(applyAlg(rec.state, ALGS["2.1"]), piece)) {
    rec.add("alg", ALGS["2.1"], { key: "seg.2.1", piece }, "2.1");
  } else if (isSolvedPiece(applyAlg(rec.state, ALGS["2.2"]), piece)) {
    rec.add("alg", ALGS["2.2"], { key: "seg.2.2", piece }, "2.2");
  } else {
    rec.add("alg", ALGS["2.3"], { key: "seg.2.3", piece }, "2.3");
    rec.add("alg", ALGS["2.1"], { key: "seg.2.1", piece }, "2.1");
  }
  if (!isSolvedPiece(rec.state, piece)) throw new Error(`Corner ${piece.join("")} not placed`);
  return rec;
}

export function solveFirstLayer(state: CubeState): Recorder {
  const rec = new Recorder(state);
  // Turn the cube upside down, keeping the same face toward you.
  const front = centers(rec.state).F;
  rec.rotate(rotationTo(rec.state, "Y", front), { key: "seg.2.flip", colors: { front } });

  if (firstLayerDone(rec.state)) {
    rec.add("info", [], { key: "seg.2.done" });
    return rec;
  }

  for (;;) {
    const todo = WHITE_CORNERS.filter((p) => !isSolvedPiece(rec.state, p));
    if (todo.length === 0) break;
    const solved = [...WHITE_EDGES, ...WHITE_CORNERS.filter((p) => !todo.includes(p))];
    // Do next the corner that needs the fewest moves.
    const plans = todo.map((p) => placeCorner(rec.state, p));
    const best = plans.reduce((a, b) => (moveCount(b) < moveCount(a) ? b : a));
    for (const seg of best.segments) rec.add(seg.kind, seg.moves, seg.explain, seg.caseId);
    if (!solved.every((p) => isSolvedPiece(rec.state, p))) throw new Error("A solved piece was broken");
  }
  if (!firstLayerDone(rec.state)) throw new Error("First layer not solved");
  return rec;
}
