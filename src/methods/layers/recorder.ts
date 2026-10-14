// Builds a stage's segments while keeping track of the cube state.
import { applyAlg, parseAlg, type CubeState, type Move } from "../../cube/model";
import type { Explain, Segment, SegmentKind } from "../types";

export class Recorder {
  readonly segments: Segment[] = [];
  constructor(public state: CubeState) {}

  add(kind: SegmentKind, moves: Move[] | string, explain: Explain, caseId?: string) {
    const list = typeof moves === "string" ? parseAlg(moves) : moves;
    const after = applyAlg(this.state, list);
    this.segments.push({ kind, moves: list, explain, caseId, before: this.state, after });
    this.state = after;
  }

  /** Adds a whole-cube rotation, if one is needed. */
  rotate(moves: Move[], explain: Explain) {
    if (moves.length > 0) this.add("rotate", moves, explain);
  }
}
