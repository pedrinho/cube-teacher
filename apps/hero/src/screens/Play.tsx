// The song: the highway in the middle, the score on the left, the cube on the right. One loop per
// frame moves the clock, misses late notes, schedules the groove and draws; key presses are judged
// as they come in. The whole-cube turn keys spin the cube on the right, to look at it.
import { useEffect, useRef, useState } from "react";
import { Cube3D, type Cube3DHandle } from "cube-kit/react/Cube3D";
import { useI18n } from "../i18n";
import { sectionAt, type Chart, type Part } from "../game/chart";
import { BeatClock } from "../game/clock";
import { Highway, type Palette, type Pop } from "../game/highway";
import { Judge, type PlayEvent } from "../game/judge";
import { LETTERS, gameKey, keyLabel, laneOfKey, type KeyMap } from "../game/lanes";
import { held, multiplier, newScore, record, wrongKey, type Score } from "../game/score";
import type { Sound } from "../game/audio";
import { useSpinKeys } from "./spin";

interface Props {
  chart: Chart;
  bpm: number;
  keys: KeyMap;
  sound: Sound;
  onDone: (score: Score) => void;
  onQuit: () => void;
}

type Phase = "playing" | "paused" | "countdown" | "done";

/** Seconds of 3-2-1 before the song goes on after a pause. */
const COUNTDOWN = 1.5;

function readPalette(): Palette {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim();
  return {
    W: v("--st-W"),
    Y: v("--st-Y"),
    G: v("--st-G"),
    B: v("--st-B"),
    R: v("--st-R"),
    O: v("--st-O"),
    gray: v("--miss"),
    body: v("--cube-body"),
    accent: v("--violet"),
    ink: v("--key-ink"),
    text: v("--ink"),
    textSoft: v("--ink-soft"),
    stage: v("--paper"),
    line: v("--lane-line"),
  };
}

