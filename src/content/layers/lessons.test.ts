// The lesson texts describe where each piece is; these checks keep them honest.
import { describe, expect, it } from "vitest";
import { applyAlg, type Color, type CubeState } from "../../cube/model";
import { slotOf } from "../../cube/pieces";
import { crossDone, firstLayerDone } from "../../methods/layers/goals";
import { LESSONS } from "./lessons";

const where = (state: CubeState, piece: Color[]) => {
  const slot = slotOf(state, piece);
  const white = slot.stickers.findIndex((i) => state[i] === "W");
  return { at: [...slot.name].sort().join(""), whiteOn: slot.faces[white] };
};
const sorted = (s: string) => [...s].sort().join("");
const byId = (step: number, id: string) => LESSONS[step].cases.find((c) => c.id === id)!;

describe("lesson 1 cases", () => {
  const expectations: Record<string, [Color[], string, string]> = {
    "1.a": [["W", "R"], "FR", "F"],
    "1.b": [["W", "G"], "FR", "R"],
    "1.c": [["W", "R"], "DR", "D"],
    "1.d": [["W", "R"], "FL", "F"],
    "1.e": [["W", "R"], "DR", "R"],
    "1.f": [["W", "R"], "UR", "R"],
  };
  for (const [id, [piece, at, whiteOn]] of Object.entries(expectations)) {
    it(`${id}: the white-${piece[1]} edge starts at ${at} with white on ${whiteOn}, and the moves finish the cross`, () => {
      const c = byId(1, id);
      expect(where(c.setup, piece)).toEqual({ at: sorted(at), whiteOn });
      expect(crossDone(applyAlg(c.setup, `${c.alg} ${c.then ?? ""}`))).toBe(true);
    });
  }
});

describe("lesson 2 cases", () => {
  const corner: Color[] = ["W", "B", "R"];
  it.each([
    ["2.1", "UFR", "R"],
    ["2.2", "UFR", "F"],
    ["2.3", "UFR", "U"],
    ["2.out", "DFR", "F"],
  ])("%s: the corner starts at %s with white on %s, and the moves finish the layer", (id, at, whiteOn) => {
    const c = byId(2, id);
    expect(where(c.setup, corner)).toEqual({ at: sorted(at), whiteOn });
    expect(firstLayerDone(applyAlg(c.setup, `${c.alg} ${c.then ?? ""}`))).toBe(true);
  });
});
