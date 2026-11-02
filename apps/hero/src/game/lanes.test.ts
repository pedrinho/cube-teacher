import { describe, expect, it } from "vitest";
import { BASE_MOVES, parseMove } from "cube-kit/cube/model";
import {
  CUBE_1x2_TRACK,
  PYRAMINX_TRACK,
  LANES,
  LETTERS,
  gameKey,
  isKeyMap,
  keyFor,
  keyLabel,
  keysByColor,
  laneOf,
  laneOfKey,
  rebind,
  shapeOf,
  type Track,
} from "./lanes";

/** A track that plays every letter, in every lane. */
const ALL: Track = { lanes: LANES, letters: LETTERS, laneOf, shapeOf };

describe("lanes", () => {
  it.each(BASE_MOVES)("%s has a lane", (base) => {
    const lane = laneOf({ base, amount: 1 });
    expect(lane === "all" || LANES.includes(lane)).toBe(true);
  });

  it("puts a pyraminx's tips in their corner's lane, as small notes", () => {
    expect(["U", "l'", "B", "r"].map((m) => [PYRAMINX_TRACK.laneOf(parseMove(m)), PYRAMINX_TRACK.shapeOf(parseMove(m))])).toEqual([
      ["U", "face"],
      ["L", "tip"],
      ["B", "face"],
      ["R", "tip"],
    ]);
  });

  it("puts slices and wide moves with their faces, and whole-cube turns everywhere", () => {
    expect(["M", "E'", "S2", "r", "y'"].map((m) => laneOf(parseMove(m)))).toEqual(["L", "D", "F", "R", "all"]);
    expect(["M", "u", "R", "x2"].map((m) => shapeOf(parseMove(m)))).toEqual(["slice", "wide", "face", "rotation"]);
  });
});

/** Every letter on its own key. */
const OWN_KEYS = keysByColor({});

describe("keys", () => {
  it("plays each move with its letter's key, whatever the direction", () => {
    expect(["R", "R'", "R2", "U", "u'", "M", "y'", "z2"].map((m) => keyFor(parseMove(m), OWN_KEYS))).toEqual([
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

  it("puts each color on its number key: 1 green, 2 yellow, 3 orange, 4 white, 5 red, 6 blue", () => {
    const keys = keysByColor({ F: "G", D: "Y", L: "O", U: "W", R: "R", B: "B" });
    expect((["F", "D", "L", "U", "R", "B"] as const).map((l) => keyLabel(keys[l]))).toEqual(["1", "2", "3", "4", "5", "6"]);
    // The letters without a color stay on their own key.
    expect([keys.M, keys.E, keys.Y]).toEqual(["KeyM", "KeyE", "KeyY"]);
    expect(isKeyMap(keys)).toBe(true);
  });

  it("listens to twelve letters", () => {
    expect(Object.values(OWN_KEYS).sort()).toEqual(["B", "D", "E", "F", "L", "M", "R", "S", "U", "X", "Y", "Z"].map((l) => `Key${l}`));
  });

  it("knows the lane of each key", () => {
    expect(["KeyR", "KeyM", "KeyE", "KeyS", "KeyY", "KeyQ", "Space"].map((c) => laneOfKey(c, OWN_KEYS, ALL))).toEqual([
      "R",
      "L",
      "D",
      "F",
      "all",
      null,
      null,
    ]);
  });

  it("knows only the keys a puzzle plays", () => {
    expect(["KeyU", "KeyD", "KeyR", "KeyM", "KeyY"].map((c) => laneOfKey(c, OWN_KEYS, CUBE_1x2_TRACK))).toEqual([
      "U",
      "D",
      null,
      null,
      null,
    ]);
  });

  it("moves a letter to a free key", () => {
    const keys = rebind(OWN_KEYS, "R", "KeyJ");
    expect(keyFor(parseMove("R'"), keys)).toBe("KeyJ");
    expect(keyFor(parseMove("r"), keys)).toBe("KeyJ");
    expect(laneOfKey("KeyJ", keys, ALL)).toBe("R");
    expect(laneOfKey("KeyR", keys, ALL)).toBe(null);
  });

  it("swaps two letters when the key is taken", () => {
    const keys = rebind(OWN_KEYS, "R", "KeyU");
    expect(keys.R).toBe("KeyU");
    expect(keys.U).toBe("KeyR");
    expect(laneOfKey("KeyR", keys, ALL)).toBe("U");
    expect(rebind(keys, "R", "KeyU")).toEqual(keys);
  });

  it("plays letters on number keys too, from the number row or the numpad", () => {
    const keys = rebind(OWN_KEYS, "U", "Digit1");
    expect(keyLabel(keys.U)).toBe("1");
    expect(laneOfKey(gameKey("Numpad1"), keys, ALL)).toBe("U");
    expect(laneOfKey(gameKey("Digit1"), keys, ALL)).toBe("U");
    expect(gameKey("KeyR")).toBe("KeyR");
  });

  it("only keeps stored key maps that give every letter its own letter or number key", () => {
    expect(isKeyMap(OWN_KEYS)).toBe(true);
    expect(isKeyMap(rebind(OWN_KEYS, "M", "KeyK"))).toBe(true);
    expect(isKeyMap(rebind(OWN_KEYS, "M", "Digit7"))).toBe(true);
    expect(isKeyMap({ ...OWN_KEYS, M: "Numpad7" })).toBe(false);
    expect(isKeyMap({ ...OWN_KEYS, R: "KeyU" })).toBe(false);
    expect(isKeyMap({ ...OWN_KEYS, R: "Space" })).toBe(false);
    expect(isKeyMap({ ...OWN_KEYS, R: undefined })).toBe(false);
    expect(isKeyMap(null)).toBe(false);
  });
});
