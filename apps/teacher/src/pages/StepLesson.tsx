// A step's lesson: how it works, the cases with their moves, a demo cube, and tips.
import { useI18n } from "../i18n";
import { CaseList } from "../components/CaseList";
import { demoMoves, type Lesson } from "../content/layers/lessons";

export function StepLesson({ lesson, focusCase }: { lesson: Lesson; focusCase?: string }) {
  const { t } = useI18n();
  const cases = lesson.cases.map((c) => ({
    id: c.id,
    title: t(c.title),
    text: t(c.text),
    alg: c.alg,
    follow: c.follow && { label: t(c.follow.label), alg: c.follow.alg },
    demo: demoMoves(c),
    setup: c.setup,
  }));

  return (
    <>
      <section className="lesson-section prose">
        <h2>{t("lesson.howItWorks")}</h2>
        {lesson.paragraphs.map((p) => (
          <p key={p}>{t(p)}</p>
        ))}
      </section>

      <section className="lesson-section">
        <h2>{t("lesson.cases")}</h2>
        <p>{t(lesson.casesLead)}</p>
        <CaseList cases={cases} mask={lesson.mask} view={lesson.view} arrows={lesson.arrows} focusCase={focusCase} />
      </section>

      <section className="lesson-section prose">
        <h2>{t("lesson.tips")}</h2>
        <ul className="tips">
          {lesson.tips.map((tip) => (
            <li key={tip}>{t(tip)}</li>
          ))}
        </ul>
      </section>
    </>
  );
}
