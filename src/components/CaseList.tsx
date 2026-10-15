// Cases of a lesson: a picture, the moves and a "Show me" button for each, next to a 3D demo cube.
// Tapping a case puts its starting position on the cube; "Solve it" plays the moves at the chosen
// speed, with the playing move highlighted, and the cube stays solved until "Start again".
// "Next move" and "Back" go through the moves one at a time instead.
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useI18n } from "../i18n";
import { applyAlg, invertMove, isRotation, parseAlg, type CubeState, type Move } from "../cube/model";
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

/** The case on the demo cube and how far its moves have played. */
interface Picked {
  id: string;
  /** Everything the demo plays, whole-cube turns included. */
  all: Move[];
  /** The strip's moves (without whole-cube turns). */
  moves: Move[];
  /** How many of `all` are done. */
  step: number;
  /** The highlighted chip in the strip. */
  current: number;
  turning: boolean;
  phase: "start" | "stepping" | "playing" | "solved";
}

/** The chip in the strip of the demo move at `index` (rotations have no chip). */
const chipAt = (all: Move[], index: number) => all.slice(0, index).filter((m) => !isRotation(m)).length;

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

  /** Shows a case's starting position on the cube. */
  const pick = (c: ShownCase): Picked => {
    window.clearTimeout(timer.current);
    cube.current?.show(c.setup);
    const all = parseAlg(c.demo);
    const shown: Picked = { id: c.id, all, moves: all.filter((m) => !isRotation(m)), step: 0, current: -1, turning: false, phase: "start" };
    setPicked(shown);
    const box = demo.current?.getBoundingClientRect();
    if (box && (box.top < 0 || box.bottom > window.innerHeight)) demo.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    return shown;
  };

  /** Changes the picked case, unless another case (or the same one picked again) took its place. */
  const update = (p: Picked, next: Partial<Picked>) => setPicked((q) => (q && q.all === p.all ? { ...q, ...next } : q));

  /** Plays the moves not done yet. */
  const playRest = (c: ShownCase, p: Picked, delay: number) => {
    const rest = p.all.slice(p.step);
    setPicked({ ...p, phase: "playing" });
    timer.current = window.setTimeout(
      () =>
        cube.current
          ?.play(rest, {
            from: applyAlg(c.setup, p.all.slice(0, p.step)),
            onStep: (i) => update(p, { current: chipAt(p.all, p.step + i), turning: isRotation(rest[i]) }),
          })
          .then(() => update(p, { step: p.all.length, current: p.moves.length, turning: false, phase: "solved" })),
      delay,
    );
  };

  /** Shows a case's starting position, then plays its moves. */
  const solve = (c: ShownCase, delay: number) => playRest(c, pick(c), delay);

  /** Plays one move forward (+1) or takes the last one back (-1); the strip marks the next move. */
  const stepBy = (c: ShownCase, p: Picked, dir: 1 | -1) => {
    const step = p.step + dir;
    const move = dir === 1 ? p.all[p.step] : invertMove(p.all[step]);
    setPicked({
      ...p,
      step,
      current: step === 0 ? -1 : chipAt(p.all, step),
      turning: isRotation(move),
      phase: step === 0 ? "start" : step === p.all.length ? "solved" : "stepping",
    });
    cube.current
      ?.play([move], { from: applyAlg(c.setup, p.all.slice(0, p.step)) })
      .then(() => setPicked((q) => (q && q.all === p.all && q.step === step ? { ...q, turning: false } : q)));
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
                disabled={picked.phase === "playing" || picked.step === picked.all.length}
                onClick={() => playRest(pickedCase, picked, SOLVE_DELAY_MS)}
              >
                {t("lesson.solve")}
              </button>
            </div>
            <div className="btn-row demo-actions" role="group" aria-label={t("lesson.stepByStep")}>
              <button
                type="button"
                className="btn case-show"
                disabled={picked.phase === "playing" || picked.step === 0}
                onClick={() => stepBy(pickedCase, picked, -1)}
              >
                {t("guide.back")}
              </button>
              <button
                type="button"
                className="btn case-show"
                disabled={picked.phase === "playing" || picked.step === picked.all.length}
                onClick={() => stepBy(pickedCase, picked, 1)}
              >
                {picked.step < picked.all.length && isRotation(picked.all[picked.step]) ? t("guide.turnCube") : t("guide.next")}
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
