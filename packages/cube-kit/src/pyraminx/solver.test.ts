import { describe, expect, it } from "vitest";
import { CENTERS, EDGES, PYRA_SOLVED, TIPS, applyPyraAlg, inPlace, isTip, randomPyraScramble, type PyraMove } from "./model";
import { solvePyraminx, solveTurns } from "./solver";

let seed = 7;
const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

describe("pyraminx solver", () => {
  it("solves 500 random pyraminxes, one step at a time", () => {
    let longest = 0;
    for (let n = 0; n < 500; n++) {
      const start = applyPyraAlg(PYRA_SOLVED, randomPyraScramble(14, random));
      const stages = solvePyraminx(start);
      expect(stages.map((s) => s.step)).toEqual([1, 2, 3, 4]);

      let state = start;
      for (const stage of stages)
        for (const seg of stage.segments) {
          expect(seg.before).toBe(state);
          state = applyPyraAlg(state, seg.moves as PyraMove[]);
          expect(seg.after).toBe(state);
          // Only the tips step turns tips.
          expect(seg.moves.every((m) => isTip(m.base as PyraMove["base"]) === (stage.step === 1))).toBe(true);
        }
      expect(state).toBe(PYRA_SOLVED);

      // After each step, what it was for is done.
      const after = stages.map((s) => s.segments[s.segments.length - 1].after);
      for (const c of ["U", "L", "R", "B"] as const) expect(TIPS[c].every((t, k) => after[0][t] === after[0][CENTERS[c][k]])).toBe(true);
      for (const c of ["L", "R", "B"] as const) expect(inPlace(after[1], CENTERS[c])).toBe(true);
      for (const e of EDGES.filter((e) => !e.corners.includes("U"))) expect(inPlace(after[2], e.stickers)).toBe(true);

      longest = Math.max(longest, stages.reduce((sum, s) => sum + s.segments.reduce((k, seg) => k + seg.moves.length, 0), 0));
    }
    // A beginner's solve stays a short song.
    expect(longest).toBeLessThan(40);
  });

  it("says so when a step is already done", () => {
    const stages = solvePyraminx(PYRA_SOLVED);
    expect(stages.map((s) => s.segments.map((seg) => seg.explain.key))).toEqual([
      ["py.seg.tipsDone"],
      ["py.seg.centersDone"],
      ["py.seg.baseDone"],
      ["py.seg.done"],
    ]);
  });

  it("finds the shortest way back with corner turns", () => {
    expect(solveTurns(applyPyraAlg(PYRA_SOLVED, "R U' L B"))).toHaveLength(4);
    expect(applyPyraAlg(applyPyraAlg(PYRA_SOLVED, "R U' L B R' L"), solveTurns(applyPyraAlg(PYRA_SOLVED, "R U' L B R' L")))).toBe(PYRA_SOLVED);
  });
});
