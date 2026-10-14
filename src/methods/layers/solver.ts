// The layer method solver: one stage per step, each made of segments the kid follows.
import type { CubeState } from "../../cube/model";
import type { Stage } from "../types";
import type { Recorder } from "./recorder";
import { solveCross } from "./step1-cross";
import { solveFirstLayer } from "./step2-corners";
import { solveSecondLayer } from "./step3-edges";
import { solveYellowCross } from "./step4-cross";
import { solveYellowFace } from "./step5-face";
import { solveTopCorners } from "./step6-corners";
import { solveMinerva } from "./step7-minerva";

const STEPS: ((state: CubeState) => Recorder)[] = [
  solveCross,
  solveFirstLayer,
  solveSecondLayer,
  solveYellowCross,
  solveYellowFace,
  solveTopCorners,
  solveMinerva,
];

/** Number of steps the solver can do so far. */
export const SOLVER_STEPS = STEPS.length;

export function solveLayers(state: CubeState, upToStep = SOLVER_STEPS): Stage[] {
  const stages: Stage[] = [];
  let current = state;
  for (let i = 0; i < Math.min(upToStep, STEPS.length); i++) {
    const rec = STEPS[i](current);
    stages.push({ step: i + 1, segments: rec.segments });
    current = rec.state;
  }
  return stages;
}
