import { describe, expect, it } from "vitest";
import { BASE_MOVES, STICKERS, applyMove, moveLayer, type Amount, type Vec } from "cube-kit/cube/model";
import { LANES, arrowOf, laneOf, shapeOf } from "./lanes";

const LABELS = Array.from({ length: 54 }, (_, i) => String.fromCharCode(48 + i)).join("");
const same = (a: Vec, b: Vec) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

/** The face (by normal) a sticker ends up on after a move. */
function landsOn(i: number, base: (typeof BASE_MOVES)[number], amount: Amount): Vec {
  const after = applyMove(LABELS, { base, amount });
  return STICKERS[after.indexOf(LABELS[i])].normal;
}

const UP: Vec = [0, 1, 0];
const DOWN: Vec = [0, -1, 0];
const LEFT: Vec = [-1, 0, 0];
const RIGHT: Vec = [1, 0, 0];
const FRONT: Vec = [0, 0, 1];

describe("lanes", () => {
  it.each(BASE_MOVES)("%s has a lane", (base) => {
    const lane = laneOf({ base, amount: 1 });
    expect(lane === "all" || LANES.includes(lane)).toBe(true);
  });

  it("puts slices and wide moves with their faces, and whole-cube turns everywhere", () => {
    expect(laneOf({ base: "M", amount: 1 })).toBe("L");
    expect(laneOf({ base: "E", amount: 3 })).toBe("D");
    expect(laneOf({ base: "S", amount: 2 })).toBe("F");
    expect(laneOf({ base: "r", amount: 1 })).toBe("R");
    expect(laneOf({ base: "y", amount: 3 })).toBe("all");
    expect(shapeOf({ base: "M", amount: 1 })).toBe("slice");
    expect(shapeOf({ base: "u", amount: 1 })).toBe("wide");
    expect(shapeOf({ base: "R", amount: 1 })).toBe("face");
    expect(shapeOf({ base: "x", amount: 2 })).toBe("rotation");
  });

  it("names the usual directions", () => {
    const arrow = (base: (typeof BASE_MOVES)[number], amount: Amount = 1) => arrowOf({ base, amount });
    expect([arrow("R"), arrow("R", 3), arrow("L"), arrow("U"), arrow("D"), arrow("F"), arrow("B")]).toEqual([
      "up",
      "down",
      "down",
      "left",
      "right",
      "cw",
      "ccw",
    ]);
    expect([arrow("M"), arrow("E"), arrow("S"), arrow("x"), arrow("y"), arrow("z")]).toEqual([
      "down",
      "right",
      "cw",
      "up",
      "left",
      "cw",
    ]);
  });

  // The arrow must match what the model does: front stickers of the layer go up, down, left or
  // right; for turns around the front axis, the top stickers go right (clockwise) or left.
  it.each(BASE_MOVES.flatMap((base) => ([1, 3] as Amount[]).map((amount) => [base, amount] as const)))(
    "%s (amount %s) points the way the stickers move",
    (base, amount) => {
      const { axis, inLayer } = moveLayer(base);
      const arrow = arrowOf({ base, amount });
      const aroundFront = axis[2] !== 0;
      const from = aroundFront ? UP : FRONT;
      const want = { up: UP, down: DOWN, left: LEFT, right: RIGHT, cw: RIGHT, ccw: LEFT }[arrow];
      const stickers = STICKERS.map((s, i) => ({ s, i })).filter(({ s }) => same(s.normal, from) && inLayer(s.pos));
      expect(stickers.length).toBeGreaterThan(0);
      for (const { i } of stickers) expect(landsOn(i, base, amount)).toEqual(want);
    },
  );
});
