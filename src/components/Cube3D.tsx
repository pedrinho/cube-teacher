// React wrapper for our three.js cube. three.js loads only when a 3D cube is on screen.
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { parseAlg, type CubeState, type Move } from "../cube/model";
import type { CubeScene, StickerColors } from "../three/cubeScene";

export interface Cube3DHandle {
  /** Animates moves, starting from what is shown now. Resolves when they have played. */
  play: (moves: string | Move[]) => Promise<void>;
  /** Shows a state right away. */
  show: (state: CubeState) => void;
}

interface Props {
  /** The state to show. Changing it snaps the cube to the new state. */
  state: CubeState;
  /** Stickers that matter; the rest are drawn gray. */
  visible?: (stickerIndex: number) => boolean;
  tempo?: number;
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

export function Cube3D({ state, visible, tempo = 1, label, ref }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState<CubeScene | null>(null);

  useEffect(() => {
    let cancelled = false;
    let created: CubeScene | null = null;
    import("../three/cubeScene").then(({ CubeScene }) => {
      if (cancelled || !container.current) return;
      created = new CubeScene(container.current, readColors(), state);
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
    scene?.setState(state, visible);
  }, [scene, state, visible]);

  useEffect(() => {
    scene?.setTempo(tempo);
  }, [scene, tempo]);

  useImperativeHandle(
    ref,
    () => ({
      play: (moves) =>
        new Promise<void>((resolve) => {
          if (!scene) return resolve();
          scene.play(typeof moves === "string" ? parseAlg(moves) : moves, resolve);
        }),
      show: (s) => scene?.setState(s, visible),
    }),
    [scene, visible],
  );

  return <div className="viewer" ref={container} role="img" aria-label={label} />;
}
