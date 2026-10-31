// The end of the song: stars, score and how the notes went. Stickers rain once, unless a level's
// song needed more stars. A level's song says whether it passed and opens the next one; the full
// songs can be played faster or changed.
import { useMemo } from "react";
import { useI18n } from "../i18n";
import { PASS_STARS } from "../game/levels";
import { accuracy, stars as starsFor, type Score } from "../game/score";

interface Props {
  score: Score;
  maxPoints: number;
  watched: boolean;
  newBest: boolean;
  /** A level's own song: the next level, when this play opened it (or it was open already). */
  level?: { onNext?: () => void };
  /** The full songs passed their level for the first time. */
  firstPass?: boolean;
  canGoFaster?: boolean;
  onAgain: () => void;
  onFaster?: () => void;
  onChange?: () => void;
  onLevels: () => void;
}

const STICKERS = ["W", "Y", "G", "B", "R", "O"];

function Confetti() {
  // Fixed positions per mount, so re-renders don't reshuffle them.
  const pieces = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        color: STICKERS[i % 6],
        left: Math.random() * 100,
        delay: Math.random() * 0.9,
        duration: 1.8 + Math.random() * 1.4,
        spin: Math.round(Math.random() * 720 - 360),
      })),
    [],
  );
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          data-color={p.color}
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            ["--spin" as string]: `${p.spin}deg`,
          }}
        />
      ))}
    </div>
  );
}

export function Results({
  score,
  maxPoints,
  watched,
  newBest,
  level,
  firstPass,
  canGoFaster,
  onAgain,
  onFaster,
  onChange,
  onLevels,
}: Props) {
  const { t } = useI18n();
  const stars = starsFor(score.points, maxPoints);
  const passed = stars >= PASS_STARS;
  const next = level && passed ? level.onNext : undefined;

  return (
    <div className="screen results">
      {(!level || passed) && <Confetti />}
      <h1>{t(!level ? "results.title" : passed ? "results.passed" : "results.almost")}</h1>
      {level && <p className="lead">{t(!passed ? "results.needStars" : next ? "results.nextOpen" : "results.allDone")}</p>}
      {firstPass && !watched && <p className="level-passed">{t("results.passed")}</p>}
      {watched ? (
        <p className="lead">{t("results.watched")}</p>
      ) : (
        <p className="stars" role="img" aria-label={t("results.stars", { n: stars })}>
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} data-on={i < stars || undefined}>
              ★
            </span>
          ))}
        </p>
      )}
      <p className="results-score">
        <span className="stat-label">{t("results.score")}</span>
        <span className="results-points">{score.points.toLocaleString()}</span>
        {newBest && !watched && <span className="new-best">{t("results.newBest")}</span>}
      </p>
      <dl className="results-grid">
        <div>
          <dt>{t("results.perfect")}</dt>
          <dd>{score.perfect}</dd>
        </div>
        <div>
          <dt>{t("results.good")}</dt>
          <dd>{score.good}</dd>
        </div>
        <div>
          <dt>{t("results.miss")}</dt>
          <dd>{score.miss}</dd>
        </div>
        <div>
          <dt>{t("results.streak")}</dt>
          <dd>{score.bestCombo}</dd>
        </div>
        <div>
          <dt>{t("results.accuracy")}</dt>
          <dd>{Math.round(accuracy(score) * 100)}%</dd>
        </div>
      </dl>
      <div className="btn-row results-actions">
        {next && (
          <button type="button" className="btn btn-primary btn-big" onClick={next} autoFocus>
            {t("results.next")}
          </button>
        )}
        <button type="button" className={next ? "btn" : "btn btn-primary btn-big"} onClick={onAgain} autoFocus={!next}>
          {t(level && !passed ? "results.retry" : "results.again")}
        </button>
        {canGoFaster && onFaster && !watched && (
          <button type="button" className="btn" onClick={onFaster}>
            {t("results.faster")}
          </button>
        )}
        {onChange && (
          <button type="button" className="btn" onClick={onChange}>
            {t("results.change")}
          </button>
        )}
        <button type="button" className="btn btn-quiet" onClick={onLevels}>
          {t("results.levels")}
        </button>
      </div>
    </div>
  );
}
