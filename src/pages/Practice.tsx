// Practice one step: scramble, follow the app through the earlier steps, then do this one alone.
import { useMemo, useState } from "react";
import { stepKey, useI18n } from "../i18n";
import { Link, navigate } from "../router";
import { CubeSvg } from "../components/CubeSvg";
import { Guide } from "../components/Guide";
import { Moves } from "../components/Moves";
import { SOLVED, applyAlg, randomScramble, type CubeState } from "../cube/model";
import { holdAs } from "../cube/orientation";
import { layersMethod } from "../methods/layers";
import { stepPicture } from "../methods/layers/pictures";
import { solveLayers } from "../methods/layers/solver";
import { LAYERS } from "../methods/registry";
import { PAINT_STORAGE_KEY } from "./Solve";

function PickStep() {
  const { t } = useI18n();
  return (
    <>
      <h1>{t("practice.title")}</h1>
      <p className="lead">{t("practice.lead")}</p>
      <h2>{t("practice.pick")}</h2>
      <ol className="lesson-list">
        {layersMethod.steps
          .filter((s) => s.id > 0)
          .map((s) => {
            const pic = stepPicture(s.id);
            const body = (
              <>
                <CubeSvg state={pic.state} visible={pic.visible} className="lesson-row-cube" />
                <span className="lesson-row-text">
                  <span className="lesson-row-num">{t("step.label", { n: s.id })}</span>
                  <span className="lesson-row-name">{t(stepKey(s.id, "name"))}</span>
                  {!s.ready && <span className="tag">{t("learn.soon")}</span>}
                </span>
              </>
            );
            return (
              <li key={s.id}>
                {s.ready ? (
                  <Link to={`/practice/${s.id}`} className="lesson-row">
                    {body}
                  </Link>
                ) : (
                  <span className="lesson-row" aria-disabled="true">
                    {body}
                  </span>
                )}
              </li>
            );
          })}
      </ol>
    </>
  );
}

function PracticeStep({ step }: { step: number }) {
  const { t } = useI18n();
  const [scramble, setScramble] = useState(() => randomScramble());
  const [following, setFollowing] = useState(false);
  const stages = useMemo(() => solveLayers(applyAlg(SOLVED, scramble), step), [scramble, step]);

  const again = () => {
    setScramble(randomScramble());
    setFollowing(false);
  };
  const different = (expected: CubeState) => {
    try {
      localStorage.setItem(PAINT_STORAGE_KEY, holdAs(expected, "W", "G"));
    } catch {
      // Without storage the editor just starts blank.
    }
    navigate("/solve");
  };

  return (
    <>
      <h1>
        {t("practice.title")}: {t(stepKey(step, "name"))}
      </h1>
      {following ? (
        <Guide method={LAYERS} stages={stages} practiceStep={step} onDifferent={different} onAgain={again} />
      ) : (
        <section>
          <p>{t("practice.scramble")}</p>
          <Moves alg={scramble} />
          <div className="btn-row solve-actions">
            <button type="button" className="btn btn-primary" onClick={() => setFollowing(true)}>
              {t("solve.scrambleDone")}
            </button>
            <button type="button" className="btn" onClick={() => setScramble(randomScramble())}>
              {t("solve.newScramble")}
            </button>
          </div>
        </section>
      )}
    </>
  );
}

export function Practice({ step }: { step?: number }) {
  const ready = layersMethod.steps.find((s) => s.id === step)?.ready;
  return step !== undefined && ready ? <PracticeStep step={step} /> : <PickStep />;
}
