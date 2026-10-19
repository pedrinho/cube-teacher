import { useEffect, useState } from "react";
import { useI18n } from "../i18n";
import { Cube3D } from "../components/Cube3D";
import { Guide } from "../components/Guide";
import { Moves } from "cube-kit/react/Moves";
import { NetEditor, blankNet } from "cube-kit/react/NetEditor";
import { ErrorList, markedStickers } from "cube-kit/react/ErrorList";
import { SOLVED, applyAlg, randomScramble, type CubeState, type Move } from "cube-kit/cube/model";
import { validate, type ValidationError } from "cube-kit/cube/validate";
import { holdAs } from "cube-kit/cube/orientation";
import type { MethodInfo } from "../methods/registry";
import type { LastLayer } from "cube-kit/methods/fridrich/solver";

const LAST_LAYER_KEY = "cube-teacher.lastLayer";
function loadLastLayer(): LastLayer {
  try {
    return localStorage.getItem(LAST_LAYER_KEY) === "full" ? "full" : "twoLook";
  } catch {
    return "twoLook";
  }
}
import type { Stage as SolveStage } from "cube-kit/methods/types";

export const PAINT_STORAGE_KEY = "cube-teacher.paint";
const STORAGE_KEY = PAINT_STORAGE_KEY;

type Mode = "paint" | "scramble";
type Stage =
  | { kind: "input" }
  | { kind: "review"; state: CubeState }
  | { kind: "guide"; stages: SolveStage[] };

function loadPaint(): CubeState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved.length === 54) return saved;
  } catch {
    // Start blank when storage is unavailable.
  }
  return blankNet();
}

export function Solve({ method }: { method: MethodInfo }) {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>("paint");
  const [stage, setStage] = useState<Stage>({ kind: "input" });
  const [paint, setPaint] = useState<CubeState>(loadPaint);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [scramble, setScramble] = useState<Move[]>(() => randomScramble());
  const [fixing, setFixing] = useState(false);
  const [lastLayer, setLastLayer] = useState<LastLayer>(loadLastLayer);
  const chooseLastLayer = (m: LastLayer) => {
    setLastLayer(m);
    try {
      localStorage.setItem(LAST_LAYER_KEY, m);
    } catch {
      // Still used for this solve.
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, paint);
    } catch {
      // Painting still works, it just isn't remembered.
    }
  }, [paint]);

  const marked = markedStickers(errors);

  const check = () => {
    const result = validate(paint);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors([]);
    setFixing(false);
    setStage({ kind: "review", state: paint });
  };

  const useScramble = () => {
    setStage({ kind: "review", state: applyAlg(SOLVED, scramble) });
  };

  const startOver = () => {
    if (mode === "paint") setPaint(blankNet());
    else setScramble(randomScramble());
    setErrors([]);
    setFixing(false);
    setStage({ kind: "input" });
  };

  const different = (expected: CubeState) => {
    setPaint(holdAs(expected, "W", "G"));
    setMode("paint");
    setFixing(true);
    setErrors([]);
    setStage({ kind: "input" });
  };

  if (stage.kind === "guide") {
    return (
      <>
        <h1>{t(method.solveTitle)}</h1>
        <Guide method={method} stages={stage.stages} onDifferent={different} onAgain={startOver} />
      </>
    );
  }

  if (stage.kind === "review") {
    return (
      <>
        <h1>{t("solve.reviewTitle")}</h1>
        <div className="review">
          <Cube3D state={stage.state} label={t("solve.reviewTitle")} />
          <div>
            <p className="lead">{t("solve.reviewText")}</p>
            {method.lastLayerChoice && (
              <div className="last-layer">
                <span className="speed-label">{t("fr.lastLayer")}</span>
                <div className="segmented" role="group" aria-label={t("fr.lastLayer")}>
                  {(["twoLook", "full"] as const).map((m) => (
                    <button key={m} type="button" aria-pressed={lastLayer === m} onClick={() => chooseLastLayer(m)}>
                      {t(m === "twoLook" ? "fr.lastLayer.twoLook" : "fr.lastLayer.full")}
                    </button>
                  ))}
                </div>
                <p className="muted">{t(lastLayer === "twoLook" ? "fr.lastLayer.twoLookText" : "fr.lastLayer.fullText")}</p>
              </div>
            )}
            <div className="btn-row">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setStage({ kind: "guide", stages: method.solve(stage.state, { lastLayer }) })}
              >
                {t("solve.start")}
              </button>
              <button type="button" className="btn" onClick={() => setStage({ kind: "input" })}>
                {t(mode === "paint" ? "solve.edit" : "solve.backToScramble")}
              </button>
              <button type="button" className="btn" onClick={startOver}>
                {t("solve.startOver")}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <h1>{t(method.solveTitle)}</h1>
      <p className="lead">{t(method.solveLead)}</p>
      <div className="tabs" role="tablist">
        {(["paint", "scramble"] as const).map((m) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)}>
            {t(m === "paint" ? "solve.tabPaint" : "solve.tabScramble")}
          </button>
        ))}
      </div>

      {mode === "paint" ? (
        <section role="tabpanel">
          {fixing ? <p className="notice">{t("solve.fixHint")}</p> : <p>{t("solve.paintHint")}</p>}
          <NetEditor value={paint} onChange={setPaint} marked={marked} />
          {errors.length > 0 && <ErrorList errors={errors} />}
          <div className="btn-row solve-actions">
            <button type="button" className="btn btn-primary" onClick={check}>
              {t("solve.check")}
            </button>
            <button type="button" className="btn" onClick={startOver}>
              {t("solve.clear")}
            </button>
          </div>
        </section>
      ) : (
        <section role="tabpanel">
          <p>{t("solve.scrambleHint")}</p>
          <Moves alg={scramble} />
          <div className="btn-row solve-actions">
            <button type="button" className="btn btn-primary" onClick={useScramble}>
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
