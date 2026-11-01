// The two-layer pyraminx: a pyraminx with its tips glued to the corners under them, so a corner
// turns as one piece with its tip, and the pyramid has two layers each way. It is the pyraminx's
// model turned only by U, L, R and B, which take the tip along: a tip is always the color of its
// corner's center. It is drawn that way too, each tip and its center as one sticker.
import {
  PYRA_STICKERS,
  applyPyraMove,
  isTip,
  pyraMoveToString,
  type PyraMove,
  type PyraState,
  type Vec,
} from "./model";

export { PYRA_SOLVED as PYRA_2_SOLVED, isPyraSolved as isPyra2Solved } from "./model";

export function applyPyra2Move(state: PyraState, m: PyraMove): PyraState {
  if (isTip(m.base)) throw new Error(`The two-layer pyraminx's tips are glued on: it can't turn ${pyraMoveToString(m)}`);
  return applyPyraMove(state, m);
}

const same = (a: Vec, b: Vec) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < 1e-9;

/**
 * The pyraminx's stickers, as drawn: a tip's covers its center too, the rhombus the two make
 * together, and the center's own has nothing to draw.
 */
export const PYRA_2_STICKERS: { outline: Vec[]; center: Vec; normal: Vec }[] = PYRA_STICKERS.map((s) => {
  if (s.kind === "edge") return { outline: [...s.triangle], center: s.center, normal: s.normal };
  if (s.kind === "center") return { outline: [], center: s.center, normal: s.normal };
  const under = PYRA_STICKERS.find((o) => o.face === s.face && o.kind === "center" && o.corners[0] === s.corners[0])!;
  // The two triangles share a side: go round from the tip's own corner, across to the center's.
  const shared = s.triangle.filter((p) => under.triangle.some((q) => same(p, q)));
  const tip = s.triangle.find((p) => !shared.includes(p))!;
  const far = under.triangle.find((q) => !shared.some((p) => same(p, q)))!;
  return { outline: [tip, shared[0], far, shared[1]], center: s.center, normal: s.normal };
});
