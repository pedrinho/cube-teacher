import { describe, expect, it } from "vitest";
import { parseAlg } from "cube-kit/cube/model";
import { HALF, LEAD_IN, PART_GAP, QUARTER, ROTATION, lastNoteAt, layOut, sectionAt, stateAfter } from "./chart";
import { LEVELS, levelChart } from "./levels";
import { ONE, TOWER } from "./puzzles";

describe("chart", () => {
  it.each(LEVELS.map((l) => [l.id, l] as const))("lays out %s note after note, section after section", (_, level) => {
    const chart = levelChart(level);

    let state = chart.start;
    let beat = -Infinity;
    chart.notes.forEach((note, i) => {
      expect(note.before).toBe(state);
      state = note.after;
      expect(note.beat).toBeGreaterThan(beat);
      // A note never starts before the previous turn is over.
      if (i > 0) expect(note.beat).toBeGreaterThanOrEqual(chart.notes[i - 1].beat + chart.notes[i - 1].length);
      beat = note.beat;
      expect(note.lane).toBeTruthy();
      expect(chart.parts[note.part].section).toBe(note.section);
    });
    expect(chart.end).toBe(state);
    expect(chart.sections.map((s) => s.title)).toEqual(level.sections.map((s) => s.title));
    expect(chart.length).toBeGreaterThan(beat);

    // Sections follow each other, and each one's notes fall inside it.
    chart.sections.forEach((s, i) => {
      if (i > 0) expect(s.startBeat).toBe(chart.sections[i - 1].endBeat);
      for (const note of chart.notes.slice(s.firstNote, s.firstNote + s.noteCount)) {
        expect(note.section).toBe(i);
        expect(note.beat).toBeGreaterThanOrEqual(s.startBeat + LEAD_IN);
        expect(note.beat + note.length).toBeLessThanOrEqual(s.endBeat);
      }
    });
    expect(chart.sections.reduce((k, s) => k + s.noteCount, 0)).toBe(chart.notes.length);
  });

  it("gives half turns and whole-cube turns more time", () => {
    const spin = layOut(ONE, ONE.solved, [{ title: "one.s1", parts: [{ kind: "rotate", moves: parseAlg("y") }] }]);
    expect(spin.notes.map((n) => n.length)).toEqual([ROTATION]);
    expect(spin.notes[0].lane).toBe("all");
    const tower = layOut(TOWER, TOWER.solved, [{ title: "tower.s1", parts: [{ kind: "align", moves: parseAlg("U U2 D'") }] }]);
    expect(tower.notes.map((n) => n.length)).toEqual([QUARTER, HALF, QUARTER]);
    expect([QUARTER, HALF]).toEqual([1, 1.5]);
  });

  it("rests a bar before each section and a beat between its parts", () => {
    const chart = layOut(TOWER, TOWER.solved, [
      {
        title: "tower.s5",
        parts: [
          { kind: "intuitive", moves: parseAlg("U D'") },
          { kind: "intuitive", moves: parseAlg("U' D") },
        ],
      },
    ]);
    expect(chart.notes.map((n) => n.beat)).toEqual([LEAD_IN, LEAD_IN + 1, LEAD_IN + 2 + PART_GAP, LEAD_IN + 3 + PART_GAP]);
    expect(chart.parts.map((p) => p.noteCount)).toEqual([2, 2]);
  });

  it("finds notes, states and sections by beat", () => {
    const chart = levelChart(LEVELS[1]);
    const first = chart.notes[0];
    expect(lastNoteAt(chart, first.beat - 0.01)).toBe(-1);
    expect(lastNoteAt(chart, first.beat)).toBe(0);
    expect(lastNoteAt(chart, chart.length)).toBe(chart.notes.length - 1);
    expect(stateAfter(chart, 0)).toBe(chart.start);
    expect(stateAfter(chart, chart.notes.length)).toBe(chart.end);
    expect(sectionAt(chart, 0)).toBe(0);
    expect(sectionAt(chart, chart.length)).toBe(chart.sections.length - 1);
  });
});
