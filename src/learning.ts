// The cases the kid marked "I'm learning this", kept in this browser. The trainer drills them.
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "cube-teacher.learning";
const EVENT = "cube-teacher:learning";

function read(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function useLearning() {
  const [ids, setIds] = useState<string[]>(read);

  useEffect(() => {
    const sync = () => setIds(read());
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  const toggle = useCallback((id: string) => {
    const current = read();
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Not remembered, but still shown for this visit.
    }
    setIds(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { ids, isOn: (id: string) => ids.includes(id), toggle };
}
