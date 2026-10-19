import { describe, expect, it } from "vitest";
import { CORNER_SLOTS, EDGE_SLOTS, SOLVED, applyAlg, randomScramble, type CubeState } from "./model";
import { validate } from "./validate";

const set = (s: CubeState, changes: Record<number, string>) =>
  [...s].map((c, i) => changes[i] ?? c).join("");
const kinds = (s: CubeState) => {
  const r = validate(s);
  return r.ok ? [] : r.errors.map((e) => e.kind);
};
const UF = EDGE_SLOTS.find((e) => e.name === "UF")!;
const UR = EDGE_SLOTS.find((e) => e.name === "UR")!;
const corner = CORNER_SLOTS[0];

describe("validate", () => {
  it("accepts solved and scrambled cubes", () => {
    expect(validate(SOLVED).ok).toBe(true);
    for (let i = 0; i < 50; i++) expect(validate(applyAlg(SOLVED, randomScramble())).ok).toBe(true);
  });

  it("reports stickers that are not painted yet", () => {
    expect(kinds(set(SOLVED, { 0: ".", 1: "." }))).toEqual(["unpainted"]);
  });

  it("reports wrong color counts", () => {
    expect(kinds(set(SOLVED, { 0: "Y" }))).toEqual(["count", "count"]);
  });

  it("reports a flipped edge", () => {
    const s = applyAlg(SOLVED, "R U F");
    const [a, b] = UF.stickers;
    expect(kinds(set(s, { [a]: s[b], [b]: s[a] }))).toEqual(["flipped-edge"]);
  });

  it("reports a twisted corner", () => {
    const s = applyAlg(SOLVED, "R U F");
    const [a, b, c] = corner.stickers;
    expect(kinds(set(s, { [a]: s[c], [b]: s[a], [c]: s[b] }))).toEqual(["twisted-corner"]);
  });

  it("reports two swapped edges", () => {
    const s = applyAlg(SOLVED, "R U F");
    const [a1, a2] = UF.stickers;
    const [b1, b2] = UR.stickers;
    expect(kinds(set(s, { [a1]: s[b1], [a2]: s[b2], [b1]: s[a1], [b2]: s[a2] }))).toEqual(["swapped-pieces"]);
  });

  it("reports a mirrored corner (impossible sticker order)", () => {
    const [, b, c] = corner.stickers;
    expect(kinds(set(SOLVED, { [b]: SOLVED[c], [c]: SOLVED[b] }))).toEqual(["bad-corner"]);
  });

  it("reports an edge that cannot exist and the duplicate it causes", () => {
    // UF becomes white/white: its green sticker trades places with a corner's white sticker.
    const [, f] = UF.stickers;
    const [w] = corner.stickers;
    const s = set(SOLVED, { [f]: "W", [w]: "G" });
    expect(kinds(s)).toContain("bad-edge");
  });
});
