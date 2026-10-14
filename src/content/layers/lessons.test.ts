// The lesson texts describe where each piece is; these checks keep them honest.
import { describe, expect, it } from "vitest";
import { applyAlg, type Color, type CubeState } from "../../cube/model";
import { slotOf } from "../../cube/pieces";
import { validate } from "../../cube/validate";
import {
  MIDDLE_EDGES,
  crossDone,
  firstLayerDone,
  secondLayerDone,
  topColorEdges,
  yellowCrossDone,
  yellowFaceDone,
  topCornersDone,
} from "../../methods/layers/goals";
import { headlights } from "../../methods/layers/step6-corners";
import { isSolved, EDGE_SLOTS } from "../../cube/model";
import { homeOf } from "../../cube/pieces";
import { CORNER_SLOTS } from "../../cube/model";
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

describe("lesson 4 cases", () => {
  const up = (id: string) => topColorEdges(byId(4, id).setup).sort();
  it("4.1 is an L at the back left", () => expect(up("4.1")).toEqual(["UB", "UL"]));
  it("4.2 is a line from left to right", () => expect(up("4.2")).toEqual(["UL", "UR"]));
  it("4.3 has only the yellow center", () => expect(up("4.3")).toEqual([]));
  it.each(["4.1", "4.2", "4.3"])("%s: the demo finishes the yellow cross", (id) => {
    const c = byId(4, id);
    expect(yellowCrossDone(applyAlg(c.setup, demoMoves(c)))).toBe(true);
  });
});

describe("lesson 5 cases", () => {
  const top = CORNER_SLOTS.filter((c) => c.faces[0] === "U");
  const ufl = top.find((c) => [...c.name].sort().join("") === "FLU")!;
  const up = (s: CubeState) => top.filter((c) => s[c.stickers[0]] === "Y").length;
  const yellowOn = (s: CubeState) => ufl.faces[ufl.stickers.findIndex((i) => s[i] === "Y")];
  it("5.1: one corner yellow on top, at the front left", () => {
    const s = byId(5, "5.1").setup;
    expect([up(s), yellowOn(s)]).toEqual([1, "U"]);
  });
  it("5.2: two corners yellow on top, front left corner shows yellow to the front", () => {
    const s = byId(5, "5.2").setup;
    expect([up(s), yellowOn(s)]).toEqual([2, "F"]);
  });
  it("5.3: no corner yellow on top, front left corner shows yellow to the left", () => {
    const s = byId(5, "5.3").setup;
    expect([up(s), yellowOn(s)]).toEqual([0, "L"]);
  });
  it.each(["5.1", "5.2", "5.3"])("%s: the demo makes the whole top yellow", (id) => {
    const c = byId(5, id);
    expect(yellowFaceDone(applyAlg(c.setup, demoMoves(c)))).toBe(true);
  });
});

describe("lesson 6 cases", () => {
  it("6.1 has headlights only at the back", () => expect(headlights(byId(6, "6.1").setup)).toEqual(["B"]));
  it("6.2 has no headlights", () => expect(headlights(byId(6, "6.2").setup)).toEqual([]));
  it.each(["6.1", "6.2"])("%s: the demo puts the top corners in place", (id) => {
    const c = byId(6, id);
    expect(topCornersDone(applyAlg(c.setup, demoMoves(c)))).toBe(true);
  });
});

describe("lesson 7 cases", () => {
  // Where each top edge has to go, as "from>to" slot names.
  const moves = (id: string) => {
    const s = byId(7, id).setup;
    return EDGE_SLOTS.filter((e) => e.faces[0] === "U")
      .map((e) => [e.name, homeOf(s, e.stickers.map((i) => s[i]) as Color[]).name])
      .filter(([a, b]) => a !== b)
      .map(([a, b]) => `${a}>${b}`)
      .sort();
  };
  it("7.1: back finished, edges go round clockwise (front to left)", () =>
    expect(moves("7.1")).toEqual(["UF>UL", "UL>UR", "UR>UF"]));
  it("7.2: back finished, edges go round counterclockwise (front to right)", () =>
    expect(moves("7.2")).toEqual(["UF>UR", "UL>UF", "UR>UL"]));
  it("7.3: opposite edges swap", () => expect(moves("7.3")).toEqual(["UB>UF", "UF>UB", "UL>UR", "UR>UL"]));
  it("7.4: neighboring edges swap", () => expect(moves("7.4")).toEqual(["UB>UR", "UF>UL", "UL>UF", "UR>UB"]));
  it.each(["7.1", "7.2", "7.3", "7.4"])("%s: the demo solves the cube", (id) => {
    const c = byId(7, id);
    expect(isSolved(applyAlg(c.setup, demoMoves(c)))).toBe(true);
  });
});

describe("all lesson cubes", () => {
  it("are real cubes", () => {
    for (const lesson of Object.values(LESSONS))
      for (const c of lesson.cases) expect(validate(c.setup), c.id).toEqual({ ok: true });
  });
});
