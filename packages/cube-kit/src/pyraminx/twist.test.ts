import { describe, expect, it } from "vitest";
import { CORNER_POS, parsePyraAlg, type Vec } from "./model";
import { PYRA_TWIST_SOLVED, PYRA_TWIST_STICKERS, applyPyraTwistMove, isPyraTwistSolved } from "./twist";

const play = (alg: string, from = PYRA_TWIST_SOLVED) => parsePyraAlg(alg).reduce(applyPyraTwistMove, from);
const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

describe("corner twist pyraminx", () => {
  it("cuts each face into three kites, one at each of its corners", () => {
    expect(PYRA_TWIST_STICKERS).toHaveLength(12);
    expect(PYRA_TWIST_SOLVED).toBe("GGGRRRBBBYYY");
    for (const s of PYRA_TWIST_STICKERS) {
      expect(s.outline[0]).toEqual(CORNER_POS[s.corner]);
      // Every kite is nearer its own corner than any other.
      for (const [corner, at] of Object.entries(CORNER_POS))
        if (corner !== s.corner) expect(dot(s.center, CORNER_POS[s.corner])).toBeGreaterThan(dot(s.center, at));
    }
  });

  it("twists one corner a third of a turn, and nothing else", () => {
    expect(play("U U U")).toBe(PYRA_TWIST_SOLVED);
    expect(play("L L'")).toBe(PYRA_TWIST_SOLVED);
    expect(play("R'")).toBe(play("R R"));
    // Clockwise seen from the top, like the pyraminx's U: the front's top kite goes to the left face.
    const u = play("U");
    expect(u.slice(0, 3)).toBe("BGG");
    expect(u.slice(3, 6)).toBe("GRR");
    expect(u.slice(6, 9)).toBe("RBB");
    expect(u.slice(9)).toBe("YYY");
    // The corners don't get in each other's way: in any order, it's the same.
    expect(play("U L' R B")).toBe(play("B R L' U"));
    // A tip turns its corner: it's all tip.
    expect(play("b")).toBe(play("B"));
  });

  it("has 81 states, and is solved only the way it started", () => {
    // A set visits what is added to it while it's being gone through: every state it can reach.
    const seen = new Set([PYRA_TWIST_SOLVED]);
    for (const s of seen) for (const m of parsePyraAlg("U L R B")) seen.add(applyPyraTwistMove(s, m));
    expect(seen.size).toBe(81);
    expect([...seen].filter(isPyraTwistSolved)).toEqual([PYRA_TWIST_SOLVED]);
    // Even every corner twisted the same way is scrambled.
    expect(isPyraTwistSolved(play("U L R B"))).toBe(false);
  });
});
