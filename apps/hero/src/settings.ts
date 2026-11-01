// Choices that stick between visits (per browser): the keys, sound and how far the player got in
// the levels. Storage can be blocked (private windows), so every read and write falls back quietly.
import { DEFAULT_KEYS, isKeyMap, type KeyMap } from "./game/lanes";

const KEYS_KEY = "cube-hero.keys";
const MUTED_KEY = "cube-hero.muted";
const LEVELS_KEY = "cube-hero.levels";

function read<T>(key: string, fallback: T, valid: (v: unknown) => v is T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      const value: unknown = JSON.parse(raw);
      if (valid(value)) return value;
    }
  } catch {
    // Use the fallback.
  }
  return fallback;
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Not remembered, but still used for this visit.
  }
}

export const loadKeys = (): KeyMap => read(KEYS_KEY, DEFAULT_KEYS, isKeyMap);
export const saveKeys = (keys: KeyMap) => write(KEYS_KEY, keys);

export const loadMuted = () => read(MUTED_KEY, false, (v): v is boolean => typeof v === "boolean");
export const saveMuted = (muted: boolean) => write(MUTED_KEY, muted);

/** The best a level has been played: its stars (1 to 5) and points. */
export interface LevelResult {
  stars: number;
  points: number;
}
export type Progress = Record<string, LevelResult>;

const isProgress = (v: unknown): v is Progress =>
  typeof v === "object" &&
  v !== null &&
  Object.values(v).every((r: LevelResult) => typeof r?.stars === "number" && typeof r.points === "number");

export const loadProgress = (): Progress => read(LEVELS_KEY, {}, isProgress);

/** Saves a level's result if it beats the best so far (more stars, or as many and more points); tells whether it did. */
export function saveLevel(id: string, result: LevelResult): boolean {
  const progress = loadProgress();
  const best = progress[id];
  if (best && (best.stars > result.stars || (best.stars === result.stars && best.points >= result.points))) return false;
  write(LEVELS_KEY, { ...progress, [id]: result });
  return true;
}
