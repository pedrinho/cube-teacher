// Which stickers belong to the same piece, so pictures can gray out whole pieces.
import { CORNER_SLOTS, EDGE_SLOTS, FACES, centerIndex, type Color, type CubeState } from "./model";

/** For every sticker index, the sticker indices of its piece (center, edge or corner). */
export const PIECE_OF: number[][] = (() => {
  const out: number[][] = [];
  for (const f of FACES) out[centerIndex(f)] = [centerIndex(f)];
  for (const slot of [...EDGE_SLOTS, ...CORNER_SLOTS]) for (const i of slot.stickers) out[i] = slot.stickers;
  return out;
})();

export const pieceColors = (state: CubeState, sticker: number) => PIECE_OF[sticker].map((i) => state[i] as Color);
