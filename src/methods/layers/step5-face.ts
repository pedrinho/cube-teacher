// Step 5 (Face de cima): the whole top yellow with R U R' U R U2 R'. Count the corners with
// yellow on top: one goes at the front left; with two, the front left corner shows yellow to the
// front; with none, it shows yellow to the left. Repeat until the top is yellow.
import { CORNER_SLOTS, applyAlg, centers, type CubeState, type Face } from "../../cube/model";
import { Y_TURNS } from "../../cube/orientation";
import { ALGS } from "./algs";
import { yellowFaceDone } from "./goals";
import { Recorder } from "./recorder";
import { keepYellowUp } from "./step3-edges";

const TOP_CORNERS = CORNER_SLOTS.filter((c) => c.faces[0] === "U");
const UFL = TOP_CORNERS.find((c) => [...c.name].sort().join("") === "FLU")!;

const cornersUp = (s: CubeState) => TOP_CORNERS.filter((c) => s[c.stickers[0]] === centers(s).U).length;
/** Whether the front left top corner shows the top color on the given face. */
const frontLeftShows = (s: CubeState, face: Face) => s[UFL.stickers[UFL.faces.indexOf(face)]] === centers(s).U;

export function solveYellowFace(state: CubeState): Recorder {
  const rec = new Recorder(state);
  keepYellowUp(rec);
  if (yellowFaceDone(rec.state)) {
    rec.add("info", [], { key: "seg.5.done" });
    return rec;
  }
  for (let guard = 0; guard < 8 && !yellowFaceDone(rec.state); guard++) {
    const count = cornersUp(rec.state);
    const held = (test: (s: CubeState) => boolean) => Y_TURNS.find((t) => test(applyAlg(rec.state, t)))!;
    if (count === 1) {
      rec.rotate(
        held((s) => frontLeftShows(s, "U")),
        { key: "seg.5.hold1" },
      );
      rec.add("alg", ALGS["5.1"], { key: "seg.5.1" }, "5.1");
    } else if (count === 2) {
      rec.rotate(
        held((s) => frontLeftShows(s, "F")),
        { key: "seg.5.hold2" },
      );
      rec.add("alg", ALGS["5.2"], { key: "seg.5.2" }, "5.2");
    } else if (count === 0) {
      rec.rotate(
        held((s) => frontLeftShows(s, "L")),
        { key: "seg.5.hold3" },
      );
      rec.add("alg", ALGS["5.3"], { key: "seg.5.3" }, "5.3");
    } else {
      throw new Error(`Impossible yellow face with ${count} corners`);
    }
  }
  if (!yellowFaceDone(rec.state)) throw new Error("Yellow face not solved");
  return rec;
}
