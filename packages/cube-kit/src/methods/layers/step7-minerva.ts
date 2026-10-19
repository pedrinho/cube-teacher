// Step 7 (Minerva): the last top edges. With one side finished, hold it at the back and send the
// other three edges round clockwise (F2 U M' U2 M U F2) or counterclockwise (F2 U' M' U2 M U' F2).
// With no side finished, do the first one from anywhere and a side becomes finished.
import { applyAlg, isSolved, type Color, type CubeState } from "../../cube/model";
import { Y_TURNS } from "../../cube/orientation";
import { homeOf, isSolvedPiece, slotOf } from "../../cube/pieces";
import { ALGS } from "./algs";
import { YELLOW_EDGES, topCornersDone } from "./goals";
import { Recorder } from "./recorder";
import { keepYellowUp } from "./step3-edges";

const solvedEdges = (s: CubeState) => YELLOW_EDGES.filter((p) => isSolvedPiece(s, p));
const sameFaces = (a: string, b: string) => [...a].sort().join("") === [...b].sort().join("");

/** True when the top edges swap with the opposite ones (case 3), not with neighbors (case 4). */
function oppositeSwap(s: CubeState): boolean {
  const atFront = YELLOW_EDGES.find((p) => sameFaces(slotOf(s, p).name, "UF"))!;
  return sameFaces(homeOf(s, atFront).name, "UB");
}

export function solveMinerva(state: CubeState): Recorder {
  const rec = new Recorder(state);
  keepYellowUp(rec);
  if (isSolved(rec.state)) {
    rec.add("info", [], { key: "seg.7.done" });
    return rec;
  }
  if (!topCornersDone(rec.state)) throw new Error("Step 7 needs the top corners in place");

  for (let guard = 0; guard < 4 && !isSolved(rec.state); guard++) {
    const done = solvedEdges(rec.state);
    if (done.length === 1) {
      const color = done[0][1] as Color;
      const turn = Y_TURNS.find((t) => sameFaces(slotOf(applyAlg(rec.state, t), done[0]).name, "UB"))!;
      rec.rotate(turn, { key: "seg.7.hold", colors: { color } });
      const caseId = isSolved(applyAlg(rec.state, ALGS["7.1"])) ? "7.1" : "7.2";
      rec.add("alg", ALGS[caseId], { key: `seg.${caseId}` }, caseId);
    } else if (done.length === 0) {
      const caseId = oppositeSwap(rec.state) ? "7.3" : "7.4";
      rec.add("alg", ALGS[caseId], { key: `seg.${caseId}` }, caseId);
    } else {
      throw new Error(`Impossible last layer with ${done.length} edges in place`);
    }
  }
  if (!isSolved(rec.state)) throw new Error("Cube not solved");
  return rec;
}
