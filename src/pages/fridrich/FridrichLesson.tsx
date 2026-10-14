// One lesson of the Fridrich track: its goal, the lesson body (when ready) and Cinoto's videos.
import { useI18n } from "../../i18n";
import { Link } from "../../router";
import { VideoEmbed } from "../../components/VideoEmbed";
import { fridrichMethod } from "../../methods/fridrich";
import { frGoal, frName } from "./FridrichHome";

export function FridrichLesson({ step: id }: { step: number; focusCase?: string }) {
  const { t } = useI18n();
  const step = fridrichMethod.steps.find((s) => s.id === id);
  if (!step) return <Link to="/fridrich">{t("fr.allLessons")}</Link>;
  const next = fridrichMethod.steps.find((s) => s.id === id + 1);
  const name = t(frName(id));

  return (
    <article className="lesson">
      <Link to="/fridrich" className="back-link">
        {t("fr.allLessons")}
      </Link>
      <header className="lesson-head">
        <div>
          <p className="lesson-num">{t("fr.lessonLabel", { n: id })}</p>
          <h1>{name}</h1>
          <p className="lead">{t(frGoal(id))}</p>
        </div>
      </header>

      {!step.ready && <p className="notice">{t("lesson.soon")}</p>}

      <section className="lesson-section">
        <h2>{t(step.videos.length > 1 ? "lesson.videos" : "lesson.video")}</h2>
        <div className="videos">
          {step.videos.map((v) => (
            <VideoEmbed key={v} videoId={v} title={name} sourceUrl={fridrichMethod.source.url} />
          ))}
        </div>
      </section>

      {next && (
        <div className="btn-row lesson-end">
          <Link to={`/fridrich/learn/${next.id}`} className="btn btn-primary">
            {t("lesson.next", { name: t(frName(next.id)) })}
          </Link>
        </div>
      )}
    </article>
  );
}
