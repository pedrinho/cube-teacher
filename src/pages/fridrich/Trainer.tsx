// Algorithm trainer: pick case sets, get a scramble that sets up one case, solve it against the
// clock, then see which case it was, its algorithm and a 3D demo. Times are kept per case.
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "../../i18n";
import type { MessageKey } from "../../i18n/en";
import { CaseList } from "../../components/CaseList";
import { CubeSvg } from "../../components/CubeSvg";
import { Moves } from "../../components/Moves";
import { TopView } from "../../components/TopView";
import { applyAlg, algToString, invertAlg, parseAlg, type CubeState, type Move } from "../../cube/model";
import { U_TURNS } from "../../cube/orientation";
import { ALL_FR_CASES, type FrCase } from "../../content/fridrich/lessons";
import { OLL_CORNER_CASES } from "../../methods/fridrich/sets";
import { stepMask } from "../../methods/layers/pictures";
import { useLearning } from "../../learning";
import { scrambleFor } from "../../trainer/scramble";
import { formatTime, loadStats, record, saveStats, summary, type Stats } from "../../trainer/stats";
import { caseTitle } from "./caseTitle";

type SetId = "learning" | "basicOll" | "pll" | "oll" | "f2l";
const SET_LABELS: Record<SetId, MessageKey> = {
  learning: "tr.set.learning",
  basicOll: "tr.set.basicOll",
  pll: "tr.set.pll",
  oll: "tr.set.oll",
  f2l: "tr.set.f2l",
};
const ids = [...ALL_FR_CASES.keys()];
const FIXED: Record<Exclude<SetId, "learning">, string[]> = {
  basicOll: [...ids.filter((id) => id.startsWith("oll2.")), ...OLL_CORNER_CASES.map((i) => `oll.${i + 1}`)],
  pll: ids.filter((id) => id.startsWith("pll.")),
  oll: ids.filter((id) => id.startsWith("oll.")),
  f2l: ids.filter((id) => id.startsWith("f2l.")),
};

const SETS_KEY = "cube-teacher.trainSets";
const PICTURE_KEY = "cube-teacher.trainPicture";
function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}
function store(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Kept for this visit only.
  }
}

const maskFor = (id: string) => stepMask(id.startsWith("f2l") ? 3 : id.startsWith("oll2") ? 4 : id.startsWith("oll") ? 5 : 7);

function Picture({ c, state, arrows }: { c: FrCase; state: CubeState; arrows?: boolean }) {
  return c.id.startsWith("f2l") ? (
    <CubeSvg state={state} visible={maskFor(c.id)} className="trainer-picture" />
  ) : (
    <TopView state={state} visible={maskFor(c.id)} arrows={arrows} className="trainer-picture" />
  );
}

interface Drill {
  c: FrCase;
  /** The case with a random top turn, as the kid will see it. */
  state: CubeState;
  /** The top turn that brings it back to the case picture's position. */
  turnBack: Move[];
  scramble: Move[];
  phase: "ready" | "running" | "done";
  startedAt: number;
  ms: number | null;
}

