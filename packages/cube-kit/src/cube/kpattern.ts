// Conversion from our sticker model to cubing.js's 3x3x3 pattern data (piece order by Reid:
// edges UF UR UB UL DF DR DB DL FR FL BR BL, corners UFR URB UBL ULF DRF DFL DLB DBR, centers U L F R B D).
import {
  CORNER_SLOTS,
  DEFAULT_SCHEME,
  EDGE_SLOTS,
  FACES,
  centerIndex,
  slotColors,
  type Color,
  type CubeState,
  type Face,
  type PieceSlot,
} from "./model";

const REID_EDGES = ["UF", "UR", "UB", "UL", "DF", "DR", "DB", "DL", "FR", "FL", "BR", "BL"];
const REID_CORNERS = ["UFR", "URB", "UBL", "ULF", "DRF", "DFL", "DLB", "DBR"];
const REID_CENTERS: Face[] = ["U", "L", "F", "R", "B", "D"];

const sameFaces = (a: string, b: string) => [...a].sort().join("") === [...b].sort().join("");
const slotFor = (slots: PieceSlot[], name: string) => slots.find((s) => sameFaces(s.name, name))!;

const colorOf = Object.fromEntries(FACES.map((f) => [DEFAULT_SCHEME[f], f])) as Record<Color, Face>;
const facesOf = (colors: Color[]) => colors.map((c) => colorOf[c]).join("");

export interface OrbitData {
  pieces: number[];
  orientation: number[];
  orientationMod?: number[];
}
export type PatternData = Record<"EDGES" | "CORNERS" | "CENTERS", OrbitData>;

function orbit(state: CubeState, slots: PieceSlot[], names: string[]): OrbitData {
  const pieces: number[] = [];
  const orientation: number[] = [];
  for (const name of names) {
    const slot = slotFor(slots, name);
    const colors = slotColors(state, slot);
    pieces.push(names.findIndex((n) => sameFaces(n, facesOf(colors))));
    // The piece's reference sticker is its U/D color (edges without one: F/B color).
    const home = slotFor(slots, facesOf(colors));
    const refColor = DEFAULT_SCHEME[home.faces[0]];
    orientation.push(colors.indexOf(refColor));
  }
  return { pieces, orientation };
}

/** Pattern data in cubing.js format, assuming the default color scheme (white U, green F). */
export function toPatternData(state: CubeState): PatternData {
  return {
    EDGES: orbit(state, EDGE_SLOTS, REID_EDGES),
    CORNERS: orbit(state, CORNER_SLOTS, REID_CORNERS),
    CENTERS: {
      pieces: REID_CENTERS.map((f) => REID_CENTERS.indexOf(colorOf[state[centerIndex(f)] as Color])),
      orientation: [0, 0, 0, 0, 0, 0],
      orientationMod: [1, 1, 1, 1, 1, 1],
    },
  };
}
