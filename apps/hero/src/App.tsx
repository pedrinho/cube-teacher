// Screens: setup → (paint) → ready → song → results. The sound engine lives for the whole visit so
// the audio context, started by the first Play click, keeps running.
import { useEffect, useRef, useState } from "react";
import { SOLVED, applyAlg, randomScramble, type CubeState, type Move } from "cube-kit/cube/model";
import { solveFridrich } from "cube-kit/methods/fridrich/solver";
import { solveLayers } from "cube-kit/methods/layers/solver";
import { PYRA_SOLVED, applyPyraAlg, randomPyraScramble } from "cube-kit/pyraminx/model";
import { solvePyraminx } from "cube-kit/pyraminx/solver";
import { useI18n, type Lang } from "./i18n";
import { Sound } from "./game/audio";
import { buildChart, puzzleOf, type Chart } from "./game/chart";
import { maxPoints, type Score } from "./game/score";
import type { KeyMap } from "./game/lanes";
import type { Puzzle } from "./game/puzzles";
import {
  BPM,
  SPEEDS,
  loadBest,
  loadKeys,
  loadMuted,
  loadSetup,
  saveBest,
  saveKeys,
  saveMuted,
  saveSetup,
  type Setup as SetupChoice,
} from "./settings";
import { Setup } from "./screens/Setup";
import { Paint } from "./screens/Paint";
import { Ready } from "./screens/Ready";
import { Play } from "./screens/Play";
import { Results } from "./screens/Results";

type Screen =
  | { kind: "setup" }
  | { kind: "paint"; watch: boolean }
  | { kind: "ready"; chart: Chart; scramble?: Move[]; watch: boolean }
  | { kind: "play"; chart: Chart; watch: boolean; run: number }
  | { kind: "results"; chart: Chart; watch: boolean; score: Score; newBest: boolean };

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
  const [keys, setKeysState] = useState<Record<Puzzle["id"], KeyMap>>(() => ({
    cube: loadKeys("cube"),
    pyraminx: loadKeys("pyraminx"),
  }));
  const [screen, setScreen] = useState<Screen>({ kind: "setup" });
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

  const changeKeys = (puzzle: Puzzle["id"], next: KeyMap) => {
    setKeysState({ ...keys, [puzzle]: next });
    saveKeys(puzzle, next);
  };

  const toggleMuted = () => {
    setMutedState(!muted);
    saveMuted(!muted);
    sound.current?.setMuted(!muted);
  };

  /** The song for a start is worked out here, so the ready screen can show it. */
  const ready = (start: CubeState, watch: boolean, scramble?: Move[], choice = setup) =>
    setScreen({ kind: "ready", chart: songFor(choice, start), scramble, watch });

  const play = (chart: Chart, watch: boolean) => {
    audio();
    setScreen({ kind: "play", chart, watch, run: ++runs.current });
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

  const finish = (chart: Chart, watch: boolean, score: Score) => {
    const newBest = !watch && saveBest(setup.method, setup.speed, score.points);
    setScreen({ kind: "results", chart, watch, score, newBest });
  };

  const faster = () => {
    const speed = SPEEDS[Math.min(SPEEDS.indexOf(setup.speed) + 1, SPEEDS.length - 1)];
    const next = { ...setup, speed };
    changeSetup(next);
    begin(false, next);
  };

  const playing = screen.kind === "play";

  // Each screen starts at the top (the song needs the whole window).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);

  return (
    <>
      <header className="bar" data-home={screen.kind === "setup" || undefined}>
        <button type="button" className="brand" onClick={() => setScreen({ kind: "setup" })} disabled={playing}>
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
        {screen.kind === "setup" && (
          <Setup
            setup={setup}
            keys={keys[puzzleOf(setup.method).id]}
            onChange={changeSetup}
            onKeysChange={(next) => changeKeys(puzzleOf(setup.method).id, next)}
            onPlay={(watch) => begin(watch)}
          />
        )}
        {screen.kind === "paint" && (
          <Paint onDone={(state) => ready(state, screen.watch)} onBack={() => setScreen({ kind: "setup" })} />
        )}
        {screen.kind === "ready" && (
          <Ready
            chart={screen.chart}
            scramble={screen.scramble}
            speed={setup.speed}
            keys={keys[screen.chart.puzzle.id]}
            watch={screen.watch}
            best={loadBest(setup.method, setup.speed)}
            onStart={() => play(screen.chart, screen.watch)}
            onShuffle={screen.scramble && (() => begin(screen.watch))}
            onBack={() => setScreen({ kind: "setup" })}
          />
        )}
        {screen.kind === "play" && (
          <Play
            key={screen.run}
            chart={screen.chart}
            bpm={BPM[setup.speed]}
            keys={keys[screen.chart.puzzle.id]}
            auto={screen.watch}
            sound={sound.current!}
            onDone={(score) => finish(screen.chart, screen.watch, score)}
            onQuit={() => setScreen({ kind: "setup" })}
          />
        )}
        {screen.kind === "results" && (
          <Results
            score={screen.score}
            maxPoints={maxPoints(screen.chart.notes.length)}
            watched={screen.watch}
            newBest={screen.newBest}
            canGoFaster={setup.speed !== "expert"}
            onAgain={() => begin(false)}
            onFaster={faster}
            onChange={() => setScreen({ kind: "setup" })}
          />
        )}
      </main>
    </>
  );
}
