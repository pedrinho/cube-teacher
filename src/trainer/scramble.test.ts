import { expect, it } from "vitest";
import { SOLVED, applyAlg, isRotation } from "../cube/model";
import { holdAs } from "../cube/orientation";
import { ALL_FR_CASES } from "../content/fridrich/lessons";
import { scrambleFor } from "./scramble";

it("makes face-turn scrambles that set up a case", async () => {
  for (const id of ["pll.T", "oll.1", "f2l.4", "oll2.dot"]) {
    const c = ALL_FR_CASES.get(id)!;
    const scramble = await scrambleFor(c.setup);
    expect(scramble.some(isRotation)).toBe(false);
    expect(applyAlg(SOLVED, scramble)).toBe(holdAs(c.setup, "W", "G"));
  }
}, 60_000);
