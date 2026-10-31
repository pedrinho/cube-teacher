// Before the song: the scrambled puzzle in 3D, the turns that scramble a real one the same way
// (they can be played on the 3D one too), or what a level is about, then the song's steps and the
// keys it uses. Start (right under the title, so it never needs scrolling to), or ask for another
// scramble.
import { useEffect, useRef, useState } from "react";
import type { Move } from "cube-kit/cube/model";
import { Cube3D, type Cube3DHandle } from "cube-kit/react/Cube3D";
import { Moves } from "cube-kit/react/Moves";
import { useI18n } from "../i18n";
import type { Chart } from "../game/chart";
import { LETTERS, keyLabel, kindOf, letterOf, moveOfLetter, type KeyMap } from "../game/lanes";

interface Props {
  chart: Chart;
  title: string;
  /** The speed, or where the level is. */
  subtitle: string;
  /** Beats a minute, for the song's length. */
  bpm: number;
  /** The turns that made the start, or none when the cube was painted. */
  scramble?: Move[];
  /** What a level is about, in place of the scramble. */
  about?: string;
  keys: KeyMap;
  watch: boolean;
  best?: number;
  onStart: () => void;
  /** A new random scramble (only for random ones). */
  onShuffle?: () => void;
  onBack: () => void;
}

/** Showing the scramble on the 3D puzzle goes a bit quicker than a lesson demo. */
const SHOW = { turnMs: 300, pauseMs: 120 };

function minutes(seconds: number) {
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function Ready({ chart, title, subtitle, bpm, scramble, about, keys, watch, best, onStart, onShuffle, onBack }: Props) {
  const { t } = useI18n();
  const cube = useRef<Cube3DHandle>(null);
  const [showing, setShowing] = useState<number | null>(null);
  const pyraminx = chart.puzzle.id === "pyraminx";
  const used = LETTERS.filter((l) => chart.notes.some((n) => letterOf(n.move) === l));

  // Enter starts too, unless it is pressing another button.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || (e.target as HTMLElement).closest("button")) return;
      e.preventDefault();
      onStart();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onStart]);

  const show = () => {
    if (!scramble) return;
    setShowing(0);
    void cube.current
      ?.play(scramble, { from: chart.puzzle.solved, onStep: (i) => setShowing(i) })
      .then(() => setShowing(null));
  };

  return (
    <div className="screen ready">
      <div className="ready-cube">
        <Cube3D ref={cube} state={chart.start} puzzle={chart.puzzle.id} stickerless label={t("ready.cube")} timing={SHOW} />
      </div>

      <div className="ready-info">
        <p className="ready-eyebrow">{t("ready.eyebrow")}</p>
        <h1>{title}</h1>
        <p className="ready-speed">{subtitle}</p>

        {best !== undefined && !watch && <p className="best">{t("setup.best", { score: best.toLocaleString() })}</p>}

        <div className="btn-row ready-actions">
          <button type="button" className="btn btn-primary btn-big" onClick={onStart} autoFocus>
            {t(watch ? "ready.watch" : "ready.start")}
          </button>
          {onShuffle && (
            <button type="button" className="btn" onClick={onShuffle}>
              {t("ready.shuffle")}
            </button>
          )}
          <button type="button" className="btn btn-quiet" onClick={onBack}>
            {t("ready.back")}
          </button>
        </div>

        <section className="ready-block" aria-labelledby="ready-scramble">
          <h2 id="ready-scramble">{t(scramble ? "ready.scrambleTitle" : about ? "ready.aboutTitle" : "ready.paintedTitle")}</h2>
          {about ? (
            <p>{about}</p>
          ) : scramble ? (
            <>
              <p>{t(pyraminx ? "ready.holdPyraminx" : "ready.holdCube")}</p>
              <Moves alg={scramble} current={showing ?? undefined} small />
              <button type="button" className="btn btn-quiet ready-show" onClick={show} disabled={showing !== null}>
                {t("ready.show")}
              </button>
            </>
          ) : (
            <p>{t("ready.painted")}</p>
          )}
        </section>

        <section className="ready-block" aria-labelledby="ready-song">
          <h2 id="ready-song">{t("ready.songTitle")}</h2>
          <ol className="ready-steps">
            {chart.sections.map((s, i) => (
              <li key={i}>
                {t(s.title)}
                <small>{s.noteCount}</small>
              </li>
            ))}
          </ol>
          <p className="ready-length">
            {t("ready.length", { notes: chart.notes.length, time: minutes((chart.length * 60) / bpm) })}
          </p>
          <p className="ready-keys-title" id="ready-keys">
            {t("ready.keysTitle")}
          </p>
          <ul className="ready-keys" aria-labelledby="ready-keys">
            {used.map((l) => (
              <li key={l} className="ready-key">
                {/* The space bar plays every note of its song: no move to name. */}
                {!chart.puzzle.bar && moveOfLetter(l)}
                <span className="kb-key" data-kind={kindOf(l)} data-wide={keys[l] === "Space" || undefined}>
                  {keys[l] === "Space" ? t("key.space") : keyLabel(keys[l])}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
