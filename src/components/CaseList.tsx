// Cases of a lesson: a picture, the moves and a "Show me" button for each, next to a 3D demo cube
// that plays the chosen case at the chosen speed, with the playing move highlighted.
import { useEffect, useRef, useState } from "react";
import { useI18n } from "../i18n";
import { isRotation, parseAlg, type CubeState, type Move } from "../cube/model";
import type { Visible } from "../three/cubeScene";
import { CubeSvg } from "./CubeSvg";
import { Cube3D, type Cube3DHandle } from "./Cube3D";
import { Moves } from "./Moves";
import { SpeedControl } from "./SpeedControl";
import { TopView } from "./TopView";

export interface ShownCase {
  /** Also the anchor id on the page (case-<id>). */
  id: string;
  title: string;
  text?: string;
  alg: string;
  /** Other ways to solve the same case. */
  alts?: string[];
  follow?: { label: string; alg: string };
  /** Everything the demo plays. */
  demo: string;
  setup: CubeState;
}

interface Props {
  cases: ShownCase[];
  mask: Visible;
  view?: "cube" | "top";
  arrows?: boolean;
  focusCase?: string;
  /** Lets the kid mark cases to drill in the trainer. */
  learning?: { isOn: (id: string) => boolean; toggle: (id: string) => void };
}

const START_DELAY_MS = 700;

export function CaseList({ cases, mask, view = "cube", arrows, focusCase, learning }: Props) {
  const { t } = useI18n();
  const cube = useRef<Cube3DHandle>(null);
  const demo = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [active, setActive] = useState<string | null>(null);
  // The demo's moves (without whole-cube turns) and which one is playing.
  const [strip, setStrip] = useState<{ moves: Move[]; current: number; turning: boolean } | null>(null);

  const show = (c: ShownCase) => {
    setActive(c.id);
    cube.current?.show(c.setup);
    window.clearTimeout(timer.current);
    const moves = parseAlg(c.demo);
    // For every demo move, the index of its chip in the strip (rotations have no chip).
    const chip = moves.map((_, i) => moves.slice(0, i).filter((m) => !isRotation(m)).length);
    const shown = moves.filter((m) => !isRotation(m));
    setStrip({ moves: shown, current: -1, turning: false });
    timer.current = window.setTimeout(
      () =>
        cube.current
          ?.play(moves, {
            onStep: (i) => setStrip({ moves: shown, current: chip[i], turning: isRotation(moves[i]) }),
          })
          .then(() => setStrip((s) => (s && s.moves === shown ? { ...s, current: shown.length, turning: false } : s))),
      START_DELAY_MS,
    );
    const box = demo.current?.getBoundingClientRect();
    if (box && (box.top < 0 || box.bottom > window.innerHeight)) demo.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    if (!focusCase) return;
    const c = cases.find((x) => x.id === focusCase);
    const el = document.getElementById(`case-${focusCase}`);
    if (c && el) {
      el.scrollIntoView({ block: "center" });
      setActive(c.id);
      // Wait for the 3D cube to load before showing the case.
      const id = window.setTimeout(() => show(c), 800);
      return () => window.clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusCase, cases]);

  return (
    <div className="cases">
      <div className="cases-demo" ref={demo}>
        <Cube3D ref={cube} state={cases[0].setup} visible={mask} label={t("lesson.cases")} />
        {strip ? (
          <div className="demo-strip" aria-live="polite">
            <Moves alg={strip.moves} current={strip.current} small />
            {strip.turning && <p className="muted">{t("lesson.turning")}</p>}
          </div>
        ) : (
          <p className="muted">{t("lesson.demo")}</p>
        )}
        <SpeedControl />
      </div>
      <ol className="case-list">
        {cases.map((c) => (
          <li key={c.id} id={`case-${c.id}`} className="case" data-active={active === c.id || undefined}>
            {view === "top" ? (
              <TopView state={c.setup} visible={mask} arrows={arrows} className="case-cube case-top" label={c.title} />
            ) : (
              <CubeSvg state={c.setup} visible={mask} className="case-cube" label={c.title} />
            )}
            <div className="case-body">
              <h3>{c.title}</h3>
              {c.text && <p>{c.text}</p>}
              <Moves alg={c.alg} small />
              {c.follow && (
                <>
                  <p className="case-then">{c.follow.label}</p>
                  <Moves alg={c.follow.alg} small />
                </>
              )}
              {c.alts && c.alts.length > 0 && (
                <details className="case-alts">
                  <summary>{t("lesson.otherWays", { n: c.alts.length })}</summary>
                  {c.alts.map((a) => (
                    <Moves key={a} alg={a} small />
                  ))}
                </details>
              )}
              <div className="btn-row case-actions">
                <button type="button" className="btn case-show" onClick={() => show(c)}>
                  {active === c.id ? t("lesson.showAgain") : t("lesson.showMe")}
                </button>
                {learning && (
                  <button
                    type="button"
                    className="btn case-show case-learning"
                    aria-pressed={learning.isOn(c.id)}
                    onClick={() => learning.toggle(c.id)}
                  >
                    {learning.isOn(c.id) ? t("lesson.learningOn") : t("lesson.learning")}
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
