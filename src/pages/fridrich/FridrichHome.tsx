// The Fridrich (CFOP) section: what the method is, and Cinoto's lessons in his order.
import { useI18n } from "../../i18n";
import type { MessageKey } from "../../i18n/en";
import { Link } from "../../router";
import { fridrichMethod } from "../../methods/fridrich";
import { FRIDRICH } from "../../methods/registry";

export const frName = (id: number) => `fr.step.${id}.name` as MessageKey;
export const frGoal = (id: number) => `fr.step.${id}.goal` as MessageKey;

export function FridrichHome() {
  const { t, tr } = useI18n();
  const groups = [0, 1, 2, 3] as const;
  return (
    <>
      <h1>{t("fr.title")}</h1>
      <p className="lead">{t("fr.lead")}</p>

      <section className="lesson-section">
        <h2>{t("fr.partsTitle")}</h2>
        <ol className="parts">
          {FRIDRICH.stages.map((s) => (
            <li key={s.id}>
              <span className="parts-num">{s.id}</span>
              <span>
                <strong>{t(s.name)}</strong> {t(`fr.stage.${s.id}.text` as MessageKey)}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {groups.map((g) => (
        <section key={g} className="lesson-group">
          <h2>{t(`fr.group.${g}` as MessageKey)}</h2>
          <ol className="lesson-list">
            {fridrichMethod.steps
              .filter((s) => s.layer === g)
              .map((s) => (
                <li key={s.id}>
                  <Link to={`/fridrich/learn/${s.id}`} className="lesson-row">
                    <span className="lesson-row-text">
                      <span className="lesson-row-num">{t("fr.lessonLabel", { n: s.id })}</span>
                      <span className="lesson-row-name">{t(frName(s.id))}</span>
                      <span className="lesson-row-goal">{t(frGoal(s.id))}</span>
                      {!s.ready && <span className="tag">{t("learn.soon")}</span>}
                    </span>
                  </Link>
                </li>
              ))}
          </ol>
        </section>
      ))}

      <p className="credit muted">
        {tr("fr.credit", {
          link: (
            <a key="src" href={fridrichMethod.source.url} target="_blank" rel="noreferrer">
              cinoto.com.br
            </a>
          ),
        })}
      </p>
    </>
  );
}
