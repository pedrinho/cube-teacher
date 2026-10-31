// The puzzles a song can be played on: how a move changes the state, how moves come down the
// highway, the color of each lane, and which keys play it.
import { SOLVED, applyMove, centers, isSolved as isCubeSolved, type Color, type Move } from "cube-kit/cube/model";
import { CUBE_1, CUBE_1x2, CUBE_1x2x2, CUBE_1x3, CUBE_1x4, type CuboidId } from "cube-kit/cuboid/model";
import { PYRA_SOLVED, applyPyraMove, isPyraSolved, type PyraMove } from "cube-kit/pyraminx/model";
import {
  CUBE_1_TRACK,
  CUBE_1x2_TRACK,
  CUBE_1x2x2_TRACK,
  CUBE_1x3_TRACK,
  CUBE_1x4_TRACK,
  CUBE_TRACK,
  PYRAMINX_TRACK,
  type KeyMap,
  type Lane,
  type Track,
} from "./lanes";

/** The cube and the pyraminx each have keys of their own; the small cuboids use the cube's. */
export type KeySet = "cube" | "pyraminx";

export interface Puzzle extends Track {
  id: "cube" | "pyraminx" | CuboidId;
  keySet: KeySet;
  /** Keys the puzzle always plays with, whatever the player chose: the 1x1x1's space bar. */
  fixedKeys?: Partial<KeyMap>;
  solved: string;
  apply: (state: string, move: Move) => string;
  isSolved: (state: string) => boolean;
  /** The color of a lane's notes and receptor while the puzzle is in `state`. */
  laneColor: (state: string, lane: Lane) => Color;
}

/** Each cube lane takes its face's center color, so it follows the cube as it is turned. */
export const CUBE: Puzzle = {
  ...CUBE_TRACK,
  id: "cube",
  keySet: "cube",
  solved: SOLVED,
  apply: applyMove,
  isSolved: isCubeSolved,
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
  keySet: "pyraminx",
  solved: PYRA_SOLVED,
  // Its songs only have pyraminx moves.
  apply: (state, move) => applyPyraMove(state, move as PyraMove),
  isSolved: isPyraSolved,
  laneColor: (_, lane) => PYRAMINX_COLORS[lane]!,
};

/** The 1x1x1 is only ever spun, so its lane keeps the white of its top. */
export const ONE: Puzzle = {
  ...CUBE_1_TRACK,
  id: "1x1x1",
  keySet: "cube",
  fixedKeys: { Y: "Space" },
  solved: CUBE_1.solved,
  apply: CUBE_1.apply,
  isSolved: CUBE_1.isSolved,
  laneColor: () => "W",
};

/** The 1x1x2's top and bottom only turn in place: the top lane stays white, the bottom yellow. */
export const TOWER: Puzzle = {
  ...CUBE_1x2_TRACK,
  id: "1x1x2",
  keySet: "cube",
  solved: CUBE_1x2.solved,
  apply: CUBE_1x2.apply,
  isSolved: CUBE_1x2.isSolved,
  laneColor: (_, lane) => (lane === "U" ? "W" : "Y"),
};

/** The 1x1x3's lanes are the 1x1x2's: white for the top, yellow for the bottom and the middle. */
export const TOWER_3: Puzzle = {
  ...CUBE_1x3_TRACK,
  id: "1x1x3",
  keySet: "cube",
  solved: CUBE_1x3.solved,
  apply: CUBE_1x3.apply,
  isSolved: CUBE_1x3.isSolved,
  laneColor: (_, lane) => (lane === "U" ? "W" : "Y"),
};

/** The 1x1x4's lanes too: white for the top two layers, yellow for the bottom two. */
export const TOWER_4: Puzzle = {
  ...CUBE_1x4_TRACK,
  id: "1x1x4",
  keySet: "cube",
  solved: CUBE_1x4.solved,
  apply: CUBE_1x4.apply,
  isSolved: CUBE_1x4.isSolved,
  laneColor: (_, lane) => (lane === "U" ? "W" : "Y"),
};

/** The 1x2x2's sides only turn halfway, so each lane keeps its side's color, as on a solved cube. */
const WALL_COLORS: Partial<Record<Lane, Color>> = { L: "O", U: "W", D: "Y", R: "R" };

export const WALL: Puzzle = {
  ...CUBE_1x2x2_TRACK,
  id: "1x2x2",
  keySet: "cube",
  solved: CUBE_1x2x2.solved,
  apply: CUBE_1x2x2.apply,
  isSolved: CUBE_1x2x2.isSolved,
  laneColor: (_, lane) => WALL_COLORS[lane]!,
};

/** The keys a puzzle is played with: its key set's, with its fixed keys on top. */
export const keysFor = (puzzle: Puzzle, keys: Record<KeySet, KeyMap>): KeyMap => ({ ...keys[puzzle.keySet], ...puzzle.fixedKeys });
