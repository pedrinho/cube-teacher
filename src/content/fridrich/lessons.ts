// The Fridrich lessons, in Cinoto's order. Case pictures and demos come from the classifier, which
// builds, for every algorithm, the cube it solves (so pictures always match the moves).
import { EDGE_SLOTS, applyAlg, algToString, invertAlg, parseAlg, type CubeState, type Move } from "../../cube/model";
import { U_TURNS } from "../../cube/orientation";
import type { MessageKey } from "../../i18n/en";
import { F2L_CASES, OLL_CASES, PLL_CASES, type AlgCase } from "../../methods/fridrich/algs";
import { classifyAlg, type AlgSet } from "../../methods/fridrich/classify";
import { OLL_CORNER_CASES, OLL_EDGES } from "../../methods/fridrich/sets";
import { topColorEdges } from "../../methods/layers/goals";
import { YELLOW_UP, stepMask, type Visible } from "../../methods/layers/pictures";

export interface FrCase {
  /** "f2l.4", "oll.12", "pll.U1", or "oll2.line" for the 2-look edge cases. */
  id: string;
  /** Position in Cinoto's list, for F2L and OLL. */
  number?: number;
  /** Cinoto's name, when he gives one. */
  name?: string;
  /** Title and text for the 2-look edge cases, which aren't in the list. */
  titleKey?: MessageKey;
  textKey?: MessageKey;
  alg: string;
  alts: string[];
  demo: string;
  setup: CubeState;
}

export interface CaseGroup {
  titleKey?: MessageKey;
  leadKey?: MessageKey;
  cases: FrCase[];
  mask: Visible;
  view: "cube" | "top";
  arrows?: boolean;
}

export interface FrLesson {
  step: number;
  paragraphs: MessageKey[];
  /** A hands-on part: the move pad (lesson 0) or the cross demo (lesson 1). */
  extra?: "moves" | "cross";
  groups: CaseGroup[];
  tips: MessageKey[];
}

function fromList(set: AlgSet, list: AlgCase[], i: number): FrCase {
  const c = list[i];
  const found = classifyAlg(set, c.algs[0]);
  if (!found) throw new Error(`${set} ${i + 1} doesn't solve its case`);
  return {
    id: set === "pll" ? `pll.${c.name}` : `${set}.${i + 1}`,
    number: i + 1,
    name: c.name,
    alg: c.algs[0],
    alts: c.algs.slice(1),
    demo: c.algs[0],
    setup: found.setup,
  };
}
const pll = (name: string) => fromList("pll", PLL_CASES, PLL_CASES.findIndex((c) => c.name === name));

// ---- 2-look OLL edges -------------------------------------------------------------------------------

const has = (s: CubeState, ...slots: string[]) => {
  const up = topColorEdges(s);
  return up.length === slots.length && slots.every((x) => up.includes(x));
};

/** The 2-look edge moves for a cube, as the guided solve does them: line, L, or dot first. */
function edgesDemo(start: CubeState): Move[] {
  const moves: Move[] = [];
  let s = start;
  for (let guard = 0; guard < 4 && topColorEdges(s).length < 4; guard++) {
    const line = U_TURNS.find((u) => has(applyAlg(s, u), "UL", "UR"));
    const ell = U_TURNS.find((u) => has(applyAlg(s, u), "UB", "UL"));
    const step = line ? [...line, ...parseAlg(OLL_EDGES.line)] : ell ? [...ell, ...parseAlg(OLL_EDGES.ell)] : parseAlg(OLL_EDGES.line);
    moves.push(...step);
    s = applyAlg(s, step);
  }
  return moves;
}

const undo = (alg: string) => applyAlg(YELLOW_UP, invertAlg(parseAlg(alg)));
// All four top edges flipped: only the yellow center on top.
const DOT = EDGE_SLOTS.filter((e) => e.faces[0] === "U").reduce((s, e) => {
  const out = [...s];
  [out[e.stickers[0]], out[e.stickers[1]]] = [s[e.stickers[1]], s[e.stickers[0]]];
  return out.join("");
}, YELLOW_UP);

