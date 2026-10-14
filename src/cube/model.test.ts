import { describe, expect, it } from "vitest";
import { cube3x3x3 } from "cubing/puzzles";
import {
  BASE_MOVES,
  CORNER_SLOTS,
  EDGE_SLOTS,
  SOLVED,
  algToString,
  applyAlg,
  centers,
  findPiece,
  invertAlg,
  isSolved,
  parseAlg,
  randomScramble,
} from "./model";
import { toPatternData } from "./kpattern";

describe("moves", () => {
  it("every quarter turn repeated 4 times is the identity", () => {
    for (const base of BASE_MOVES) expect(applyAlg(SOLVED, `${base} ${base} ${base} ${base}`)).toBe(SOLVED);
  });

  it("(R U R' U') x6 is the identity", () => {
    expect(applyAlg(SOLVED, "R U R' U' ".repeat(6))).toBe(SOLVED);
  });

  it("an alg followed by its inverse is the identity", () => {
    const alg = parseAlg("R U2 F' M x y' z2 L D B' E S'");
    expect(applyAlg(applyAlg(SOLVED, alg), invertAlg(alg))).toBe(SOLVED);
  });

  it("parses and prints algs", () => {
    expect(algToString(parseAlg("  R U'  F2 M' x2 ")).toString()).toBe("R U' F2 M' x2");
    expect(() => parseAlg("Q")).toThrow();
  });

  it("R moves the front-right stickers to the top", () => {
    const s = applyAlg(SOLVED, "R");
    // U face right column becomes green (from F).
    expect([s[2], s[5], s[8]]).toEqual(["G", "G", "G"]);
  });

  it("rotations keep the cube solved but move the centers", () => {
    const s = applyAlg(SOLVED, "x2");
    expect(isSolved(s)).toBe(true);
    expect(centers(s).U).toBe("Y");
    expect(centers(s).F).toBe("B");
  });
});

describe("pieces", () => {
  it("has 12 edges and 8 corners", () => {
    expect(EDGE_SLOTS).toHaveLength(12);
    expect(CORNER_SLOTS).toHaveLength(8);
  });

  it("finds a piece by its colors", () => {
    expect(findPiece(SOLVED, ["W", "G"])?.name).toBe("UF");
    expect(findPiece(applyAlg(SOLVED, "F"), ["W", "G"])?.name).toBe("FR");
  });
});

describe("matches cubing.js", () => {
  it("gives the same pattern for random algs", async () => {
    const kpuzzle = await cube3x3x3.kpuzzle();
    let seed = 1;
    const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const extra = parseAlg("M E S x y z M' x' y2");
    for (let n = 0; n < 200; n++) {
      const alg = [...randomScramble(15, random), extra[n % extra.length], ...randomScramble(5, random)];
      const ours = toPatternData(applyAlg(SOLVED, alg));
      const theirs = kpuzzle.defaultPattern().applyAlg(algToString(alg)).patternData;
      for (const orbit of ["EDGES", "CORNERS", "CENTERS"] as const) {
        expect(ours[orbit].pieces, `${orbit} pieces after ${algToString(alg)}`).toEqual(theirs[orbit].pieces);
        if (orbit !== "CENTERS")
          expect(ours[orbit].orientation, `${orbit} orientation after ${algToString(alg)}`).toEqual(
            theirs[orbit].orientation,
          );
      }
    }
  });
});
