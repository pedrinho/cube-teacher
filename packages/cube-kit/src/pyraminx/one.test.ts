import { describe, expect, it } from "vitest";
import { CORNER_POS, PYRA_FACES, parsePyraAlg } from "./model";
import { PYRA_1_SOLVED, PYRA_1_STICKERS, applyPyra1Move, isPyra1Solved } from "./one";

const play = (alg: string, from = PYRA_1_SOLVED) => parsePyraAlg(alg).reduce(applyPyra1Move, from);

describe("one-piece pyraminx", () => {
  it("has one sticker per face, the whole face", () => {
    expect(PYRA_1_STICKERS.map((s) => s.face)).toEqual([...PYRA_FACES]);
    expect(PYRA_1_SOLVED).toBe("GRBY");
    // Each face is a triangle of three of the four corners: all but the one across from it.
    for (const s of PYRA_1_STICKERS) {
      const corners = s.outline.map((p) => Object.values(CORNER_POS).findIndex((c) => c.every((x, i) => Math.abs(x - p[i]) < 1e-9)));
      expect(new Set(corners).size).toBe(3);
      expect(Math.hypot(...s.normal)).toBeCloseTo(1);
    }
  });

  it("turns whole, a third of a turn around a corner", () => {
    expect(play("U U U")).toBe(PYRA_1_SOLVED);
    expect(play("U U'")).toBe(PYRA_1_SOLVED);
    expect(play("L' L' L'")).toBe(PYRA_1_SOLVED);
    // Clockwise seen from the top, like the cube's U: the front goes to the left.
    expect(play("U")).toBe("BGRY");
    // The face across from the corner spins in place: U keeps the bottom, B the front.
    expect(play("U")[3]).toBe("Y");
    expect(play("L")[2]).toBe("B");
    expect(play("R")[1]).toBe("R");
    expect(play("B")[0]).toBe("G");
    // A tip turns it the same as its corner: there's only one piece.
    expect(play("u")).toBe(play("U"));
  });

  it("can be held twelve ways, and is solved only the way it started", () => {
    // A set visits what is added to it while it's being gone through: every way it can be held.
    const seen = new Set([PYRA_1_SOLVED]);
    for (const s of seen) for (const m of parsePyraAlg("U L R B")) seen.add(applyPyra1Move(s, m));
    expect(seen.size).toBe(12);
    expect([...seen].filter(isPyra1Solved)).toEqual([PYRA_1_SOLVED]);
    // Two corners' turns, one each way, make a half turn around an edge: twice and it's back.
    expect(isPyra1Solved(play("U L'"))).toBe(false);
    expect(play("U L' U L'")).toBe(PYRA_1_SOLVED);
  });
});
