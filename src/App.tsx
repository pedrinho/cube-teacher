import { Header } from "./components/Header";
import { useRoute } from "./router";
import { Home } from "./pages/Home";
import { Learn } from "./pages/Learn";
import { Lesson } from "./pages/Lesson";
import { Solve } from "./pages/Solve";
import { Practice } from "./pages/Practice";
import { LAYERS } from "./methods/registry";
import { FridrichHome } from "./pages/fridrich/FridrichHome";
import { FridrichLesson } from "./pages/fridrich/FridrichLesson";
import { useI18n } from "./i18n";

export function App() {
  const route = useRoute();
  const [section = "", param, sub, extra] = route;
  const { t } = useI18n();
  let page;
  if (section === "fridrich") {
    if (param === "learn" && sub !== undefined)
      page = <FridrichLesson key={sub} step={Number(sub)} focusCase={extra} />;
    else if (param === "solve") page = <p className="notice">{t("fr.solveSoon")}</p>;
    else if (param === "train") page = <p className="notice">{t("fr.trainSoon")}</p>;
    else page = <FridrichHome />;
  } else if (section === "learn" && param !== undefined) page = <Lesson key={param} step={Number(param)} focusCase={sub} />;
  else if (section === "learn") page = <Learn />;
  else if (section === "solve") page = <Solve method={LAYERS} />;
  else if (section === "practice") page = <Practice key={param ?? ""} step={param ? Number(param) : undefined} />;
  else page = <Home />;
  return (
    <>
      <Header route={route} />
      <main className="page">{page}</main>
    </>
  );
}
