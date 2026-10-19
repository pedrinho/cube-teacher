// A song chart: the solver's stages laid out on a beat timeline, one note per move.
// Sections are the solver's steps, parts are its segments ("line up the edge", "R U R'"), and
// notes reach the strike line at their beat.
import { applyMove, isRotation, type CubeState, type Move } from "cube-kit/cube/model";
import type { KitMessageKey } from "cube-kit/i18n/en";
import type { Explain, SegmentKind, Stage } from "cube-kit/methods/types";
import { laneOf, shapeOf, type Lane, type NoteShape } from "./lanes";

/** Beats for a quarter turn, a half turn and a whole-cube turn. */
export const QUARTER = 1;
export const HALF = 1.5;
export const ROTATION = 2;
/** Rest between two parts, so each algorithm reads as its own phrase. */
export const PART_GAP = 1;
/** A bar before each section's first note, while its banner shows. */
export const LEAD_IN = 4;
/** How long a message with no moves stays up ("the cross is already done"). */
export const INFO = 2;
/** Rest after the last note. */
export const TAIL = 2;

export type Method = "layers" | "fridrich";

export interface Note {
  /** When the note reaches the strike line. */
  beat: number;
  /** How long the turn lasts, in beats. */
  length: number;
  move: Move;
  lane: Lane | "all";
  shape: NoteShape;
  before: CubeState;
  after: CubeState;
  part: number;
  section: number;
}

export interface Part {
  kind: SegmentKind;
  explain?: Explain;
  caseId?: string;
  section: number;
  startBeat: number;
  endBeat: number;
  /** Index of the part's first note, and how many it has. */
  firstNote: number;
  noteCount: number;
}

export interface Section {
  /** The step's name. */
  title: KitMessageKey;
  startBeat: number;
  endBeat: number;
  before: CubeState;
  after: CubeState;
  firstNote: number;
  noteCount: number;
}

export interface Chart {
  method: Method;
  start: CubeState;
  end: CubeState;
  notes: Note[];
  parts: Part[];
  sections: Section[];
  /** Beat at which the song is over. */
  length: number;
}

export const noteLength = (m: Move) => (isRotation(m) ? ROTATION : m.amount === 2 ? HALF : QUARTER);

const stageTitle = (method: Method, step: number) =>
  (method === "layers" ? `step.${step}.name` : `fr.stage.${step}`) as KitMessageKey;

/** Lays out the stages of a solve, starting from `start`. */
export function buildChart(method: Method, start: CubeState, stages: Stage[]): Chart {
  const notes: Note[] = [];
  const parts: Part[] = [];
  const sections: Section[] = [];
  let beat = 0;

  for (const stage of stages) {
    const { segments } = stage;
    const section = sections.length;
    const before = segments[0]?.before ?? (sections.length ? sections[sections.length - 1].after : start);
    const startBeat = beat;
    const firstNote = notes.length;
    beat += LEAD_IN;
    let state = before;
    segments.forEach((seg, k) => {
      if (k > 0) beat += PART_GAP;
      const part = parts.length;
      const partStart = beat;
      const partFirst = notes.length;
      if (seg.moves.length === 0) beat += INFO;
      for (const move of seg.moves) {
        const after = applyMove(state, move);
        const length = noteLength(move);
        notes.push({ beat, length, move, lane: laneOf(move), shape: shapeOf(move), before: state, after, part, section });
        state = after;
        beat += length;
      }
      parts.push({
        kind: seg.kind,
        explain: seg.explain,
        caseId: seg.caseId,
        section,
        startBeat: partStart,
        endBeat: beat,
        firstNote: partFirst,
        noteCount: notes.length - partFirst,
      });
    });
    sections.push({
      title: stageTitle(method, stage.step),
      startBeat,
      endBeat: beat,
      before,
      after: state,
      firstNote,
      noteCount: notes.length - firstNote,
    });
  }

  const end = sections.length ? sections[sections.length - 1].after : start;
  return { method, start, end, notes, parts, sections, length: beat + TAIL };
}

/** Index of the last note that has reached the strike line by `beat` (-1 before the first). */
export function lastNoteAt(chart: Chart, beat: number): number {
  let lo = 0;
  let hi = chart.notes.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (chart.notes[mid].beat <= beat) {
      found = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return found;
}

/** The cube after the first `played` notes. */
export const stateAfter = (chart: Chart, played: number) => (played > 0 ? chart.notes[played - 1].after : chart.start);

/** The section being played at `beat` (the last one that has started). */
export function sectionAt(chart: Chart, beat: number): number {
  let i = 0;
  while (i + 1 < chart.sections.length && chart.sections[i + 1].startBeat <= beat) i++;
  return i;
}