const EDGE_CASES: FrCase[] = [
  { id: "oll2.line", titleKey: "fr.oll2.line", textKey: "fr.oll2.lineText", alg: OLL_EDGES.line, alts: [], demo: OLL_EDGES.line, setup: undo(OLL_EDGES.line) },
  { id: "oll2.ell", titleKey: "fr.oll2.ell", textKey: "fr.oll2.ellText", alg: OLL_EDGES.ell, alts: [], demo: OLL_EDGES.ell, setup: undo(OLL_EDGES.ell) },
  {
    id: "oll2.dot",
    titleKey: "fr.oll2.dot",
    textKey: "fr.oll2.dotText",
    alg: OLL_EDGES.line,
    alts: [],
    demo: algToString(edgesDemo(DOT)),
    setup: DOT,
  },
];

// ---- Lessons ------------------------------------------------------------------------------------------

const F2L_MASK = stepMask(3);
const OLL_MASK = stepMask(5);
const ALL = stepMask(7);
// Cinoto's simplest F2L cases: the two fishing moves and short ones for pairs already on top.
const INTUITIVE_F2L = [4, 5, 6, 7, 16, 18].map((n) => fromList("f2l", F2L_CASES, n - 1));

export const FR_LESSONS: Record<number, FrLesson> = {
  0: { step: 0, paragraphs: ["fr.l0.p1", "fr.l0.p2", "fr.l0.p3"], extra: "moves", groups: [], tips: ["fr.l0.tip1", "fr.l0.tip2", "fr.l0.tip3"] },
  1: { step: 1, paragraphs: ["fr.l1.p1", "fr.l1.p2", "fr.l1.p3"], extra: "cross", groups: [], tips: ["fr.l1.tip1", "fr.l1.tip2"] },
  2: {
    step: 2,
    paragraphs: ["fr.l2.p1", "fr.l2.p2", "fr.l2.p3"],
    groups: [{ leadKey: "fr.l2.lead", cases: INTUITIVE_F2L, mask: F2L_MASK, view: "cube" }],
    tips: ["fr.l2.tip1", "fr.l2.tip2"],
  },
  3: {
    step: 3,
    paragraphs: ["fr.l3.p1", "fr.l3.p2"],
    groups: [
      { titleKey: "fr.l3.edges", leadKey: "fr.l3.edgesLead", cases: EDGE_CASES, mask: stepMask(4), view: "top" },
      {
        titleKey: "fr.l3.corners",
        leadKey: "fr.l3.cornersLead",
        cases: OLL_CORNER_CASES.map((i) => fromList("oll", OLL_CASES, i)),
        mask: OLL_MASK,
        view: "top",
      },
    ],
    tips: ["fr.l3.tip1", "fr.l3.tip2"],
  },
  4: {
    step: 4,
    paragraphs: ["fr.l4.p1", "fr.l4.p2", "fr.l4.p3"],
    groups: [
      { titleKey: "fr.l4.known", cases: ["A1", "A2", "U1", "U2"].map(pll), mask: ALL, view: "top", arrows: true },
      { titleKey: "fr.l4.twoLook", leadKey: "fr.l4.twoLookLead", cases: ["T", "Y", "H", "Z"].map(pll), mask: ALL, view: "top", arrows: true },
      {
        titleKey: "fr.l4.rest",
        cases: ["J1", "J2", "R1", "R2", "F", "V", "E", "N1", "N2", "G1", "G2", "G3", "G4"].map(pll),
        mask: ALL,
        view: "top",
        arrows: true,
      },
    ],
    tips: ["fr.l4.tip1", "fr.l4.tip2"],
  },
  5: {
    step: 5,
    paragraphs: ["fr.l5.p1", "fr.l5.p2"],
    groups: [{ leadKey: "fr.l5.lead", cases: OLL_CASES.map((_, i) => fromList("oll", OLL_CASES, i)), mask: OLL_MASK, view: "top" }],
    tips: ["fr.l5.tip1", "fr.l5.tip2"],
  },
  6: {
    step: 6,
    paragraphs: ["fr.l6.p1", "fr.l6.p2"],
    groups: [{ leadKey: "fr.l6.lead", cases: F2L_CASES.map((_, i) => fromList("f2l", F2L_CASES, i)), mask: F2L_MASK, view: "cube" }],
    tips: ["fr.l6.tip1", "fr.l6.tip2"],
  },
};

/** Every case that can be practiced, by id. */
export const ALL_FR_CASES: Map<string, FrCase> = new Map(
  Object.values(FR_LESSONS).flatMap((l) => l.groups.flatMap((g) => g.cases.map((c) => [c.id, c] as const))),
);
