import { useI18n, type Lang } from "../i18n";
import type { MessageKey } from "../i18n/en";
import { Link } from "../router";
import { CubeSvg } from "./CubeSvg";
import { stepPicture } from "../methods/layers/pictures";

const LOGO = stepPicture(7);

/** The two tracks and their pages: route path, label, and whether a route belongs to it. */
const TRACKS: { id: "layers" | "fridrich"; to: string; label: MessageKey; pages: { to: string; label: MessageKey }[] }[] = [
  {
    id: "layers",
    to: "/learn",
    label: "nav.layers",
    pages: [
      { to: "/learn", label: "nav.learn" },
      { to: "/solve", label: "nav.solve" },
      { to: "/practice", label: "nav.practice" },
    ],
  },
  {
    id: "fridrich",
    to: "/fridrich",
    label: "nav.fridrich",
    pages: [
      { to: "/fridrich", label: "nav.lessons" },
      { to: "/fridrich/train", label: "nav.trainer" },
      { to: "/fridrich/solve", label: "nav.solve" },
    ],
  },
];

export function Header({ route }: { route: string[] }) {
  const { t, lang, setLang } = useI18n();
  const [section = "", sub] = route;
  const track = section === "fridrich" ? "fridrich" : section === "" ? null : "layers";
  const current = section === "fridrich" ? (sub === "train" || sub === "solve" ? `/fridrich/${sub}` : "/fridrich") : `/${section}`;
  const langs: { id: Lang; label: string }[] = [
    { id: "en", label: "EN" },
    { id: "pt", label: "PT" },
  ];
  const pages = TRACKS.find((tr) => tr.id === track)?.pages;
  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="brand">
          <CubeSvg state={LOGO.state} />
          {t("app.name")}
        </Link>
        <nav className="nav" aria-label={t("nav.tracks")}>
          {TRACKS.map((tr) => (
            <Link key={tr.id} to={tr.to} aria-current={track === tr.id ? "true" : undefined}>
              {t(tr.label)}
            </Link>
          ))}
        </nav>
        <div className="lang" role="group" aria-label={t("lang.label")}>
          {langs.map((l) => (
            <button key={l.id} type="button" aria-pressed={lang === l.id} onClick={() => setLang(l.id)}>
              {l.label}
            </button>
          ))}
        </div>
      </div>
      {pages && (
        <nav className="subnav" aria-label={t(TRACKS.find((tr) => tr.id === track)!.label)}>
          <div className="subnav-inner">
            {pages.map((p) => (
              <Link key={p.to} to={p.to} aria-current={current === p.to ? "page" : undefined}>
                {t(p.label)}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
