// Viewer preferences that should stick between visits (per browser).
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type Speed = "verySlow" | "slow" | "normal" | "fast";

/** How long one quarter turn takes, and the pause between moves of a demo. */
export const SPEEDS: Record<Speed, { turnMs: number; pauseMs: number }> = {
  verySlow: { turnMs: 1100, pauseMs: 700 },
  slow: { turnMs: 700, pauseMs: 400 },
  normal: { turnMs: 450, pauseMs: 250 },
  fast: { turnMs: 250, pauseMs: 80 },
};

const STORAGE_KEY = "cube-teacher.speed";

interface Settings {
  speed: Speed;
  setSpeed: (speed: Speed) => void;
}

const SettingsContext = createContext<Settings | null>(null);

function initialSpeed(): Speed {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved in SPEEDS) return saved as Speed;
  } catch {
    // Storage can be blocked; use the default.
  }
  return "normal";
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [speed, setSpeedState] = useState<Speed>(initialSpeed);
  const setSpeed = useCallback((next: Speed) => {
    setSpeedState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Still changed for this visit.
    }
  }, []);
  const value = useMemo(() => ({ speed, setSpeed }), [speed, setSpeed]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): Settings {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}
