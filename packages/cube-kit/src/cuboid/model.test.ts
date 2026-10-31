import { describe, expect, it } from "vitest";
import { parseAlg } from "../cube/model";
import { CUBE_1, CUBE_1x2, makeCuboid, type Cuboid } from "./model";

const play = (c: Cuboid, alg: string, from = c.solved) => parseAlg(alg).reduce(c.apply, from);

describe("cuboid model", () => {
  it("has a sticker on every outer side of every cubie", () => {
    expect(CUBE_1.cubies).toEqual([[0, 0, 0]]);
    expect(CUBE_1.stickers).toHaveLength(6);
    expect(CUBE_1.solved).toBe("WRGYOB");
    expect(CUBE_1x2.cubies).toHaveLength(2);
    expect(CUBE_1x2.stickers).toHaveLength(10);
    expect(CUBE_1x2.solved).toBe("WRRGGYOOBB");
    expect(makeCuboid([2, 2, 2]).stickers).toHaveLength(24);
  });

  it("only turns the ways that keep its shape", () => {
    expect(CUBE_1.moves).toEqual(["U", "D", "R", "L", "F", "B", "x", "y", "z"]);
    expect(CUBE_1x2.moves).toEqual(["U", "D", "y"]);
    expect(() => play(CUBE_1x2, "R")).toThrow();
  });

  it("turns a 1x1x1 whole, whichever side turns", () => {
    expect(play(CUBE_1, "U")).toBe(play(CUBE_1, "y"));
    expect(play(CUBE_1, "U")).toBe(play(CUBE_1, "D'"));
    // Seen from above, the front goes left: the right side comes to the front.
    expect(play(CUBE_1, "y")).toBe("WBRYGO");
    expect(play(CUBE_1, "y y y y")).toBe(CUBE_1.solved);
    expect(CUBE_1.isSolved(play(CUBE_1, "x y z"))).toBe(true);
  });

  it("turns the top and the bottom of a 1x1x2 on their own", () => {
    expect(play(CUBE_1x2, "U U U U")).toBe(CUBE_1x2.solved);
    expect(play(CUBE_1x2, "U U'")).toBe(CUBE_1x2.solved);
    expect(play(CUBE_1x2, "U2 U2")).toBe(CUBE_1x2.solved);
    expect(CUBE_1x2.isSolved(play(CUBE_1x2, "U"))).toBe(false);
    expect(CUBE_1x2.isSolved(play(CUBE_1x2, "U2"))).toBe(false);
    // The top and the bottom are only ever out of line with each other: U and D do the same to that.
    expect(play(CUBE_1x2, "U D'")).toBe(play(CUBE_1x2, "y"));
    expect(CUBE_1x2.isSolved(play(CUBE_1x2, "U D'"))).toBe(true);
    expect(CUBE_1x2.isSolved(play(CUBE_1x2, "D U'"))).toBe(true);
    // Only the sides change: the top stays white and the bottom yellow.
    const s = play(CUBE_1x2, "U D2 U'");
    expect(s[0]).toBe("W");
    expect(s[5]).toBe("Y");
  });
});
