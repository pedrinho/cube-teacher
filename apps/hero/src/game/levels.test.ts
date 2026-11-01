import { describe, expect, it } from "vitest";
import { holdCount } from "./chart";
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

  it("plays the 1x1x1 on the space bar, the 1x1x2 and 1x1x4 on U and D, the 1x1x3 on U, D and E, the 1x2x2 on R, L, U and D, the 1x2x3 on those and E, and the 1x3x3 on those, E and M", () => {
    const [one, tower, tall, four, wall, wall3, floppy] = songs;
    const oneKeys = keysFor(one.puzzle, keys);
    expect(new Set(levelChart(one).notes.map((n) => keyFor(n.move, oneKeys)))).toEqual(new Set(["Space"]));
    // The 1x1x1 spins in fours: it ends the way it started.
    expect(levelChart(one).end).toBe(levelChart(one).start);
    const towerKeys = keysFor(tower.puzzle, keys);
    expect(new Set(levelChart(tower).notes.map((n) => keyFor(n.move, towerKeys)))).toEqual(new Set(["KeyU", "KeyD"]));
    const tallKeys = keysFor(tall.puzzle, keys);
    expect(new Set(levelChart(tall).notes.map((n) => keyFor(n.move, tallKeys)))).toEqual(new Set(["KeyU", "KeyD", "KeyE"]));
    // E comes down D's lane, outlined, as on the cube.
    const e = levelChart(tall).notes.find((n) => n.move.base === "E")!;
    expect([e.lane, e.shape]).toEqual(["D", "slice"]);
    // u and d are big notes on U's and D's keys.
    const fourKeys = keysFor(four.puzzle, keys);
    expect(new Set(levelChart(four).notes.map((n) => keyFor(n.move, fourKeys)))).toEqual(new Set(["KeyU", "KeyD"]));
    const u = levelChart(four).notes.find((n) => n.move.base === "u")!;
    expect([u.lane, u.shape]).toEqual(["U", "wide"]);
    // The 1x2x2 turns its four sides halfway: every note is held.
    const wallKeys = keysFor(wall.puzzle, keys);
    const wallChart = levelChart(wall);
    expect(new Set(wallChart.notes.map((n) => keyFor(n.move, wallKeys)))).toEqual(new Set(["KeyR", "KeyL", "KeyU", "KeyD"]));
    expect(holdCount(wallChart)).toBe(wallChart.notes.length);
    // The 1x2x3 adds its middle row, E2: held too, outlined in D's lane.
    const wall3Keys = keysFor(wall3.puzzle, keys);
    const wall3Chart = levelChart(wall3);
    expect(new Set(wall3Chart.notes.map((n) => keyFor(n.move, wall3Keys)))).toEqual(new Set(["KeyR", "KeyL", "KeyU", "KeyD", "KeyE"]));
    expect(holdCount(wall3Chart)).toBe(wall3Chart.notes.length);
    const e2 = wall3Chart.notes.find((n) => n.move.base === "E")!;
    expect([e2.lane, e2.shape]).toEqual(["D", "slice"]);
    // The 1x3x3 adds its middle column, M2: held too, outlined in L's lane.
    const floppyKeys = keysFor(floppy.puzzle, keys);
    const floppyChart = levelChart(floppy);
    expect(new Set(floppyChart.notes.map((n) => keyFor(n.move, floppyKeys)))).toEqual(
      new Set(["KeyR", "KeyL", "KeyU", "KeyD", "KeyE", "KeyM"]),
    );
    expect(holdCount(floppyChart)).toBe(floppyChart.notes.length);
    const m2 = floppyChart.notes.find((n) => n.move.base === "M")!;
    expect([m2.lane, m2.shape]).toEqual(["L", "slice"]);
  });

  it("opens each level once the one before has three stars", () => {
    const [one, tower, tall, four, wall, wall3, floppy] = LEVELS;
    const pass = { stars: 3, points: 500 };
    expect(isOpen({}, one)).toBe(true);
    expect(isOpen({}, tower)).toBe(false);
    expect(isOpen({ [one.id]: { stars: 2, points: 900 } }, tower)).toBe(false);
    expect(isOpen({ [one.id]: pass }, tower)).toBe(true);
    expect(isOpen({ [one.id]: pass }, tall)).toBe(false);
    expect(isOpen({ [one.id]: pass, [tower.id]: pass }, tall)).toBe(true);
    expect(isOpen({ [one.id]: pass, [tower.id]: pass, [tall.id]: pass }, four)).toBe(true);
    const firstFour = { [one.id]: pass, [tower.id]: pass, [tall.id]: pass, [four.id]: pass };
    expect(isOpen(firstFour, wall)).toBe(true);
    expect(isOpen(firstFour, wall3)).toBe(false);
    const firstFive = { ...firstFour, [wall.id]: pass };
    expect(isOpen(firstFive, wall3)).toBe(true);
    expect(isOpen(firstFive, floppy)).toBe(false);
    const firstSix = { ...firstFive, [wall3.id]: pass };
    expect(isOpen(firstSix, floppy)).toBe(true);
    expect(isOpen(firstSix, REAL_CUBES)).toBe(false);
    expect(isOpen({ ...firstSix, [floppy.id]: pass }, REAL_CUBES)).toBe(true);
  });

  it("numbers the levels in each chapter", () => {
    expect(LEVELS.map((l) => [l.chapter, numberOf(l)])).toEqual([
      ["easy", 1],
      ["easy", 2],
      ["easy", 3],
      ["easy", 4],
      ["easy", 5],
      ["easy", 6],
      ["easy", 7],
      ["medium", 1],
    ]);
    expect(nextLevel(LEVELS[0])).toBe(LEVELS[1]);
    expect(nextLevel(REAL_CUBES)).toBeUndefined();
  });
});
