// The puzzles a song can be played on: how a move changes the state, how moves come down the
// highway, the color of each lane, and which keys play it.
import type { Color, Move } from "cube-kit/cube/model";
import { PYRA_SOLVED, applyPyraMove, isPyraSolved, type PyraMove } from "cube-kit/pyraminx/model";
import { PYRA_1_SOLVED, applyPyra1Move, isPyra1Solved } from "cube-kit/pyraminx/one";
import { PYRA_2_SOLVED, applyPyra2Move, isPyra2Solved } from "cube-kit/pyraminx/two";
import { PYRA_TWIST_SOLVED, applyPyraTwistMove, isPyraTwistSolved } from "cube-kit/pyraminx/twist";
import {
  CUBE_1,
  CUBE_1x2,
  CUBE_1x2x2,
  CUBE_1x2x3,
  CUBE_1x3,
  CUBE_1x3x3,
  CUBE_1x4,
  CUBE_2x2x2,
  CUBE_2x2x3,
  type CuboidId,
} from "cube-kit/cuboid/model";
import {
  CUBE_1_TRACK,
  CUBE_1x2_TRACK,
  CUBE_1x2x2_TRACK,
  CUBE_1x2x3_TRACK,
  CUBE_1x3_TRACK,
  CUBE_1x3x3_TRACK,
  CUBE_1x4_TRACK,
  CUBE_2x2x2_TRACK,
  CUBE_2x2x3_TRACK,
  PYRAMINX_TRACK,
  type KeyMap,
  type Lane,
  type Track,
} from "./lanes";

export interface Puzzle extends Track {
  id: CuboidId | "pyraminx1" | "pyraminx2" | "pyraminx" | "cornerTwist";
  /** Keys the puzzle always plays with, whatever the player chose: the 1x1x1's space bar. */
  fixedKeys?: Partial<KeyMap>;
  solved: string;
  apply: (state: string, move: Move) => string;
  isSolved: (state: string) => boolean;
  /** The color of a lane's notes and receptor while the puzzle is in `state`. */
  laneColor: (state: string, lane: Lane) => Color;
}

/** The 1x1x1 is only ever spun, so its lane keeps the white of its top. */
export const ONE: Puzzle = {
  ...CUBE_1_TRACK,
  id: "1x1x1",
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
  solved: CUBE_1x2.solved,
  apply: CUBE_1x2.apply,
  isSolved: CUBE_1x2.isSolved,
  laneColor: (_, lane) => (lane === "U" ? "W" : "Y"),
};

/** The 1x1x3's lanes are the 1x1x2's: white for the top, yellow for the bottom and the middle. */
export const TOWER_3: Puzzle = {
  ...CUBE_1x3_TRACK,
  id: "1x1x3",
  solved: CUBE_1x3.solved,
  apply: CUBE_1x3.apply,
  isSolved: CUBE_1x3.isSolved,
  laneColor: (_, lane) => (lane === "U" ? "W" : "Y"),
};

/** The 1x1x4's lanes too: white for the top two layers, yellow for the bottom two. */
export const TOWER_4: Puzzle = {
  ...CUBE_1x4_TRACK,
  id: "1x1x4",
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
  solved: CUBE_1x2x2.solved,
  apply: CUBE_1x2x2.apply,
  isSolved: CUBE_1x2x2.isSolved,
  laneColor: (_, lane) => WALL_COLORS[lane]!,
};

/** The 1x2x3's lanes are the 1x2x2's: its middle row comes down D's, yellow. */
export const WALL_3: Puzzle = {
  ...CUBE_1x2x3_TRACK,
  id: "1x2x3",
  solved: CUBE_1x2x3.solved,
  apply: CUBE_1x2x3.apply,
  isSolved: CUBE_1x2x3.isSolved,
  laneColor: (_, lane) => WALL_COLORS[lane]!,
};

/** The 1x3x3, the floppy cube, has the 1x2x3's lanes too: its middle column comes down L's, orange. */
export const FLOPPY: Puzzle = {
  ...CUBE_1x3x3_TRACK,
  id: "1x3x3",
  solved: CUBE_1x3x3.solved,
  apply: CUBE_1x3x3.apply,
  isSolved: CUBE_1x3x3.isSolved,
  laneColor: (_, lane) => WALL_COLORS[lane]!,
};

