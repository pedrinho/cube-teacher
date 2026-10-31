// Scoring. Each note is judged by how close to its beat the right key was pressed: perfect,
// good, or missed. Hits in a row raise the multiplier; a miss or a wrong key starts over. Holding a
// half turn's key until its tail has gone by earns a bonus on top.

export type Judgment = "perfect" | "good" | "miss";

/** Timing windows, in milliseconds either side of the beat. */
export const PERFECT_MS = 100;
export const GOOD_MS = 200;

/** The judgment for a press this far from the beat, or null when it's too far to count. */
export function judge(offsetMs: number): Exclude<Judgment, "miss"> | null {
  const off = Math.abs(offsetMs);
  return off <= PERFECT_MS ? "perfect" : off <= GOOD_MS ? "good" : null;
}

export interface Score {
  points: number;
  /** Hits in a row. */
  combo: number;
  bestCombo: number;
  perfect: number;
  good: number;
  miss: number;
}

export const newScore = (): Score => ({ points: 0, combo: 0, bestCombo: 0, perfect: 0, good: 0, miss: 0 });

/** Hits in a row needed for each step of the multiplier (×1 up to ×4). */
export const STREAK = 10;
export const MAX_MULTIPLIER = 4;
export const POINTS: Record<Judgment, number> = { perfect: 100, good: 50, miss: 0 };

export const multiplier = (combo: number) => Math.min(MAX_MULTIPLIER, 1 + Math.floor(combo / STREAK));

export function record(score: Score, j: Judgment): Score {
  if (j === "miss") return { ...score, combo: 0, miss: score.miss + 1 };
  const combo = score.combo + 1;
  return {
    ...score,
    points: score.points + POINTS[j] * multiplier(score.combo),
    combo,
    bestCombo: Math.max(score.bestCombo, combo),
    [j]: score[j] + 1,
  };
}

/** A wrong key breaks the streak (the note can still be played). */
export const wrongKey = (score: Score): Score => ({ ...score, combo: 0 });

/** Points for holding a half turn's key to the end of its tail. Letting go early only loses them. */
export const HOLD_BONUS = 50;
export const held = (score: Score): Score => ({ ...score, points: score.points + HOLD_BONUS });

/** The best possible score: every note perfect, in one streak, and every hold held. */
export function maxPoints(notes: number, holds = 0): number {
  let points = holds * HOLD_BONUS;
  for (let combo = 0; combo < notes; combo++) points += POINTS.perfect * multiplier(combo);
  return points;
}

/** One to five stars, by how close the score came to the best possible. */
export function stars(points: number, max: number): number {
  if (max <= 0) return 5;
  const ratio = points / max;
  return ratio >= 0.9 ? 5 : ratio >= 0.75 ? 4 : ratio >= 0.55 ? 3 : ratio >= 0.35 ? 2 : 1;
}

/** Share of notes hit (good counts half). */
export const accuracy = (s: Score) => {
  const total = s.perfect + s.good + s.miss;
  return total === 0 ? 1 : (s.perfect + s.good / 2) / total;
};
