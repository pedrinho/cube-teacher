import { describe, expect, it } from "vitest";
import { rebind } from "./lanes";
import { CUBE_3, DEFAULT_KEYS, ONE, POCKET, PYRA_ONE, PYRA_THREE, TOWER, keysFor, spinKeys } from "./puzzles";

describe("spin keys", () => {
  it("spin a cube with the X, Y and Z keys", () => {
    expect([...spinKeys(CUBE_3, keysFor(CUBE_3, DEFAULT_KEYS))]).toEqual([
      ["KeyX", "x"],
      ["KeyY", "y"],
      ["KeyZ", "z"],
    ]);
    for (const puzzle of [TOWER, POCKET]) expect(spinKeys(puzzle, keysFor(puzzle, DEFAULT_KEYS)).size).toBe(3);
  });

  it("are the keys the player gave the whole-cube turns", () => {
    const keys = { ...DEFAULT_KEYS, cube: rebind(DEFAULT_KEYS.cube, "Y", "KeyQ") };
    expect(spinKeys(CUBE_3, keysFor(CUBE_3, keys)).get("KeyQ")).toBe("y");
    expect(spinKeys(CUBE_3, keysFor(CUBE_3, keys)).has("KeyY")).toBe(false);
  });

  it("leave a song that plays whole-cube turns alone, and don't spin a pyraminx", () => {
    expect(spinKeys(ONE, keysFor(ONE, DEFAULT_KEYS)).size).toBe(0);
    for (const puzzle of [PYRA_ONE, PYRA_THREE]) expect(spinKeys(puzzle, keysFor(puzzle, DEFAULT_KEYS)).size).toBe(0);
  });
});
