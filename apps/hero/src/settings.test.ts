import { beforeEach, describe, expect, it, vi } from "vitest";
import { rebind } from "./game/lanes";
import { DEFAULT_KEYS } from "./game/puzzles";
import { loadKeys, loadProgress, saveKeys, saveLevel } from "./settings";

// The tests run in node: a Map stands in for the browser's storage.
beforeEach(() => {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
  });
});

describe("keys", () => {
  it("are the number keys by color until changed, the cubes' and the pyraminxes' each", () => {
    expect(loadKeys("cube")).toEqual(DEFAULT_KEYS.cube);
    expect(loadKeys("pyraminx")).toEqual(DEFAULT_KEYS.pyraminx);
  });

  it("keeps the keys the player chose, the cubes' apart from the pyraminxes'", () => {
    const keys = rebind(DEFAULT_KEYS.cube, "R", "KeyJ");
    saveKeys("cube", keys);
    expect(loadKeys("cube")).toEqual(keys);
    expect(loadKeys("pyraminx")).toEqual(DEFAULT_KEYS.pyraminx);
    const pyraKeys = rebind(DEFAULT_KEYS.pyraminx, "U", "KeyK");
    saveKeys("pyraminx", pyraKeys);
    expect(loadKeys("pyraminx")).toEqual(pyraKeys);
    expect(loadKeys("cube")).toEqual(keys);
  });

  it("starts everyone on the number keys, whatever the old letter keys were", () => {
    localStorage.setItem("cube-hero.keys", JSON.stringify({ ...DEFAULT_KEYS.cube, F: "KeyF", B: "KeyB" }));
    expect(loadKeys("cube")).toEqual(DEFAULT_KEYS.cube);
  });

  it("ignores keys it can't use", () => {
    localStorage.setItem("cube-hero.colorKeys.cube", JSON.stringify({ ...DEFAULT_KEYS.cube, R: "Digit4" }));
    expect(loadKeys("cube")).toEqual(DEFAULT_KEYS.cube);
  });
});

describe("level progress", () => {
  it("starts empty and keeps each level's best", () => {
    expect(loadProgress()).toEqual({});
    expect(saveLevel("easy-1x1x1", { stars: 2, points: 900 })).toBe(true);
    expect(saveLevel("easy-1x1x1", { stars: 4, points: 1500 })).toBe(true);
    // Fewer stars, or as many with fewer points, aren't kept.
    expect(saveLevel("easy-1x1x1", { stars: 3, points: 5000 })).toBe(false);
    expect(saveLevel("easy-1x1x1", { stars: 4, points: 1400 })).toBe(false);
    expect(saveLevel("easy-1x1x2", { stars: 1, points: 100 })).toBe(true);
    expect(loadProgress()).toEqual({
      "easy-1x1x1": { stars: 4, points: 1500 },
      "easy-1x1x2": { stars: 1, points: 100 },
    });
  });

  it("ignores progress it can't read", () => {
    localStorage.setItem("cube-hero.levels", JSON.stringify({ "easy-1x1x1": { stars: "lots" } }));
    expect(loadProgress()).toEqual({});
  });
});
