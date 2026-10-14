// A scramble (face turns only) that turns a solved cube into a given cube, using cubing.js's solver.
// The cube is held with white on top and green in front, like every scramble in the app.
import type { KPatternData } from "cubing/kpuzzle";
import { SOLVED, applyAlg, parseAlg, type CubeState, type Move } from "../cube/model";
import { toPatternData } from "../cube/kpattern";
import { holdAs } from "../cube/orientation";

export async function scrambleFor(state: CubeState): Promise<Move[]> {
  const target = holdAs(state, "W", "G");
  const [{ cube3x3x3 }, { KPattern }, { experimentalSolve3x3x3IgnoringCenters }] = await Promise.all([
    import("cubing/puzzles"),
    import("cubing/kpuzzle"),
    import("cubing/search"),
  ]);
  const kpuzzle = await cube3x3x3.kpuzzle();
  const solution = await experimentalSolve3x3x3IgnoringCenters(new KPattern(kpuzzle, toPatternData(target) as unknown as KPatternData));
  const scramble = parseAlg(solution.invert().toString());
  if (applyAlg(SOLVED, scramble) !== target) throw new Error("Scramble doesn't make the case");
  return scramble;
}
