// Screens: setup → (paint) → song → results. The sound engine lives for the whole visit so the
// audio context, started by the first Play click, keeps running.
import { useEffect, useRef, useState } from "react";
import { SOLVED, applyAlg, randomScramble, type CubeState } from "cube-kit/cube/model";
import { solveFridrich } from "cube-kit/methods/fridrich/solver";
import { solveLayers } from "cube-kit/methods/layers/solver";
import { useI18n, type Lang } from "./i18n";
import { Sound } from "./game/audio";
import { buildChart, type Chart } from "./game/chart";
import { maxPoints, type Score } from "./game/score";
import { BPM, SPEEDS, loadMuted, loadSetup, saveBest, saveMuted, saveSetup, type Setup as SetupChoice } from "./settings";
import { Setup } from "./screens/Setup";
import { Paint } from "./screens/Paint";
import { Play } from "./screens/Play";
import { Results } from "./screens/Results";

type Screen =
  | { kind: "setup" }
  | { kind: "paint"; watch: boolean }
  | { kind: "play"; chart: Chart; watch: boolean; run: number }
  | { kind: "results"; chart: Chart; watch: boolean; score: Score; newBest: boolean };

function songFor(setup: SetupChoice, start: CubeState): Chart {
  const stages = setup.method === "layers" ? solveLayers(start) : solveFridrich(start, "twoLook");
  return buildChart(setup.method, start, stages);
}

export function App() {
  const { t, lang, setLang } = useI18n();
  const [setup, setSetupState] = useState(loadSetup);
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

  const toggleMuted = () => {
    setMutedState(!muted);
    saveMuted(!muted);
    sound.current?.setMuted(!muted);
  };

  const play = (start: CubeState, watch: boolean) => {
    audio();
    setScreen({ kind: "play", chart: songFor(setup, start), watch, run: ++runs.current });
  };

  const begin = (watch: boolean, choice = setup) => {
    audio();
    if (choice.cube === "paint") setScreen({ kind: "paint", watch });
    else play(applyAlg(SOLVED, randomScramble()), watch);
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
        {screen.kind === "setup" && <Setup setup={setup} onChange={changeSetup} onPlay={(watch) => begin(watch)} />}
        {screen.kind === "paint" && (
          <Paint onDone={(state) => play(state, screen.watch)} onBack={() => setScreen({ kind: "setup" })} />
        )}
        {screen.kind === "play" && (
          <Play
            key={screen.run}
            chart={screen.chart}
            bpm={BPM[setup.speed]}
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
