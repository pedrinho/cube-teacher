// Cases of a lesson: a picture, the moves and a "Show me" button for each, next to a 3D demo cube.
// Tapping a case puts its starting position on the cube; "Solve it" plays the moves at the chosen
// speed, with the playing move highlighted, and the cube stays solved until "Start again".
import { useEffect, useRef, useState, type MouseEvent } from "react";
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

/** The case on the demo cube: its moves (without whole-cube turns) and how far it has played. */
interface Picked {
  id: string;
  moves: Move[];
  current: number;
  turning: boolean;
  phase: "start" | "playing" | "solved";
}

/** Before a demo started from a case card, so the eye can find the cube first. */
const START_DELAY_MS = 700;
/** Before a demo started from the button under the cube, which is already in view. */
const SOLVE_DELAY_MS = 300;

export function CaseList({ cases, mask, view = "cube", arrows, focusCase, learning }: Props) {
  const { t } = useI18n();
  const cube = useRef<Cube3DHandle>(null);
  const demo = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [picked, setPicked] = useState<Picked | null>(null);
  const pickedCase = cases.find((c) => c.id === picked?.id);

  /** Shows a case's starting position on the cube; returns the strip's moves. */
  const pick = (c: ShownCase, phase: Picked["phase"] = "start") => {
    window.clearTimeout(timer.current);
    cube.current?.show(c.setup);
    const moves = parseAlg(c.demo).filter((m) => !isRotation(m));
    setPicked({ id: c.id, moves, current: -1, turning: false, phase });
    const box = demo.current?.getBoundingClientRect();
    if (box && (box.top < 0 || box.bottom > window.innerHeight)) demo.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    return moves;
  };

  /** Shows a case's starting position, then plays its moves. */
  const solve = (c: ShownCase, delay: number) => {
    const shown = pick(c, "playing");
    const moves = parseAlg(c.demo);
    // For every demo move, the index of its chip in the strip (rotations have no chip).
    const chip = moves.map((_, i) => moves.slice(0, i).filter((m) => !isRotation(m)).length);
    // Only this run, while it is still the one on the cube, moves the strip along.
    const update = (next: Partial<Picked>) => setPicked((p) => (p && p.moves === shown ? { ...p, ...next } : p));
    timer.current = window.setTimeout(
      () =>
        cube.current
          ?.play(moves, {
            from: c.setup,
            onStep: (i) => update({ current: chip[i], turning: isRotation(moves[i]) }),
          })
          .then(() => update({ current: shown.length, turning: false, phase: "solved" })),
      delay,
    );
  };

  // Tapping anywhere on a card picks it, except on its buttons and links.
  const onCardClick = (c: ShownCase) => (e: MouseEvent) => {
    if ((e.target as Element).closest("button, a, summary")) return;
    if (window.getSelection()?.type === "Range") return;
    pick(c);
  };

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    if (!focusCase) return;
    const c = cases.find((x) => x.id === focusCase);
    const el = document.getElementById(`case-${focusCase}`);
    if (c && el) {
      el.scrollIntoView({ block: "center" });
      // Wait for the 3D cube to load before showing the case.
      const id = window.setTimeout(() => solve(c, START_DELAY_MS), 800);
      return () => window.clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusCase, cases]);

  return (
    <div className="cases">
      <div className="cases-demo" ref={demo}>
        <Cube3D ref={cube} state={cases[0].setup} visible={mask} label={pickedCase?.title ?? t("lesson.cases")} />
        {picked && pickedCase ? (
          <>
            <div className="demo-strip" aria-live="polite">
              <Moves alg={picked.moves} current={picked.current} small />
              {picked.turning && <p className="muted">{t("lesson.turning")}</p>}
            </div>
            <div className="btn-row demo-actions">
              <button type="button" className="btn case-show" disabled={picked.phase === "start"} onClick={() => pick(pickedCase)}>
                {t("lesson.startAgain")}
              </button>
              <button
                type="button"
                className="btn btn-primary case-show"
                disabled={picked.phase !== "start"}
                onClick={() => solve(pickedCase, SOLVE_DELAY_MS)}
              >
                {t("lesson.solve")}
              </button>
            </div>
          </>
        ) : (
          <p className="muted">{t("lesson.demo")}</p>
        )}
        <SpeedControl />
      </div>
      <ol className="case-list">
        {cases.map((c) => (
          <li key={c.id} id={`case-${c.id}`} className="case" data-active={picked?.id === c.id || undefined} onClick={onCardClick(c)}>
            <button type="button" className="case-pick" aria-label={t("lesson.pick", { name: c.title })} onClick={() => pick(c)}>
              {view === "top" ? (
                <TopView state={c.setup} visible={mask} arrows={arrows} className="case-cube case-top" label={c.title} />
              ) : (
                <CubeSvg state={c.setup} visible={mask} className="case-cube" label={c.title} />
              )}
            </button>
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
                <button type="button" className="btn case-show" onClick={() => solve(c, START_DELAY_MS)}>
                  {picked?.id === c.id ? t("lesson.showAgain") : t("lesson.showMe")}
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
