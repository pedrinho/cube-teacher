// Whole-cube rotations: how to turn the cube in your hands so given colors face up and front.
import { applyAlg, centers, parseAlg, type Color, type CubeState, type Move } from "./model";

/** For each of the 24 ways to hold a cube, the shortest rotation (y turns preferred). */
const ROTATIONS: Move[][] = (() => {
  const steps = ["y", "y'", "y2", "x", "x'", "x2", "z", "z'", "z2"].map((m) => parseAlg(m));
  // Track the orientation through where the centers end up, starting from any labeled cube.
  const probe = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";
  const seen = new Map<string, Move[]>([[probe, []]]);
  let frontier: [string, Move[]][] = [[probe, []]];
  while (frontier.length > 0) {
    const next: [string, Move[]][] = [];
    for (const [s, alg] of frontier)
      for (const step of steps) {
        const t = applyAlg(s, step);
        if (seen.has(t)) continue;
        const a = [...alg, ...step];
        seen.set(t, a);
        next.push([t, a]);
      }
    frontier = next;
  }
  return [...seen.values()];
})();

/** The rotation that puts `up` on top and `front` in front (empty if already held that way). */
export function rotationTo(state: CubeState, up: Color, front: Color): Move[] {
  for (const r of ROTATIONS) {
    const c = centers(applyAlg(state, r));
    if (c.U === up && c.F === front) return r;
  }
  throw new Error(`Cannot hold ${up} up and ${front} in front`);
}

/** The same cube held with `up` on top and `front` in front. */
export const holdAs = (state: CubeState, up: Color, front: Color) => applyAlg(state, rotationTo(state, up, front));

/** The four ways to turn the cube around its vertical axis. */
export const Y_TURNS: Move[][] = ["", "y", "y2", "y'"].map((a) => parseAlg(a));
/** The four ways to turn the top layer. */
export const U_TURNS: Move[][] = ["", "U", "U2", "U'"].map((a) => parseAlg(a));
