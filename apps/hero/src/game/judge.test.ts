import { describe, expect, it } from "vitest";
import { SOLVED, applyAlg, invertAlg, parseAlg } from "cube-kit/cube/model";
import { buildChart } from "./chart";
import { Judge } from "./judge";

// 60 turns per minute: one beat is one second.
const MS = 1000;

/** A one-part song that undoes a scramble. */
function chartOf(scramble: string) {
  const start = applyAlg(SOLVED, scramble);
  const moves = invertAlg(parseAlg(scramble));
  return buildChart("layers", start, [
    { step: 1, segments: [{ kind: "intuitive", moves, explain: { key: "seg.1.done" }, before: start, after: SOLVED }] },
  ]);
}

describe("judge", () => {
  // Undoing "R U" is U' then R'.
  const chart = chartOf("R U");
  const [first, second] = chart.notes;

  it("lays out the undo moves", () => {
    expect(chart.notes.map((n) => `${n.move.base}${n.move.amount}`)).toEqual(["U3", "R3"]);
  });

  it("scores perfect and good hits with the right keys", () => {
    const judge = new Judge(chart.notes);
    const [perfect] = judge.press("KeyU", first.beat + 0.05, MS);
    expect(perfect).toMatchObject({ type: "hit", note: 0, judgment: "perfect" });
    expect(perfect.type === "hit" && perfect.offsetMs).toBeCloseTo(50);
    const [hit] = judge.press("KeyR", second.beat - 0.15, MS);
    expect(hit).toMatchObject({ type: "hit", note: 1, judgment: "good" });
    expect(judge.done).toBe(true);
    expect(judge.results).toEqual(["perfect", "good"]);
  });

  it("calls another letter a wrong key, and the note can still be hit", () => {
    const judge = new Judge(chart.notes);
    expect(judge.press("KeyD", first.beat, MS)).toEqual([{ type: "wrong", note: 0, code: "KeyD" }]);
    expect(judge.press("KeyR", first.beat, MS)[0].type).toBe("wrong");
    expect(judge.press("KeyU", first.beat + 0.1, MS)[0]).toMatchObject({ type: "hit", judgment: "perfect" });
  });

  it("ignores presses far from any note", () => {
    const judge = new Judge(chart.notes);
    expect(judge.press("KeyU", first.beat - 0.5, MS)).toEqual([{ type: "stray", code: "KeyU" }]);
    expect(judge.next).toBe(0);
  });

  it("misses notes whose window has passed, in order", () => {
    const judge = new Judge(chart.notes);
    expect(judge.update(first.beat + 0.19, MS)).toEqual([]);
    expect(judge.update(second.beat + 0.3, MS)).toEqual([
      { type: "miss", note: 0 },
      { type: "miss", note: 1 },
    ]);
    expect(judge.done).toBe(true);
  });

  it("settles a missed note before judging a late press for the next one", () => {
    const judge = new Judge(chart.notes);
    const events = judge.press("KeyR", second.beat, MS);
    expect(events.map((e) => e.type)).toEqual(["miss", "hit"]);
  });

  it("takes the letter of a half turn and of a whole-cube turn", () => {
    const start = applyAlg(SOLVED, "R2");
    const c = buildChart("layers", start, [
      {
        step: 1,
        segments: [
          { kind: "rotate", moves: [{ base: "y", amount: 1 }], explain: { key: "seg.1.rotate" }, before: start, after: applyAlg(start, "y") },
          { kind: "alg", moves: [{ base: "F", amount: 2 }], explain: { key: "seg.1.done" }, before: applyAlg(start, "y"), after: applyAlg(start, "y F2") },
        ],
      },
    ]);
    const judge = new Judge(c.notes);
    expect(judge.press("KeyY", c.notes[0].beat, MS)[0].type).toBe("hit");
    expect(judge.press("KeyF", c.notes[1].beat, MS)[0].type).toBe("hit");
  });
});
