// Lesson content for each step: the explanation, the cases with their moves, and the cube
// each case starts from (built by undoing the moves from a solved cube, then checked in tests).
import { CORNER_SLOTS, applyAlg, algToString, invertAlg, parseAlg, type CubeState } from "../../cube/model";
import type { MessageKey } from "../../i18n/en";
import { WHITE_UP, YELLOW_UP, stepMask, type Visible } from "../../methods/layers/pictures";
import { solveFirstLayer } from "../../methods/layers/step2-corners";

export interface LessonCase {
  /** Also the anchor id on the lesson page, e.g. "2.1". */
  id: string;
  title: MessageKey;
  text: MessageKey;
  /** The moves for this case. */
  alg: string;
  /** Moves that follow in the demo, e.g. case 3 turns into case 1, which is then solved. */
  then?: string;
  /** The cube before the moves. */
  setup: CubeState;
}

export interface Lesson {
  step: number;
  paragraphs: MessageKey[];
  casesLead: MessageKey;
  cases: LessonCase[];
  tips: MessageKey[];
  /** Which pieces the pictures and the demo cube draw in color. */
  mask: Visible;
}

const undo = (base: CubeState, moves: string) => applyAlg(base, invertAlg(parseAlg(moves)));

/** Turns a corner's stickers in place (clockwise when `turns` is 1). */
function twist(state: CubeState, faces: string, turns: number): CubeState {
  const slot = CORNER_SLOTS.find((s) => [...s.name].sort().join("") === [...faces].sort().join(""))!;
  const out = [...state];
  slot.stickers.forEach((st, k) => (out[slot.stickers[(k + turns) % 3]] = state[st]));
  return out.join("");
}

// A white corner in its place but turned, with a top corner turned the other way to make up for it.
const STUCK = twist(twist(YELLOW_UP, "DFR", 1), "UBL", 2);
// What the solver does after taking the corner out.
const stuckSegments = solveFirstLayer(STUCK).segments;
const stuckMoves = stuckSegments.slice(stuckSegments.findIndex((s) => s.caseId === "2.out") + 1).flatMap((s) => s.moves);

export const LESSONS: Record<number, Lesson> = {
  1: {
    step: 1,
    paragraphs: ["l1.p1", "l1.p2", "l1.p3"],
    casesLead: "l1.casesLead",
    cases: [
      { id: "1.a", title: "l1.a.title", text: "l1.a.text", alg: "R", setup: undo(WHITE_UP, "R") },
      { id: "1.b", title: "l1.b.title", text: "l1.b.text", alg: "F'", setup: undo(WHITE_UP, "F'") },
      { id: "1.c", title: "l1.c.title", text: "l1.c.text", alg: "R2", setup: undo(WHITE_UP, "R2") },
      { id: "1.d", title: "l1.d.title", text: "l1.d.text", alg: "U2 L' U2", setup: undo(WHITE_UP, "U2 L' U2") },
      { id: "1.e", title: "l1.e.title", text: "l1.e.text", alg: "R U F' U'", setup: undo(WHITE_UP, "R U F' U'") },
      { id: "1.f", title: "l1.f.title", text: "l1.f.text", alg: "R' U F' U'", setup: undo(WHITE_UP, "R' U F' U'") },
    ],
    tips: ["l1.tip1", "l1.tip2"],
    mask: stepMask(1),
  },
  2: {
    step: 2,
    paragraphs: ["l2.p1", "l2.p2", "l2.p3"],
    casesLead: "l2.casesLead",
    cases: [
      { id: "2.1", title: "l2.1.title", text: "l2.1.text", alg: "R U R'", setup: undo(YELLOW_UP, "R U R'") },
      { id: "2.2", title: "l2.2.title", text: "l2.2.text", alg: "F' U' F", setup: undo(YELLOW_UP, "F' U' F") },
      {
        id: "2.3",
        title: "l2.3.title",
        text: "l2.3.text",
        alg: "R U2 R' U'",
        then: "R U R'",
        setup: undo(YELLOW_UP, "R U2 R' U' R U R'"),
      },
      { id: "2.out", title: "l2.out.title", text: "l2.out.text", alg: "R U R'", then: algToString(stuckMoves), setup: STUCK },
    ],
    tips: ["l2.tip1", "l2.tip2"],
    mask: stepMask(2),
  },
};
