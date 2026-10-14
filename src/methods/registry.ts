// Everything the shared screens (guide, solve, step rail) need to know about a method.
import type { CubeState } from "../cube/model";
import type { MessageKey } from "../i18n/en";
import { LESSONS } from "../content/layers/lessons";
import { layersMethod } from "./layers";
import { solveLayers } from "./layers/solver";
import { fridrichMethod } from "./fridrich";
import { solveFridrich } from "./fridrich/solver";
import type { MethodDef, Stage } from "./types";

export interface MethodInfo {
  def: MethodDef;
  /** Solver stages, as shown in the guide's step rail. */
  stages: { id: number; name: MessageKey }[];
  /** Message shown when a stage is done. */
  stageDone: (id: number) => MessageKey;
  /** Lesson page showing a case used by the solver, if there is one. */
  lessonLink: (caseId: string) => string | undefined;
  solve: (state: CubeState) => Stage[];
}

export const LAYERS: MethodInfo = {
  def: layersMethod,
  stages: [1, 2, 3, 4, 5, 6, 7].map((id) => ({ id, name: `step.${id}.name` as MessageKey })),
  stageDone: (id) => `guide.stepDone.${id}` as MessageKey,
  lessonLink: (caseId) => {
    // Cases belong to the lesson of their step ("2.2" is step 2's case 2, even when used in step 3).
    const step = Number(caseId.split(".")[0]);
    return LESSONS[step]?.cases.some((c) => c.id === caseId) ? `/learn/${step}/${caseId}` : undefined;
  },
  solve: (state) => solveLayers(state),
};

export const FRIDRICH: MethodInfo = {
  def: fridrichMethod,
  stages: [1, 2, 3, 4].map((id) => ({ id, name: `fr.stage.${id}` as MessageKey })),
  stageDone: (id) => `fr.stageDone.${id}` as MessageKey,
  lessonLink: () => undefined,
  solve: (state) => solveFridrich(state),
};
