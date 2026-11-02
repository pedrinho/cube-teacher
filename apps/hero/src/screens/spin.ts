// The whole-cube turn keys (X, Y and Z) spin the cube on screen, to look at its other sides; with
// Shift, the other way. Only the picture turns: the song and its score don't change.
import { useEffect, useRef, type RefObject } from "react";
import type { Cube3DHandle } from "cube-kit/react/Cube3D";
import { gameKey, type KeyMap } from "../game/lanes";
import { spinKeys, type Puzzle } from "../game/puzzles";

export function useSpinKeys(cube: RefObject<Cube3DHandle | null>, puzzle: Puzzle, keys: KeyMap) {
  const spins = useRef(spinKeys(puzzle, keys));
  spins.current = spinKeys(puzzle, keys);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const turn = spins.current.get(gameKey(e.code));
      if (!turn || e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      if (!e.repeat) cube.current?.spin(turn, e.shiftKey ? 3 : 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cube]);
}
