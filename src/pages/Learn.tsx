import { stepKey, useI18n } from "../i18n";
import { Link } from "../router";
import { CubeSvg } from "../components/CubeSvg";
import { StepName } from "../components/StepTitle";
import { layersMethod } from "../methods/layers";
import { stepPicture } from "../methods/layers/pictures";
import type { StepDef } from "../methods/types";

function LessonRow({ step }: { step: StepDef }) {
  const { t } = useI18n();
  const pic = stepPicture(step.id);
  return (
    <li>
      <Link to={`/learn/${step.id}`} className="lesson-row">
        <CubeSvg state={pic.state} visible={pic.visible} className="lesson-row-cube" />
        <span className="lesson-row-text">
          {step.id > 0 && <span className="lesson-row-num">{t("step.label", { n: step.id })}</span>}
          <span className="lesson-row-name">
            <StepName step={step.id} />
          </span>
          <span className="lesson-row-goal">{t(stepKey(step.id, "goal"))}</span>
          {!step.ready && <span className="tag">{t("learn.soon")}</span>}
        </span>
      </Link>
    </li>
  );
}

export function Learn() {
  const { t } = useI18n();
  const groups = [0, 1, 2, 3] as const;
  return (
    <>
      <h1>{t("learn.title")}</h1>
      <p className="lead">{t("learn.lead")}</p>
      {groups.map((layer) => (
        <section key={layer} className="lesson-group">
          {layer !== 0 && <h2>{t(`layer.${layer}`)}</h2>}
          <ol className="lesson-list">
            {layersMethod.steps
              .filter((s) => s.layer === layer)
              .map((s) => (
                <LessonRow key={s.id} step={s} />
              ))}
          </ol>
        </section>
      ))}
    </>
  );
}
