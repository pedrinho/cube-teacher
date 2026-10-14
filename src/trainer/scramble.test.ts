import { expect, it } from "vitest";
import { SOLVED, applyAlg, isRotation, parseAlg } from "../cube/model";
import { holdAs } from "../cube/orientation";
import { ALL_FR_CASES } from "../content/fridrich/lessons";
import { scrambleFor } from "./scramble";

it("every practice case gets a face-turn scramble that sets it up", () => {
  for (const c of ALL_FR_CASES.values()) {
    for (const turn of ["", "U", "U2", "U'"]) {
      const scramble = scrambleFor(c.setupMoves, parseAlg(turn));
      expect(scramble.some((m) => isRotation(m) || !"UDLRFB".includes(m.base)), c.id).toBe(false);
      expect(applyAlg(SOLVED, scramble), c.id).toBe(holdAs(applyAlg(c.setup, turn), "W", "G"));
    }
  }
});
