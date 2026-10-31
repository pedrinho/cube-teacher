// Pick a song (the method, or the pyraminx), a speed and where the cube comes from, then play or
// watch. The keys can be changed here too.
import { useEffect, useState } from "react";
import { useI18n, type MessageKey } from "../i18n";
import { BPM, SPEEDS, loadBest, type CubeSource, type Setup as SetupChoice } from "../settings";
import { puzzleOf, type Method } from "../game/chart";
import {
  DEFAULT_KEYS,
  LETTERS,
  PYRAMINX_LANES,
  gameKey,
  isBindableKey,
  keyLabel,
  kindOf,
  letterOfKey,
  moveOfLetter,
  rebind,
  type KeyMap,
  type Letter,
} from "../game/lanes";

interface Props {
  setup: SetupChoice;
  keys: KeyMap;
  onChange: (setup: SetupChoice) => void;
  onKeysChange: (keys: KeyMap) => void;
  onPlay: (watch: boolean) => void;
}

const TITLE: { letter: string; color: string }[] = [
  { letter: "C", color: "W" },
  { letter: "U", color: "Y" },
  { letter: "B", color: "G" },
  { letter: "E", color: "B" },
  { letter: "H", color: "R" },
  { letter: "E", color: "O" },
  { letter: "R", color: "G" },
  { letter: "O", color: "Y" },
];

