// Paint a real cube into the game with cube-kit's editor, check it, then confirm it in 3D.
import { useEffect, useState } from "react";
import { Cube3D } from "cube-kit/react/Cube3D";
import { ErrorList, markedStickers } from "cube-kit/react/ErrorList";
import { NetEditor, blankNet } from "cube-kit/react/NetEditor";
import { validate, type ValidationError } from "cube-kit/cube/validate";
import type { CubeState } from "cube-kit/cube/model";
import { useI18n } from "../i18n";
import { PAINT_KEY } from "../settings";

function loadPaint(): CubeState {
  try {
    const saved = localStorage.getItem(PAINT_KEY);
    if (saved && saved.length === 54) return saved;
  } catch {
    // Start blank when storage is unavailable.
  }
  return blankNet();
}

interface Props {
  onDone: (state: CubeState) => void;
  onBack: () => void;
}

export function Paint({ onDone, onBack }: Props) {
  const { t } = useI18n();
  const [paint, setPaint] = useState<CubeState>(loadPaint);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [review, setReview] = useState<CubeState | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(PAINT_KEY, paint);
    } catch {
      // Painting still works, it just isn't remembered.
    }
  }, [paint]);

  const check = () => {
    const result = validate(paint);
    if (!result.ok) return setErrors(result.errors);
    setErrors([]);
    setReview(paint);
  };

  if (review) {
    return (
      <div className="screen">
        <h1>{t("review.title")}</h1>
        <div className="review">
          <Cube3D state={review} label={t("review.title")} />
          <div>
            <p className="lead">{t("review.text")}</p>
            <div className="btn-row">
              <button type="button" className="btn btn-primary btn-big" onClick={() => onDone(review)}>
                {t("review.play")}
              </button>
              <button type="button" className="btn" onClick={() => setReview(null)}>
                {t("review.edit")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <h1>{t("paint.title")}</h1>
      <p className="lead">{t("paint.hint")}</p>
      <NetEditor value={paint} onChange={setPaint} marked={markedStickers(errors)} />
      {errors.length > 0 && <ErrorList errors={errors} />}
      <div className="btn-row paint-actions">
        <button type="button" className="btn btn-primary" onClick={check}>
          {t("paint.check")}
        </button>
        <button type="button" className="btn" onClick={() => setPaint(blankNet())}>
          {t("paint.clear")}
        </button>
        <button type="button" className="btn btn-quiet" onClick={onBack}>
          {t("paint.back")}
        </button>
      </div>
    </div>
  );
}
