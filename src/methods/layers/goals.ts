// What "done" means after each step, for the solver's checks and the tests.
import { EDGE_SLOTS, centers, type Color, type CubeState } from "../../cube/model";
import { isSolvedPiece } from "../../cube/pieces";

export const SIDE_COLORS: Color[] = ["G", "R", "B", "O"];
export const WHITE_EDGES: Color[][] = SIDE_COLORS.map((c) => ["W", c]);
/** White corners, as white plus two neighboring side colors. */
export const WHITE_CORNERS: Color[][] = SIDE_COLORS.map((c, i) => ["W", c, SIDE_COLORS[(i + 1) % 4]]);
/** Middle layer edges: two neighboring side colors, no white or yellow. */
export const MIDDLE_EDGES: Color[][] = SIDE_COLORS.map((c, i) => [c, SIDE_COLORS[(i + 1) % 4]]);

export const crossDone = (s: CubeState) => WHITE_EDGES.every((p) => isSolvedPiece(s, p));
export const firstLayerDone = (s: CubeState) => crossDone(s) && WHITE_CORNERS.every((p) => isSolvedPiece(s, p));
export const secondLayerDone = (s: CubeState) => firstLayerDone(s) && MIDDLE_EDGES.every((p) => isSolvedPiece(s, p));

const TOP_EDGES = EDGE_SLOTS.filter((e) => e.faces[0] === "U");
/** Names of the top edge slots whose top sticker has the top center's color. */
export const topColorEdges = (s: CubeState) =>
  TOP_EDGES.filter((e) => s[e.stickers[0]] === centers(s).U).map((e) => e.name);
export const yellowCrossDone = (s: CubeState) => secondLayerDone(s) && topColorEdges(s).length === 4;

/** Goal of each step, by step number. */
export const STEP_GOALS: Record<number, (s: CubeState) => boolean> = {
  1: crossDone,
  2: firstLayerDone,
  3: secondLayerDone,
  4: yellowCrossDone,
};