export function Trainer() {
  const { t } = useI18n();
  const learning = useLearning();
  const [sets, setSets] = useState<SetId[]>(() => load<SetId[]>(SETS_KEY, ["basicOll"]));
  const [showPicture, setShowPicture] = useState(() => load(PICTURE_KEY, true));
  const [stats, setStats] = useState<Stats>(loadStats);
  const [drill, setDrill] = useState<Drill | null>(null);
  const [now, setNow] = useState(0);

  const pool = [...new Set(sets.flatMap((s) => (s === "learning" ? learning.ids.filter((id) => ALL_FR_CASES.has(id)) : FIXED[s])))];

  const toggleSet = (s: SetId) => {
    const next = sets.includes(s) ? sets.filter((x) => x !== s) : [...sets, s];
    setSets(next);
    store(SETS_KEY, next);
  };

  const next = useCallback(() => {
    if (pool.length === 0) return;
    const previous = drill?.c.id;
    const choices = pool.length > 1 ? pool.filter((id) => id !== previous) : pool;
    const c = ALL_FR_CASES.get(choices[Math.floor(Math.random() * choices.length)])!;
    const turn = U_TURNS[Math.floor(Math.random() * 4)];
    const state = applyAlg(c.setup, turn);
    setDrill({ c, state, turnBack: invertAlg(turn), scramble: scrambleFor(c.setupMoves, turn), phase: "ready", startedAt: 0, ms: null });
  }, [pool, drill]);

  const start = () => {
    if (drill?.phase === "ready") setDrill({ ...drill, phase: "running", startedAt: performance.now() });
  };
  // Saving happens here, not inside a state update (React may run updates twice).
  const stop = (skipped = false) => {
    if (!drill || (!skipped && drill.phase !== "running")) return;
    const ms = !skipped && drill.phase === "running" ? performance.now() - drill.startedAt : null;
    if (ms !== null) {
      const updated = record(loadStats(), drill.c.id, ms);
      saveStats(updated);
      setStats(updated);
    }
    setDrill({ ...drill, phase: "done", ms });
  };

  // The running clock.
  useEffect(() => {
    if (drill?.phase !== "running") return;
    let frame = requestAnimationFrame(function tick() {
      setNow(performance.now());
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [drill?.phase]);

  // Space bar: start, stop, next case.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== " " || (e.target instanceof HTMLElement && e.target.closest("button, a, input, summary"))) return;
      e.preventDefault();
      if (!drill || drill.phase === "done") next();
      else if (drill.phase === "ready") start();
      else if (drill.phase === "running") stop();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const practiced = Object.entries(stats)
    .filter(([id]) => ALL_FR_CASES.has(id))
    .map(([id, times]) => ({ c: ALL_FR_CASES.get(id)!, s: summary(times)! }))
    .sort((a, b) => b.s.avg5 - a.s.avg5);

  const d = drill;
  const running = d?.phase === "running";
  const shownTime = d?.phase === "running" ? now - d.startedAt : (d?.ms ?? 0);
  const caseSummary = d ? summary(stats[d.c.id]) : null;

  return (
    <>
      <h1>{t("tr.title")}</h1>
      <p className="lead">{t("tr.lead")}</p>

      <section className="trainer-sets" aria-label={t("tr.sets")}>
        <div className="chips">
          {(Object.keys(SET_LABELS) as SetId[]).map((s) => (
            <button key={s} type="button" className="chip" aria-pressed={sets.includes(s)} onClick={() => toggleSet(s)}>
              {t(SET_LABELS[s], { n: learning.ids.filter((id) => ALL_FR_CASES.has(id)).length })}
            </button>
          ))}
        </div>
        <label className="check">
          <input
            type="checkbox"
            checked={showPicture}
            onChange={(e) => {
              setShowPicture(e.target.checked);
              store(PICTURE_KEY, e.target.checked);
            }}
          />
          {t("tr.showPicture")}
        </label>
        {sets.includes("learning") && learning.ids.length === 0 && <p className="notice">{t("tr.learningEmpty")}</p>}
      </section>

      <div className="trainer">
        <div className="trainer-card">
          {!d && (
            <>
              <p>{t("tr.ready", { n: pool.length })}</p>
              <button type="button" className="btn btn-primary btn-big" disabled={pool.length === 0} onClick={next}>
                {t("tr.begin")}
              </button>
            </>
          )}
          {d && (d.phase === "ready" || d.phase === "running") && (
            <>
              <p>{t("tr.scramble")}</p>
              <Moves alg={d.scramble} small />
              {showPicture && <Picture c={d.c} state={d.state} />}
            </>
          )}
          {d && (
            <button
              type="button"
              className="timer"
              data-running={running || undefined}
              onClick={() => (d.phase === "ready" ? start() : d.phase === "running" ? stop() : next())}
            >
              <span className="timer-digits">{formatTime(shownTime)}</span>
              <span className="timer-hint">
                {d.phase === "ready" ? t("tr.start") : d.phase === "running" ? t("tr.stop") : t("tr.next")}
              </span>
            </button>
          )}
          {d && (d.phase === "ready" || d.phase === "running") && (
            <button type="button" className="link-button" onClick={() => stop(true)}>
              {t("tr.skip")}
            </button>
          )}
          {d && d.phase === "done" && caseSummary && (
            <p className="muted">
              {t("tr.caseStats", { tries: caseSummary.tries, best: formatTime(caseSummary.best), avg: formatTime(caseSummary.avg5) })}
            </p>
          )}
          <p className="muted guide-keys">{t("tr.keys")}</p>
        </div>

        {d && d.phase === "done" && (
          <div className="trainer-reveal">
            {d.turnBack.length > 0 && (
              <p>
                {t("tr.turnFirst")} <Moves alg={d.turnBack} small />
              </p>
            )}
            <CaseList
              cases={[
                {
                  id: d.c.id,
                  title: caseTitle(t, d.c),
                  alg: d.c.alg,
                  alts: d.c.alts,
                  demo: algToString([...d.turnBack, ...parseAlg(d.c.demo)]),
                  setup: d.state,
                },
              ]}
              mask={maskFor(d.c.id)}
              view={d.c.id.startsWith("f2l") ? "cube" : "top"}
              arrows={d.c.id.startsWith("pll")}
              learning={learning}
            />
          </div>
        )}
      </div>

      <section className="lesson-section">
        <h2>{t("tr.statsTitle")}</h2>
        {practiced.length === 0 ? (
          <p className="muted">{t("tr.noStats")}</p>
        ) : (
          <>
            <p className="muted">{t("tr.statsLead")}</p>
            <table className="stats">
              <thead>
                <tr>
                  <th>{t("tr.col.case")}</th>
                  <th>{t("tr.col.tries")}</th>
                  <th>{t("tr.col.best")}</th>
                  <th>{t("tr.col.avg")}</th>
                </tr>
              </thead>
              <tbody>
                {practiced.map(({ c, s }) => (
                  <tr key={c.id}>
                    <td>{caseTitle(t, c)}</td>
                    <td>{s.tries}</td>
                    <td>{formatTime(s.best)}</td>
                    <td>{formatTime(s.avg5)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              type="button"
              className="btn"
              onClick={() => {
                saveStats({});
                setStats({});
              }}
            >
              {t("tr.clear")}
            </button>
          </>
        )}
      </section>
    </>
  );
}
