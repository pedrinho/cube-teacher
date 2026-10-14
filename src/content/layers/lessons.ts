// Lesson content for each step: the explanation, the cases with their moves, and the cube
// each case starts from (built by undoing the moves from a solved cube, then checked in tests).
import { CORNER_SLOTS, EDGE_SLOTS, applyAlg, algToString, invertAlg, parseAlg, type CubeState } from "../../cube/model";
import type { MessageKey } from "../../i18n/en";
import { WHITE_UP, YELLOW_UP, stepMask, type Visible } from "../../methods/layers/pictures";
import { solveFirstLayer } from "../../methods/layers/step2-corners";
import { solveSecondLayer } from "../../methods/layers/step3-edges";
import { solveYellowCross } from "../../methods/layers/step4-cross";
import { solveYellowFace } from "../../methods/layers/step5-face";

export interface LessonCase {
  /** Also the anchor id on the lesson page, e.g. "2.1". */
  id: string;
  title: MessageKey;
  text: MessageKey;
  /** The moves for this case. */
  alg: string;
  /** Moves that come right after, shown under a label (e.g. "Then case 1:"). */
  follow?: { label: MessageKey; alg: string };
  /** Everything the demo cube plays; defaults to the moves and the follow-up. */
  demo?: string;
  /** The cube before the moves. */
  setup: CubeState;
}

export const demoMoves = (c: LessonCase) => c.demo ?? `${c.alg} ${c.follow?.alg ?? ""}`.trim();

export interface Lesson {
  step: number;
  paragraphs: MessageKey[];
  casesLead: MessageKey;
  cases: LessonCase[];
  tips: MessageKey[];
  /** Which pieces the pictures and the demo cube draw in color. */
  mask: Visible;
  /** Case pictures: the cube from the front corner, or the top layer from above. */
  view?: "cube" | "top";
  /** Draw arrows to where top pieces go (top view only). */
  arrows?: boolean;
}

const undo = (base: CubeState, moves: string) => applyAlg(base, invertAlg(parseAlg(moves)));

const findSlot = <T extends { name: string }>(slots: T[], faces: string) =>
  slots.find((s) => [...s.name].sort().join("") === [...faces].sort().join(""))!;

/** Swaps two edges' stickers in order, or flips one edge when both are the same slot. */
function swapEdges(state: CubeState, a: string, b: string): CubeState {
  const sa = findSlot(EDGE_SLOTS, a).stickers;
  const sb = findSlot(EDGE_SLOTS, b).stickers;
  const out = [...state];
  if (a === b) [out[sa[0]], out[sa[1]]] = [state[sa[1]], state[sa[0]]];
  else sa.forEach((st, k) => ([out[st], out[sb[k]]] = [state[sb[k]], state[st]]));
  return out.join("");
}

/** Everything the solver does for this step, as one move string (rotations included). */
const solverMoves = (solve: (s: CubeState) => { segments: { moves: Parameters<typeof algToString>[0] }[] }, s: CubeState) =>
  algToString(solve(s).segments.flatMap((g) => g.moves));

/** Turns a corner's stickers in place (clockwise when `turns` is 1). */
function twist(state: CubeState, faces: string, turns: number): CubeState {
  const slot = findSlot(CORNER_SLOTS, faces);
  const out = [...state];
  slot.stickers.forEach((st, k) => (out[slot.stickers[(k + turns) % 3]] = state[st]));
  return out.join("");
}

