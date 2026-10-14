// Pictures of what the cube looks like after each step, like the step icons in Cinoto's guide:
// pieces that are not solved yet are gray.
import { SOLVED, applyAlg, type CubeState } from "../../cube/model";
import { PIECE_OF, pieceColors } from "../../cube/pieces";

type Visible = (stickerIndex: number) => boolean;

export interface StepPicture {
  state: CubeState;
  visible: Visible;
}

/** White on top (as in step 1), and yellow on top, blue in front (as in steps 2–7). */
const WHITE_UP = SOLVED;
const YELLOW_UP = applyAlg(SOLVED, "x2");

function rule(state: CubeState, keep: (colors: string[], own: string) => boolean): StepPicture {
  return {
    state,
    visible: (i) => PIECE_OF[i].length === 1 || keep(pieceColors(state, i), state[i]),
  };
}

const isEdge = (c: string[]) => c.length === 2;
const isCorner = (c: string[]) => c.length === 3;
const has = (c: string[], color: string) => c.includes(color);
const firstLayer = (c: string[]) => has(c, "W");
const secondLayer = (c: string[]) => isEdge(c) && !has(c, "W") && !has(c, "Y");

export function stepPicture(step: number): StepPicture {
  switch (step) {
    case 0:
      return { state: YELLOW_UP, visible: () => true };
    case 1:
      return rule(WHITE_UP, (c) => isEdge(c) && has(c, "W"));
    case 2:
      return rule(YELLOW_UP, firstLayer);
    case 3:
      return rule(YELLOW_UP, (c) => firstLayer(c) || secondLayer(c));
    case 4:
      return rule(YELLOW_UP, (c, own) => firstLayer(c) || secondLayer(c) || (isEdge(c) && own === "Y"));
    case 5:
      return rule(YELLOW_UP, (c, own) => firstLayer(c) || secondLayer(c) || own === "Y");
    case 6:
      return rule(YELLOW_UP, (c, own) => firstLayer(c) || secondLayer(c) || own === "Y" || isCorner(c));
    default:
      return { state: YELLOW_UP, visible: () => true };
  }
}
