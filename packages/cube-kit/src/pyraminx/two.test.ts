import { describe, expect, it } from "vitest";
import { PYRA_STICKERS, TIPS, parsePyraAlg, type Vec } from "./model";
import { PYRA_2_SOLVED, PYRA_2_STICKERS, applyPyra2Move, isPyra2Solved } from "./two";

const play = (alg: string, from = PYRA_2_SOLVED) => parsePyraAlg(alg).reduce(applyPyra2Move, from);

/** Area of a flat polygon in space. */
const area = (pts: readonly Vec[]) => {
  const total = [0, 0, 0];
  pts.forEach((p, k) => {
    const q = pts[(k + 1) % pts.length];
    total[0] += p[1] * q[2] - p[2] * q[1];
    total[1] += p[2] * q[0] - p[0] * q[2];
    total[2] += p[0] * q[1] - p[1] * q[0];
  });
  return Math.hypot(...total) / 2;
};

describe("two-layer pyraminx", () => {
  it("turns its corners with their tips, and never a tip alone", () => {
    expect(play("U U U")).toBe(PYRA_2_SOLVED);
    expect(isPyra2Solved(play("U"))).toBe(false);
    expect(() => play("u")).toThrow();
    // However it's turned, every tip is still the color of its corner's center.
    const s = play("R U R' U' L' B R B' U L");
    for (const [corner, tips] of Object.entries(TIPS))
      for (const i of tips) {
        const center = PYRA_STICKERS.findIndex(
          (o) => o.face === PYRA_STICKERS[i].face && o.kind === "center" && o.corners[0] === corner,
        );
        expect(s[i]).toBe(s[center]);
      }
  });

  it("comes back from R U R' U' after three, and from U L after fifteen", () => {
    expect(isPyra2Solved(play("R U R' U' R U R' U'"))).toBe(false);
    expect(play("R U R' U' R U R' U' R U R' U'")).toBe(PYRA_2_SOLVED);
    expect(play(Array(15).fill("U L").join(" "))).toBe(PYRA_2_SOLVED);
  });

  it("draws each tip and its center as one piece", () => {
    expect(PYRA_2_STICKERS).toHaveLength(PYRA_STICKERS.length);
    PYRA_2_STICKERS.forEach((s, i) => {
      const { kind, triangle } = PYRA_STICKERS[i];
      // A center is drawn by its tip: the two make a rhombus twice the size of either.
      if (kind === "center") expect(s.outline).toEqual([]);
      else if (kind === "tip") {
        expect(s.outline).toHaveLength(4);
        expect(area(s.outline)).toBeCloseTo(2 * area(triangle));
      } else expect(s.outline).toEqual(triangle);
    });
  });
});
