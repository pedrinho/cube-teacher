// Lesson 0: the pieces and how moves are written (Cinoto's "noções gerais").
import { useRef } from "react";
import { useI18n } from "../i18n";
import { CubeSvg } from "../components/CubeSvg";
import { MovePad, type MovePadHandle } from "../components/MovePad";
import { SOLVED, applyAlg } from "../cube/model";
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
  const pad = useRef<MovePadHandle>(null);

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
        <MovePad ref={pad} moves={MOVES} start={START} label={t("notation.moves")}>
          <div className="notice trick">
            <p>{t("notation.trick")}</p>
            <button type="button" className="btn btn-primary" onClick={() => pad.current?.play(TRICK)}>
              {t("notation.trickPlay")}
            </button>
          </div>
          <p className="muted">{t("notation.hold")}</p>
        </MovePad>
      </section>
    </>
  );
}
