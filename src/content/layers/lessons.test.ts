// The lesson texts describe where each piece is; these checks keep them honest.
import { describe, expect, it } from "vitest";
import { applyAlg, type Color, type CubeState } from "../../cube/model";
import { slotOf } from "../../cube/pieces";
import { validate } from "../../cube/validate";
import { MIDDLE_EDGES, crossDone, firstLayerDone, secondLayerDone } from "../../methods/layers/goals";
import { LESSONS, demoMoves } from "./lessons";

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
      expect(crossDone(applyAlg(c.setup, demoMoves(c)))).toBe(true);
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
    expect(firstLayerDone(applyAlg(c.setup, demoMoves(c)))).toBe(true);
  });
});

describe("lesson 3 cases", () => {
  const sideOf = (state: CubeState, piece: Color[]) => {
    const slot = slotOf(state, piece);
    return Object.fromEntries(slot.faces.map((f, k) => [f, state[slot.stickers[k]]]));
  };
  it("3.1: the blue-red edge is at the top front, blue over the blue center, red on top (goes right)", () => {
    expect(sideOf(byId(3, "3.1").setup, ["B", "R"])).toEqual({ U: "R", F: "B" });
  });
  it("3.2: the blue-orange edge is at the top front, blue over the blue center, orange on top (goes left)", () => {
    expect(sideOf(byId(3, "3.2").setup, ["B", "O"])).toEqual({ U: "O", F: "B" });
  });
  it("3.flip: the blue-red edge is in its place but flipped", () => {
    expect(sideOf(byId(3, "3.flip").setup, ["B", "R"])).toEqual({ F: "R", R: "B" });
  });
  it("3.none: no middle layer edge is on top, but the layer is not done", () => {
    const s = byId(3, "3.none").setup;
    expect(MIDDLE_EDGES.some((p) => slotOf(s, p).faces.includes("U"))).toBe(false);
    expect(secondLayerDone(s)).toBe(false);
  });
  it.each(["3.1", "3.2", "3.flip", "3.none"])("%s: the demo finishes the second layer", (id) => {
    const c = byId(3, id);
    expect(secondLayerDone(applyAlg(c.setup, demoMoves(c)))).toBe(true);
  });
});

describe("all lesson cubes", () => {
  it("are real cubes", () => {
    for (const lesson of Object.values(LESSONS))
      for (const c of lesson.cases) expect(validate(c.setup), c.id).toEqual({ ok: true });
  });
});
