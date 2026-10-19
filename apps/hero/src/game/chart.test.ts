import { describe, expect, it } from "vitest";
import { SOLVED, applyAlg, isSolved, randomScramble } from "cube-kit/cube/model";
import { solveLayers } from "cube-kit/methods/layers/solver";
import { solveFridrich } from "cube-kit/methods/fridrich/solver";
import { HALF, LEAD_IN, QUARTER, ROTATION, buildChart, lastNoteAt, sectionAt, stateAfter, type Method } from "./chart";

let seed = 11;
const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

const solve = (method: Method, state: string) =>
  method === "layers" ? solveLayers(state) : solveFridrich(state, "twoLook");

describe("chart", () => {
  it.each(["layers", "fridrich"] as const)("lays out 300 %s solves that end solved", (method) => {
    for (let n = 0; n < 300; n++) {
      const scramble = randomScramble(25, random);
      const start = applyAlg(SOLVED, scramble);
      const chart = buildChart(method, start, solve(method, start));

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
      expect(isSolved(state)).toBe(true);
      expect(chart.end).toBe(state);
      expect(chart.sections.map((s) => s.title)).toEqual(
        method === "layers" ? [1, 2, 3, 4, 5, 6, 7].map((k) => `step.${k}.name`) : [1, 2, 3, 4].map((k) => `fr.stage.${k}`),
      );
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
    }
  }, 120_000);

  it("gives half turns and whole-cube turns more time", () => {
    const start = applyAlg(SOLVED, "R2 U");
    const chart = buildChart("layers", start, [
      {
        step: 1,
        segments: [
          { kind: "rotate", moves: [{ base: "y", amount: 1 }], explain: { key: "seg.1.rotate" }, before: start, after: applyAlg(start, "y") },
        ],
      },
    ]);
    expect(chart.notes.map((n) => n.length)).toEqual([ROTATION]);
    expect(chart.notes[0].lane).toBe("all");
    expect([QUARTER, HALF]).toEqual([1, 1.5]);
  });

  it("finds notes, states and sections by beat", () => {
    const start = applyAlg(SOLVED, "F R U");
    const chart = buildChart("layers", start, solveLayers(start));
    const first = chart.notes[0];
    expect(lastNoteAt(chart, first.beat - 0.01)).toBe(-1);
    expect(lastNoteAt(chart, first.beat)).toBe(0);
    expect(lastNoteAt(chart, chart.length)).toBe(chart.notes.length - 1);
    expect(stateAfter(chart, 0)).toBe(start);
    expect(stateAfter(chart, chart.notes.length)).toBe(chart.end);
    expect(sectionAt(chart, 0)).toBe(0);
    expect(sectionAt(chart, chart.length)).toBe(chart.sections.length - 1);
  });
});
