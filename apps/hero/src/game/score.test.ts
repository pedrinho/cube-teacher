import { describe, expect, it } from "vitest";
import { accuracy, judge, maxPoints, multiplier, newScore, record, stars, wrongKey, type Judgment } from "./score";

const play = (js: Judgment[], score = newScore()) => js.reduce(record, score);
const many = (n: number, j: Judgment) => Array<Judgment>(n).fill(j);

describe("score", () => {
  it("judges by timing", () => {
    expect([0, 80, -100, 150, -200, 201, -500].map(judge)).toEqual(["perfect", "perfect", "perfect", "good", "good", null, null]);
  });

  it("raises the multiplier every 10 hits in a row, up to ×4", () => {
    expect([0, 9, 10, 19, 20, 30, 99].map(multiplier)).toEqual([1, 1, 2, 2, 3, 4, 4]);
  });

  it("counts a streak, breaks it on a miss or a wrong key, and keeps the best one", () => {
    let s = play([...many(10, "perfect"), "good", "good"]);
    expect(s.points).toBe(10 * 100 + 2 * 50 * 2);
    expect(s.combo).toBe(12);
    s = record(s, "miss");
    expect([s.combo, s.miss, s.bestCombo]).toEqual([0, 1, 12]);
    s = play(many(3, "perfect"), s);
    expect(wrongKey(s).combo).toBe(0);
    expect(wrongKey(s).bestCombo).toBe(12);
    expect([s.perfect, s.good]).toEqual([13, 2]);
  });

  it("matches the best possible score with all perfects", () => {
    expect(play(many(57, "perfect")).points).toBe(maxPoints(57));
  });

  it("gives five stars for a perfect song and fewer otherwise", () => {
    const max = maxPoints(100);
    expect(stars(play(many(100, "perfect")).points, max)).toBe(5);
    expect(stars(play(Array.from({ length: 100 }, (_, i) => (i % 5 === 4 ? "miss" : "perfect"))).points, max)).toBeLessThan(5);
    expect(stars(0, max)).toBe(1);
    expect(accuracy(play(["perfect", "good", "miss", "perfect"]))).toBe(2.5 / 4);
  });
});
