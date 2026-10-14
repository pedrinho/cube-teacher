// Follow-along solving: one instruction at a time, one move at a time, on a 3D copy of the cube.
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { applyAlg, invertMove, type CubeState } from "../cube/model";
import { explainText, stepKey, useI18n } from "../i18n";
import { Link } from "../router";
import type { Segment, Stage } from "../methods/types";
import { LESSONS } from "../content/layers/lessons";
import { Cube3D, type Cube3DHandle } from "./Cube3D";
import { HoldBadge } from "./HoldBadge";
import { Moves } from "./Moves";
import { SpeedControl } from "./SpeedControl";
import { StepRail } from "./StepRail";

interface Props {
  stages: Stage[];
  /** In practice mode, the step the kid does on their own. */
  practiceStep?: number;
  onDifferent: (expected: CubeState) => void;
  onAgain: () => void;
}

type View = "moves" | "stageDone" | "yourTurn" | "end";
interface Pos {
  stage: number;
  seg: number;
  /** How many of the segment's moves are done. */
  move: number;
}

export function Guide({ stages, practiceStep, onDifferent, onAgain }: Props) {
  const { t } = useI18n();
  const cube = useRef<Cube3DHandle>(null);
  const firstView: View = stages[0]?.step === practiceStep ? "yourTurn" : "moves";
  const [pos, setPos] = useState<Pos>({ stage: 0, seg: 0, move: 0 });
  const [view, setView] = useState<View>(firstView);
  const [hint, setHint] = useState(false);
  // The latest position, read by key presses that arrive before React re-renders.
  const nav = useRef<{ pos: Pos; view: View }>({ pos, view: firstView });

  const go = useCallback((p: Pos, v: View) => {
    nav.current = { pos: p, view: v };
    setPos(p);
    setView(v);
  }, []);

  const stage = stages[pos.stage];
  const seg: Segment = stage.segments[pos.seg];
  const lastSeg = stage.segments[stage.segments.length - 1];
  const shown =
    view === "yourTurn"
      ? stage.segments[0].before
      : view === "moves"
        ? applyAlg(seg.before, seg.moves.slice(0, pos.move))
        : lastSeg.after;

  const next = useCallback(() => {
    const { pos, view } = nav.current;
    const stage = stages[pos.stage];
    const seg = stage.segments[pos.seg];
    if (view === "yourTurn" || view === "end") return;
    if (view === "stageDone") {
      if (pos.stage + 1 >= stages.length) return go(pos, "end");
      setHint(false);
      return go({ stage: pos.stage + 1, seg: 0, move: 0 }, stages[pos.stage + 1].step === practiceStep ? "yourTurn" : "moves");
    }
    if (pos.move < seg.moves.length) {
      cube.current?.play([seg.moves[pos.move]], { from: applyAlg(seg.before, seg.moves.slice(0, pos.move)) });
      go({ ...pos, move: pos.move + 1 }, "moves");
    } else if (pos.seg + 1 < stage.segments.length) {
      go({ ...pos, seg: pos.seg + 1, move: 0 }, "moves");
    } else {
      const last = pos.stage + 1 >= stages.length;
      go(pos, stage.step === practiceStep || last ? "end" : "stageDone");
    }
  }, [stages, practiceStep, go]);

  const back = useCallback(() => {
    const { pos, view } = nav.current;
    const stage = stages[pos.stage];
    const seg = stage.segments[pos.seg];
    if (view === "stageDone" || view === "end") {
      const last = stage.segments[stage.segments.length - 1];
      return go({ ...pos, seg: stage.segments.length - 1, move: last.moves.length }, "moves");
    }
    if (view !== "moves") return;
    if (pos.move > 0) {
      cube.current?.play([invertMove(seg.moves[pos.move - 1])], { from: applyAlg(seg.before, seg.moves.slice(0, pos.move)) });
      go({ ...pos, move: pos.move - 1 }, "moves");
    } else if (pos.seg > 0) {
      const prev = stage.segments[pos.seg - 1];
      go({ ...pos, seg: pos.seg - 1, move: prev.moves.length }, "moves");
    } else if (pos.stage > 0) {
      const prevStage = stages[pos.stage - 1];
      const prev = prevStage.segments[prevStage.segments.length - 1];
      go({ stage: pos.stage - 1, seg: prevStage.segments.length - 1, move: prev.moves.length }, "moves");
    }
  }, [stages, go]);

  const replay = () => {
    cube.current?.show(seg.before);
    cube.current?.play(seg.moves.slice(0, pos.move));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const onButton = e.target instanceof HTMLElement && e.target.closest("button, a, input");
      if (e.key === "ArrowRight" || (e.key === " " && !onButton)) {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        back();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, back]);

  const stepName = t(stepKey(stage.step, "name"));
  const segDone = pos.move >= seg.moves.length;
  const nextLabel =
    !segDone && seg.kind === "rotate" ? t("guide.turnCube") : segDone ? t("guide.continue") : t("guide.next");
  const doneUpTo = view === "stageDone" || view === "end" ? stage.step : stage.step - 1;
  const firstAction = stage.segments.find((s) => s.kind !== "rotate") ?? stage.segments[0];
  // Cases belong to the lesson of their step ("2.2" is step 2's case 2, even when used in step 3).
  const caseStep = seg.caseId ? Number(seg.caseId.split(".")[0]) : undefined;
  const lessonLink =
    caseStep && LESSONS[caseStep]?.cases.some((c) => c.id === seg.caseId) ? `/learn/${caseStep}/${seg.caseId}` : undefined;

  let text: ReactNode;
  let controls: ReactNode;
  if (view === "moves") {
    text = (
      <>
        <p className="guide-text">{explainText(t, seg.explain)}</p>
        {seg.moves.length > 0 && seg.kind !== "rotate" && <Moves alg={seg.moves} current={pos.move} />}
        <p className="muted guide-part">
          {t("guide.part", { n: pos.seg + 1, total: stage.segments.length })}
          {lessonLink && (
            <>
              {" "}
              <Link to={lessonLink} target="_blank" rel="noreferrer">
                {t("guide.seeCase")}
              </Link>
            </>
          )}
        </p>
      </>
    );
    controls = (
      <>
        <button type="button" className="btn" onClick={back}>
          {t("guide.back")}
        </button>
        <button type="button" className="btn btn-primary btn-big" onClick={next}>
          {nextLabel}
        </button>
        {pos.move > 0 && (
          <button type="button" className="btn" onClick={replay}>
            {t("guide.replay")}
          </button>
        )}
      </>
    );
  } else if (view === "stageDone") {
    text = (
      <>
        <h2>{t("guide.stepDone", { n: stage.step })}</h2>
        <p className="guide-text">{t(`guide.stepDone.${stage.step}` as "guide.stepDone.1")}</p>
      </>
    );
    controls = (
      <>
        <button type="button" className="btn" onClick={back}>
          {t("guide.back")}
        </button>
        <button type="button" className="btn btn-primary btn-big" onClick={next}>
          {pos.stage + 1 < stages.length
            ? t("guide.nextStep", { name: t(stepKey(stages[pos.stage + 1].step, "name")) })
            : t("guide.continue")}
        </button>
      </>
    );
  } else if (view === "yourTurn") {
    text = (
      <>
        <h2>{t("practice.yourTurn", { name: stepName })}</h2>
        <p className="guide-text">{t("practice.yourTurnText")}</p>
        {hint && <p className="notice">{explainText(t, firstAction.explain)}</p>}
      </>
    );
    controls = (
      <>
        <button type="button" className="btn btn-primary btn-big" onClick={() => go(pos, "end")}>
          {t("practice.didIt")}
        </button>
        {!hint && (
          <button type="button" className="btn" onClick={() => setHint(true)}>
            {t("practice.hint")}
          </button>
        )}
        <button type="button" className="btn" onClick={() => go(pos, "moves")}>
          {t("practice.showMe")}
        </button>
      </>
    );
  } else {
    text = (
      <>
        <h2>{practiceStep ? t("practice.wellDone") : t("guide.solved")}</h2>
        <p className="guide-text">{practiceStep ? t("practice.wellDoneText") : t("guide.solvedText")}</p>
      </>
    );
    controls = (
      <button type="button" className="btn btn-primary btn-big" onClick={onAgain}>
        {practiceStep ? t("practice.again") : t("guide.again")}
      </button>
    );
  }

  return (
    <div className="guide">
      <StepRail current={stage.step} doneUpTo={doneUpTo} />
      <div className="guide-body">
        <div className="guide-card">
          <p className="guide-step">
            {t("guide.step", { n: stage.step })}: {stepName}
          </p>
          {text}
        </div>
        <div className="guide-cube">
          <Cube3D ref={cube} state={shown} label={stepName} />
          <HoldBadge state={shown} />
          <SpeedControl />
        </div>
        <div className="guide-controls">
          <div className="btn-row">{controls}</div>
          {view !== "end" && (
            <button type="button" className="link-button" onClick={() => onDifferent(shown)}>
              {t("guide.different")}
            </button>
          )}
          <p className="muted guide-keys">{t("guide.keys")}</p>
        </div>
      </div>
    </div>
  );
}
