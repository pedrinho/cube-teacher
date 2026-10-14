// Animated 3D cube from cubing.js. The app drives it: it shows `setupAlg` and animates `alg`.
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import type { TwistyPlayer } from "cubing/twisty";
import { useI18n } from "../i18n";

export interface CubeViewerHandle {
  /** Animates one more move on top of what is shown. */
  addMove: (move: string) => void;
  /** Shows `setup`, then animates `alg` from the start. */
  play: (setup: string, alg: string) => void;
  /** Shows `setup` with nothing to animate. */
  reset: (setup: string) => void;
}

interface Props {
  setupAlg?: string;
  alg?: string;
  /** Speed multiplier for animations. */
  tempo?: number;
  label: string;
  ref?: Ref<CubeViewerHandle>;
}

export function CubeViewer({ setupAlg = "", alg = "", tempo = 1, label, ref }: Props) {
  const { t } = useI18n();
  const container = useRef<HTMLDivElement>(null);
  const [player, setPlayer] = useState<TwistyPlayer | null>(null);

  useEffect(() => {
    let cancelled = false;
    let created: TwistyPlayer | null = null;
    import("cubing/twisty").then(({ TwistyPlayer }) => {
      if (cancelled || !container.current) return;
      created = new TwistyPlayer({
        puzzle: "3x3x3",
        visualization: "3D",
        controlPanel: "none",
        background: "none",
        hintFacelets: "none",
        viewerLink: "none",
        experimentalSetupAlg: setupAlg,
        alg,
        tempoScale: tempo,
      });
      container.current.append(created);
      setPlayer(created);
    });
    return () => {
      cancelled = true;
      created?.remove();
    };
    // The player is created once; prop changes are applied below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!player) return;
    player.experimentalSetupAlg = setupAlg;
    player.alg = alg;
    player.jumpToStart();
  }, [player, setupAlg, alg]);

  useEffect(() => {
    if (player) player.tempoScale = tempo;
  }, [player, tempo]);

  useImperativeHandle(
    ref,
    () => ({
      addMove: (move) => player?.experimentalAddMove(move, { cancel: false }),
      play: (setup, moves) => {
        if (!player) return;
        player.experimentalSetupAlg = setup;
        player.alg = moves;
        player.jumpToStart();
        player.play();
      },
      reset: (setup) => {
        if (!player) return;
        player.experimentalSetupAlg = setup;
        player.alg = "";
        player.jumpToStart();
      },
    }),
    [player],
  );

  return (
    <div className="viewer" ref={container} role="img" aria-label={label}>
      {!player && <p className="muted viewer-loading">{t("solve.loading")}</p>}
    </div>
  );
}
