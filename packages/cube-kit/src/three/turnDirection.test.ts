// The 3D animation must turn each layer the same way the model applies the move,
// otherwise the cube would visibly turn one way and then snap to the other.
import { describe, expect, it } from "vitest";
import { Quaternion, Vector3 } from "three";
import { BASE_MOVES, STICKERS, applyMove, moveLayer } from "../cube/model";

const LABELS = Array.from({ length: 54 }, (_, i) => String.fromCharCode(48 + i)).join("");
const key = (v: Vector3) => [v.x, v.y, v.z].map((n) => Math.round(n)).join(",");

describe("3D turn direction", () => {
  it.each(BASE_MOVES)("%s animates the way the model moves stickers", (base) => {
    const { axis, inLayer } = moveLayer(base);
    const q = new Quaternion().setFromAxisAngle(new Vector3(...axis), -Math.PI / 2);
    const after = applyMove(LABELS, { base, amount: 1 });
    STICKERS.forEach((s, i) => {
      if (!inLayer(s.pos)) return;
      const pos = new Vector3(...s.pos).applyQuaternion(q);
      const normal = new Vector3(...s.normal).applyQuaternion(q);
      const j = STICKERS.findIndex((t) => key(new Vector3(...t.pos)) === key(pos) && key(new Vector3(...t.normal)) === key(normal));
      expect(after[j]).toBe(LABELS[i]);
    });
  });
});
