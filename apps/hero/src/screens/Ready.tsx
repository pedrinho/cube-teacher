// Before a level's song: its puzzle in 3D, what the level is about, then the song's steps and the
// keys it uses, and the keys that spin the puzzle to look at it. Start is right under the title, so
// it never needs scrolling to.
import { useEffect, useRef } from "react";
import { Cube3D, type Cube3DHandle } from "cube-kit/react/Cube3D";
import { useI18n } from "../i18n";
import type { Chart } from "../game/chart";
import { LETTERS, keyLabel, kindOf, letterOf, moveOfLetter, type KeyMap } from "../game/lanes";
import { spinKeys } from "../game/puzzles";
import { useSpinKeys } from "./spin";

interface Props {
  chart: Chart;
  title: string;
  /** Where the level is. */
  subtitle: string;
  /** Beats a minute, for the song's length. */
  bpm: number;
  /** What the level is about. */
  about: string;
  keys: KeyMap;
  best?: number;
  onStart: () => void;
  onBack: () => void;
}

function minutes(seconds: number) {
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function Ready({ chart, title, subtitle, bpm, about, keys, best, onStart, onBack }: Props) {
  const { t } = useI18n();
  const used = LETTERS.filter((l) => chart.notes.some((n) => letterOf(n.move) === l));
  const cube = useRef<Cube3DHandle>(null);
  useSpinKeys(cube, chart.puzzle, keys);
  const spins = [...spinKeys(chart.puzzle, keys)];

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

  return (
    <div className="screen ready">
      <div className="ready-cube">
        <Cube3D ref={cube} state={chart.start} puzzle={chart.puzzle.id} stickerless label={t("ready.cube")} />
      </div>

      <div className="ready-info">
        <p className="ready-eyebrow">{t("ready.eyebrow")}</p>
        <h1>{title}</h1>
        <p className="ready-speed">{subtitle}</p>

        {best !== undefined && <p className="best">{t("ready.best", { score: best.toLocaleString() })}</p>}

        <div className="btn-row ready-actions">
          <button type="button" className="btn btn-primary btn-big" onClick={onStart} autoFocus>
            {t("ready.start")}
          </button>
          <button type="button" className="btn btn-quiet" onClick={onBack}>
            {t("ready.back")}
          </button>
        </div>

        <section className="ready-block" aria-labelledby="ready-about">
          <h2 id="ready-about">{t("ready.aboutTitle")}</h2>
          <p>{about}</p>
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
          {spins.length > 0 && (
            <>
              <p className="ready-keys-title ready-spin-title" id="ready-spin">
                {t("ready.spinTitle")}
              </p>
              <ul className="ready-keys" aria-labelledby="ready-spin">
                {spins.map(([code, turn]) => (
                  <li key={code} className="ready-key">
                    {turn}
                    <span className="kb-key" data-kind="turn">
                      {keyLabel(code)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="ready-spin-note">{t("ready.spinNote")}</p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
