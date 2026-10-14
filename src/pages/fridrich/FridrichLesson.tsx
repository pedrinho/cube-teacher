// One lesson of the Fridrich track: how it works, a hands-on part, the cases, tips and Cinoto's videos.
import { useI18n } from "../../i18n";
import { Link } from "../../router";
import { CaseList, type ShownCase } from "../../components/CaseList";
import { CrossDemo } from "../../components/CrossDemo";
import { MovePad } from "../../components/MovePad";
import { VideoEmbed } from "../../components/VideoEmbed";
import { FR_LESSONS, type FrCase } from "../../content/fridrich/lessons";
import { YELLOW_UP } from "../../methods/layers/pictures";
import { fridrichMethod } from "../../methods/fridrich";
import { useLearning } from "../../learning";
import { frGoal, frName } from "./FridrichHome";

const NEW_MOVES = ["r", "r'", "l", "l'", "u", "d", "f", "M", "M'", "E", "S", "x", "x'", "y", "y'", "z"];

export function FridrichLesson({ step: id, focusCase }: { step: number; focusCase?: string }) {
  const { t } = useI18n();
  const learning = useLearning();
  const step = fridrichMethod.steps.find((s) => s.id === id);
  const lesson = FR_LESSONS[id];
  if (!step || !lesson) return <Link to="/fridrich">{t("fr.allLessons")}</Link>;
  const next = fridrichMethod.steps.find((s) => s.id === id + 1);
  const name = t(frName(id));

  const shown = (c: FrCase): ShownCase => ({
    id: c.id,
    title: c.titleKey
      ? t(c.titleKey)
      : c.id.startsWith("pll")
        ? t("fr.case.pll", { name: c.name ?? "" })
        : `${t(c.id.startsWith("oll") ? "fr.case.oll" : "fr.case.f2l", { n: c.number ?? 0 })}${c.name ? `: ${c.name}` : ""}`,
    text: c.textKey && t(c.textKey),
    alg: c.alg,
    alts: c.alts,
    demo: c.demo,
    setup: c.setup,
  });
  const hasCases = lesson.groups.length > 0;

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

      <section className="lesson-section prose">
        <h2>{t("lesson.howItWorks")}</h2>
        {lesson.paragraphs.map((p) => (
          <p key={p}>{t(p)}</p>
        ))}
      </section>

      {lesson.extra === "moves" && (
        <section className="lesson-section">
          <h2>{t("fr.moves.title")}</h2>
          <p>{t("fr.moves.text")}</p>
          <MovePad moves={NEW_MOVES} start={YELLOW_UP} label={t("fr.moves.title")} />
        </section>
      )}
      {lesson.extra === "cross" && <CrossDemo />}

      {lesson.groups.map((g, k) => (
        <section key={k} className="lesson-section">
          <h2>{g.titleKey ? t(g.titleKey) : t("lesson.cases")}</h2>
          {g.leadKey && <p>{t(g.leadKey)}</p>}
          <CaseList
            cases={g.cases.map(shown)}
            mask={g.mask}
            view={g.view}
            arrows={g.arrows}
            focusCase={g.cases.some((c) => c.id === focusCase) ? focusCase : undefined}
            learning={learning}
          />
        </section>
      ))}

      <section className="lesson-section prose">
        <h2>{t("lesson.tips")}</h2>
        <ul className="tips">
          {lesson.tips.map((tip) => (
            <li key={tip}>{t(tip)}</li>
          ))}
        </ul>
      </section>

      <section className="lesson-section">
        <h2>{t(step.videos.length > 1 ? "lesson.videos" : "lesson.video")}</h2>
        <div className="videos">
          {step.videos.map((v) => (
            <VideoEmbed key={v} videoId={v} title={name} sourceUrl={fridrichMethod.source.url} />
          ))}
        </div>
      </section>

      <div className="btn-row lesson-end">
        {hasCases && (
          <Link to="/fridrich/train" className="btn btn-primary">
            {t("fr.trainLink")}
          </Link>
        )}
        {next && (
          <Link to={`/fridrich/learn/${next.id}`} className={hasCases ? "btn" : "btn btn-primary"}>
            {t("lesson.next", { name: t(frName(next.id)) })}
          </Link>
        )}
      </div>
    </article>
  );
}
