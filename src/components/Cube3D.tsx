// React wrapper for our three.js cube. three.js loads only when a 3D cube is on screen.
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { parseAlg, type CubeState, type Move } from "../cube/model";
import { SPEEDS, useSettings } from "../settings";
import type { CubeScene, StickerColors, Visible } from "../three/cubeScene";

export interface Cube3DHandle {
  /**
   * Animates moves, starting from what is shown now (or from `from`, snapping to it first if the
   * cube is somewhere else). `onStep` hears which move is playing. Resolves when they have played.
   */
  play: (
    moves: string | Move[],
    options?: { from?: CubeState; onStep?: (index: number) => void },
  ) => Promise<void>;
  /** Shows a state right away. */
  show: (state: CubeState) => void;
}

interface Props {
  /**
   * The state to show. Changing it snaps the cube to the new state, unless that is where the
   * moves being animated already end (so `play` followed by setting the end state is smooth).
   */
  state: CubeState;
  /** Stickers that matter; the rest are drawn gray. */
  visible?: Visible;
  /** Look at the cube from below (to see a cross on the bottom). */
  fromBelow?: boolean;
  label: string;
  ref?: Ref<Cube3DHandle>;
}

function readColors(): StickerColors {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim();
  return {
    W: v("--st-W"),
    Y: v("--st-Y"),
    G: v("--st-G"),
    B: v("--st-B"),
    R: v("--st-R"),
    O: v("--st-O"),
    gray: v("--st-gray"),
    empty: v("--st-empty"),
    body: v("--cube-body"),
  };
}

export function Cube3D({ state, visible, fromBelow, label, ref }: Props) {
  const { speed } = useSettings();
  const container = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState<CubeScene | null>(null);

  useEffect(() => {
    let cancelled = false;
    let created: CubeScene | null = null;
    import("../three/cubeScene").then(({ CubeScene }) => {
      if (cancelled || !container.current) return;
      created = new CubeScene(container.current, readColors(), state, { fromBelow });
      setScene(created);
    });
    return () => {
      cancelled = true;
      created?.dispose();
    };
    // Created once; later state changes are applied by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (scene && scene.finalState !== state) scene.setState(state, visible);
  }, [scene, state]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    scene?.setVisible(visible);
  }, [scene, visible]);

  useEffect(() => {
    scene?.setTiming(SPEEDS[speed].turnMs, SPEEDS[speed].pauseMs);
  }, [scene, speed]);

  useImperativeHandle(
    ref,
    () => ({
      play: (moves, { from, onStep } = {}) =>
        new Promise<void>((resolve) => {
          if (!scene) return resolve();
          if (from !== undefined && scene.finalState !== from) scene.setState(from, visible);
          scene.play(typeof moves === "string" ? parseAlg(moves) : moves, { done: resolve, onStep });
        }),
      show: (s) => scene?.setState(s, visible),
    }),
    [scene, visible],
  );

  return <div className="viewer" ref={container} role="img" aria-label={label} />;
}
