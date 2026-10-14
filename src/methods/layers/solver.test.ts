import { describe, expect, it } from "vitest";
import { SOLVED, algToString, applyAlg, centers, isRotation, parseAlg, randomScramble } from "../../cube/model";
import { ALGS } from "./algs";
import { STEP_GOALS } from "./goals";
import { SOLVER_STEPS, solveLayers } from "./solver";

let seed = 7;
const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const DOCUMENTED = new Set<string>(Object.values(ALGS));

describe("layer solver", () => {
  it("solves 2,000 random cubes step by step, as far as the solver goes", () => {
    const moves: number[][] = Array.from({ length: SOLVER_STEPS }, () => []);
    for (let n = 0; n < 2000; n++) {
      const scrambled = applyAlg(SOLVED, randomScramble(25, random));
      const stages = solveLayers(scrambled);
      let state = scrambled;
      stages.forEach((stage, i) => {
        for (const seg of stage.segments) {
          expect(seg.before).toBe(state);
          state = applyAlg(state, seg.moves);
          expect(seg.after).toBe(state);
          if (seg.kind === "rotate") expect(seg.moves.every(isRotation)).toBe(true);
          else expect(seg.moves.some(isRotation)).toBe(false);
          if (seg.kind === "alg") expect(DOCUMENTED.has(algToString(seg.moves))).toBe(true);
          if (seg.kind === "align") expect(seg.moves.every((m) => m.base === "U")).toBe(true);
        }
        // This step's goal holds, and so do the earlier ones.
        for (let s = 1; s <= stage.step; s++) expect(STEP_GOALS[s](state)).toBe(true);
        moves[i].push(stage.segments.filter((g) => g.kind !== "rotate").reduce((k, g) => k + g.moves.length, 0));
      });
    }
    const stats = moves.map((m, i) => `step ${i + 1}: avg ${(m.reduce((a, b) => a + b, 0) / m.length).toFixed(1)}, max ${Math.max(...m)}`);
    console.info(stats.join(" | "));
  });

  it("holds the cube white on top for the cross and yellow on top afterwards", () => {
    const [cross, ...rest] = solveLayers(applyAlg(SOLVED, "R U F' L2 D B"));
    for (const seg of cross.segments.filter((s) => s.kind !== "rotate")) expect(centers(seg.before).U).toBe("W");
    for (const stage of rest)
      for (const seg of stage.segments.filter((s) => s.kind !== "rotate")) expect(centers(seg.before).U).toBe("Y");
  });

  it("says the cross is done when it already is", () => {
    const [cross] = solveLayers(applyAlg(SOLVED, "D"));
    expect(cross.segments.map((s) => s.kind)).toEqual(["info"]);
  });

  it("uses case 1 for a corner with white facing right", () => {
    // Yellow on top, first layer solved except the front-right corner, which sits above its place.
    const start = applyAlg(SOLVED, "z2");
    const caseState = applyAlg(start, parseAlg("R U' R'"));
    const [, corners] = solveLayers(applyAlg(caseState, "z2"));
    expect(corners.segments.filter((s) => s.kind === "alg").map((s) => s.caseId)).toEqual(["2.1"]);
  });
});
