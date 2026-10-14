// Lesson 0: the pieces and how moves are written (Cinoto's "noções gerais").
import { useRef, useState } from "react";
import { useI18n } from "../i18n";
import { CubeSvg } from "../components/CubeSvg";
import { Cube3D, type Cube3DHandle } from "../components/Cube3D";
import { MoveLabel, Moves } from "../components/Moves";
import { SOLVED, applyAlg, parseMove } from "../cube/model";
import { PIECE_OF } from "../cube/pieces";
import { stepPicture } from "../methods/layers/pictures";

// The moves used in the method, in the order of Cinoto's notation table, plus D and B for scrambles.
const MOVES = ["F", "F'", "F2", "R", "R'", "R2", "B2", "U", "U'", "U2", "L", "L'", "M", "M'", "D", "D'", "B", "B'"];
const START = applyAlg(SOLVED, "x2"); // yellow on top, blue in front, as in the videos
const TRICK = "R U R' U' ".repeat(6).trim();

const solved = stepPicture(0).state;
const kinds = [
  { name: "notation.centersName", text: "notation.centers", size: 1 },
  { name: "notation.edgesName", text: "notation.edges", size: 2 },
  { name: "notation.cornersName", text: "notation.corners", size: 3 },
] as const;

export function Notation() {
  const { t } = useI18n();
  const viewer = useRef<Cube3DHandle>(null);
  const [history, setHistory] = useState<string[]>([]);

  const turn = (move: string) => {
    viewer.current?.play(move);
    setHistory((h) => [...h, move]);
  };
  const reset = () => {
    viewer.current?.show(START);
    setHistory([]);
  };
  const trick = () => {
    viewer.current?.play(TRICK);
  };

  return (
    <>
      <section className="lesson-section">
        <h2>{t("notation.pieces")}</h2>
        <ul className="piece-kinds">
          {kinds.map((k) => (
            <li key={k.name}>
              <CubeSvg state={solved} visible={(i) => PIECE_OF[i].length === k.size} className="piece-kind-cube" />
              <h3>{t(k.name)}</h3>
              <p>{t(k.text)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="lesson-section faces">
        <CubeSvg state={solved} faceLetters className="faces-cube" />
        <div>
          <h2>{t("notation.faces")}</h2>
          <p>{t("notation.facesText")}</p>
        </div>
      </section>

      <section className="lesson-section">
        <h2>{t("notation.moves")}</h2>
        <p>{t("notation.movesText")}</p>
        <div className="playground">
          <Cube3D ref={viewer} state={START} label={t("notation.moves")} />
          <div className="playground-side">
            <p className="muted">{t("notation.try")}</p>
            <div className="move-pad">
              {MOVES.map((m) => (
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
            <div className="notice trick">
              <p>{t("notation.trick")}</p>
              <button type="button" className="btn btn-primary" onClick={trick}>
                {t("notation.trickPlay")}
              </button>
            </div>
            <p className="muted">{t("notation.hold")}</p>
          </div>
        </div>
      </section>
    </>
  );
}
