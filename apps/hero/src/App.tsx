// Screens: levels (home), then a level's song: ready → song → results. The sound engine lives for
// the whole visit so the audio context, started by the first click on a level, keeps running.
import { useEffect, useRef, useState } from "react";
import { useI18n, type Lang, type MessageKey } from "./i18n";
import { Sound } from "./game/audio";
import { holdCount, type Chart } from "./game/chart";
import { CHAPTERS, isOpen, levelChart, nextLevel, numberOf, type Level } from "./game/levels";
import { maxPoints, stars as starsFor, type Score } from "./game/score";
import { LETTERS, keyLabel, type KeyMap } from "./game/lanes";
import { keysFor, type KeySet } from "./game/puzzles";
import { loadKeys, loadMuted, loadProgress, saveKeys, saveLevel, saveMuted, type Progress } from "./settings";
import { Levels } from "./screens/Levels";
import { Ready } from "./screens/Ready";
import { Play } from "./screens/Play";
import { Results } from "./screens/Results";

type Screen =
  | { kind: "levels" }
  | { kind: "ready"; chart: Chart; level: Level }
  | { kind: "play"; chart: Chart; level: Level; run: number }
  | { kind: "results"; chart: Chart; level: Level; score: Score; newBest: boolean };

export function App() {
  const { t, lang, setLang } = useI18n();
  const [keys, setKeysState] = useState(() => ({ cube: loadKeys("cube"), pyraminx: loadKeys("pyraminx") }));
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

  const changeKeys = (set: KeySet, next: KeyMap) => {
    setKeysState((all) => ({ ...all, [set]: next }));
    saveKeys(set, next);
  };

  const toggleMuted = () => {
    setMutedState(!muted);
    saveMuted(!muted);
    sound.current?.setMuted(!muted);
  };

  const home = () => setScreen({ kind: "levels" });

  const play = (chart: Chart, level: Level) => {
    audio();
    setScreen({ kind: "play", chart, level, run: ++runs.current });
  };

  const openLevel = (level: Level) => {
    audio();
    setScreen({ kind: "ready", chart: levelChart(level), level });
  };

  const finish = (chart: Chart, level: Level, score: Score) => {
    const stars = starsFor(score.points, maxPoints(chart.notes.length, holdCount(chart)));
    const newBest = saveLevel(level.id, { stars, points: score.points });
    setProgress(loadProgress());
    setScreen({ kind: "results", chart, level, score, newBest });
  };

  /** Where a level is: "Chapter 1 · Easy · Level 2". */
  const whereIs = (level: Level) =>
    [
      t("levels.chapter", { n: CHAPTERS.indexOf(level.chapter) + 1 }),
      t(`chapter.${level.chapter}` as MessageKey),
      t("levels.level", { n: numberOf(level) }),
    ].join(" · ");

  const playing = screen.kind === "play";

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
        {screen.kind === "levels" && <Levels progress={progress} keys={keys} onKeysChange={changeKeys} onPlay={openLevel} />}
        {screen.kind === "ready" && (
          <Ready
            chart={screen.chart}
            title={t(screen.level.title)}
            subtitle={whereIs(screen.level)}
            bpm={screen.level.bpm}
            about={t(screen.level.about, keyNames(keysFor(screen.chart.puzzle, keys)))}
            keys={keysFor(screen.chart.puzzle, keys)}
            best={progress[screen.level.id]?.points}
            onStart={() => play(screen.chart, screen.level)}
            onBack={home}
          />
        )}
        {screen.kind === "play" && (
          <Play
            key={screen.run}
            chart={screen.chart}
            bpm={screen.level.bpm}
            keys={keysFor(screen.chart.puzzle, keys)}
            sound={sound.current!}
            onDone={(score) => finish(screen.chart, screen.level, score)}
            onQuit={home}
          />
        )}
        {screen.kind === "results" && (
          <Results
            score={screen.score}
            maxPoints={maxPoints(screen.chart.notes.length, holdCount(screen.chart))}
            newBest={screen.newBest}
            onNext={nextOf(screen.level, progress, openLevel)}
            onAgain={() => play(screen.chart, screen.level)}
            onLevels={home}
          />
        )}
      </main>
    </>
  );
}

/** What is printed on each letter's key, for texts that name them: "press {U}". */
const keyNames = (keys: KeyMap) => Object.fromEntries(LETTERS.map((l) => [l, keyLabel(keys[l])]));

/** Opens the level after this one, if there is one and it is open. */
function nextOf(level: Level, progress: Progress, open: (level: Level) => void) {
  const next = nextLevel(level);
  return next && isOpen(progress, next) ? () => open(next) : undefined;
}
