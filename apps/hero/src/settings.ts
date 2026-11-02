// Choices that stick between visits (per browser): the cubes' and the pyraminxes' keys, sound and
// how far the player got in the levels. Storage can be blocked (private windows), so every read
// and write falls back quietly.
import { isKeyMap, type KeyMap } from "./game/lanes";
import { DEFAULT_KEYS, type KeySet } from "./game/puzzles";

/**
 * Each kind of puzzle's keys. Not under the old "cube-hero.keys": those started on their letters,
 * and everyone starts on the number keys by color now.
 */
const KEYS_KEY: Record<KeySet, string> = { cube: "cube-hero.colorKeys.cube", pyraminx: "cube-hero.colorKeys.pyraminx" };
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

export const loadKeys = (set: KeySet): KeyMap => read(KEYS_KEY[set], DEFAULT_KEYS[set], isKeyMap);
export const saveKeys = (set: KeySet, keys: KeyMap) => write(KEYS_KEY[set], keys);

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
