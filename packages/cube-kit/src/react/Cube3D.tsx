// React wrapper for our three.js cube, or pyraminx. three.js loads only when one is on screen.
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { parseAlg, type CubeState, type Move } from "../cube/model";
import type { StickerColors, Visible } from "../three/cubeScene";

/** What both 3D puzzles can do. A state is the puzzle's sticker string. */
interface PuzzleScene {
  readonly finalState: string;
  setState(state: string, visible?: Visible): void;
  setVisible(visible?: Visible): void;
  setTiming(turnMs: number, pauseMs: number): void;
  play(moves: Move[], options?: { done?: () => void; onStep?: (index: number) => void }): void;
  dispose(): void;
}

type SceneOptions = { fromBelow?: boolean; stickerless?: boolean };

/** Loads the puzzle's scene code, then makes one. */
const loadScene = (puzzle: "cube" | "pyraminx") =>
  puzzle === "pyraminx"
    ? import("../three/pyraminxScene").then(
        ({ PyraminxScene }) =>
          (el: HTMLElement, colors: StickerColors, state: string, options: SceneOptions): PuzzleScene =>
            new PyraminxScene(el, colors, state, options),
      )
    : import("../three/cubeScene").then(
        ({ CubeScene }) =>
          (el: HTMLElement, colors: StickerColors, state: string, options: SceneOptions): PuzzleScene =>
            new CubeScene(el, colors, state, options),
      );

/** How long one quarter turn takes, and the pause between moves played together. */
export interface Timing {
  turnMs: number;
  pauseMs: number;
}

const NORMAL: Timing = { turnMs: 450, pauseMs: 250 };

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

export interface Cube3DProps {
  /**
   * The state to show. Changing it snaps the cube to the new state, unless that is where the
   * moves being animated already end (so `play` followed by setting the end state is smooth).
   */
  state: CubeState;
  /** Stickers that matter; the rest are drawn gray. */
  visible?: Visible;
  /** Look at the cube from below (to see a cross on the bottom). */
  fromBelow?: boolean;
  /** Colored plastic pieces with no black body, like a stickerless speed cube. */
  stickerless?: boolean;
  /** A pyraminx instead of a cube; its state is a pyraminx state, its moves pyraminx moves. */
  puzzle?: "cube" | "pyraminx";
  label: string;
  timing?: Timing;
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

export function Cube3D({ state, visible, fromBelow, stickerless, puzzle = "cube", label, timing = NORMAL, ref }: Cube3DProps) {
  const container = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState<PuzzleScene | null>(null);

  useEffect(() => {
    let cancelled = false;
    let created: PuzzleScene | null = null;
    loadScene(puzzle).then((make) => {
      if (cancelled || !container.current) return;
      created = make(container.current, readColors(), state, { fromBelow, stickerless });
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
    scene?.setTiming(timing.turnMs, timing.pauseMs);
  }, [scene, timing.turnMs, timing.pauseMs]);

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
