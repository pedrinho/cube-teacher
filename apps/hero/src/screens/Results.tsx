// The end of a level's song: stars, score and how the notes went. It says whether the level passed
// (stickers rain when it did) and, if so, opens the next one.
import { useMemo } from "react";
import { useI18n } from "../i18n";
import { PASS_STARS } from "../game/levels";
import { accuracy, stars as starsFor, type Score } from "../game/score";

interface Props {
  score: Score;
  maxPoints: number;
  newBest: boolean;
  /** The next level, when this play opened it (or it was open already). */
  onNext?: () => void;
  onAgain: () => void;
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

export function Results({ score, maxPoints, newBest, onNext, onAgain, onLevels }: Props) {
  const { t } = useI18n();
  const stars = starsFor(score.points, maxPoints);
  const passed = stars >= PASS_STARS;
  const next = passed ? onNext : undefined;

  return (
    <div className="screen results">
      {passed && <Confetti />}
      <h1>{t(passed ? "results.passed" : "results.almost")}</h1>
      <p className="lead">{t(!passed ? "results.needStars" : next ? "results.nextOpen" : "results.allDone")}</p>
      <p className="stars" role="img" aria-label={t("results.stars", { n: stars })}>
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} data-on={i < stars || undefined}>
            ★
          </span>
        ))}
      </p>
      <p className="results-score">
        <span className="stat-label">{t("results.score")}</span>
        <span className="results-points">{score.points.toLocaleString()}</span>
        {newBest && <span className="new-best">{t("results.newBest")}</span>}
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
          {t(passed ? "results.again" : "results.retry")}
        </button>
        <button type="button" className="btn btn-quiet" onClick={onLevels}>
          {t("results.levels")}
        </button>
      </div>
    </div>
  );
}
