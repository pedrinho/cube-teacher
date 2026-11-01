// The player's keys: each letter the songs play, next to the key that plays it. Click one, then
// press another letter or number key; a letter that had that key takes the old one.
import { useEffect, useState } from "react";
import { useI18n, type MessageKey } from "../i18n";
import {
  DEFAULT_KEYS,
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

type KeyGroup = { title: MessageKey; letters: Letter[] };

const KEY_GROUPS: KeyGroup[] = [
  { title: "keys.faces", letters: ["U", "D", "L", "R", "F", "B"] },
  { title: "keys.slices", letters: ["M", "E", "S"] },
  { title: "keys.turns", letters: ["X", "Y", "Z"] },
];

/** Change a letter's key: click it, then press the new key. Esc cancels. */
export function KeyEditor({ keys, onChange }: { keys: KeyMap; onChange: (keys: KeyMap) => void }) {
  const { t } = useI18n();
  const [waiting, setWaiting] = useState<Letter | null>(null);
  const [status, setStatus] = useState("");
  const standard = LETTERS.every((l) => keys[l] === DEFAULT_KEYS[l]);

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
        other && other !== waiting
          ? t("keys.swapped", { move, key, other: moveOfLetter(other), otherKey: keyLabel(keys[waiting]) })
          : t("keys.done", { move, key }),
      );
      onChange(rebind(keys, waiting, code));
      setWaiting(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [waiting, keys, onChange, t]);

  const pick = (letter: Letter) => {
    setWaiting(waiting === letter ? null : letter);
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
