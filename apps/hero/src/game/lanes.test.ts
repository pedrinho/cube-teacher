import { describe, expect, it } from "vitest";
import { BASE_MOVES, parseMove } from "cube-kit/cube/model";
import { GAME_KEYS, LANES, keyFor, laneOf, laneOfKey, shapeOf } from "./lanes";

describe("lanes", () => {
  it.each(BASE_MOVES)("%s has a lane", (base) => {
    const lane = laneOf({ base, amount: 1 });
    expect(lane === "all" || LANES.includes(lane)).toBe(true);
  });

  it("puts slices and wide moves with their faces, and whole-cube turns everywhere", () => {
    expect(["M", "E'", "S2", "r", "y'"].map((m) => laneOf(parseMove(m)))).toEqual(["L", "D", "F", "R", "all"]);
    expect(["M", "u", "R", "x2"].map((m) => shapeOf(parseMove(m)))).toEqual(["slice", "wide", "face", "rotation"]);
  });
});

describe("keys", () => {
  it("plays each move with its own letter, whatever the direction", () => {
    expect(["R", "R'", "R2", "U", "u'", "M", "y'", "z2"].map((m) => keyFor(parseMove(m)))).toEqual([
      "KeyR",
      "KeyR",
      "KeyR",
      "KeyU",
      "KeyU",
      "KeyM",
      "KeyY",
      "KeyZ",
    ]);
  });

  it("listens to twelve letters", () => {
    expect([...GAME_KEYS].sort()).toEqual(["B", "D", "E", "F", "L", "M", "R", "S", "U", "X", "Y", "Z"].map((l) => `Key${l}`));
  });

  it("knows the lane of each key", () => {
    expect(["KeyR", "KeyM", "KeyE", "KeyS", "KeyY", "KeyQ", "Space"].map(laneOfKey)).toEqual(["R", "L", "D", "F", "all", null, null]);
  });
});
