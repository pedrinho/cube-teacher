// The player's keys: each letter the songs play, next to the key that plays it, the cubes' and the
// pyraminxes' apart. Click one, then press another letter or number key; a letter that had that
// key takes the old one. The colored letters go in the order of their number keys, 1 to 6, each
// keycap in its color.
import { useEffect, useState } from "react";
import { useI18n, type MessageKey } from "../i18n";
import {
  LETTERS,
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
import { DEFAULT_KEYS, HOME_COLORS, type KeySet } from "../game/puzzles";

type KeyGroup = { set: KeySet; title: MessageKey; letters: Letter[] };

/** A kind of puzzle's colored letters, in the order of their number keys. */
const byNumber = (set: KeySet) =>
  (Object.keys(HOME_COLORS[set]) as Letter[]).sort((a, b) => DEFAULT_KEYS[set][a].localeCompare(DEFAULT_KEYS[set][b]));

const KEY_GROUPS: KeyGroup[] = [
  { set: "cube", title: "keys.faces", letters: byNumber("cube") },
  { set: "cube", title: "keys.slices", letters: ["M", "E", "S"] },
  { set: "cube", title: "keys.turns", letters: ["X", "Y", "Z"] },
  { set: "pyraminx", title: "keys.corners", letters: byNumber("pyraminx") },
];

const SETS: KeySet[] = ["cube", "pyraminx"];

/** Whether a kind of puzzle shows a letter here: the pyraminx only has its four corners. */
const shown = (set: KeySet, letter: Letter) => KEY_GROUPS.some((g) => g.set === set && g.letters.includes(letter));

/**
 * Change a letter's key: click it, then press the new key. Esc cancels. Only the letters shown
 * count: on the pyraminx, a key taken from a letter it doesn't play (M) quietly gives it the old one.
 */
export function KeyEditor({ keys, onChange }: { keys: Record<KeySet, KeyMap>; onChange: (set: KeySet, keys: KeyMap) => void }) {
  const { t } = useI18n();
  const [waiting, setWaiting] = useState<{ set: KeySet; letter: Letter } | null>(null);
  const [status, setStatus] = useState("");
  const standard = SETS.every((set) => LETTERS.every((l) => !shown(set, l) || keys[set][l] === DEFAULT_KEYS[set][l]));

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
      const { set, letter } = waiting;
      const setKeys = keys[set];
      const other = letterOfKey(code, setKeys);
      const move = moveOfLetter(letter);
      const key = keyLabel(code);
      setStatus(
        other && other !== letter && shown(set, other)
          ? t("keys.swapped", { move, key, other: moveOfLetter(other), otherKey: keyLabel(setKeys[letter]) })
          : t("keys.done", { move, key }),
      );
      onChange(set, rebind(setKeys, letter, code));
      setWaiting(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [waiting, keys, onChange, t]);

  const isWaiting = (set: KeySet, letter: Letter) => waiting?.set === set && waiting.letter === letter;

  const pick = (set: KeySet, letter: Letter) => {
    setWaiting(isWaiting(set, letter) ? null : { set, letter });
    setStatus("");
  };

  return (
    <section className="keys" aria-labelledby="keys-title">
      <h3 id="keys-title">{t("keys.title")}</h3>
      {KEY_GROUPS.map((g) => (
        <div key={g.title} className="keys-group">
          <span className="keys-group-title">{t(g.title)}</span>
          <div className="keys-row">
            {g.letters.map((l) => (
              <button
                key={l}
                type="button"
                className="keybind"
                aria-pressed={isWaiting(g.set, l)}
                aria-label={t("keys.change", { move: moveOfLetter(l), key: keyLabel(keys[g.set][l]) })}
                onClick={() => pick(g.set, l)}
              >
                <span className="keybind-move">{moveOfLetter(l)}</span>
                <span className="kb-key" data-kind={kindOf(l)} data-color={HOME_COLORS[g.set][l]}>
                  {isWaiting(g.set, l) ? "…" : keyLabel(keys[g.set][l])}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
      <p className="keys-status" aria-live="polite">
        {waiting ? t("keys.waiting", { move: moveOfLetter(waiting.letter) }) : status || t("keys.hint")}
      </p>
      {!standard && (
        <button
          type="button"
          className="btn btn-quiet keys-reset"
          onClick={() => {
            for (const set of SETS) onChange(set, DEFAULT_KEYS[set]);
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
