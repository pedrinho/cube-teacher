// A solving method is a sequence of steps, each with a lesson and a solver stage.
import type { Color, CubeState, Move } from "../cube/model";
import type { MessageKey } from "../i18n/en";

export interface StepDef {
  /** 0 is the notation lesson; real steps start at 1. */
  id: number;
  /** Which layer of the cube the step completes (0 for the notation lesson). */
  layer: 0 | 1 | 2 | 3;
  /** YouTube videos for this step (Cinoto's), in watching order. */
  videos: string[];
  /** Whether the full lesson and the solver for this step are available yet. */
  ready: boolean;
}

export interface MethodDef {
  id: "layers" | "fridrich";
  steps: StepDef[];
  /** Credit for the method and its videos. */
  source: { author: string; title: string; url: string };
}

/** What a segment's instruction says, filled in with color names by the UI. */
export interface Explain {
  key: MessageKey;
  /** The piece being worked on, by its colors (white first). */
  piece?: Color[];
  /** Named colors used in the text, e.g. { front: "B" }. */
  colors?: Record<string, Color>;
}

export type SegmentKind =
  /** Turn the whole cube in your hands. */
  | "rotate"
  /** Turn the top layer to line a piece up. */
  | "align"
  /** A named algorithm for a case. */
  | "alg"
  /** Free moves found for this exact cube (the cross). */
  | "intuitive"
  /** Nothing to do, just a message. */
  | "info";

export interface Segment {
  kind: SegmentKind;
  moves: Move[];
  explain: Explain;
  /** Lesson case this segment uses, e.g. "2.1" for step 2, case 1. */
  caseId?: string;
  before: CubeState;
  after: CubeState;
}

export interface Stage {
  step: number;
  segments: Segment[];
}
