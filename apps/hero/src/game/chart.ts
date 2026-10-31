// A song chart: sections of moves laid out on a beat timeline, one note per move. A song's
// sections are the solver's steps and its parts the solver's segments ("line up the edge",
// "R U R'"); a level's are written out by hand, with tips. Notes reach the strike line at their beat.
import { isRotation, type CubeState, type Move } from "cube-kit/cube/model";
import type { Explain, SegmentKind, Stage } from "cube-kit/methods/types";
import type { MessageKey } from "../i18n/en";
import type { Lane, NoteShape } from "./lanes";
import { CUBE, PYRAMINX, type Puzzle } from "./puzzles";

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

export type Method = "layers" | "fridrich" | "pyraminx";

/** The puzzle a song is played on. States are that puzzle's (a cube's or a pyraminx's). */
export const puzzleOf = (method: Method): Puzzle => (method === "pyraminx" ? PYRAMINX : CUBE);

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
  /** What a level says to do here, when it isn't a solver's explanation. */
  tip?: MessageKey;
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
  title: MessageKey;
  startBeat: number;
  endBeat: number;
  before: CubeState;
  after: CubeState;
  firstNote: number;
  noteCount: number;
}

export interface Chart {
  puzzle: Puzzle;
  start: CubeState;
  end: CubeState;
  notes: Note[];
  parts: Part[];
  sections: Section[];
  /** Beat at which the song is over. */
  length: number;
}

export const noteLength = (m: Move) => (isRotation(m) ? ROTATION : m.amount === 2 ? HALF : QUARTER);

/** Half turns of a layer are held: their key stays down until the note's tail has gone by. */
export const isHold = (n: Note): n is Note & { lane: Lane } => n.move.amount === 2 && n.lane !== "all";
/** How far before the next note's beat a held note's tail stops, so the two never touch. */
export const HOLD_TRIM = 0.35;
export const holdEnd = (n: Note) => n.beat + n.length - HOLD_TRIM;
export const holdCount = (chart: Chart) => chart.notes.filter(isHold).length;

/** A section to lay out: its name and its parts, each a run of moves with what it says. */
export interface SectionPlan {
  title: MessageKey;
  parts: PartPlan[];
}

export interface PartPlan {
  kind: SegmentKind;
  moves: Move[];
  explain?: Explain;
  tip?: MessageKey;
  caseId?: string;
  /** Where the part starts, when the solver says so; otherwise where the one before ended. */
  before?: CubeState;
}

const stageTitle = (method: Method, step: number) =>
  (method === "layers" ? `step.${step}.name` : method === "fridrich" ? `fr.stage.${step}` : `py.stage.${step}`) as MessageKey;

/** Lays out the stages of a solve, starting from `start`. */
export const buildChart = (method: Method, start: CubeState, stages: Stage[]): Chart =>
  layOut(
    puzzleOf(method),
    start,
    stages.map((stage) => ({ title: stageTitle(method, stage.step), parts: stage.segments })),
  );

/** Lays out sections of moves on the beat, starting from `start`. */
export function layOut(puzzle: Puzzle, start: CubeState, plan: SectionPlan[]): Chart {
  const notes: Note[] = [];
  const parts: Part[] = [];
  const sections: Section[] = [];
  let beat = 0;

  for (const { title, parts: segments } of plan) {
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
        const after = puzzle.apply(state, move);
        const length = noteLength(move);
        notes.push({ beat, length, move, lane: puzzle.laneOf(move), shape: puzzle.shapeOf(move), before: state, after, part, section });
        state = after;
        beat += length;
      }
      parts.push({
        kind: seg.kind,
        explain: seg.explain,
        tip: seg.tip,
        caseId: seg.caseId,
        section,
        startBeat: partStart,
        endBeat: beat,
        firstNote: partFirst,
        noteCount: notes.length - partFirst,
      });
    });
    sections.push({
      title,
      startBeat,
      endBeat: beat,
      before,
      after: state,
      firstNote,
      noteCount: notes.length - firstNote,
    });
  }

  const end = sections.length ? sections[sections.length - 1].after : start;
  return { puzzle, start, end, notes, parts, sections, length: beat + TAIL };
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
