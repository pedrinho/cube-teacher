// The levels, in four chapters from easy to extreme. A level is a song written out by hand on a
// small puzzle (the first ones are tutorials), or the choice of the full songs on a real cube or a
// pyraminx. Each level opens once the one before it has three stars.
import { parseAlg } from "cube-kit/cube/model";
import type { MessageKey } from "../i18n/en";
import type { Progress } from "../settings";
import { layOut, type Chart, type SectionPlan } from "./chart";
import { ONE, TOWER, type Puzzle } from "./puzzles";

export const CHAPTERS = ["easy", "medium", "hard", "extreme"] as const;
export type Chapter = (typeof CHAPTERS)[number];

interface LevelBase {
  id: string;
  chapter: Chapter;
  title: MessageKey;
  /** One line under the title on the levels screen. */
  text: MessageKey;
  tutorial?: boolean;
}

/** A song written for the level, always at the same speed. */
export interface SongLevel extends LevelBase {
  kind: "song";
  puzzle: Puzzle;
  bpm: number;
  /** What the level is about, on the screen before it. */
  about: MessageKey;
  sections: SectionPlan[];
}

/** The full songs: the player picks one, its speed and the cube. */
export interface ChoiceLevel extends LevelBase {
  kind: "choice";
}

export type Level = SongLevel | ChoiceLevel;

/** The same moves, `times` times over. */
const repeat = (alg: string, times: number) => parseAlg(Array(times).fill(alg).join(" "));

/** The layer method, Fridrich and the pyraminx, as they were before there were levels. */
export const REAL_CUBES: ChoiceLevel = {
  id: "medium-real",
  chapter: "medium",
  kind: "choice",
  title: "level.real.title",
  text: "level.real.text",
};

export const LEVELS: Level[] = [
  {
    id: "easy-1x1x1",
    chapter: "easy",
    kind: "song",
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
    kind: "song",
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
  REAL_CUBES,
];

export const levelChart = (level: SongLevel): Chart => layOut(level.puzzle, level.puzzle.solved, level.sections);

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
