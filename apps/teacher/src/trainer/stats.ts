// Times per case, kept in this browser: the last few times of every case practiced.
const STORAGE_KEY = "cube-teacher.trainStats";
const KEEP = 12;

export type Stats = Record<string, number[]>;

export function loadStats(): Stats {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? (parsed as Stats) : {};
  } catch {
    return {};
  }
}

export function saveStats(stats: Stats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // Times are kept for this visit only.
  }
}

/** Adds a time (milliseconds) to a case and returns the new stats. */
export function record(stats: Stats, caseId: string, ms: number): Stats {
  return { ...stats, [caseId]: [...(stats[caseId] ?? []), ms].slice(-KEEP) };
}

export function summary(times: number[] = []) {
  if (times.length === 0) return null;
  const last5 = times.slice(-5);
  return {
    tries: times.length,
    best: Math.min(...times),
    avg5: last5.reduce((a, b) => a + b, 0) / last5.length,
  };
}

/** 7.43 or 1:02.10 */
export function formatTime(ms: number): string {
  const s = ms / 1000;
  if (s < 60) return s.toFixed(2);
  const m = Math.floor(s / 60);
  return `${m}:${(s - m * 60).toFixed(2).padStart(5, "0")}`;
}
