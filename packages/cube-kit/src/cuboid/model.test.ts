import { describe, expect, it } from "vitest";
import { parseAlg } from "../cube/model";
import { CUBE_1, CUBE_1x2, CUBE_1x2x2, CUBE_1x2x3, CUBE_1x3, CUBE_1x3x3, CUBE_1x4, CUBE_2x2x3, makeCuboid, type Cuboid } from "./model";

const play = (c: Cuboid, alg: string, from = c.solved) => parseAlg(alg).reduce(c.apply, from);

describe("cuboid model", () => {
  it("has a sticker on every outer side of every cubie", () => {
    expect(CUBE_1.cubies).toEqual([[0, 0, 0]]);
    expect(CUBE_1.stickers).toHaveLength(6);
    expect(CUBE_1.solved).toBe("WRGYOB");
    expect(CUBE_1x2.cubies).toHaveLength(2);
    expect(CUBE_1x2.stickers).toHaveLength(10);
    expect(CUBE_1x2.solved).toBe("WRRGGYOOBB");
    expect(CUBE_1x3.stickers).toHaveLength(14);
    expect(CUBE_1x4.stickers).toHaveLength(18);
    expect(CUBE_1x2x2.cubies).toHaveLength(4);
    expect(CUBE_1x2x2.stickers).toHaveLength(16);
    expect(CUBE_1x2x3.cubies).toHaveLength(6);
    expect(CUBE_1x2x3.stickers).toHaveLength(22);
    expect(CUBE_1x3x3.cubies).toHaveLength(9);
    expect(CUBE_1x3x3.stickers).toHaveLength(30);
    expect(CUBE_2x2x3.cubies).toHaveLength(12);
    expect(CUBE_2x2x3.stickers).toHaveLength(32);
    expect(makeCuboid([2, 2, 2]).stickers).toHaveLength(24);
  });

  it("only turns the ways that keep its shape", () => {
    expect(CUBE_1.moves).toEqual(["U", "D", "R", "L", "F", "B", "x", "y", "z"]);
    expect(CUBE_1x2.moves).toEqual(["U", "D", "y"]);
    expect(CUBE_1x3.moves).toEqual(["U", "D", "E", "u", "d", "y"]);
    expect(CUBE_1x4.moves).toEqual(["U", "D", "u", "d", "y"]);
    // A middle layer needs a middle.
    expect(makeCuboid([2, 2, 2]).moves).not.toContain("E");
    expect(makeCuboid([3, 3, 3]).moves).toContain("M");
    expect(() => play(CUBE_1x2, "R")).toThrow();
    // The other ways, only halfway.
    expect(CUBE_1x2.halfMoves).toEqual(["R", "L", "F", "B", "x", "z"]);
    expect(CUBE_1x2x2.moves).toEqual(["F", "B", "z"]);
    expect(CUBE_1x2x2.halfMoves).toEqual(["U", "D", "R", "L", "x", "y"]);
    expect(() => play(CUBE_1x2x2, "R")).toThrow();
    expect(() => play(CUBE_1x2x2, "R'")).toThrow();
    // No side of a 1x2x3 is square: everything turns halfway, its middle row too.
    expect(CUBE_1x2x3.moves).toEqual([]);
    expect(CUBE_1x2x3.halfMoves).toEqual(["U", "D", "R", "L", "F", "B", "E", "u", "d", "x", "y", "z"]);
    expect(() => play(CUBE_1x2x3, "E")).toThrow();
    expect(() => play(CUBE_1x2x3, "F")).toThrow();
    // A 1x3x3's front is square: it turns a quarter, but everything else only halfway.
    expect(CUBE_1x3x3.moves).toEqual(["F", "B", "z"]);
    expect(CUBE_1x3x3.halfMoves).toEqual(["U", "D", "R", "L", "M", "E", "u", "d", "r", "l", "x", "y"]);
    expect(() => play(CUBE_1x3x3, "M")).toThrow();
    // A 2x2x3 is square seen from above: its layers turn a quarter, its sides only halfway.
    expect(CUBE_2x2x3.moves).toEqual(["U", "D", "E", "u", "d", "y"]);
    expect(CUBE_2x2x3.halfMoves).toEqual(["R", "L", "F", "B", "x", "z"]);
    expect(() => play(CUBE_2x2x3, "F")).toThrow();
    expect(() => play(CUBE_2x2x3, "R'")).toThrow();
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

  it("turns the middle of a 1x1x3 like D", () => {
    expect(play(CUBE_1x3, "E E E E")).toBe(CUBE_1x3.solved);
    expect(CUBE_1x3.isSolved(play(CUBE_1x3, "E"))).toBe(false);
    // U, E' and D' turn all three layers the same way: the whole tower.
    expect(play(CUBE_1x3, "U E' D'")).toBe(play(CUBE_1x3, "y"));
    expect(play(CUBE_1x3, "D E U'")).toBe(play(CUBE_1x3, "y'"));
    expect(CUBE_1x3.isSolved(play(CUBE_1x3, "U2 E2 D2"))).toBe(true);
  });

  it("turns the top or bottom two layers of a 1x1x4 with u and d", () => {
    expect(play(CUBE_1x4, "u u u u")).toBe(CUBE_1x4.solved);
    expect(CUBE_1x4.isSolved(play(CUBE_1x4, "u"))).toBe(false);
    // The two halves turned the same way: the whole tower.
    expect(play(CUBE_1x4, "u d'")).toBe(play(CUBE_1x4, "y"));
    // u turns two layers and U' takes the top one back: only the second one is out.
    expect(CUBE_1x4.isSolved(play(CUBE_1x4, "u U'"))).toBe(false);
    expect(play(CUBE_1x4, "u U' d' U")).toBe(play(CUBE_1x4, "y"));
    // On a 1x1x3, u is the top two of three, like on the cube.
    expect(play(CUBE_1x3, "u")).toBe(play(CUBE_1x3, "U E'"));
  });

  it("turns the sides of a 1x2x2 halfway", () => {
    expect(play(CUBE_1x2x2, "R2 R2")).toBe(CUBE_1x2x2.solved);
    expect(CUBE_1x2x2.isSolved(play(CUBE_1x2x2, "R2"))).toBe(false);
    // R2 turns the right column upside down: its front goes to the back, its top to the bottom.
    const s = play(CUBE_1x2x2, "R2");
    const at = (face: string, x: number, y: number) =>
      s[CUBE_1x2x2.stickers.findIndex((t) => t.face === face && t.pos[0] === x && t.pos[1] === y)];
    expect([at("F", 0.5, 0.5), at("F", -0.5, 0.5), at("U", 0.5, 0.5), at("D", 0.5, -0.5)]).toEqual(["B", "G", "Y", "W"]);
    // The two columns, or the two rows, turned together: the whole thing.
    expect(play(CUBE_1x2x2, "R2 L2")).toBe(play(CUBE_1x2x2, "x2"));
    expect(play(CUBE_1x2x2, "U2 D2")).toBe(play(CUBE_1x2x2, "y2"));
    // R2 U2 takes three cubies around: three times and they're back.
    expect(CUBE_1x2x2.isSolved(play(CUBE_1x2x2, "R2 U2"))).toBe(false);
    expect(play(CUBE_1x2x2, "R2 U2 R2 U2 R2 U2")).toBe(CUBE_1x2x2.solved);
    // Its front, seen straight on, also turns a quarter: the whole thing again.
    expect(play(CUBE_1x2x2, "F")).toBe(play(CUBE_1x2x2, "z"));
  });

  it("turns the rows and columns of a 1x2x3 halfway", () => {
    expect(play(CUBE_1x2x3, "E2 E2")).toBe(CUBE_1x2x3.solved);
    expect(CUBE_1x2x3.isSolved(play(CUBE_1x2x3, "E2"))).toBe(false);
    // R2 turns the right column over: its top and bottom trade places, its middle turns around.
    const s = play(CUBE_1x2x3, "R2");
    const at = (face: string, x: number, y: number) =>
      s[CUBE_1x2x3.stickers.findIndex((t) => t.face === face && t.pos[0] === x && t.pos[1] === y)];
    expect([at("F", 0.5, 0), at("F", -0.5, 0), at("U", 0.5, 1), at("D", 0.5, -1)]).toEqual(["B", "G", "Y", "W"]);
    // The three rows, or the two columns, turned together: the whole thing. The top and bottom
    // alone leave the middle behind.
    expect(play(CUBE_1x2x3, "U2 E2 D2")).toBe(play(CUBE_1x2x3, "y2"));
    expect(CUBE_1x2x3.isSolved(play(CUBE_1x2x3, "U2 D2"))).toBe(false);
    expect(play(CUBE_1x2x3, "R2 L2")).toBe(play(CUBE_1x2x3, "x2"));
    expect(play(CUBE_1x2x3, "u2")).toBe(play(CUBE_1x2x3, "U2 E2"));
    // R2 E2 twice puts every cubie back with the middle row turned around; four times, all back.
    const twice = play(CUBE_1x2x3, "R2 E2 R2 E2");
    expect(CUBE_1x2x3.isSolved(twice)).toBe(false);
    expect(play(CUBE_1x2x3, "R2 E2 R2 E2", twice)).toBe(CUBE_1x2x3.solved);
    // R2 U2 R2 D2 takes three corners around: three times and they're back.
    expect(CUBE_1x2x3.isSolved(play(CUBE_1x2x3, "R2 U2 R2 D2"))).toBe(false);
    expect(play(CUBE_1x2x3, "R2 U2 R2 D2 R2 U2 R2 D2 R2 U2 R2 D2")).toBe(CUBE_1x2x3.solved);
    // Its front, seen straight on, turns halfway too: the whole thing again.
    expect(play(CUBE_1x2x3, "F2")).toBe(play(CUBE_1x2x3, "z2"));
  });

  it("turns the rows and columns of a 1x3x3 halfway", () => {
    expect(play(CUBE_1x3x3, "M2 M2")).toBe(CUBE_1x3x3.solved);
    expect(CUBE_1x3x3.isSolved(play(CUBE_1x3x3, "M2"))).toBe(false);
    // The three columns, or the three rows, turned together: the whole thing.
    expect(play(CUBE_1x3x3, "R2 M2 L2")).toBe(play(CUBE_1x3x3, "x2"));
    expect(play(CUBE_1x3x3, "U2 E2 D2")).toBe(play(CUBE_1x3x3, "y2"));
    // M2 E2 swaps the cubies around the center across it: twice and they're back.
    expect(CUBE_1x3x3.isSolved(play(CUBE_1x3x3, "M2 E2"))).toBe(false);
    expect(play(CUBE_1x3x3, "M2 E2 M2 E2")).toBe(CUBE_1x3x3.solved);
    // M2 U2 M2 D2 swaps the corners left and right, turned around: the top ones keep their white on
    // top, but show their backs and the other side's color. The middles stay put.
    const s = play(CUBE_1x3x3, "M2 U2 M2 D2");
    const at = (face: string, x: number, y: number) =>
      s[CUBE_1x3x3.stickers.findIndex((t) => t.face === face && t.pos[0] === x && t.pos[1] === y)];
    expect([at("U", 1, 1), at("R", 1, 1), at("F", 1, 1), at("F", -1, -1), at("F", 0, 1), at("F", 1, 0)]).toEqual(["W", "O", "B", "B", "G", "G"]);
    expect(play(CUBE_1x3x3, "M2 U2 M2 D2", s)).toBe(CUBE_1x3x3.solved);
    // R2 U2 R2 U2 takes three corners around: three times and they're back.
    expect(CUBE_1x3x3.isSolved(play(CUBE_1x3x3, "R2 U2 R2 U2"))).toBe(false);
    expect(play(CUBE_1x3x3, "R2 U2 R2 U2 R2 U2 R2 U2 R2 U2 R2 U2")).toBe(CUBE_1x3x3.solved);
    // A quarter turn of its front turns the whole thing.
    expect(play(CUBE_1x3x3, "F")).toBe(play(CUBE_1x3x3, "z"));
  });

  it("turns a 2x2x3's layers a quarter and its sides halfway", () => {
    expect(play(CUBE_2x2x3, "U U U U")).toBe(CUBE_2x2x3.solved);
    expect(play(CUBE_2x2x3, "U E' D'")).toBe(play(CUBE_2x2x3, "y"));
    expect(play(CUBE_2x2x3, "F2 F2")).toBe(CUBE_2x2x3.solved);
    // F2 turns the front half over: its top and bottom trade places, and so do its left and right,
    // but it still faces the front. The back half stays.
    const s = play(CUBE_2x2x3, "F2");
    const at = (face: string, x: number, y: number, z: number) =>
      s[CUBE_2x2x3.stickers.findIndex((t) => t.face === face && t.pos.join() === [x, y, z].join())];
    expect([at("U", 0.5, 1, 0.5), at("U", 0.5, 1, -0.5), at("R", 0.5, 0, 0.5), at("F", 0.5, 0, 0.5)]).toEqual(["Y", "W", "O", "G"]);
    // The two halves turned together: the whole thing.
    expect(play(CUBE_2x2x3, "F2 B2")).toBe(play(CUBE_2x2x3, "z2"));
    expect(play(CUBE_2x2x3, "R2 L2")).toBe(play(CUBE_2x2x3, "x2"));
    // R2 F2 and U R2 U R2 take cubies around: three times and they're back.
    expect(CUBE_2x2x3.isSolved(play(CUBE_2x2x3, "R2 F2"))).toBe(false);
    expect(play(CUBE_2x2x3, "R2 F2 R2 F2 R2 F2")).toBe(CUBE_2x2x3.solved);
    expect(CUBE_2x2x3.isSolved(play(CUBE_2x2x3, "U R2 U R2"))).toBe(false);
    expect(play(CUBE_2x2x3, "U R2 U R2 U R2 U R2 U R2 U R2")).toBe(CUBE_2x2x3.solved);
    // F2 E F2 E' only moves middle cubies: three of them go around.
    const middle = play(CUBE_2x2x3, "F2 E F2 E'");
    const moved = CUBE_2x2x3.stickers.filter((_, i) => middle[i] !== CUBE_2x2x3.solved[i]);
    expect(moved.length).toBeGreaterThan(0);
    expect(moved.every((t) => t.pos[1] === 0)).toBe(true);
    expect(play(CUBE_2x2x3, "F2 E F2 E' F2 E F2 E'", middle)).toBe(CUBE_2x2x3.solved);
  });
});
