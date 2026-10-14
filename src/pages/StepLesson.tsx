// A step's lesson: how it works, the cases with their moves, a demo cube, and tips.
import { useEffect, useRef, useState } from "react";
import { useI18n } from "../i18n";
import { CubeSvg } from "../components/CubeSvg";
import { Cube3D, type Cube3DHandle } from "../components/Cube3D";
import { Moves } from "../components/Moves";
import type { Lesson, LessonCase } from "../content/layers/lessons";

const START_DELAY_MS = 700;

export function StepLesson({ lesson, focusCase }: { lesson: Lesson; focusCase?: string }) {
  const { t } = useI18n();
  const cube = useRef<Cube3DHandle>(null);
  const demo = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [active, setActive] = useState<string | null>(null);

  const show = (c: LessonCase) => {
    setActive(c.id);
    cube.current?.show(c.setup);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => cube.current?.play(`${c.alg} ${c.then ?? ""}`.trim()), START_DELAY_MS);
    const box = demo.current?.getBoundingClientRect();
    if (box && (box.top < 0 || box.bottom > window.innerHeight)) demo.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    if (!focusCase) return;
    const c = lesson.cases.find((x) => x.id === focusCase);
    const el = document.getElementById(`case-${focusCase}`);
    if (c && el) {
      el.scrollIntoView({ block: "center" });
      setActive(c.id);
      // Wait for the 3D cube to load before showing the case.
      const id = window.setTimeout(() => show(c), 800);
      return () => window.clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusCase, lesson]);

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
        <div className="cases">
          <div className="cases-demo" ref={demo}>
            <Cube3D ref={cube} state={lesson.cases[0].setup} visible={lesson.mask} label={t("lesson.cases")} />
            <p className="muted">{t("lesson.demo")}</p>
          </div>
          <ol className="case-list">
            {lesson.cases.map((c) => (
              <li key={c.id} id={`case-${c.id}`} className="case" data-active={active === c.id || undefined}>
                <CubeSvg state={c.setup} visible={lesson.mask} className="case-cube" label={t(c.title)} />
                <div className="case-body">
                  <h3>{t(c.title)}</h3>
                  <p>{t(c.text)}</p>
                  <Moves alg={c.alg} small />
                  {c.id === "2.3" && c.then && (
                    <>
                      <p className="case-then">{t("lesson.thenCase1")}</p>
                      <Moves alg={c.then} small />
                    </>
                  )}
                  <button type="button" className="btn case-show" onClick={() => show(c)}>
                    {active === c.id ? t("lesson.showAgain") : t("lesson.showMe")}
                  </button>
                </div>
              </li>
            ))}
          </ol>
        </div>
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
