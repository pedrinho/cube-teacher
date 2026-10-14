import { useI18n } from "../i18n";
import { Link } from "../router";
import { StepLadder } from "../components/StepLadder";
import { layersMethod } from "../methods/layers";

export function Home() {
  const { t, tr } = useI18n();
  const { source } = layersMethod;
  return (
    <>
      <section className="hero">
        <h1>{t("home.title")}</h1>
        <p className="lead">{t("home.lead")}</p>
        <div className="btn-row">
          <Link className="btn btn-primary" to="/learn">
            {t("home.start")}
          </Link>
          <Link className="btn" to="/solve">
            {t("home.solve")}
          </Link>
        </div>
      </section>
      <section aria-labelledby="steps-title">
        <h2 id="steps-title" className="visually-hidden">
          {t("home.steps")}
        </h2>
        <StepLadder />
      </section>
      <section className="faster" aria-labelledby="faster-title">
        <h2 id="faster-title">{t("home.fasterTitle")}</h2>
        <p>{t("home.fasterText")}</p>
        <Link className="btn btn-primary" to="/fridrich">
          {t("home.fasterButton")}
        </Link>
      </section>
      <p className="credit muted">
        {tr("home.credit", {
          link: (
            <a key="src" href={source.url} target="_blank" rel="noreferrer">
              {source.title}
            </a>
          ),
        })}
      </p>
    </>
  );
}
