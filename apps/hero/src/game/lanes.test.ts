import { describe, expect, it } from "vitest";
import { BASE_MOVES, parseMove } from "cube-kit/cube/model";
import { parsePyraAlg } from "cube-kit/pyraminx/model";
import {
  DEFAULT_KEYS,
  LANES,
  PYRAMINX_TRACK,
  gameKey,
  isKeyMap,
  keyFor,
  keyLabel,
  laneOf,
  laneOfKey,
  rebind,
  shapeOf,
} from "./lanes";

describe("lanes", () => {
  it.each(BASE_MOVES)("%s has a lane", (base) => {
    const lane = laneOf({ base, amount: 1 });
    expect(lane === "all" || LANES.includes(lane)).toBe(true);
  });

  it("puts slices and wide moves with their faces, and whole-cube turns everywhere", () => {
    expect(["M", "E'", "S2", "r", "y'"].map((m) => laneOf(parseMove(m)))).toEqual(["L", "D", "F", "R", "all"]);
    expect(["M", "u", "R", "x2"].map((m) => shapeOf(parseMove(m)))).toEqual(["slice", "wide", "face", "rotation"]);
  });

  it("puts pyraminx turns and tips in their corner's lane", () => {
    const moves = parsePyraAlg("L U' B R l u' b r");
    expect(moves.map(PYRAMINX_TRACK.laneOf)).toEqual(["L", "U", "B", "R", "L", "U", "B", "R"]);
    expect(moves.map(PYRAMINX_TRACK.shapeOf)).toEqual(["face", "face", "face", "face", "tip", "tip", "tip", "tip"]);
    expect(moves.map((m) => keyFor(m, DEFAULT_KEYS))).toEqual(["KeyL", "KeyU", "KeyB", "KeyR", "KeyL", "KeyU", "KeyB", "KeyR"]);
  });
});

describe("keys", () => {
  it("plays each move with its own letter by default, whatever the direction", () => {
    expect(["R", "R'", "R2", "U", "u'", "M", "y'", "z2"].map((m) => keyFor(parseMove(m), DEFAULT_KEYS))).toEqual([
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
    expect(Object.values(DEFAULT_KEYS).sort()).toEqual(["B", "D", "E", "F", "L", "M", "R", "S", "U", "X", "Y", "Z"].map((l) => `Key${l}`));
  });

  it("knows the lane of each key", () => {
    expect(["KeyR", "KeyM", "KeyE", "KeyS", "KeyY", "KeyQ", "Space"].map((c) => laneOfKey(c, DEFAULT_KEYS))).toEqual([
      "R",
      "L",
      "D",
      "F",
      "all",
      null,
      null,
    ]);
  });

  it("knows only the pyraminx's four keys on a pyraminx", () => {
    expect(["KeyU", "KeyB", "KeyF", "KeyM", "KeyY"].map((c) => laneOfKey(c, DEFAULT_KEYS, PYRAMINX_TRACK))).toEqual([
      "U",
      "B",
      null,
      null,
      null,
    ]);
  });

  it("moves a letter to a free key", () => {
    const keys = rebind(DEFAULT_KEYS, "R", "KeyJ");
    expect(keyFor(parseMove("R'"), keys)).toBe("KeyJ");
    expect(keyFor(parseMove("r"), keys)).toBe("KeyJ");
    expect(laneOfKey("KeyJ", keys)).toBe("R");
    expect(laneOfKey("KeyR", keys)).toBe(null);
  });

  it("swaps two letters when the key is taken", () => {
    const keys = rebind(DEFAULT_KEYS, "R", "KeyU");
    expect(keys.R).toBe("KeyU");
    expect(keys.U).toBe("KeyR");
    expect(laneOfKey("KeyR", keys)).toBe("U");
    expect(rebind(keys, "R", "KeyU")).toEqual(keys);
  });

  it("plays letters on number keys too, from the number row or the numpad", () => {
    const keys = rebind(DEFAULT_KEYS, "U", "Digit1");
    expect(keyLabel(keys.U)).toBe("1");
    expect(laneOfKey(gameKey("Numpad1"), keys)).toBe("U");
    expect(laneOfKey(gameKey("Digit1"), keys)).toBe("U");
    expect(gameKey("KeyR")).toBe("KeyR");
  });

  it("only keeps stored key maps that give every letter its own letter or number key", () => {
    expect(isKeyMap(DEFAULT_KEYS)).toBe(true);
    expect(isKeyMap(rebind(DEFAULT_KEYS, "M", "KeyK"))).toBe(true);
    expect(isKeyMap(rebind(DEFAULT_KEYS, "M", "Digit7"))).toBe(true);
    expect(isKeyMap({ ...DEFAULT_KEYS, M: "Numpad7" })).toBe(false);
    expect(isKeyMap({ ...DEFAULT_KEYS, R: "KeyU" })).toBe(false);
    expect(isKeyMap({ ...DEFAULT_KEYS, R: "Space" })).toBe(false);
    expect(isKeyMap({ ...DEFAULT_KEYS, R: undefined })).toBe(false);
    expect(isKeyMap(null)).toBe(false);
  });
});
