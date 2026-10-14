// A 3D cube with a pad of move buttons: tap a move to see it, reset to start over.
import { useImperativeHandle, useRef, useState, type ReactNode, type Ref } from "react";
import { useI18n } from "../i18n";
import { parseMove, type CubeState } from "../cube/model";
import { Cube3D, type Cube3DHandle } from "./Cube3D";
import { MoveLabel, Moves } from "./Moves";
import { SpeedControl } from "./SpeedControl";

export interface MovePadHandle {
  /** Plays moves on the cube without adding them to the list of tapped moves. */
  play: (moves: string) => void;
}

interface Props {
  moves: string[];
  start: CubeState;
  label: string;
  /** Extra content under the pad (tips, buttons). */
  children?: ReactNode;
  ref?: Ref<MovePadHandle>;
}

export function MovePad({ moves, start, label, children, ref }: Props) {
  const { t } = useI18n();
  const viewer = useRef<Cube3DHandle>(null);
  const [history, setHistory] = useState<string[]>([]);

  useImperativeHandle(ref, () => ({ play: (m) => viewer.current?.play(m) }), []);

  const turn = (move: string) => {
    viewer.current?.play(move);
    setHistory((h) => [...h, move]);
  };
  const reset = () => {
    viewer.current?.show(start);
    setHistory([]);
  };

  return (
    <div className="playground">
      <Cube3D ref={viewer} state={start} label={label} />
      <div className="playground-side">
        <p className="muted">{t("notation.try")}</p>
        <div className="move-pad">
          {moves.map((m) => (
            <button key={m} type="button" className="move" onClick={() => turn(m)} aria-label={m}>
              <MoveLabel move={parseMove(m)} />
            </button>
          ))}
        </div>
        {history.length > 0 && <Moves alg={history.join(" ")} small />}
        <div className="btn-row">
          <button type="button" className="btn" onClick={reset}>
            {t("notation.reset")}
          </button>
        </div>
        {children}
        <SpeedControl />
      </div>
    </div>
  );
}
