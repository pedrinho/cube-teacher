// The levels, in four chapters from easy to extreme. Each is a song written out by hand for a
// puzzle, always at the same speed. Chapter 1's are tutorials, with a tip for every part of the
// song; from chapter 2 on there are no tutorials and no tips, only what the level is about. Each
// level opens once the one before it has three stars.
import { parseAlg } from "cube-kit/cube/model";
import type { MessageKey } from "../i18n/en";
import type { Progress } from "../settings";
import { layOut, type Chart, type SectionPlan } from "./chart";
import { FLOPPY, ONE, PILLAR, POCKET, TOWER, TOWER_3, TOWER_4, WALL, WALL_3, type Puzzle } from "./puzzles";

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
    // A real cube now, and Medium: a quarter turn a second, the tap-heavy songs of real solves.
    bpm: 60,
    // Every section comes back to where it started. R L' turns the whole cube (x), back after four;
    // R U R' U' comes back after six, R2 U2 and R2 F2 after three.
    sections: [
      {
        title: "pocket.s1",
        parts: [
          { kind: "align", moves: repeat("R", 4) },
          { kind: "align", moves: repeat("F'", 4) },
        ],
      },
      { title: "pocket.s2", parts: [{ kind: "intuitive", moves: repeat("R L'", 4) }] },
      {
        title: "pocket.s3",
        parts: [
          { kind: "intuitive", moves: repeat("R U R' U'", 3) },
          { kind: "intuitive", moves: repeat("R U R' U'", 3) },
        ],
      },
      {
        title: "pocket.s4",
        parts: [
          { kind: "intuitive", moves: repeat("R2 U2", 3) },
          { kind: "intuitive", moves: repeat("R2 F2", 3) },
        ],
      },
    ],
  },
];

export const levelChart = (level: Level): Chart => layOut(level.puzzle, level.puzzle.solved, level.sections);

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
