import { useI18n, type Lang } from "../i18n";
import { Link } from "../router";
import { CubeSvg } from "./CubeSvg";
import { stepPicture } from "../methods/layers/pictures";

const LOGO = stepPicture(7);

export function Header({ section }: { section: string }) {
  const { t, lang, setLang } = useI18n();
  const langs: { id: Lang; label: string }[] = [
    { id: "en", label: "EN" },
    { id: "pt", label: "PT" },
  ];
  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="brand">
          <CubeSvg state={LOGO.state} />
          {t("app.name")}
        </Link>
        <nav className="nav">
          <Link to="/learn" aria-current={section === "learn" ? "page" : undefined}>
            {t("nav.learn")}
          </Link>
          <Link to="/solve" aria-current={section === "solve" ? "page" : undefined}>
            {t("nav.solve")}
          </Link>
        </nav>
        <div className="lang" role="group" aria-label={t("lang.label")}>
          {langs.map((l) => (
            <button key={l.id} type="button" aria-pressed={lang === l.id} onClick={() => setLang(l.id)}>
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
