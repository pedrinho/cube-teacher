import { describe, expect, it } from "vitest";
import { SOLVED, applyAlg, randomScramble } from "../../cube/model";
import { validate } from "../../cube/validate";
import { f2lDone, solvedUpToTop, topYellow, yellowUp } from "../../methods/fridrich/classify";
import { solveFridrich } from "../../methods/fridrich/solver";
import { topColorEdges } from "../../methods/layers/goals";
import { FRIDRICH } from "../../methods/registry";
import { ALL_FR_CASES, FR_LESSONS } from "./lessons";

describe("Fridrich lessons", () => {
  const cases = [...ALL_FR_CASES.values()];

  it("has the 2-look edge cases, the 7 corner OLLs, 21 PLLs, 57 OLLs and 41 F2L cases", () => {
    expect(cases.filter((c) => c.id.startsWith("oll2.")).length).toBe(3);
    expect(cases.filter((c) => c.id.startsWith("pll.")).length).toBe(21);
    expect(cases.filter((c) => c.id.startsWith("oll.")).length).toBe(57);
    expect(cases.filter((c) => c.id.startsWith("f2l.")).length).toBe(41);
    expect(FR_LESSONS[3].groups[1].cases.length).toBe(7);
  });

  it("every case picture is a real cube and its demo reaches the case's goal", () => {
    for (const c of cases) {
      expect(validate(c.setup), c.id).toEqual({ ok: true });
      const after = yellowUp(applyAlg(c.setup, c.demo));
      if (c.id.startsWith("f2l")) expect(f2lDone(after), c.id).toBe(true);
      if (c.id.startsWith("oll.")) expect(f2lDone(after) && topYellow(after), c.id).toBe(true);
      if (c.id.startsWith("oll2")) expect(topColorEdges(after).length, c.id).toBe(4);
      if (c.id.startsWith("pll")) expect(solvedUpToTop(after), c.id).toBe(true);
    }
  });

  it("the 2-look edge pictures show a line, an L and a dot", () => {
    const up = (id: string) => topColorEdges(ALL_FR_CASES.get(id)!.setup).sort();
    expect(up("oll2.line")).toEqual(["UL", "UR"]);
    expect(up("oll2.ell")).toEqual(["UB", "UL"]);
    expect(up("oll2.dot")).toEqual([]);
  });

  it("every case the guided solve uses links to a lesson that shows it", () => {
    let seed = 5;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let n = 0; n < 200; n++)
      for (const stage of solveFridrich(applyAlg(SOLVED, randomScramble(25, random))))
        for (const seg of stage.segments) {
          if (!seg.caseId) continue;
          const link = FRIDRICH.lessonLink(seg.caseId);
          expect(link, seg.caseId).toBeDefined();
          const [, , , step, id] = link!.split("/");
          expect(FR_LESSONS[Number(step)].groups.some((g) => g.cases.some((c) => c.id === id)), seg.caseId).toBe(true);
        }
  });
});
