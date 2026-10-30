// The puzzles a song can be played on: how a move changes the state, how moves come down the
// highway, and the color of each lane.
import { SOLVED, applyMove, centers, type Color, type Move } from "cube-kit/cube/model";
import { PYRA_SOLVED, applyPyraMove, type PyraMove } from "cube-kit/pyraminx/model";
import { CUBE_TRACK, PYRAMINX_TRACK, type Lane, type Track } from "./lanes";

export interface Puzzle extends Track {
  id: "cube" | "pyraminx";
  solved: string;
  apply: (state: string, move: Move) => string;
  /** The color of a lane's notes and receptor while the puzzle is in `state`. */
  laneColor: (state: string, lane: Lane) => Color;
}

/** Each cube lane takes its face's center color, so it follows the cube as it is turned. */
export const CUBE: Puzzle = {
  ...CUBE_TRACK,
  id: "cube",
  solved: SOLVED,
  apply: applyMove,
  laneColor: (state, lane) => centers(state)[lane],
};

/**
 * The pyraminx is never turned over, so its lanes keep one color each, left to right: green for
 * the left, yellow for the top, red for the back and blue for the right.
 */
const PYRAMINX_COLORS: Partial<Record<Lane, Color>> = { L: "G", U: "Y", B: "R", R: "B" };

export const PYRAMINX: Puzzle = {
  ...PYRAMINX_TRACK,
  id: "pyraminx",
  solved: PYRA_SOLVED,
  // Its songs only have pyraminx moves.
  apply: (state, move) => applyPyraMove(state, move as PyraMove),
  laneColor: (_, lane) => PYRAMINX_COLORS[lane]!,
};
