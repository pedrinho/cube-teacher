// The puzzles a song can be played on: how a move changes the state, how moves come down the
// highway, the color of each lane, and which keys play it.
import { DEFAULT_SCHEME, SOLVED, applyMove, isSolved as isCubeSolved, type Color, type Move } from "cube-kit/cube/model";
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
  CUBE_3_TRACK,
  PYRAMINX_TRACK,
  keysByColor,
  type KeyMap,
  type Lane,
  type Letter,
  type Track,
} from "./lanes";

/** The cubes share their keys, and the pyraminxes theirs: U, L, R and B are letters of both. */
export type KeySet = "cube" | "pyraminx";

export interface Puzzle extends Track {
  id: CuboidId | "cube" | "pyraminx1" | "pyraminx2" | "pyraminx" | "cornerTwist";
  keySet: KeySet;
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

/** The 1x2x3's lanes are the 1x2x2's: its middle row comes down D's, yellow. */
export const WALL_3: Puzzle = {
  ...CUBE_1x2x3_TRACK,
  id: "1x2x3",
  keySet: "cube",
  solved: CUBE_1x2x3.solved,
  apply: CUBE_1x2x3.apply,
  isSolved: CUBE_1x2x3.isSolved,
  laneColor: (_, lane) => WALL_COLORS[lane]!,
};

/** The 1x3x3, the floppy cube, has the 1x2x3's lanes too: its middle column comes down L's, orange. */
export const FLOPPY: Puzzle = {
  ...CUBE_1x3x3_TRACK,
  id: "1x3x3",
  keySet: "cube",
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
  keySet: "cube",
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
  keySet: "cube",
  solved: CUBE_2x2x2.solved,
  apply: CUBE_2x2x2.apply,
  isSolved: CUBE_2x2x2.isSolved,
  laneColor: (_, lane) => POCKET_COLORS[lane]!,
};

/**
 * The 3x3x3's song only turns its faces, never its middle layers or the whole cube, so its centers
 * stay put: each lane keeps its face's color.
 */
export const CUBE_3: Puzzle = {
  ...CUBE_3_TRACK,
  id: "cube",
  keySet: "cube",
  solved: SOLVED,
  apply: applyMove,
  isSolved: isCubeSolved,
  laneColor: (_, lane) => DEFAULT_SCHEME[lane],
};

/**
 * The pyraminxes' lanes keep one color each, left to right: green, yellow, red and blue, the order
 * of their number keys. They stay put while the puzzle turns, even when the one-piece one turns
 * over whole.
 */
const PYRA_COLORS: Partial<Record<Lane, Color>> = { L: "G", U: "Y", B: "R", R: "B" };
const pyraLaneColor = (_: string, lane: Lane) => PYRA_COLORS[lane]!;

/** The one-piece pyraminx only ever turns whole, around a corner. */
export const PYRA_ONE: Puzzle = {
  ...PYRAMINX_TRACK,
  id: "pyraminx1",
  keySet: "pyraminx",
  solved: PYRA_1_SOLVED,
  // Its songs only have pyraminx moves.
  apply: (state, move) => applyPyra1Move(state, move as PyraMove),
  isSolved: isPyra1Solved,
  laneColor: pyraLaneColor,
};

/** The two-layer pyraminx, its tips glued on. */
export const PYRA_TWO: Puzzle = {
  ...PYRAMINX_TRACK,
  id: "pyraminx2",
  keySet: "pyraminx",
  solved: PYRA_2_SOLVED,
  // Its songs only have pyraminx moves, and no tips.
  apply: (state, move) => applyPyra2Move(state, move as PyraMove),
  isSolved: isPyra2Solved,
  laneColor: pyraLaneColor,
};

/** The pyraminx, its tips loose. */
export const PYRA_THREE: Puzzle = {
  ...PYRAMINX_TRACK,
  id: "pyraminx",
  keySet: "pyraminx",
  solved: PYRA_SOLVED,
  // Its songs only have pyraminx moves.
  apply: (state, move) => applyPyraMove(state, move as PyraMove),
  isSolved: isPyraSolved,
  laneColor: pyraLaneColor,
};

/**
 * The corner twist pyraminx, all tips: its corners only twist in place, U, L, R and B, big notes
 * since they're the whole puzzle.
 */
export const PYRA_TWIST: Puzzle = {
  ...PYRAMINX_TRACK,
  id: "cornerTwist",
  keySet: "pyraminx",
  solved: PYRA_TWIST_SOLVED,
  // Its songs only have pyraminx moves.
  apply: (state, move) => applyPyraTwistMove(state, move as PyraMove),
  isSolved: isPyraTwistSolved,
  laneColor: pyraLaneColor,
};

/**
 * The color of each letter's lane: a cube's faces their center's (white on top, green in front), a
 * pyraminx's corners their lane's.
 */
export const HOME_COLORS: Record<KeySet, Partial<Record<Letter, Color>>> = {
  cube: DEFAULT_SCHEME,
  pyraminx: PYRA_COLORS,
};

/** The keys each kind of puzzle starts with: its home colors on their number keys. */
export const DEFAULT_KEYS: Record<KeySet, KeyMap> = {
  cube: keysByColor(HOME_COLORS.cube),
  pyraminx: keysByColor(HOME_COLORS.pyraminx),
};

/** The keys a puzzle is played with: the player's for its kind, with the puzzle's fixed keys on top. */
export const keysFor = (puzzle: Puzzle, keys: Record<KeySet, KeyMap>): KeyMap => ({ ...keys[puzzle.keySet], ...puzzle.fixedKeys });
