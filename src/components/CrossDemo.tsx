// A random cube held white side down, seen from below, and its shortest white cross.
import { useRef, useState } from "react";
import { useI18n } from "../i18n";
import { SOLVED, applyAlg, algToString, randomScramble, type CubeState, type Move } from "../cube/model";
import { PIECE_OF, pieceColors } from "../cube/pieces";
import { optimalCross } from "../methods/fridrich/solver";
import { Cube3D, type Cube3DHandle } from "./Cube3D";
import { Moves } from "./Moves";
import { SpeedControl } from "./SpeedControl";

// Only the centers and the white edges are drawn in color.
const crossMask = (i: number, s: CubeState) =>
  PIECE_OF[i].length === 1 || (PIECE_OF[i].length === 2 && pieceColors(s, i).includes("W"));

const whiteDown = (scramble: Move[]) => applyAlg(applyAlg(SOLVED, scramble), "z2");

export function CrossDemo() {
  const { t } = useI18n();
  const cube = useRef<Cube3DHandle>(null);
  const [start, setStart] = useState(() => whiteDown(randomScramble()));
  const [moves, setMoves] = useState<Move[] | null>(null);
  const [current, setCurrent] = useState(-1);

  const show = (fresh: boolean) => {
    const s = fresh ? whiteDown(randomScramble()) : start;
    setStart(s);
    const solution = optimalCross(s);
    setMoves(solution);
    setCurrent(-1);
    cube.current?.show(s);
    window.setTimeout(
      () => cube.current?.play(algToString(solution), { onStep: setCurrent }).then(() => setCurrent(solution.length)),
      700,
    );
  };

  return (
    <section className="lesson-section">
      <h2>{t("fr.cross.title")}</h2>
      <p>{t("fr.cross.text")}</p>
      <div className="playground">
        <Cube3D ref={cube} state={start} visible={crossMask} fromBelow label={t("fr.cross.title")} />
        <div className="playground-side">
          {moves && (
            <>
              <p className="lead">{t("fr.cross.count", { n: moves.length })}</p>
              <Moves alg={moves} current={current} small />
            </>
          )}
          <div className="btn-row">
            <button type="button" className="btn btn-primary" onClick={() => show(moves !== null)}>
              {moves ? t("fr.cross.again") : t("fr.cross.show")}
            </button>
          </div>
          <SpeedControl />
        </div>
      </div>
    </section>
  );
}
