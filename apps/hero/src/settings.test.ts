import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_KEYS, rebind } from "./game/lanes";
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
  it("are the standard keys until changed", () => {
    expect(loadKeys()).toEqual(DEFAULT_KEYS);
  });

  it("keeps the keys the player chose", () => {
    const keys = rebind(DEFAULT_KEYS, "R", "KeyJ");
    saveKeys(keys);
    expect(loadKeys()).toEqual(keys);
    // Under the name they've always had.
    expect(JSON.parse(localStorage.getItem("cube-hero.keys")!)).toEqual(keys);
  });

  it("ignores keys it can't use", () => {
    localStorage.setItem("cube-hero.keys", JSON.stringify({ ...DEFAULT_KEYS, R: "KeyU" }));
    expect(loadKeys()).toEqual(DEFAULT_KEYS);
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
