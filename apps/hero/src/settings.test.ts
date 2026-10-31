import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_KEYS, rebind } from "./game/lanes";
import { loadKeys, saveKeys } from "./settings";

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
    expect(loadKeys("cube")).toEqual(DEFAULT_KEYS);
    expect(loadKeys("pyraminx")).toEqual(DEFAULT_KEYS);
  });

  it("are the cube's and the pyraminx's own", () => {
    const cube = rebind(DEFAULT_KEYS, "R", "KeyJ");
    saveKeys("cube", cube);
    expect(loadKeys("pyraminx")).toEqual(DEFAULT_KEYS);

    const pyraminx = rebind(DEFAULT_KEYS, "U", "KeyM");
    saveKeys("pyraminx", pyraminx);
    expect(loadKeys("cube")).toEqual(cube);
    expect(loadKeys("pyraminx")).toEqual(pyraminx);
  });

  it("keeps the cube keys saved before the pyraminx had its own", () => {
    const keys = rebind(DEFAULT_KEYS, "R", "KeyJ");
    localStorage.setItem("cube-hero.keys", JSON.stringify(keys));
    expect(loadKeys("cube")).toEqual(keys);
    expect(loadKeys("pyraminx")).toEqual(DEFAULT_KEYS);
  });
});
