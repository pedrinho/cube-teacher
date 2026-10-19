// The end of the song: the solved cube, stars, score and how the notes went. Stickers rain once.
import { useMemo } from "react";
import { useI18n } from "../i18n";
import { accuracy, stars as starsFor, type Score } from "../game/score";

interface Props {
  score: Score;
  maxPoints: number;
  watched: boolean;
  newBest: boolean;
  canGoFaster: boolean;
  onAgain: () => void;
  onFaster: () => void;
  onChange: () => void;
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

export function Results({ score, maxPoints, watched, newBest, canGoFaster, onAgain, onFaster, onChange }: Props) {
  const { t } = useI18n();
  const stars = starsFor(score.points, maxPoints);

  return (
    <div className="screen results">
      <Confetti />
      <h1>{t("results.title")}</h1>
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
        <button type="button" className="btn btn-primary btn-big" onClick={onAgain} autoFocus>
          {t("results.again")}
        </button>
        {canGoFaster && !watched && (
          <button type="button" className="btn" onClick={onFaster}>
            {t("results.faster")}
          </button>
        )}
        <button type="button" className="btn" onClick={onChange}>
          {t("results.change")}
        </button>
      </div>
    </div>
  );
}
