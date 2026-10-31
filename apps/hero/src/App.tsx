// Screens: levels (home). A level's own song: ready → song → results. The real-cubes level:
// setup → (paint) → ready → song → results. The sound engine lives for the whole visit so the audio
// context, started by the first Play click, keeps running.
import { useEffect, useRef, useState } from "react";
import { SOLVED, applyAlg, randomScramble, type CubeState, type Move } from "cube-kit/cube/model";
import { solveFridrich } from "cube-kit/methods/fridrich/solver";
import { solveLayers } from "cube-kit/methods/layers/solver";
import { PYRA_SOLVED, applyPyraAlg, randomPyraScramble } from "cube-kit/pyraminx/model";
import { solvePyraminx } from "cube-kit/pyraminx/solver";
import { useI18n, type Lang, type MessageKey } from "./i18n";
import { Sound } from "./game/audio";
import { buildChart, holdCount, puzzleOf, type Chart, type Method } from "./game/chart";
import {
  CHAPTERS,
  PASS_STARS,
  REAL_CUBES,
  isOpen,
  levelChart,
  nextLevel,
  numberOf,
  passed,
  type Level,
  type SongLevel,
} from "./game/levels";
import { maxPoints, stars as starsFor, type Score } from "./game/score";
import type { KeyMap } from "./game/lanes";
import { keysFor, type KeySet } from "./game/puzzles";
import {
  BPM,
  SPEEDS,
  loadBest,
  loadKeys,
  loadMuted,
  loadProgress,
  loadSetup,
  saveBest,
  saveKeys,
  saveLevel,
  saveMuted,
  saveSetup,
  type Progress,
  type Setup as SetupChoice,
} from "./settings";
import { Levels } from "./screens/Levels";
import { Setup } from "./screens/Setup";
import { Paint } from "./screens/Paint";
import { Ready } from "./screens/Ready";
import { Play } from "./screens/Play";
import { Results } from "./screens/Results";

/** `level` is set on a level's own song; without it, the song is one of the real cubes'. */
type Screen =
  | { kind: "levels" }
  | { kind: "setup" }
  | { kind: "paint"; watch: boolean }
  | { kind: "ready"; chart: Chart; level?: SongLevel; scramble?: Move[]; watch: boolean }
  | { kind: "play"; chart: Chart; level?: SongLevel; watch: boolean; run: number }
  | { kind: "results"; chart: Chart; level?: SongLevel; watch: boolean; score: Score; newBest: boolean; firstPass: boolean };

const SONG_NAME: Record<Method, MessageKey> = {
  layers: "setup.layers",
  fridrich: "setup.fridrich",
  pyraminx: "setup.pyraminx",
};

function songFor(setup: SetupChoice, start: CubeState): Chart {
  const stages =
    setup.method === "pyraminx"
      ? solvePyraminx(start)
      : setup.method === "layers"
        ? solveLayers(start)
        : solveFridrich(start, "twoLook");
  return buildChart(setup.method, start, stages);
}

