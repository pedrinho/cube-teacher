// Pictures of what the cube looks like after each step, like the step icons in Cinoto's guide:
// pieces that are not solved yet are gray. Masks follow the pieces' colors, so they stay right
// while the cube turns.
import { SOLVED, applyAlg, type CubeState } from "../../cube/model";
import { PIECE_OF, pieceColors } from "../../cube/pieces";

export type Visible = (stickerIndex: number, state: CubeState) => boolean;

export interface StepPicture {
  state: CubeState;
  visible: Visible;
}

/** White on top (as in step 1), and yellow on top, blue in front (as in steps 2–7). */
export const WHITE_UP = SOLVED;
export const YELLOW_UP = applyAlg(SOLVED, "x2");

const isEdge = (c: string[]) => c.length === 2;
const isCorner = (c: string[]) => c.length === 3;
const firstLayer = (c: string[]) => c.includes("W");
const secondLayer = (c: string[]) => isEdge(c) && !c.includes("W") && !c.includes("Y");

/** Which pieces are drawn in color once each step is done (own = the sticker's own color). */
const DONE: Record<number, (colors: string[], own: string) => boolean> = {
  0: () => true,
  1: (c) => isEdge(c) && c.includes("W"),
  2: firstLayer,
  3: (c) => firstLayer(c) || secondLayer(c),
  4: (c, own) => firstLayer(c) || secondLayer(c) || (isEdge(c) && own === "Y"),
  5: (c, own) => firstLayer(c) || secondLayer(c) || own === "Y",
  6: (c, own) => firstLayer(c) || secondLayer(c) || own === "Y" || isCorner(c),
  7: () => true,
};

/** Colors the pieces that are done after `step`; centers always show. */
export function stepMask(step: number): Visible {
  const keep = DONE[step] ?? DONE[7];
  return (i, state) => PIECE_OF[i].length === 1 || keep(pieceColors(state, i), state[i]);
}

export function stepPicture(step: number): StepPicture {
  return { state: step === 1 ? WHITE_UP : YELLOW_UP, visible: stepMask(step) };
}
