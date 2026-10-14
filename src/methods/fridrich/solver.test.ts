import { describe, expect, it } from "vitest";
import { SOLVED, algToString, applyAlg, isRotation, isSolved, parseAlg, randomScramble } from "../../cube/model";
import { crossDone } from "../layers/goals";
import { F2L_CASES, OLL_CASES, PLL_CASES } from "./algs";
import { f2lDone, topYellow } from "./classify";
import { OLL_EDGES } from "./sets";
import { solveFridrich, type LastLayer } from "./solver";

const DOCUMENTED = new Set<string>(
  [...F2L_CASES, ...OLL_CASES, ...PLL_CASES].flatMap((c) => c.algs).map((a) => algToString(parseAlg(a))),
);
for (const a of Object.values(OLL_EDGES)) DOCUMENTED.add(algToString(parseAlg(a)));
const GOALS = [crossDone, f2lDone, (s: string) => f2lDone(s) && topYellow(s), isSolved];

describe.each(["full", "twoLook"] as LastLayer[])("Fridrich solver (%s last layer)", (mode) => {
  it("solves 1,000 random cubes with an optimal cross and only Cinoto's algorithms", () => {
    let seed = mode === "full" ? 11 : 13;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const moves: number[][] = [[], [], [], []];
    for (let n = 0; n < 1000; n++) {
      const scrambled = applyAlg(SOLVED, randomScramble(25, random));
      const stages = solveFridrich(scrambled, mode);
      let state = scrambled;
      stages.forEach((stage, i) => {
        for (const seg of stage.segments) {
          expect(seg.before).toBe(state);
          state = applyAlg(state, seg.moves);
          expect(seg.after).toBe(state);
          if (seg.kind === "rotate") expect(seg.moves.every(isRotation)).toBe(true);
          if (seg.kind === "align") expect(seg.moves.every((m) => m.base === "U")).toBe(true);
          if (seg.kind === "intuitive") {
            expect(seg.moves.some(isRotation)).toBe(false);
            expect(seg.moves.length).toBeLessThanOrEqual(8);
          }
          if (seg.kind === "alg") expect(DOCUMENTED.has(algToString(seg.moves)), algToString(seg.moves)).toBe(true);
        }
        for (let g = 0; g <= i; g++) expect(GOALS[g](state)).toBe(true);
        moves[i].push(stage.segments.filter((g) => g.kind !== "rotate").reduce((k, g) => k + g.moves.length, 0));
      });
    }
    const avg = (m: number[]) => (m.reduce((a, b) => a + b, 0) / m.length).toFixed(1);
    console.info(`${mode}: ` + ["cross", "F2L", "OLL", "PLL"].map((name, i) => `${name} avg ${avg(moves[i])}, max ${Math.max(...moves[i])}`).join(" | "));
  }, 120_000);
});