export function Play({ chart, bpm, keys, sound, onDone, onQuit }: Props) {
  const { t } = useI18n();
  const canvas = useRef<HTMLCanvasElement>(null);
  const cube = useRef<Cube3DHandle>(null);
  const [phase, setPhaseState] = useState<Phase>("playing");
  const [count, setCount] = useState(0);
  const [score, setScoreState] = useState<Score>(newScore);
  const [next, setNext] = useState(0);
  const [section, setSection] = useState(0);
  useSpinKeys(cube, chart.puzzle, keys);

  // Everything the frame loop and key handlers share, without re-rendering every frame.
  const game = useRef({
    clock: new BeatClock(() => performance.now() / 1000, bpm),
    judge: new Judge(chart.notes, keys),
    score: newScore(),
    pops: [] as Pop[],
    held: new Set<string>(),
    phase: "playing" as Phase,
    section: -1,
    countdownEnd: 0,
  });

  const msPerBeat = 60000 / bpm;
  const sectionNames = chart.sections.map((s) => t(s.title));
  const words = {
    perfect: t("judge.perfect"),
    good: t("judge.good"),
    miss: t("judge.miss"),
    wrong: t("judge.wrong"),
    held: t("judge.held"),
  };
  const space = t("key.space");
  const labels = useRef({ sectionNames, words, space });
  labels.current = { sectionNames, words, space };
  // A level's tips name the player's keys: "press {U}".
  const keyNames = Object.fromEntries(LETTERS.map((l) => [l, keyLabel(keys[l])]));

  const setPhase = (p: Phase) => {
    game.current.phase = p;
    setPhaseState(p);
  };

  /** Applies what the judge decided: turn the cube, play a sound, score, show a pop. */
  const handle = (events: PlayEvent[]) => {
    const g = game.current;
    const now = performance.now();
    for (const e of events) {
      // A dropped hold only loses its bonus: the tail goes gray, nothing else.
      if (e.type === "stray" || e.type === "dropped") continue;
      if (e.type === "held") {
        g.score = held(g.score);
        g.pops.push({ lane: chart.notes[e.note].lane, judgment: "held", at: now });
        continue;
      }
      if (e.type === "wrong") {
        sound.wrong();
        g.score = wrongKey(g.score);
        g.pops.push({ lane: laneOfKey(e.code, keys, chart.puzzle) ?? "all", judgment: "wrong", at: now });
        continue;
      }
      const note = chart.notes[e.note];
      cube.current?.play([note.move], { from: note.before });
      const judgment = e.type === "hit" ? e.judgment : "miss";
      if (judgment === "miss") sound.miss();
      else sound.hit(note.lane, note.move.amount === 3);
      g.score = record(g.score, judgment);
      g.pops.push({ lane: note.lane, judgment, at: now });
    }
    if (events.some((e) => e.type !== "stray")) {
      setScoreState(g.score);
      setNext(g.judge.next);
    }
    g.pops = g.pops.filter((p) => now - p.at < 1000);
  };

  const pause = () => {
    const g = game.current;
    if (g.phase !== "playing") return;
    g.clock.pause();
    // Keys are let go to pause: holds in progress count as held.
    handle(g.judge.settle());
    g.held.clear();
    setPhase("paused");
  };

  const resume = () => {
    const g = game.current;
    if (g.phase !== "paused") return;
    g.countdownEnd = performance.now() / 1000 + COUNTDOWN;
    setPhase("countdown");
  };

  const restart = () => {
    const g = game.current;
    g.judge.reset();
    g.score = newScore();
    g.pops = [];
    g.section = -1;
    g.clock.pause();
    g.clock.seek(0);
    cube.current?.show(chart.start);
    setScoreState(g.score);
    setNext(0);
    g.countdownEnd = performance.now() / 1000 + COUNTDOWN;
    setPhase("countdown");
  };

  useEffect(() => {
    const g = game.current;
    const el = canvas.current!;
    const highway = new Highway(el, readPalette(), keys, chart.puzzle);
    // Only the letters this puzzle plays: on the 1x1x2, U and D.
    const gameKeys = new Set(chart.puzzle.letters.map((l) => keys[l]));
    const resize = new ResizeObserver(() => highway.resize());
    resize.observe(el);
    highway.resize();

    sound.resetGroove(0);
    g.clock.play();
    let frame = 0;

    const loop = () => {
      frame = requestAnimationFrame(loop);
      const now = performance.now();

      if (g.phase === "countdown") {
        const left = g.countdownEnd - now / 1000;
        setCount(Math.max(1, Math.ceil((left / COUNTDOWN) * 3)));
        if (left <= 0) {
          sound.resetGroove(g.clock.beat);
          g.clock.play();
          setPhase("playing");
        }
      }

      if (g.phase === "playing") {
        const beat = g.clock.beat;
        handle(g.judge.update(beat, msPerBeat));

        const s = sectionAt(chart, beat);
        if (s !== g.section) {
          if (g.section !== -1 || beat > 0.5) sound.crash();
          g.section = s;
          setSection(s);
        }
        sound.groove(g.clock, chart.length - 1);

        if (beat >= chart.length && g.judge.done) {
          g.clock.pause();
          setPhase("done");
          sound.fanfare();
          onDone(g.score);
        }
      }

      highway.draw({
        chart,
        beat: g.clock.beat,
        results: g.judge.results,
        next: g.judge.next,
        held: g.held,
        holds: g.judge.holds,
        pops: g.pops,
        now,
        sectionNames: labels.current.sectionNames,
        words: labels.current.words,
        space: labels.current.space,
      });
    };
    frame = requestAnimationFrame(loop);

    const onKey = (e: KeyboardEvent) => {
      // The space bar pauses too, unless the song is played on it (the 1x1x1).
      if (e.code === "Escape" || (e.code === "Space" && !gameKeys.has("Space"))) {
        e.preventDefault();
        if (e.repeat) return;
        if (g.phase === "playing") pause();
        else if (g.phase === "paused") resume();
        return;
      }
      const code = gameKey(e.code);
      if (!gameKeys.has(code) || e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      if (e.repeat) return;
      g.held.add(code);
      if (g.phase === "playing") handle(g.judge.press(code, g.clock.beat, msPerBeat));
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const code = gameKey(e.code);
      g.held.delete(code);
      if (g.phase === "playing") handle(g.judge.release(code, g.clock.beat));
    };
    const onHide = () => {
      if (document.hidden) pause();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", pause);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", pause);
      document.removeEventListener("visibilitychange", onHide);
    };
    // One loop for the whole song; it reads the latest values through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The part being played: the one with the next note (or the last one).
  const nextNote = chart.notes[Math.min(next, chart.notes.length - 1)];
  const partIndex = nextNote ? nextNote.part : chart.parts.length - 1;
  const part = chart.parts[partIndex];
  const after = chart.parts[partIndex + 1];
  const current = chart.sections[section];
  /** What a part says: a tutorial's tip. */
  const lyric = (p?: Part) => p?.tip && t(p.tip, keyNames);
  const now = lyric(part);
  const then = after && after.section === part?.section ? lyric(after) : undefined;

  return (
    <div className="play">
      <div className="play-top">
        <div className="play-step">
          <span className="play-step-n">{t("play.step", { n: section + 1, total: chart.sections.length })}</span>
          <span className="play-step-name">{current && sectionNames[section]}</span>
        </div>
        <ol className="progress" aria-label={t("play.step", { n: section + 1, total: chart.sections.length })}>
          {chart.sections.map((s, i) => (
            <li
              key={i}
              style={{ flexGrow: Math.max(1, s.noteCount) }}
              data-state={i === section ? "current" : i < section ? "done" : "todo"}
              title={sectionNames[i]}
            >
              {i === section && (
                <span
                  className="progress-fill"
                  style={{ width: `${s.noteCount ? (100 * Math.max(0, next - s.firstNote)) / s.noteCount : 100}%` }}
                />
              )}
            </li>
          ))}
        </ol>
        <button type="button" className="btn btn-quiet" onClick={pause} disabled={phase !== "playing"}>
          {t("play.pause")}
        </button>
      </div>

      <div className="play-body">
        <div className="play-score" aria-live="off">
          <p className="stat">
            <span className="stat-label">{t("play.score")}</span>
            <span className="stat-value">{score.points.toLocaleString()}</span>
          </p>
          <p className="multiplier" data-level={multiplier(score.combo)}>
            ×{multiplier(score.combo)}
          </p>
          <p className="stat">
            <span className="stat-label">{t("play.streak")}</span>
            <span className="stat-value stat-small">{score.combo}</span>
          </p>
        </div>

        <div className="highway-wrap">
          <canvas ref={canvas} className="highway" aria-label={sectionNames[section]} />
          {phase === "countdown" && (
            <div className="countdown" aria-live="assertive">
              {count}
            </div>
          )}
          {phase === "paused" && (
            <div className="pause-menu" role="dialog" aria-label={t("play.paused")}>
              <h2>{t("play.paused")}</h2>
              <button type="button" className="btn btn-primary btn-big" onClick={resume} autoFocus>
                {t("play.resume")}
              </button>
              <button type="button" className="btn" onClick={restart}>
                {t("play.restart")}
              </button>
              <button type="button" className="btn" onClick={onQuit}>
                {t("play.quit")}
              </button>
            </div>
          )}
        </div>

        <div className="play-cube">
          <Cube3D
            ref={cube}
            state={chart.start}
            puzzle={chart.puzzle.id}
            stickerless
            label={t("app.name")}
            timing={{ turnMs: Math.min(200, msPerBeat * 0.45), pauseMs: 0 }}
          />
          {now && (
            <div className="lyrics">
              <p className="lyric-now">
                <span className="lyric-label">{t("play.now")}</span>
                {now}
              </p>
              {then && (
                <p className="lyric-next">
                  <span className="lyric-label">{t("play.next")}</span>
                  {then}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
