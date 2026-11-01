// The levels, in four chapters from easy to extreme. Each is a song written out by hand for a
// puzzle, always at the same speed. Chapter 1's are tutorials: the puzzle starts solved, every
// section brings it back, and every part of the song has a tip. From chapter 2 on there are no
// tutorials and no tips, only what the level is about, and the puzzle comes scrambled: the song
// solves it, on its last note. (A puzzle of one piece comes turned, and is solved only held the way
// it started.) Each level opens once the one before it has three stars.
import { parseAlg, type Move } from "cube-kit/cube/model";
import type { MessageKey } from "../i18n/en";
import type { Progress } from "../settings";
import { layOut, type Chart, type SectionPlan } from "./chart";
import {
  FLOPPY,
  ONE,
  PILLAR,
  POCKET,
  PYRA_ONE,
  PYRA_THREE,
  PYRA_TWO,
  TOWER,
  TOWER_3,
  TOWER_4,
  WALL,
  WALL_3,
  type Puzzle,
} from "./puzzles";

export const CHAPTERS = ["easy", "medium", "hard", "extreme"] as const;
export type Chapter = (typeof CHAPTERS)[number];

export interface Level {
  id: string;
  chapter: Chapter;
  title: MessageKey;
  /** One line under the title on the levels screen. */
  text: MessageKey;
  tutorial?: boolean;
  puzzle: Puzzle;
  /** From chapter 2 on: the turns that scramble the puzzle before the song, which solves it. */
  scramble?: Move[];
  bpm: number;
  /** What the level is about, on the screen before it. */
  about: MessageKey;
  sections: SectionPlan[];
}

/** The same moves, `times` times over. */
const repeat = (alg: string, times: number) => parseAlg(Array(times).fill(alg).join(" "));

