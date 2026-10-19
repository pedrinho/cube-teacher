// Step 4 (Cruz de cima): yellow cross on top with F U R U' R' F'. An L is held at the back left
// and finishes the cross; a line is held left to right and becomes that L; a dot becomes a line.
import { applyAlg, type CubeState } from "../../cube/model";
import { Y_TURNS } from "../../cube/orientation";
import { ALGS } from "./algs";
import { topColorEdges, yellowCrossDone } from "./goals";
import { Recorder } from "./recorder";
import { keepYellowUp } from "./step3-edges";

const has = (state: CubeState, ...slots: string[]) => {
  const up = topColorEdges(state);
  return up.length === slots.length && slots.every((s) => up.includes(s));
};

export function solveYellowCross(state: CubeState): Recorder {
  const rec = new Recorder(state);
  keepYellowUp(rec);
  if (yellowCrossDone(rec.state)) {
    rec.add("info", [], { key: "seg.4.done" });
    return rec;
  }
  for (let guard = 0; guard < 6 && !yellowCrossDone(rec.state); guard++) {
    const count = topColorEdges(rec.state).length;
    const line = Y_TURNS.find((t) => has(applyAlg(rec.state, t), "UL", "UR"));
    const ell = Y_TURNS.find((t) => has(applyAlg(rec.state, t), "UB", "UL"));
    if (count === 2 && line) {
      rec.rotate(line, { key: "seg.4.hold2" });
      rec.add("alg", ALGS["4.2"], { key: "seg.4.2" }, "4.2");
    } else if (count === 2 && ell) {
      rec.rotate(ell, { key: "seg.4.hold1" });
      rec.add("alg", ALGS["4.1"], { key: "seg.4.1" }, "4.1");
    } else if (count === 0) {
      rec.add("alg", ALGS["4.3"], { key: "seg.4.3" }, "4.3");
    } else {
      throw new Error(`Impossible yellow cross with ${count} edges`);
    }
  }
  if (!yellowCrossDone(rec.state)) throw new Error("Yellow cross not solved");
  return rec;
}
