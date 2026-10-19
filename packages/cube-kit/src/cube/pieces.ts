// Which stickers belong to the same piece, so pictures can gray out whole pieces.
import {
  CORNER_SLOTS,
  DEFAULT_SCHEME as DEFAULT_COLOR,
  EDGE_SLOTS,
  FACES,
  centerIndex,
  centers,
  slotColors,
  type Color,
  type CubeState,
  type PieceSlot,
} from "./model";

/** For every sticker index, the sticker indices of its piece (center, edge or corner). */
export const PIECE_OF: number[][] = (() => {
  const out: number[][] = [];
  for (const f of FACES) out[centerIndex(f)] = [centerIndex(f)];
  for (const slot of [...EDGE_SLOTS, ...CORNER_SLOTS]) for (const i of slot.stickers) out[i] = slot.stickers;
  return out;
})();

export const pieceColors = (state: CubeState, sticker: number) => PIECE_OF[sticker].map((i) => state[i] as Color);

const sameSet = (a: readonly string[], b: readonly string[]) => [...a].sort().join("") === [...b].sort().join("");
const slotsFor = (colors: readonly Color[]) => (colors.length === 2 ? EDGE_SLOTS : CORNER_SLOTS);

/** Where a piece is now. */
export function slotOf(state: CubeState, colors: readonly Color[]): PieceSlot {
  return slotsFor(colors).find((s) => sameSet(slotColors(state, s), colors))!;
}

/** Where a piece belongs: the slot between the centers of its colors. */
export function homeOf(state: CubeState, colors: readonly Color[]): PieceSlot {
  const c = centers(state);
  return slotsFor(colors).find((s) => sameSet(s.faces.map((f) => c[f]), colors))!;
}

/** True when the piece is in its place and turned the right way. */
export function isSolvedPiece(state: CubeState, colors: readonly Color[]): boolean {
  const home = homeOf(state, colors);
  const c = centers(state);
  return home.stickers.every((i, k) => state[i] === c[home.faces[k]]);
}

/** All pieces (by colors) of a cube, edges then corners. */
export const ALL_EDGES: Color[][] = EDGE_SLOTS.map((s) => s.faces.map((f) => DEFAULT_COLOR[f]));
export const ALL_CORNERS: Color[][] = CORNER_SLOTS.map((s) => s.faces.map((f) => DEFAULT_COLOR[f]));
