import { describe, expect, it } from "vitest";
import {
  CENTERS,
  CORNERS,
  CORNER_POS,
  EDGES,
  PYRA_MOVES,
  PYRA_SOLVED,
  PYRA_STICKERS,
  TIPS,
  applyPyraAlg,
  applyPyraMove,
  invertPyraMove,
  isPyraSolved,
  parsePyraAlg,
  pyraMoveToString,
  pyraPerm,
  randomPyraScramble,
} from "./model";

let seed = 5;
const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

const moved = (alg: string) => pyraPerm(parsePyraAlg(alg)[0]).filter((from, to) => from !== to).length;

describe("pyraminx model", () => {
  it("has 9 stickers on each of the 4 faces, all facing out", () => {
    expect(PYRA_STICKERS).toHaveLength(36);
    expect(PYRA_SOLVED).toBe("GGGGGGGGGRRRRRRRRRBBBBBBBBBYYYYYYYYY");
    for (const s of PYRA_STICKERS) {
      const out = s.center[0] * s.normal[0] + s.center[1] * s.normal[1] + s.center[2] * s.normal[2];
      expect(out).toBeCloseTo(1 / 3);
    }
  });

  it("knows its pieces: 4 tips and 4 centers of 3 stickers, 6 edges of 2", () => {
    for (const c of CORNERS) {
      expect(TIPS[c]).toHaveLength(3);
      expect(CENTERS[c]).toHaveLength(3);
      // Every sticker of a tip is at its corner.
      for (const i of TIPS[c]) expect(PYRA_STICKERS[i].triangle.some((p) => p.every((x, k) => Math.abs(x - CORNER_POS[c][k]) < 1e-9))).toBe(true);
    }
    expect(EDGES).toHaveLength(6);
    for (const e of EDGES) {
      expect(e.stickers.every((i) => i >= 0)).toBe(true);
      expect(PYRA_STICKERS[e.stickers[0]].face).not.toBe(PYRA_STICKERS[e.stickers[1]].face);
    }
  });

  it("turns a tip's 3 stickers, or a corner's 12", () => {
    expect(["u", "l", "r", "b"].map(moved)).toEqual([3, 3, 3, 3]);
    expect(["U", "L", "R", "B"].map(moved)).toEqual([12, 12, 12, 12]);
    // U leaves the bottom alone; it turns the front's top to the left face (clockwise from above).
    const u = applyPyraMove(PYRA_SOLVED, { base: "U", amount: 1 });
    expect(u.slice(27)).toBe("YYYYYYYYY");
    expect(u.slice(9, 13)).toBe("GGGG");
  });

  it.each(PYRA_MOVES)("%s three times, or %s then %s', changes nothing", (base) => {
    const m = { base, amount: 1 } as const;
    expect(applyPyraAlg(PYRA_SOLVED, [m, m, m])).toBe(PYRA_SOLVED);
    expect(applyPyraAlg(PYRA_SOLVED, [m, invertPyraMove(m)])).toBe(PYRA_SOLVED);
    expect(applyPyraAlg(PYRA_SOLVED, [m, m])).toBe(applyPyraAlg(PYRA_SOLVED, [invertPyraMove(m)]));
  });

  it("reads and writes moves", () => {
    const moves = parsePyraAlg("U L' r b′ B");
    expect(moves.map(pyraMoveToString)).toEqual(["U", "L'", "r", "b'", "B"]);
    expect(() => parsePyraAlg("F")).toThrow();
  });

  it("scrambles to a real pyraminx state: 9 of each color, pieces with their own colors", () => {
    for (let n = 0; n < 50; n++) {
      const state = applyPyraAlg(PYRA_SOLVED, randomPyraScramble(14, random));
      for (const c of "GRBY") expect([...state].filter((x) => x === c)).toHaveLength(9);
      // Tips and centers stay at their corner, so they keep their colors as a set.
      for (const c of CORNERS)
        for (const piece of [TIPS[c], CENTERS[c]])
          expect(piece.map((i) => state[i]).sort()).toEqual(piece.map((i) => PYRA_SOLVED[i]).sort());
      // Every edge is one of the six two-color edges.
      const solvedEdges = EDGES.map((e) => e.stickers.map((i) => PYRA_SOLVED[i]).sort().join(""));
      expect(EDGES.map((e) => e.stickers.map((i) => state[i]).sort().join("")).sort()).toEqual([...solvedEdges].sort());
    }
    expect(isPyraSolved(PYRA_SOLVED)).toBe(true);
    expect(isPyraSolved(applyPyraAlg(PYRA_SOLVED, "u"))).toBe(false);
  });
});
