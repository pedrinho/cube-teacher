// Step 6 (Cantos): top corners to their places with R' F R' B2 R F' R' B2 R2. Look for
// "headlights", two top corners showing the same color on one side, and hold them at the back.
// No headlights: do the moves anyway and they appear. Then turn the top to line the corners up.
import { applyAlg, stickerIndex, type Color, type CubeState, type Face } from "../../cube/model";
import { U_TURNS, Y_TURNS } from "../../cube/orientation";
import { isSolvedPiece } from "../../cube/pieces";
import { ALGS } from "./algs";
import { YELLOW_CORNERS, topCornersDone, yellowFaceDone } from "./goals";
import { Recorder } from "./recorder";
import { keepYellowUp } from "./step3-edges";

const SIDES: Face[] = ["F", "R", "B", "L"];

/** Sides whose two top corners show the same color. */
export const headlights = (s: CubeState) => SIDES.filter((f) => s[stickerIndex(f, 0)] === s[stickerIndex(f, 2)]);

const cornersInPlace = (s: CubeState) => YELLOW_CORNERS.every((p) => isSolvedPiece(s, p));

export function solveTopCorners(state: CubeState): Recorder {
  const rec = new Recorder(state);
  keepYellowUp(rec);
  if (topCornersDone(rec.state)) {
    rec.add("info", [], { key: "seg.6.done" });
    return rec;
  }
  if (!yellowFaceDone(rec.state)) throw new Error("Step 6 needs a yellow top");

  for (let guard = 0; guard < 4 && headlights(rec.state).length < 4; guard++) {
    const sides = headlights(rec.state);
    if (sides.length > 0) {
      const color = rec.state[stickerIndex(sides[0], 0)] as Color;
      rec.rotate(
        Y_TURNS.find((t) => headlights(applyAlg(rec.state, t)).includes("B"))!,
        { key: "seg.6.hold", colors: { color } },
      );
      rec.add("alg", ALGS["6.1"], { key: "seg.6.1" }, "6.1");
    } else {
      rec.add("alg", ALGS["6.2"], { key: "seg.6.2" }, "6.2");
    }
  }

  const align = U_TURNS.find((t) => cornersInPlace(applyAlg(rec.state, t)));
  if (!align) throw new Error("Top corners not in place");
  if (align.length > 0) rec.add("align", align, { key: "seg.6.align" });
  if (!topCornersDone(rec.state)) throw new Error("Top corners not solved");
  return rec;
}
