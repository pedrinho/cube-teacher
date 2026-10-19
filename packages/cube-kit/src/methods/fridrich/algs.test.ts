// Every algorithm transcribed from Cinoto's guide must solve a case of its set; the alternatives
// must solve the same case as the main one; and together the cases must cover the whole set.
import { describe, expect, it } from "vitest";
import { F2L_CASES, OLL_CASES, PLL_CASES, type AlgCase } from "./algs";
import { classifyAlg, type AlgSet } from "./classify";

const SETS: [AlgSet, AlgCase[], number][] = [
  ["f2l", F2L_CASES, 41],
  ["oll", OLL_CASES, 57],
  ["pll", PLL_CASES, 21],
];

describe.each(SETS)("%s", (set, cases, total) => {
  it("every algorithm solves a case, and alternatives solve the same one", () => {
    const problems: string[] = [];
    cases.forEach((c, i) => {
      const keys = c.algs.map((a) => classifyAlg(set, a)?.key);
      c.algs.forEach((a, k) => {
        if (!keys[k]) problems.push(`#${i + 1} ${c.name ?? ""} "${a}" solves no ${set} case`);
        else if (keys[k] !== keys[0]) problems.push(`#${i + 1} ${c.name ?? ""} "${a}" solves a different case than the main one`);
      });
    });
    expect(problems).toEqual([]);
  });

  it(`covers all ${total} cases, once each`, () => {
    const keys = cases.map((c) => classifyAlg(set, c.algs[0])?.key);
    const repeated = keys.filter((k, i) => k && keys.indexOf(k) !== i);
    expect(repeated).toEqual([]);
    expect(new Set(keys.filter(Boolean)).size).toBe(total);
  });
});

describe("2-look sets", () => {
  it("the seven corner OLLs all start with the yellow cross done", async () => {
    const { OLL_CORNER_CASES } = await import("./sets");
    const { topColorEdges } = await import("../layers/goals");
    expect(OLL_CORNER_CASES).not.toContain(-1);
    for (const i of OLL_CORNER_CASES) expect(topColorEdges(classifyAlg("oll", OLL_CASES[i].algs[0])!.setup)).toHaveLength(4);
  });

  it("the edge PLLs only move edges, and the corner PLLs fix the corners", async () => {
    const { PLL_CORNER_CASES, PLL_EDGE_CASES } = await import("./sets");
    const { YELLOW_CORNERS } = await import("../layers/goals");
    const { isSolvedPiece } = await import("../../cube/pieces");
    const { applyAlg } = await import("../../cube/model");
    const { U_TURNS } = await import("../../cube/orientation");
    const cornersOk = (s: string) => U_TURNS.some((u) => YELLOW_CORNERS.every((p) => isSolvedPiece(applyAlg(s, u), p)));
    for (const i of PLL_EDGE_CASES) expect(cornersOk(classifyAlg("pll", PLL_CASES[i].algs[0])!.setup)).toBe(true);
    for (const i of PLL_CORNER_CASES) expect(cornersOk(classifyAlg("pll", PLL_CASES[i].algs[0])!.setup)).toBe(false);
  });
});
