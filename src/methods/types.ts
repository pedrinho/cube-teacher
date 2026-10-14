// A solving method is a sequence of steps, each with a lesson and (later) a solver stage.

export interface StepDef {
  /** 0 is the notation lesson; real steps start at 1. */
  id: number;
  /** Which layer of the cube the step completes (0 for the notation lesson). */
  layer: 0 | 1 | 2 | 3;
  /** YouTube video for this step. */
  videoId: string;
  /** Whether the full lesson is available yet (lessons arrive layer by layer). */
  ready: boolean;
}

export interface MethodDef {
  id: string;
  steps: StepDef[];
  /** Credit for the method and its videos. */
  source: { author: string; title: string; url: string };
}
