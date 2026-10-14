// What "done" means after each step, for the solver's checks and the tests.
import type { Color, CubeState } from "../../cube/model";
import { isSolvedPiece } from "../../cube/pieces";

export const SIDE_COLORS: Color[] = ["G", "R", "B", "O"];
export const WHITE_EDGES: Color[][] = SIDE_COLORS.map((c) => ["W", c]);
/** White corners, as white plus two neighboring side colors. */
export const WHITE_CORNERS: Color[][] = SIDE_COLORS.map((c, i) => ["W", c, SIDE_COLORS[(i + 1) % 4]]);

export const crossDone = (s: CubeState) => WHITE_EDGES.every((p) => isSolvedPiece(s, p));
export const firstLayerDone = (s: CubeState) => crossDone(s) && WHITE_CORNERS.every((p) => isSolvedPiece(s, p));

/** Goal of each step, by step number. */
export const STEP_GOALS: Record<number, (s: CubeState) => boolean> = {
  1: crossDone,
  2: firstLayerDone,
};