export function App() {
  const { t, lang, setLang } = useI18n();
  const [setup, setSetupState] = useState(loadSetup);
  // The cube and the pyraminx each have their own keys: both cube songs share the cube's.
  const [keys, setKeysState] = useState<Record<KeySet, KeyMap>>(() => ({
    cube: loadKeys("cube"),
    pyraminx: loadKeys("pyraminx"),
  }));
  const [progress, setProgress] = useState(loadProgress);
  const [screen, setScreen] = useState<Screen>({ kind: "levels" });
  const [muted, setMutedState] = useState(loadMuted);
  const sound = useRef<Sound | null>(null);
  const runs = useRef(0);

  const audio = () => {
    sound.current ??= new Sound();
    sound.current.setMuted(muted);
    sound.current.start();
    return sound.current;
  };

  const changeSetup = (next: SetupChoice) => {
    setSetupState(next);
    saveSetup(next);
  };

  const changeKeys = (set: KeySet, next: KeyMap) => {
    setKeysState({ ...keys, [set]: next });
    saveKeys(set, next);
  };

  const toggleMuted = () => {
    setMutedState(!muted);
    saveMuted(!muted);
    sound.current?.setMuted(!muted);
  };

  const home = () => setScreen({ kind: "levels" });

  /** The song for a start is worked out here, so the ready screen can show it. */
  const ready = (start: CubeState, watch: boolean, scramble?: Move[], choice = setup) =>
    setScreen({ kind: "ready", chart: songFor(choice, start), scramble, watch });

  const play = (chart: Chart, watch: boolean, level?: SongLevel) => {
    audio();
    setScreen({ kind: "play", chart, level, watch, run: ++runs.current });
  };

  const begin = (watch: boolean, choice = setup) => {
    audio();
    // The pyraminx can't be painted (yet): it is always scrambled at random.
    if (choice.method === "pyraminx") {
      const scramble = randomPyraScramble();
      ready(applyPyraAlg(PYRA_SOLVED, scramble), watch, scramble, choice);
    } else if (choice.cube === "paint") setScreen({ kind: "paint", watch });
    else {
      const scramble = randomScramble();
      ready(applyAlg(SOLVED, scramble), watch, scramble, choice);
    }
  };

  const openLevel = (level: Level) => {
    if (level.kind === "choice") return setScreen({ kind: "setup" });
    audio();
    setScreen({ kind: "ready", chart: levelChart(level), level, watch: false });
  };

  const finish = (chart: Chart, watch: boolean, score: Score, level?: SongLevel) => {
    const stars = starsFor(score.points, maxPoints(chart.notes.length, holdCount(chart)));
    const firstPass = !watch && !level && !passed(progress, REAL_CUBES) && stars >= PASS_STARS;
    let newBest = false;
    if (!watch) {
      // The real cubes' songs keep their best per song and speed too.
      const levelBest = saveLevel((level ?? REAL_CUBES).id, { stars, points: score.points });
      newBest = level ? levelBest : saveBest(setup.method, setup.speed, score.points);
      setProgress(loadProgress());
    }
    setScreen({ kind: "results", chart, level, watch, score, newBest, firstPass });
  };

  const faster = () => {
    const speed = SPEEDS[Math.min(SPEEDS.indexOf(setup.speed) + 1, SPEEDS.length - 1)];
    const next = { ...setup, speed };
    changeSetup(next);
    begin(false, next);
  };

  /** Where a level is: "Chapter 1 · Easy · Level 2". */
  const whereIs = (level: Level) =>
    [
      t("levels.chapter", { n: CHAPTERS.indexOf(level.chapter) + 1 }),
      t(`chapter.${level.chapter}` as MessageKey),
      t("levels.level", { n: numberOf(level) }),
    ].join(" · ");

  const playing = screen.kind === "play";
  const setKeys = puzzleOf(setup.method).keySet;

  // Each screen starts at the top (the song needs the whole window).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);

  return (
    <>
      <header className="bar" data-home={screen.kind === "levels" || undefined}>
        <button type="button" className="brand" onClick={home} disabled={playing}>
          {t("app.name")}
        </button>
        <div className="bar-tools">
          <button type="button" className="btn btn-quiet sound" aria-pressed={!muted} onClick={toggleMuted}>
            {t(muted ? "sound.off" : "sound.on")}
          </button>
          <div className="lang" role="group" aria-label={t("lang.label")}>
            {(["en", "pt"] as Lang[]).map((l) => (
              <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>
      <main className="page" data-screen={screen.kind}>
        {screen.kind === "levels" && <Levels progress={progress} onPlay={openLevel} />}
        {screen.kind === "setup" && (
          <Setup
            setup={setup}
            keys={keys[setKeys]}
            onChange={changeSetup}
            onKeysChange={(next) => changeKeys(setKeys, next)}
            onPlay={(watch) => begin(watch)}
            onBack={home}
          />
        )}
        {screen.kind === "paint" && (
          <Paint onDone={(state) => ready(state, screen.watch)} onBack={() => setScreen({ kind: "setup" })} />
        )}
        {screen.kind === "ready" &&
          (screen.level ? (
            <Ready
              chart={screen.chart}
              title={t(screen.level.title)}
              subtitle={whereIs(screen.level)}
              bpm={screen.level.bpm}
              about={t(screen.level.about)}
              keys={keysFor(screen.chart.puzzle, keys)}
              watch={false}
              best={progress[screen.level.id]?.points}
              onStart={() => play(screen.chart, false, screen.level)}
              onBack={home}
            />
          ) : (
            <Ready
              chart={screen.chart}
              title={t(SONG_NAME[setup.method])}
              subtitle={`${t(`speed.${setup.speed}` as MessageKey)} · ${t("speed.bpm", { n: BPM[setup.speed] })}`}
              bpm={BPM[setup.speed]}
              scramble={screen.scramble}
              keys={keysFor(screen.chart.puzzle, keys)}
              watch={screen.watch}
              best={loadBest(setup.method, setup.speed)}
              onStart={() => play(screen.chart, screen.watch)}
              onShuffle={screen.scramble && (() => begin(screen.watch))}
              onBack={() => setScreen({ kind: "setup" })}
            />
          ))}
        {screen.kind === "play" && (
          <Play
            key={screen.run}
            chart={screen.chart}
            bpm={screen.level?.bpm ?? BPM[setup.speed]}
            keys={keysFor(screen.chart.puzzle, keys)}
            auto={screen.watch}
            sound={sound.current!}
            onDone={(score) => finish(screen.chart, screen.watch, score, screen.level)}
            onQuit={() => (screen.level ? home() : setScreen({ kind: "setup" }))}
          />
        )}
        {screen.kind === "results" &&
          (screen.level ? (
            <Results
              score={screen.score}
              maxPoints={maxPoints(screen.chart.notes.length, holdCount(screen.chart))}
              watched={screen.watch}
              newBest={screen.newBest}
              level={{ onNext: nextOf(screen.level, progress, openLevel) }}
              onAgain={() => play(screen.chart, false, screen.level)}
              onLevels={home}
            />
          ) : (
            <Results
              score={screen.score}
              maxPoints={maxPoints(screen.chart.notes.length, holdCount(screen.chart))}
              watched={screen.watch}
              newBest={screen.newBest}
              firstPass={screen.firstPass}
              canGoFaster={setup.speed !== "expert"}
              onAgain={() => begin(false)}
              onFaster={faster}
              onChange={() => setScreen({ kind: "setup" })}
              onLevels={home}
            />
          ))}
      </main>
    </>
  );
}

/** Opens the level after this one, if there is one and it is open. */
function nextOf(level: Level, progress: Progress, open: (level: Level) => void) {
  const next = nextLevel(level);
  return next && isOpen(progress, next) ? () => open(next) : undefined;
}
