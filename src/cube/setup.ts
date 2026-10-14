// Moves that turn a solved cube into a given state, so the 3D player can show it.
import type { KPatternData } from "cubing/kpuzzle";
import { toPatternData } from "./kpattern";
import type { CubeState } from "./model";

export async function setupAlgFor(state: CubeState): Promise<string> {
  const [{ cube3x3x3 }, { KPattern }, { experimentalSolve3x3x3IgnoringCenters }] = await Promise.all([
    import("cubing/puzzles"),
    import("cubing/kpuzzle"),
    import("cubing/search"),
  ]);
  const kpuzzle = await cube3x3x3.kpuzzle();
  const pattern = new KPattern(kpuzzle, toPatternData(state) as unknown as KPatternData);
  const solution = await experimentalSolve3x3x3IgnoringCenters(pattern);
  return solution.invert().toString();
}
