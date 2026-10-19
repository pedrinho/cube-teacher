import { describe, expect, it } from "vitest";
import { BeatClock } from "./clock";

function fakeTime() {
  let t = 100;
  return { now: () => t, advance: (s: number) => (t += s) };
}

describe("beat clock", () => {
  it("counts beats only while playing", () => {
    const time = fakeTime();
    const clock = new BeatClock(time.now, 60);
    time.advance(5);
    expect(clock.beat).toBe(0);
    clock.play();
    time.advance(2);
    expect(clock.beat).toBe(2);
    clock.pause();
    time.advance(10);
    expect(clock.beat).toBe(2);
    clock.play();
    time.advance(1);
    expect(clock.beat).toBe(3);
  });

  it("keeps its place when the tempo changes", () => {
    const time = fakeTime();
    const clock = new BeatClock(time.now, 30);
    clock.play();
    time.advance(4);
    expect(clock.beat).toBe(2);
    clock.setBpm(90);
    expect(clock.beat).toBe(2);
    time.advance(2);
    expect(clock.beat).toBe(5);
  });

  it("seeks while playing or paused", () => {
    const time = fakeTime();
    const clock = new BeatClock(time.now, 60);
    clock.seek(10);
    expect(clock.beat).toBe(10);
    clock.play();
    time.advance(1);
    clock.seek(4);
    expect(clock.beat).toBe(4);
    time.advance(1);
    expect(clock.beat).toBe(5);
  });

  it("tells when a beat will sound", () => {
    const time = fakeTime();
    const clock = new BeatClock(time.now, 120);
    clock.play();
    expect(clock.timeOf(4)).toBe(102);
    time.advance(0.5);
    expect(clock.timeOf(clock.beat)).toBeCloseTo(time.now());
  });
});