/**
 * The 2x2x3 is never turned over in its song, so its lanes keep their side's color too: the front's
 * is green.
 */
const PILLAR_COLORS: Partial<Record<Lane, Color>> = { U: "W", F: "G", D: "Y", R: "R" };

export const PILLAR: Puzzle = {
  ...CUBE_2x2x3_TRACK,
  id: "2x2x3",
  solved: CUBE_2x2x3.solved,
  apply: CUBE_2x2x3.apply,
  isSolved: CUBE_2x2x3.isSolved,
  laneColor: (_, lane) => PILLAR_COLORS[lane]!,
};

/**
 * The 2x2x2 has no centers to show which way it's held, and its song only turns it whole in R L',
 * which comes back after four: its lanes keep the colors of a cube held white on top, green in front.
 */
const POCKET_COLORS: Partial<Record<Lane, Color>> = { L: "O", U: "W", F: "G", R: "R" };

export const POCKET: Puzzle = {
  ...CUBE_2x2x2_TRACK,
  id: "2x2x2",
  solved: CUBE_2x2x2.solved,
  apply: CUBE_2x2x2.apply,
  isSolved: CUBE_2x2x2.isSolved,
  laneColor: (_, lane) => POCKET_COLORS[lane]!,
};

/**
 * The one-piece pyraminx only ever turns whole, around a corner. Each corner's lane takes the color
 * of the face across from it, the one that spins in place while it turns around that corner: the
 * lanes follow the puzzle as it's turned. A state is its faces' colors, in the order F L R D.
 */
const ACROSS: Partial<Record<Lane, number>> = { U: 3, L: 2, R: 1, B: 0 };

export const PYRA_ONE: Puzzle = {
  ...PYRAMINX_TRACK,
  id: "pyraminx1",
  solved: PYRA_1_SOLVED,
  // Its songs only have pyraminx moves.
  apply: (state, move) => applyPyra1Move(state, move as PyraMove),
  isSolved: isPyra1Solved,
  laneColor: (state, lane) => state[ACROSS[lane]!] as Color,
};

/**
 * The two-layer pyraminx (its tips glued on) is never turned over, so its lanes keep the colors the
 * one-piece one's have at home: each corner's, the face across from it.
 */
export const PYRA_TWO: Puzzle = {
  ...PYRAMINX_TRACK,
  id: "pyraminx2",
  solved: PYRA_2_SOLVED,
  // Its songs only have pyraminx moves, and no tips.
  apply: (state, move) => applyPyra2Move(state, move as PyraMove),
  isSolved: isPyra2Solved,
  laneColor: (_, lane) => PYRA_ONE.laneColor(PYRA_ONE.solved, lane),
};

/** The pyraminx, its tips loose, isn't turned over either: the two-layer one's lanes. */
export const PYRA_THREE: Puzzle = {
  ...PYRAMINX_TRACK,
  id: "pyraminx",
  solved: PYRA_SOLVED,
  // Its songs only have pyraminx moves.
  apply: (state, move) => applyPyraMove(state, move as PyraMove),
  isSolved: isPyraSolved,
  laneColor: PYRA_TWO.laneColor,
};

/**
 * The corner twist pyraminx, all tips: its corners only twist in place, U, L, R and B, big notes
 * since they're the whole puzzle. It isn't turned over either: the two-layer one's lanes.
 */
export const PYRA_TWIST: Puzzle = {
  ...PYRAMINX_TRACK,
  id: "cornerTwist",
  solved: PYRA_TWIST_SOLVED,
  // Its songs only have pyraminx moves.
  apply: (state, move) => applyPyraTwistMove(state, move as PyraMove),
  isSolved: isPyraTwistSolved,
  laneColor: PYRA_TWO.laneColor,
};

/** The keys a puzzle is played with: the player's, with the puzzle's fixed keys on top. */
export const keysFor = (puzzle: Puzzle, keys: KeyMap): KeyMap => ({ ...keys, ...puzzle.fixedKeys });
