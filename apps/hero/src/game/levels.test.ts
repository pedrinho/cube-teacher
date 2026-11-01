import { describe, expect, it } from "vitest";
import { holdCount } from "./chart";
import { DEFAULT_KEYS, keyFor, type Lane } from "./lanes";
import { LEVELS, isOpen, levelChart, nextLevel, numberOf } from "./levels";
import { keysFor } from "./puzzles";

const keys = DEFAULT_KEYS;

describe("levels", () => {
  it.each(LEVELS.map((l) => [l.id, l] as const))("%s is played on its puzzle's keys", (_, level) => {
    const chart = levelChart(level);
    const played = keysFor(level.puzzle, keys);
    const puzzleKeys = new Set(level.puzzle.letters.map((l) => played[l]));
    expect(chart.notes.length).toBeGreaterThan(10);
    for (const note of chart.notes) expect(puzzleKeys.has(keyFor(note.move, played))).toBe(true);
  });

  it("starts chapter 1 solved and brings it back every section; from chapter 2 on, starts scrambled and solves it on the last note", () => {
    for (const level of LEVELS) {
      const chart = levelChart(level);
      const { isSolved, solved } = level.puzzle;
      if (level.chapter === "easy") {
        expect(chart.start).toBe(solved);
        for (const section of chart.sections) expect(isSolved(section.after)).toBe(true);
      } else {
        expect(isSolved(chart.start)).toBe(false);
        expect(chart.notes.slice(0, -1).some((n) => isSolved(n.after))).toBe(false);
        // Back the way it was, not just solved with the cube held some other way.
        expect(chart.end).toBe(solved);
      }
    }
  });

  it("plays the 1x1x1 on the space bar, the 1x1x2 and 1x1x4 on U and D, the 1x1x3 on U, D and E, the 1x2x2 on R, L, U and D, the 1x2x3 on those and E, the 1x3x3 on those, E and M, the 2x2x3 on U, D, E, R and F, the 2x2x2 on R, U, F and L, and the one-piece pyraminx on its corners", () => {
    const [one, tower, tall, four, wall, wall3, floppy, pillar, pocket, pyra] = LEVELS;
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
    // The 2x2x3's layers turn a quarter, tapped, between its held half turns; F2 has its own lane.
    const pillarKeys = keysFor(pillar.puzzle, keys);
    const pillarChart = levelChart(pillar);
    expect(new Set(pillarChart.notes.map((n) => keyFor(n.move, pillarKeys)))).toEqual(new Set(["KeyU", "KeyD", "KeyE", "KeyR", "KeyF"]));
    expect(holdCount(pillarChart)).toBe(pillarChart.notes.filter((n) => n.move.amount === 2).length);
    expect(holdCount(pillarChart)).toBeLessThan(pillarChart.notes.length);
    const f2 = pillarChart.notes.find((n) => n.move.base === "F")!;
    expect([f2.lane, f2.shape]).toEqual(["F", "face"]);
    // The 2x2x2 turns every side a quarter, both ways, tapped; its half turns are held.
    const pocketKeys = keysFor(pocket.puzzle, keys);
    const pocketChart = levelChart(pocket);
    expect(new Set(pocketChart.notes.map((n) => keyFor(n.move, pocketKeys)))).toEqual(new Set(["KeyR", "KeyU", "KeyF", "KeyL"]));
    expect(new Set(pocketChart.notes.map((n) => n.move.amount))).toEqual(new Set([1, 2, 3]));
    expect(holdCount(pocketChart)).toBe(pocketChart.notes.filter((n) => n.move.amount === 2).length);
    // The one-piece pyraminx plays its corners, U L R B, each in its own lane, both ways: no holds.
    const pyraKeys = keysFor(pyra.puzzle, keys);
    const pyraChart = levelChart(pyra);
    expect(new Set(pyraChart.notes.map((n) => keyFor(n.move, pyraKeys)))).toEqual(new Set(["KeyU", "KeyL", "KeyR", "KeyB"]));
    for (const n of pyraChart.notes) expect(n.lane).toBe(n.move.base);
    expect(holdCount(pyraChart)).toBe(0);
    // A corner's lane has the color of the face across from it, which stays put while it turns.
    for (const n of pyraChart.notes) expect(pyra.puzzle.laneColor(n.after, n.lane as Lane)).toBe(pyra.puzzle.laneColor(n.before, n.lane as Lane));
    // And the lanes follow the puzzle as it's turned: the top corner's isn't always yellow.
    expect(new Set(pyraChart.notes.map((n) => pyra.puzzle.laneColor(n.before, "U")))).not.toEqual(new Set(["Y"]));
  });

  it("teaches in chapter 1, with a tip for every part, and from chapter 2 on just plays", () => {
    for (const level of LEVELS) {
      const tutorial = level.chapter === "easy";
      expect(level.tutorial ?? false).toBe(tutorial);
      for (const part of level.sections.flatMap((s) => s.parts)) expect(part.tip !== undefined).toBe(tutorial);
    }
  });

  it("opens each level once the one before has three stars", () => {
    const [one, tower, tall, four, wall, wall3, floppy, pillar, pocket, pyra] = LEVELS;
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
    expect(isOpen(firstSix, pillar)).toBe(false);
    const firstSeven = { ...firstSix, [floppy.id]: pass };
    expect(isOpen(firstSeven, pillar)).toBe(true);
    // The 2x2x2 opens chapter 2 once the 2x2x3 has three stars.
    expect(isOpen(firstSeven, pocket)).toBe(false);
    expect(isOpen({ ...firstSeven, [pillar.id]: { stars: 2, points: 900 } }, pocket)).toBe(false);
    expect(isOpen({ ...firstSeven, [pillar.id]: pass }, pocket)).toBe(true);
    // The one-piece pyraminx comes after the 2x2x2.
    expect(isOpen({ ...firstSeven, [pillar.id]: pass }, pyra)).toBe(false);
    expect(isOpen({ ...firstSeven, [pillar.id]: pass, [pocket.id]: pass }, pyra)).toBe(true);
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
      ["easy", 8],
      ["medium", 1],
      ["medium", 2],
    ]);
    expect(nextLevel(LEVELS[0])).toBe(LEVELS[1]);
    expect(nextLevel(LEVELS[LEVELS.length - 1])).toBeUndefined();
  });
});
