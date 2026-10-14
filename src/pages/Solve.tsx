import { useEffect, useState } from "react";
import { useI18n } from "../i18n";
import { Cube3D } from "../components/Cube3D";
import { Moves } from "../components/Moves";
import { NetEditor, blankNet } from "../components/NetEditor";
import { SOLVED, applyAlg, randomScramble, type CubeState, type Move } from "../cube/model";
import { validate, type ValidationError } from "../cube/validate";

const STORAGE_KEY = "cube-teacher.paint";
const IMPOSSIBLE = new Set(["flipped-edge", "twisted-corner", "swapped-pieces"]);

type Mode = "paint" | "scramble";
type Stage = { kind: "input" } | { kind: "review"; state: CubeState };

function loadPaint(): CubeState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved.length === 54) return saved;
  } catch {
    // Start blank when storage is unavailable.
  }
  return blankNet();
}

function ErrorList({ errors }: { errors: ValidationError[] }) {
  const { t } = useI18n();
  return (
    <div className="notice notice-error" role="alert">
      <h3>{t("error.title")}</h3>
      <ul>
        {errors.map((e, k) => (
          <li key={k}>
            {e.kind === "count"
              ? t("error.count", { count: e.count, color: t(`color.${e.color}`) })
              : e.kind === "unpainted"
                ? t("error.unpainted", { count: e.count })
                : t(`error.${e.kind}`)}
          </li>
        ))}
      </ul>
      {errors.some((e) => IMPOSSIBLE.has(e.kind)) && <p>{t("error.impossibleHelp")}</p>}
    </div>
  );
}

export function Solve() {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>("paint");
  const [stage, setStage] = useState<Stage>({ kind: "input" });
  const [paint, setPaint] = useState<CubeState>(loadPaint);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [scramble, setScramble] = useState<Move[]>(() => randomScramble());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, paint);
    } catch {
      // Painting still works, it just isn't remembered.
    }
  }, [paint]);

  const marked = new Set(errors.flatMap((e) => ("stickers" in e ? e.stickers : [])));

  const check = () => {
    const result = validate(paint);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors([]);
    setStage({ kind: "review", state: paint });
  };

  const useScramble = () => {
    setStage({ kind: "review", state: applyAlg(SOLVED, scramble) });
  };

  const startOver = () => {
    if (mode === "paint") setPaint(blankNet());
    else setScramble(randomScramble());
    setErrors([]);
    setStage({ kind: "input" });
  };

  if (stage.kind === "review") {
    return (
      <>
        <h1>{t("solve.reviewTitle")}</h1>
        <div className="review">
          <Cube3D state={stage.state} label={t("solve.reviewTitle")} />
          <div>
            <p className="lead">{t("solve.reviewText")}</p>
            <div className="btn-row">
              <button type="button" className="btn" onClick={() => setStage({ kind: "input" })}>
                {t(mode === "paint" ? "solve.edit" : "solve.backToScramble")}
              </button>
              <button type="button" className="btn" onClick={startOver}>
                {t("solve.startOver")}
              </button>
            </div>
            <p className="notice">{t("solve.soon")}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <h1>{t("solve.title")}</h1>
      <p className="lead">{t("solve.lead")}</p>
      <div className="tabs" role="tablist">
        {(["paint", "scramble"] as const).map((m) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)}>
            {t(m === "paint" ? "solve.tabPaint" : "solve.tabScramble")}
          </button>
        ))}
      </div>

      {mode === "paint" ? (
        <section role="tabpanel">
          <p>{t("solve.paintHint")}</p>
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
