// Checks that an entered cube is a real, solvable cube.
// The last three checks are the "impossible" situations Cinoto warns about: a twisted corner,
// a flipped edge, or two swapped pieces (usually a cube that was taken apart and rebuilt wrong).
import {
  COLORS,
  CORNER_SLOTS,
  EDGE_SLOTS,
  centers,
  slotColors,
  type Color,
  type CubeState,
  type PieceSlot,
} from "./model";

export type ValidationError =
  | { kind: "unpainted"; count: number }
  | { kind: "centers" }
  | { kind: "count"; color: Color; count: number }
  | { kind: "bad-edge"; stickers: number[] }
  | { kind: "bad-corner"; stickers: number[] }
  | { kind: "duplicate"; stickers: number[] }
  | { kind: "flipped-edge" }
  | { kind: "twisted-corner" }
  | { kind: "swapped-pieces" };

export type ValidationResult = { ok: true } | { ok: false; errors: ValidationError[] };

const rotations = <T,>(xs: T[]) => xs.map((_, i) => [...xs.slice(i), ...xs.slice(0, i)].join(""));

function parity(perm: number[]): number {
  const seen = new Array(perm.length).fill(false);
  let swaps = 0;
  for (let i = 0; i < perm.length; i++) {
    if (seen[i]) continue;
    let j = i;
    let len = 0;
    while (!seen[j]) {
      seen[j] = true;
      j = perm[j];
      len++;
    }
    swaps += len - 1;
  }
  return swaps % 2;
}

export function validate(state: CubeState): ValidationResult {
  const errors: ValidationError[] = [];
  const unpainted = [...state].filter((c) => !(COLORS as readonly string[]).includes(c)).length;
  if (unpainted > 0) return { ok: false, errors: [{ kind: "unpainted", count: unpainted }] };
  const center = centers(state);
  const centerColors = Object.values(center);
  if (new Set(centerColors).size !== 6) return { ok: false, errors: [{ kind: "centers" }] };

  for (const color of COLORS) {
    const count = [...state].filter((c) => c === color).length;
    if (count !== 9) errors.push({ kind: "count", color, count });
  }
  if (errors.length > 0) return { ok: false, errors };

  // Where each piece belongs, keyed by its colors (corners: clockwise order, any rotation).
  const homeColors = (slot: PieceSlot) => slot.faces.map((f) => center[f]);
  const edgeHome = new Map<string, number>();
  EDGE_SLOTS.forEach((slot, i) => {
    edgeHome.set(homeColors(slot).join(""), i);
    edgeHome.set([...homeColors(slot)].reverse().join(""), i);
  });
  const cornerHome = new Map<string, number>();
  CORNER_SLOTS.forEach((slot, i) => rotations(homeColors(slot)).forEach((k) => cornerHome.set(k, i)));

  const identify = (slots: PieceSlot[], homes: Map<string, number>, kind: "bad-edge" | "bad-corner") => {
    const perm: number[] = [];
    const firstSeen = new Map<number, PieceSlot>();
    slots.forEach((slot) => {
      const home = homes.get(slotColors(state, slot).join(""));
      if (home === undefined) {
        errors.push({ kind, stickers: slot.stickers });
        return;
      }
      const other = firstSeen.get(home);
      if (other) errors.push({ kind: "duplicate", stickers: [...other.stickers, ...slot.stickers] });
      firstSeen.set(home, slot);
      perm.push(home);
    });
    return perm;
  };
  const edgePerm = identify(EDGE_SLOTS, edgeHome, "bad-edge");
  const cornerPerm = identify(CORNER_SLOTS, cornerHome, "bad-corner");
  if (errors.length > 0) return { ok: false, errors };

  // Orientation: where the piece's reference color (U/D color, else F/B for edges) sits.
  const upDown = [center.U, center.D];
  const frontBack = [center.F, center.B];
  let flips = 0;
  for (const slot of EDGE_SLOTS) {
    const colors = slotColors(state, slot);
    const ref = colors.find((c) => upDown.includes(c)) ?? colors.find((c) => frontBack.includes(c))!;
    flips += colors.indexOf(ref);
  }
  let twists = 0;
  for (const slot of CORNER_SLOTS) {
    const colors = slotColors(state, slot);
    twists += colors.findIndex((c) => upDown.includes(c));
  }
  if (flips % 2 !== 0) errors.push({ kind: "flipped-edge" });
  if (twists % 3 !== 0) errors.push({ kind: "twisted-corner" });
  if (parity(edgePerm) !== parity(cornerPerm)) errors.push({ kind: "swapped-pieces" });

  return errors.length > 0 ? { ok: false, errors } : { ok: true };
}
