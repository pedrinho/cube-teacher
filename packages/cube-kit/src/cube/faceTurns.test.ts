import { describe, expect, it } from "vitest";
import { SOLVED, applyAlg, isRotation, parseAlg, randomScramble, algToString } from "./model";
import { holdAs } from "./orientation";
import { toFaceTurns } from "./faceTurns";

describe("toFaceTurns", () => {
  it("makes the same cube with outer face turns only", () => {
    let seed = 3;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const extras = parseAlg("r l' u d2 f b' M M' E S2 x y' z2 Rw");
    for (let n = 0; n < 300; n++) {
      const alg = [...randomScramble(6, random), extras[n % extras.length], ...randomScramble(4, random), extras[(n * 7) % extras.length]];
      const faces = toFaceTurns(alg);
      expect(faces.some((m) => isRotation(m) || !"UDLRFB".includes(m.base)), algToString(faces)).toBe(false);
      expect(applyAlg(SOLVED, faces)).toBe(holdAs(applyAlg(SOLVED, alg), "W", "G"));
    }
  });

  it("merges turns of the same face", () => {
    expect(algToString(toFaceTurns(parseAlg("R R U U' F2 F2")))).toBe("R2");
  });
});
