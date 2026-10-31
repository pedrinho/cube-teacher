import { describe, expect, it } from "vitest";
import { DEFAULT_KEYS, keyFor } from "./lanes";
import { LEVELS, REAL_CUBES, isOpen, levelChart, nextLevel, numberOf, type SongLevel } from "./levels";
import { keysFor } from "./puzzles";

const songs = LEVELS.filter((l): l is SongLevel => l.kind === "song");
const keys = { cube: DEFAULT_KEYS, pyraminx: DEFAULT_KEYS };

describe("levels", () => {
  it.each(songs.map((l) => [l.id, l] as const))("%s is played on its puzzle's keys, every section ending solved", (_, level) => {
    const chart = levelChart(level);
    const played = keysFor(level.puzzle, keys);
    const puzzleKeys = new Set(level.puzzle.letters.map((l) => played[l]));
    expect(chart.notes.length).toBeGreaterThan(10);
    for (const note of chart.notes) expect(puzzleKeys.has(keyFor(note.move, played))).toBe(true);
    for (const section of chart.sections) expect(level.puzzle.isSolved(section.after)).toBe(true);
  });

  it("plays the 1x1x1 on the space bar, and the 1x1x2 on U and D", () => {
    const [one, tower] = songs;
    const oneKeys = keysFor(one.puzzle, keys);
    expect(new Set(levelChart(one).notes.map((n) => keyFor(n.move, oneKeys)))).toEqual(new Set(["Space"]));
    // The 1x1x1 spins in fours: it ends the way it started.
    expect(levelChart(one).end).toBe(levelChart(one).start);
    const towerKeys = keysFor(tower.puzzle, keys);
    expect(new Set(levelChart(tower).notes.map((n) => keyFor(n.move, towerKeys)))).toEqual(new Set(["KeyU", "KeyD"]));
  });

  it("opens each level once the one before has three stars", () => {
    const [one, tower] = LEVELS;
    expect(isOpen({}, one)).toBe(true);
    expect(isOpen({}, tower)).toBe(false);
    expect(isOpen({ [one.id]: { stars: 2, points: 900 } }, tower)).toBe(false);
    expect(isOpen({ [one.id]: { stars: 3, points: 900 } }, tower)).toBe(true);
    expect(isOpen({ [one.id]: { stars: 5, points: 9000 } }, REAL_CUBES)).toBe(false);
    expect(isOpen({ [one.id]: { stars: 5, points: 9000 }, [tower.id]: { stars: 3, points: 500 } }, REAL_CUBES)).toBe(true);
  });

  it("numbers the levels in each chapter", () => {
    expect(LEVELS.map((l) => [l.chapter, numberOf(l)])).toEqual([
      ["easy", 1],
      ["easy", 2],
      ["medium", 1],
    ]);
    expect(nextLevel(LEVELS[0])).toBe(LEVELS[1]);
    expect(nextLevel(REAL_CUBES)).toBeUndefined();
  });
});