export const LEVELS: Level[] = [
  {
    id: "easy-1x1x1",
    chapter: "easy",
    tutorial: true,
    title: "level.one.title",
    text: "level.one.text",
    about: "level.one.about",
    puzzle: ONE,
    // Spins are two beats long: a note every two seconds.
    bpm: 60,
    // Spins in fours, so the cube ends the way it started.
    sections: [
      { title: "one.s1", parts: [{ kind: "rotate", moves: repeat("y", 4), tip: "one.t1" }] },
      {
        title: "one.s2",
        parts: [
          { kind: "rotate", moves: repeat("y", 4), tip: "one.t2" },
          { kind: "rotate", moves: repeat("y", 4), tip: "one.t2b" },
        ],
      },
      { title: "one.s3", parts: [{ kind: "rotate", moves: repeat("y", 8), tip: "one.t3" }] },
    ],
  },
  {
    id: "easy-1x1x2",
    chapter: "easy",
    tutorial: true,
    title: "level.tower.title",
    text: "level.tower.text",
    about: "level.tower.about",
    puzzle: TOWER,
    bpm: 40,
    // Every section turns the top and the bottom back in line.
    sections: [
      { title: "tower.s1", parts: [{ kind: "align", moves: repeat("U", 4), tip: "tower.t1" }] },
      { title: "tower.s2", parts: [{ kind: "align", moves: repeat("U'", 4), tip: "tower.t2" }] },
      { title: "tower.s3", parts: [{ kind: "align", moves: repeat("U2", 2), tip: "tower.t3" }] },
      { title: "tower.s4", parts: [{ kind: "align", moves: repeat("D", 4), tip: "tower.t4" }] },
      {
        title: "tower.s5",
        parts: [
          { kind: "intuitive", moves: parseAlg("U D'"), tip: "tower.t5" },
          { kind: "intuitive", moves: parseAlg("U2 D2"), tip: "tower.t5b" },
          { kind: "intuitive", moves: parseAlg("U' D"), tip: "tower.t5c" },
          { kind: "intuitive", moves: parseAlg("U U D D"), tip: "tower.t5d" },
        ],
      },
    ],
  },
  {
    id: "easy-1x1x3",
    chapter: "easy",
    tutorial: true,
    title: "level.tall.title",
    text: "level.tall.text",
    about: "level.tall.about",
    puzzle: TOWER_3,
    bpm: 40,
    // Every section brings the three layers back in line: E turns like D, so U, E' and D' turn
    // all three the same way.
    sections: [
      { title: "tall.s1", parts: [{ kind: "align", moves: repeat("E", 4), tip: "tall.t1" }] },
      { title: "tall.s2", parts: [{ kind: "align", moves: repeat("E'", 4), tip: "tall.t2" }] },
      { title: "tall.s3", parts: [{ kind: "align", moves: repeat("E2", 2), tip: "tall.t3" }] },
      {
        title: "tall.s4",
        parts: [
          { kind: "intuitive", moves: parseAlg("U E' D'"), tip: "tall.t4" },
          { kind: "intuitive", moves: parseAlg("U2 E2 D2"), tip: "tall.t4b" },
          { kind: "intuitive", moves: parseAlg("D E U'"), tip: "tall.t4c" },
        ],
      },
      { title: "tall.s5", parts: [{ kind: "intuitive", moves: parseAlg("U U E' E' D' D'"), tip: "tall.t5" }] },
    ],
  },
  {
    id: "easy-1x1x4",
    chapter: "easy",
    tutorial: true,
    title: "level.four.title",
    text: "level.four.text",
    about: "level.four.about",
    puzzle: TOWER_4,
    bpm: 40,
    // Every section brings the four layers back in line. u turns the top two and d the bottom two
    // (like D, seen from below), so u and d' together turn the whole tower; u then U' leaves only
    // the second layer out.
    sections: [
      { title: "four.s1", parts: [{ kind: "align", moves: repeat("u", 4), tip: "four.t1" }] },
      { title: "four.s2", parts: [{ kind: "align", moves: repeat("u'", 4), tip: "four.t2" }] },
      { title: "four.s3", parts: [{ kind: "align", moves: repeat("d", 4), tip: "four.t3" }] },
      {
        title: "four.s4",
        parts: [
          { kind: "intuitive", moves: parseAlg("u d'"), tip: "four.t4" },
          { kind: "intuitive", moves: parseAlg("u2 d2"), tip: "four.t4b" },
          { kind: "intuitive", moves: parseAlg("u' d"), tip: "four.t4c" },
        ],
      },
      {
        title: "four.s5",
        parts: [
          { kind: "intuitive", moves: parseAlg("u U' d' U"), tip: "four.t5" },
          { kind: "intuitive", moves: parseAlg("d D' u' D"), tip: "four.t5b" },
        ],
      },
    ],
  },
  {
    id: "easy-1x2x2",
    chapter: "easy",
    tutorial: true,
    title: "level.wall.title",
    text: "level.wall.text",
    about: "level.wall.about",
    puzzle: WALL,
    // Every note is a held half turn, a beat and a half long: a little faster than the towers.
    bpm: 50,
    // Every section turns the sides back. R2 and L2 together turn the whole thing upside down, U2
    // and D2 turn it around, and R2 U2 three times takes three cubies around and back.
    sections: [
      { title: "wall.s1", parts: [{ kind: "align", moves: repeat("R2", 2), tip: "wall.t1" }] },
      { title: "wall.s2", parts: [{ kind: "align", moves: repeat("L2", 2), tip: "wall.t2" }] },
      {
        title: "wall.s3",
        parts: [
          { kind: "align", moves: repeat("U2", 2), tip: "wall.t3" },
          { kind: "align", moves: repeat("D2", 2), tip: "wall.t3b" },
        ],
      },
      {
        title: "wall.s4",
        parts: [
          { kind: "intuitive", moves: parseAlg("R2 L2"), tip: "wall.t4" },
          { kind: "intuitive", moves: parseAlg("U2 D2"), tip: "wall.t4b" },
        ],
      },
      {
        title: "wall.s5",
        parts: [
          { kind: "intuitive", moves: repeat("R2 U2", 3), tip: "wall.t5" },
          { kind: "intuitive", moves: repeat("L2 D2", 3), tip: "wall.t5b" },
        ],
      },
    ],
  },
  {
    id: "easy-1x2x3",
    chapter: "easy",
    tutorial: true,
    title: "level.wall3.title",
    text: "level.wall3.text",
    about: "level.wall3.about",
    puzzle: WALL_3,
    // The 1x2x2's speed: the middle row and the longer runs are the step up.
    bpm: 50,
    // Every section turns it back in line. U2, E2 and D2 together turn the whole thing around, and
    // R2 and L2 upside down. R2 E2 swaps the right corners and the middle two: twice and they're
    // home with the middle row turned around, four times and it's all back. R2 U2 R2 D2 takes three
    // corners around.
    sections: [
      { title: "wall3.s1", parts: [{ kind: "align", moves: repeat("E2", 2), tip: "wall3.t1" }] },
      {
        title: "wall3.s2",
        parts: [
          { kind: "intuitive", moves: parseAlg("U2 E2 D2"), tip: "wall3.t2" },
          { kind: "intuitive", moves: parseAlg("D2 E2 U2"), tip: "wall3.t2b" },
        ],
      },
      {
        title: "wall3.s3",
        parts: [
          { kind: "align", moves: repeat("R2", 2), tip: "wall3.t3" },
          { kind: "intuitive", moves: parseAlg("R2 L2"), tip: "wall3.t3b" },
        ],
      },
      { title: "wall3.s4", parts: [{ kind: "intuitive", moves: repeat("R2 E2", 4), tip: "wall3.t4" }] },
      { title: "wall3.s5", parts: [{ kind: "intuitive", moves: repeat("R2 U2 R2 D2", 3), tip: "wall3.t5" }] },
    ],
  },
  {
    id: "easy-1x3x3",
    chapter: "easy",
    tutorial: true,
    title: "level.floppy.title",
    text: "level.floppy.text",
    about: "level.floppy.about",
    puzzle: FLOPPY,
    // The 1x2x3's speed and length again: the middle column, M2, is the step up.
    bpm: 50,
    // Every section turns it back in line. R2, M2 and L2 together turn the whole thing upside down.
    // M2 E2 swaps the cubies around the center across it, and M2 U2 M2 D2 the corners left and right,
    // turned around: twice and they're back. R2 U2 R2 U2 takes three corners around.
    sections: [
      { title: "floppy.s1", parts: [{ kind: "align", moves: repeat("M2", 2), tip: "floppy.t1" }] },
      {
        title: "floppy.s2",
        parts: [
          { kind: "intuitive", moves: parseAlg("R2 M2 L2"), tip: "floppy.t2" },
          { kind: "intuitive", moves: parseAlg("L2 M2 R2"), tip: "floppy.t2b" },
        ],
      },
      { title: "floppy.s3", parts: [{ kind: "intuitive", moves: repeat("M2 E2", 2), tip: "floppy.t3" }] },
      { title: "floppy.s4", parts: [{ kind: "intuitive", moves: repeat("M2 U2 M2 D2", 2), tip: "floppy.t4" }] },
      { title: "floppy.s5", parts: [{ kind: "intuitive", moves: repeat("R2 U2 R2 U2", 3), tip: "floppy.t5" }] },
    ],
  },
  {
    id: "easy-2x2x3",
    chapter: "easy",
    tutorial: true,
    title: "level.pillar.title",
    text: "level.pillar.text",
    about: "level.pillar.about",
    puzzle: PILLAR,
    // The 1x3x3's speed and length in beats, with more notes: quarter turns are taps, a beat long,
    // between the held half turns. F2 and mixing the two are the step up.
    bpm: 50,
    // Every section turns it back in line. U, E' and D' together turn the whole thing; R2 F2, U R2
    // U R2 and F2 E F2 E' (three middle cubies) take cubies around and back in three.
    sections: [
      { title: "pillar.s1", parts: [{ kind: "align", moves: repeat("F2", 2), tip: "pillar.t1" }] },
      {
        title: "pillar.s2",
        parts: [
          { kind: "intuitive", moves: parseAlg("U E' D'"), tip: "pillar.t2" },
          { kind: "intuitive", moves: parseAlg("D E U'"), tip: "pillar.t2b" },
        ],
      },
      { title: "pillar.s3", parts: [{ kind: "intuitive", moves: repeat("R2 F2", 3), tip: "pillar.t3" }] },
      { title: "pillar.s4", parts: [{ kind: "intuitive", moves: repeat("U R2 U R2", 3), tip: "pillar.t4" }] },
      { title: "pillar.s5", parts: [{ kind: "intuitive", moves: repeat("F2 E F2 E'", 3), tip: "pillar.t5" }] },
    ],
  },
  {
    id: "medium-2x2x2",
    chapter: "medium",
    title: "level.pocket.title",
    text: "level.pocket.text",
    about: "level.pocket.about",
    puzzle: POCKET,
    // The song played backwards, at its shortest.
    scramble: parseAlg("R F R U' F2 U F' U' R'"),
    // A real cube now, and Medium: a quarter turn a second, the tap-heavy songs of real solves.
    bpm: 60,
    // R and F' four times, and R L' four times (the whole cube turns over and back), come back to
    // where they started: a warm-up that shows the scramble from every side. R U R' U' and R' F R F'
    // three times each, then R2 U2 and R2 F2 twice each, solve it.
    sections: [
      {
        title: "pocket.s1",
        parts: [
          { kind: "align", moves: repeat("R", 4) },
          { kind: "align", moves: repeat("F'", 4) },
        ],
      },
      { title: "pocket.s2", parts: [{ kind: "intuitive", moves: repeat("R L'", 4) }] },
      { title: "pocket.s3", parts: [{ kind: "intuitive", moves: repeat("R U R' U'", 3) }] },
      { title: "pocket.s4", parts: [{ kind: "intuitive", moves: repeat("R' F R F'", 3) }] },
      {
        title: "pocket.s5",
        parts: [
          { kind: "intuitive", moves: repeat("R2 U2", 2) },
          { kind: "intuitive", moves: repeat("R2 F2", 2) },
        ],
      },
    ],
  },
  {
    id: "medium-pyraminx1",
    chapter: "medium",
    title: "level.pyra1.title",
    text: "level.pyra1.text",
    about: "level.pyra1.about",
    puzzle: PYRA_ONE,
    // The song played backwards, at its shortest. One piece can only be held another way: here, a
    // half turn around an edge, since a single corner's turn would come home in the middle of the
    // song, where each corner turns on its own.
    scramble: parseAlg("U B'"),
    // One piece, so gentle: a third of a turn a beat, at the 2x2x2's speed.
    bpm: 60,
    // A corner's turn three times, two corners' turns one each way twice (a half turn around an
    // edge), and L U R come back to where they started; U L R, a half turn around another edge,
    // turns it home.
    sections: [
      {
        title: "pyra1.s1",
        parts: [
          { kind: "align", moves: repeat("U", 3) },
          { kind: "align", moves: repeat("U'", 3) },
        ],
      },
      {
        title: "pyra1.s2",
        parts: [
          { kind: "align", moves: repeat("L", 3) },
          { kind: "align", moves: repeat("R", 3) },
          { kind: "align", moves: repeat("B", 3) },
        ],
      },
      {
        title: "pyra1.s3",
        parts: [
          { kind: "intuitive", moves: repeat("U L'", 2) },
          { kind: "intuitive", moves: repeat("R B'", 2) },
        ],
      },
      {
        title: "pyra1.s4",
        parts: [
          { kind: "intuitive", moves: parseAlg("L U R") },
          { kind: "intuitive", moves: parseAlg("U L R") },
        ],
      },
    ],
  },
  {
    id: "medium-pyraminx2",
    chapter: "medium",
    title: "level.pyra2.title",
    text: "level.pyra2.text",
    about: "level.pyra2.about",
    puzzle: PYRA_TWO,
    // The song played backwards, at its shortest.
    scramble: parseAlg("R' U R' L B' R U L"),
    // Real pieces now, still at the 2x2x2's speed.
    bpm: 60,
    // U and L' three times come back to where they started: a warm-up. R U R' U' and its mirror
    // L' U' L U come back after three, and so does R' L R L', so twice each is the same as once the
    // other way; with U L R B, they solve it.
    sections: [
      {
        title: "pyra2.s1",
        parts: [
          { kind: "align", moves: repeat("U", 3) },
          { kind: "align", moves: repeat("L'", 3) },
        ],
      },
      { title: "pyra2.s2", parts: [{ kind: "intuitive", moves: repeat("R U R' U'", 2) }] },
      { title: "pyra2.s3", parts: [{ kind: "intuitive", moves: repeat("L' U' L U", 2) }] },
      { title: "pyra2.s4", parts: [{ kind: "intuitive", moves: repeat("R' L R L'", 2) }] },
      { title: "pyra2.s5", parts: [{ kind: "intuitive", moves: parseAlg("U L R B") }] },
    ],
  },
  {
    id: "medium-pyraminx3",
    chapter: "medium",
    title: "level.pyra3.title",
    text: "level.pyra3.text",
    about: "level.pyra3.about",
    puzzle: PYRA_THREE,
    // The song played backwards, at its shortest: its layers, then its tips.
    scramble: parseAlg("L R' L' R' L' R B' U' u' l' r' b'"),
    // The tips are the step up; still at the 2x2x2's speed.
    bpm: 60,
    // u and r' three times come back to where they started: a warm-up for the tips. U R' U' R, its
    // mirror U' L U L' and B R' B' R come back after three, so twice each is once the other way;
    // with L R U B they solve the layers, and every tip then solves it, on the last one.
    sections: [
      {
        title: "pyra3.s1",
        parts: [
          { kind: "align", moves: repeat("u", 3) },
          { kind: "align", moves: repeat("r'", 3) },
        ],
      },
      { title: "pyra3.s2", parts: [{ kind: "intuitive", moves: repeat("U R' U' R", 2) }] },
      { title: "pyra3.s3", parts: [{ kind: "intuitive", moves: repeat("U' L U L'", 2) }] },
      { title: "pyra3.s4", parts: [{ kind: "intuitive", moves: repeat("B R' B' R", 2) }] },
      { title: "pyra3.s5", parts: [{ kind: "intuitive", moves: parseAlg("L R U B") }] },
      { title: "pyra3.s6", parts: [{ kind: "intuitive", moves: parseAlg("u l r b") }] },
    ],
  },
];

export const levelChart = ({ puzzle, scramble = [], sections }: Level): Chart =>
  layOut(puzzle, scramble.reduce(puzzle.apply, puzzle.solved), sections);

/** Stars a level needs to count as passed and open the next one. */
export const PASS_STARS = 3;

export const passed = (progress: Progress, level: Level) => (progress[level.id]?.stars ?? 0) >= PASS_STARS;

/** The first level is always open; the others once the level before has three stars. */
export const isOpen = (progress: Progress, level: Level) => {
  const i = LEVELS.indexOf(level);
  return i === 0 || passed(progress, LEVELS[i - 1]);
};

export const nextLevel = (level: Level): Level | undefined => LEVELS[LEVELS.indexOf(level) + 1];

/** The level's number in its chapter, from 1. */
export const numberOf = (level: Level) => LEVELS.filter((l) => l.chapter === level.chapter).indexOf(level) + 1;