function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; title: string; text?: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="choice">
      <legend>{label}</legend>
      <div className="choice-options">
        {options.map((o) => (
          <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
            <span className="choice-title">{o.title}</span>
            {o.text && <span className="choice-text">{o.text}</span>}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

const ROWS = ["1234567890", "QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

/** The code of a key drawn on the keyboard. */
const codeOf = (cap: string) => (/\d/.test(cap) ? `Digit${cap}` : `Key${cap}`);

/**
 * A keyboard with the song's keys lit, each drawn like the notes it plays. A key that plays
 * another letter shows that letter, with its own in the corner.
 */
function Keyboard({ keys, letters }: { keys: KeyMap; letters: readonly Letter[] }) {
  return (
    <div className="kb" aria-hidden="true">
      {ROWS.map((row) => (
        <div key={row} className="kb-row">
          {[...row].map((cap) => {
            const bound = letterOfKey(codeOf(cap), keys);
            const letter = bound && letters.includes(bound) ? bound : undefined;
            return (
              <span key={cap} className="kb-key" data-kind={letter && kindOf(letter)}>
                {letter ?? cap}
                {letter && letter !== cap && <small className="kb-legend">{cap}</small>}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

type KeyGroup = { title: MessageKey; letters: Letter[] };

const KEY_GROUPS: KeyGroup[] = [
  { title: "keys.faces", letters: ["U", "D", "L", "R", "F", "B"] },
  { title: "keys.slices", letters: ["M", "E", "S"] },
  { title: "keys.turns", letters: ["X", "Y", "Z"] },
];

/**
 * The pyraminx's letters, in the order of its lanes. They are the cube's U L R B, but the pyraminx
 * has keys of its own, so changing them here leaves the cube's alone.
 */
const PYRAMINX_KEY_GROUPS: KeyGroup[] = [{ title: "keys.corners", letters: [...PYRAMINX_LANES] }];

/**
 * Change a letter's key: click it, then press the new key. Esc cancels. Only the letters shown
 * count: on the pyraminx, a key taken from a cube-only letter (M) quietly gives it the old one.
 */
function KeyEditor({ keys, groups, onChange }: { keys: KeyMap; groups: KeyGroup[]; onChange: (keys: KeyMap) => void }) {
  const { t } = useI18n();
  const [waiting, setWaiting] = useState<Letter | null>(null);
  const [status, setStatus] = useState("");
  const shown = (l: Letter) => groups.some((g) => g.letters.includes(l));
  const standard = LETTERS.every((l) => !shown(l) || keys[l] === DEFAULT_KEYS[l]);

  useEffect(() => {
    if (!waiting) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.code === "Escape") {
        e.preventDefault();
        setWaiting(null);
        setStatus("");
        return;
      }
      const code = gameKey(e.code);
      if (!isBindableKey(code)) return;
      e.preventDefault();
      const other = letterOfKey(code, keys);
      const move = moveOfLetter(waiting);
      const key = keyLabel(code);
      setStatus(
        other && other !== waiting && groups.some((g) => g.letters.includes(other))
          ? t("keys.swapped", { move, key, other: moveOfLetter(other), otherKey: keyLabel(keys[waiting]) })
          : t("keys.done", { move, key }),
      );
      onChange(rebind(keys, waiting, code));
      setWaiting(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [waiting, keys, groups, onChange, t]);

  const pick = (letter: Letter) => {
    setWaiting(waiting === letter ? null : letter);
    setStatus("");
  };

  return (
    <section className="keys" aria-labelledby="keys-title">
      <h3 id="keys-title">{t("keys.title")}</h3>
      {groups.map((g) => (
        <div key={g.title} className="keys-group">
          <span className="keys-group-title">{t(g.title)}</span>
          <div className="keys-row">
            {g.letters.map((l) => (
              <button
                key={l}
                type="button"
                className="keybind"
                aria-pressed={waiting === l}
                aria-label={t("keys.change", { move: moveOfLetter(l), key: keyLabel(keys[l]) })}
                onClick={() => pick(l)}
              >
                <span className="keybind-move">{moveOfLetter(l)}</span>
                <span className="kb-key" data-kind={kindOf(l)}>
                  {waiting === l ? "…" : keyLabel(keys[l])}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
      <p className="keys-status" aria-live="polite">
        {waiting ? t("keys.waiting", { move: moveOfLetter(waiting) }) : status || t("keys.hint")}
      </p>
      {!standard && (
        <button
          type="button"
          className="btn btn-quiet keys-reset"
          onClick={() => {
            onChange(DEFAULT_KEYS);
            setWaiting(null);
            setStatus("");
          }}
        >
          {t("keys.reset")}
        </button>
      )}
    </section>
  );
}

export function Setup({ setup, keys, onChange, onKeysChange, onPlay }: Props) {
  const { t } = useI18n();
  const best = loadBest(setup.method, setup.speed);
  const keyNames = Object.fromEntries(LETTERS.map((l) => [l, keyLabel(keys[l])]));
  const pyraminx = setup.method === "pyraminx";

  return (
    <div className="setup">
      <section className="setup-main">
        <h1 className="title" aria-label={t("app.name")}>
          {TITLE.map((c, i) => (
            <span key={i} className="title-key" data-color={c.color} aria-hidden="true">
              {c.letter}
            </span>
          ))}
        </h1>
        <p className="lead">{t("setup.lead")}</p>

        <Choice<Method>
          label={t("setup.song")}
          value={setup.method}
          onChange={(method) => onChange({ ...setup, method })}
          options={[
            { value: "layers", title: t("setup.layers"), text: t("setup.layersText") },
            { value: "fridrich", title: t("setup.fridrich"), text: t("setup.fridrichText") },
            { value: "pyraminx", title: t("setup.pyraminx"), text: t("setup.pyraminxText") },
          ]}
        />
        <Choice
          label={t("setup.speed")}
          value={setup.speed}
          onChange={(speed) => onChange({ ...setup, speed })}
          options={SPEEDS.map((s) => ({
            value: s,
            title: t(`speed.${s}` as MessageKey),
            text: t("speed.bpm", { n: BPM[s] }),
          }))}
        />
        {/* A pyraminx is always scrambled at random. */}
        {!pyraminx && (
          <Choice<CubeSource>
            label={t("setup.cube")}
            value={setup.cube}
            onChange={(cube) => onChange({ ...setup, cube })}
            options={[
              { value: "random", title: t("setup.random") },
              { value: "paint", title: t("setup.paint") },
            ]}
          />
        )}

        <div className="btn-row setup-actions">
          <button type="button" className="btn btn-primary btn-big" onClick={() => onPlay(false)}>
            {t("setup.play")}
          </button>
          <button type="button" className="btn" onClick={() => onPlay(true)}>
            {t("setup.watch")}
          </button>
        </div>
        {best !== undefined && <p className="best">{t("setup.best", { score: best.toLocaleString() })}</p>}
      </section>

      <aside className="setup-how">
        <h2>{t("setup.howTitle")}</h2>
        <Keyboard keys={keys} letters={puzzleOf(setup.method).letters} />
        <ul className="how">
          <li>{t("setup.how1", keyNames)}</li>
          <li>{t(pyraminx ? "setup.pyHow2" : "setup.how2", keyNames)}</li>
          <li>{t(pyraminx ? "setup.pyHow3" : "setup.how3", keyNames)}</li>
          <li>{t("setup.how4")}</li>
        </ul>
        {/* A new editor for each puzzle, so a letter picked on one isn't still waiting on the other. */}
        <KeyEditor
          key={puzzleOf(setup.method).id}
          keys={keys}
          groups={pyraminx ? PYRAMINX_KEY_GROUPS : KEY_GROUPS}
          onChange={onKeysChange}
        />
      </aside>
    </div>
  );
}
