import { stepKey, useI18n } from "../i18n";
import { Link } from "../router";
import { CubeSvg } from "../components/CubeSvg";
import { StepName } from "../components/StepTitle";
import { VideoEmbed } from "../components/VideoEmbed";
import { layersMethod } from "../methods/layers";
import { stepPicture } from "../methods/layers/pictures";
import { LESSONS } from "../content/layers/lessons";
import { Notation } from "./Notation";
import { StepLesson } from "./StepLesson";

export function Lesson({ step: id, focusCase }: { step: number; focusCase?: string }) {
  const { t } = useI18n();
  const step = layersMethod.steps.find((s) => s.id === id);
  if (!step) return <Link to="/learn">{t("lesson.back")}</Link>;
  const next = layersMethod.steps.find((s) => s.id === id + 1);
  const pic = stepPicture(id);
  const name = t(stepKey(id, "name"));

  return (
    <article className="lesson">
      <Link to="/learn" className="back-link">
        {t("lesson.back")}
      </Link>
      <header className="lesson-head">
        <div>
          {id > 0 && <p className="lesson-num">{t("step.label", { n: id })}</p>}
          <h1>
            <StepName step={id} />
          </h1>
          <p className="lead">{t(stepKey(id, "goal"))}</p>
        </div>
        <CubeSvg state={pic.state} visible={pic.visible} className="lesson-head-cube" label={name} />
      </header>

      {id === 0 ? (
        <Notation />
      ) : LESSONS[id] ? (
        <StepLesson lesson={LESSONS[id]} focusCase={focusCase} />
      ) : (
        <p className="notice">{t("lesson.soon")}</p>
      )}

      <section className="lesson-section">
        <h2>{t("lesson.video")}</h2>
        <VideoEmbed videoId={step.videoId} title={name} />
      </section>

      <div className="btn-row lesson-end">
        {LESSONS[id] && (
          <Link to={`/practice/${id}`} className="btn btn-primary">
            {t("lesson.practice")}
          </Link>
        )}
        {next && (
          <Link to={`/learn/${next.id}`} className={LESSONS[id] ? "btn" : "btn btn-primary"}>
            {t("lesson.next", { name: t(stepKey(next.id, "name")) })}
          </Link>
        )}
      </div>
    </article>
  );
}
