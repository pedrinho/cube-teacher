import { Header } from "./components/Header";
import { useRoute } from "./router";
import { Home } from "./pages/Home";
import { Learn } from "./pages/Learn";
import { Lesson } from "./pages/Lesson";
import { Solve } from "./pages/Solve";
import { Practice } from "./pages/Practice";

export function App() {
  const [section = "", param, sub] = useRoute();
  let page;
  if (section === "learn" && param !== undefined) page = <Lesson key={param} step={Number(param)} focusCase={sub} />;
  else if (section === "learn") page = <Learn />;
  else if (section === "solve") page = <Solve />;
  else if (section === "practice") page = <Practice key={param ?? ""} step={param ? Number(param) : undefined} />;
  else page = <Home />;
  return (
    <>
      <Header section={section} />
      <main className="page">{page}</main>
    </>
  );
}
