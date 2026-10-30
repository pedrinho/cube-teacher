// Choices that stick between visits (per browser): song, speed, cube, keys, sound and best scores.
// Storage can be blocked (private windows), so every read and write falls back quietly.
import type { Method } from "./game/chart";
import { DEFAULT_KEYS, isKeyMap, type KeyMap } from "./game/lanes";

export type Speed = "easy" | "medium" | "hard" | "expert";
export const SPEEDS: Speed[] = ["easy", "medium", "hard", "expert"];
/** Quarter turns per minute for each speed. */
export const BPM: Record<Speed, number> = { easy: 40, medium: 60, hard: 80, expert: 110 };

export type CubeSource = "random" | "paint";

export interface Setup {
  method: Method;
  speed: Speed;
  cube: CubeSource;
}

const SETUP_KEY = "cube-hero.setup";
const KEYS_KEY = "cube-hero.keys";
const MUTED_KEY = "cube-hero.muted";
const BESTS_KEY = "cube-hero.bests";
export const PAINT_KEY = "cube-hero.paint";

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

const isSetup = (v: unknown): v is Setup => {
  const s = v as Setup;
  return (
    typeof v === "object" &&
    v !== null &&
    (s.method === "layers" || s.method === "fridrich" || s.method === "pyraminx") &&
    SPEEDS.includes(s.speed) &&
    (s.cube === "random" || s.cube === "paint")
  );
};

export const loadSetup = (): Setup => read(SETUP_KEY, { method: "layers", speed: "easy", cube: "random" }, isSetup);
export const saveSetup = (setup: Setup) => write(SETUP_KEY, setup);

export const loadKeys = (): KeyMap => read(KEYS_KEY, DEFAULT_KEYS, isKeyMap);
export const saveKeys = (keys: KeyMap) => write(KEYS_KEY, keys);

export const loadMuted = () => read(MUTED_KEY, false, (v): v is boolean => typeof v === "boolean");
export const saveMuted = (muted: boolean) => write(MUTED_KEY, muted);

type Bests = Record<string, number>;
const isBests = (v: unknown): v is Bests =>
  typeof v === "object" && v !== null && Object.values(v).every((n) => typeof n === "number");
const bestKey = (method: Method, speed: Speed) => `${method}.${speed}`;

export const loadBest = (method: Method, speed: Speed): number | undefined => read(BESTS_KEY, {}, isBests)[bestKey(method, speed)];

/** Saves a score if it beats the best so far; tells whether it did. */
export function saveBest(method: Method, speed: Speed, score: number): boolean {
  const bests = read(BESTS_KEY, {}, isBests);
  const key = bestKey(method, speed);
  if (bests[key] !== undefined && bests[key] >= score) return false;
  write(BESTS_KEY, { ...bests, [key]: score });
  return true;
}
