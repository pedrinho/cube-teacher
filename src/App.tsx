import { Header } from "./components/Header";
import { useRoute } from "./router";
import { Home } from "./pages/Home";
import { Learn } from "./pages/Learn";
import { Lesson } from "./pages/Lesson";
import { Solve } from "./pages/Solve";

export function App() {
  const [section = "", param] = useRoute();
  let page;
  if (section === "learn" && param !== undefined) page = <Lesson step={Number(param)} />;
  else if (section === "learn") page = <Learn />;
  else if (section === "solve") page = <Solve />;
  else page = <Home />;
  return (
    <>
      <Header section={section} />
      <main className="page">{page}</main>
    </>
  );
}