// A white corner in its place but turned, with a top corner turned the other way to make up for it.
const STUCK = twist(twist(YELLOW_UP, "DFR", 1), "UBL", 2);
// Second layer edges stuck in the middle layer: one flipped in its place (with a top edge flipped
// too, as a real cube needs), or two swapped (with two top edges swapped too).
const FLIPPED = swapEdges(swapEdges(YELLOW_UP, "FR", "FR"), "UB", "UB");
// All four top edges flipped: only the yellow center on top.
const DOT = ["UF", "UR", "UB", "UL"].reduce((s, e) => swapEdges(s, e, e), YELLOW_UP);
const CROSS = "F U R U' R' F'";
const SUNE = "R U R' U R U2 R'";
// Two corners with yellow on top, front left corner showing yellow to the front (case 2), and
// none on top, front left corner showing yellow to the left (case 3).
const TWO_UP = undo(YELLOW_UP, `${SUNE} ${SUNE} y2 ${SUNE}`);
const NONE_UP = undo(YELLOW_UP, `${SUNE} ${SUNE}`);
const SWAPPED = swapEdges(swapEdges(YELLOW_UP, "FR", "FL"), "UF", "UB");

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
        follow: { label: "lesson.thenCase1", alg: "R U R'" },
        setup: undo(YELLOW_UP, "R U2 R' U' R U R'"),
      },
      {
        id: "2.out",
        title: "l2.out.title",
        text: "l2.out.text",
        alg: "R U R'",
        demo: solverMoves(solveFirstLayer, STUCK),
        setup: STUCK,
      },
    ],
    tips: ["l2.tip1", "l2.tip2"],
    mask: stepMask(2),
  },
  3: {
    step: 3,
    paragraphs: ["l3.p1", "l3.p2", "l3.p3", "l3.p4"],
    casesLead: "l3.casesLead",
    cases: [
      {
        id: "3.1",
        title: "l3.1.title",
        text: "l3.1.text",
        alg: "U R U R' U'",
        follow: { label: "lesson.thenStep2Case2", alg: "F' U' F" },
        setup: undo(YELLOW_UP, "U R U R' U' F' U' F"),
      },
      {
        id: "3.2",
        title: "l3.2.title",
        text: "l3.2.text",
        alg: "U' L' U' L U",
        follow: { label: "lesson.thenTurnStep2Case1", alg: "R U R'" },
        demo: "U' L' U' L U y' R U R'",
        setup: undo(YELLOW_UP, "U' L' U' L U F U F'"),
      },
      {
        id: "3.flip",
        title: "l3.flip.title",
        text: "l3.flip.text",
        alg: "U R U R' U'",
        follow: { label: "lesson.thenStep2Case2", alg: "F' U' F" },
        demo: solverMoves(solveSecondLayer, FLIPPED),
        setup: FLIPPED,
      },
      {
        id: "3.none",
        title: "l3.none.title",
        text: "l3.none.text",
        alg: "U R U R' U'",
        follow: { label: "lesson.thenStep2Case2", alg: "F' U' F" },
        demo: solverMoves(solveSecondLayer, SWAPPED),
        setup: SWAPPED,
      },
    ],
    tips: ["l3.tip1", "l3.tip2"],
    mask: stepMask(3),
  },
  4: {
    step: 4,
    paragraphs: ["l4.p1", "l4.p2", "l4.p3"],
    casesLead: "l4.casesLead",
    cases: [
      { id: "4.1", title: "l4.1.title", text: "l4.1.text", alg: CROSS, setup: undo(YELLOW_UP, CROSS) },
      {
        id: "4.2",
        title: "l4.2.title",
        text: "l4.2.text",
        alg: CROSS,
        follow: { label: "lesson.thenAgain", alg: CROSS },
        setup: undo(YELLOW_UP, `${CROSS} ${CROSS}`),
      },
      { id: "4.3", title: "l4.3.title", text: "l4.3.text", alg: CROSS, demo: solverMoves(solveYellowCross, DOT), setup: DOT },
    ],
    tips: ["l4.tip1", "l4.tip2"],
    mask: stepMask(4),
    view: "top",
  },
  5: {
    step: 5,
    paragraphs: ["l5.p1", "l5.p2", "l5.p3"],
    casesLead: "l5.casesLead",
    cases: [
      { id: "5.1", title: "l5.1.title", text: "l5.1.text", alg: SUNE, setup: undo(YELLOW_UP, SUNE) },
      { id: "5.2", title: "l5.2.title", text: "l5.2.text", alg: SUNE, demo: solverMoves(solveYellowFace, TWO_UP), setup: TWO_UP },
      { id: "5.3", title: "l5.3.title", text: "l5.3.text", alg: SUNE, demo: solverMoves(solveYellowFace, NONE_UP), setup: NONE_UP },
    ],
    tips: ["l5.tip1", "l5.tip2"],
    mask: stepMask(5),
    view: "top",
  },
};
