// The home screen: the four chapters, easy to extreme, and their levels. A level shows its stars,
// or a lock until the level before it has three stars. Chapters without levels yet say so. The
// player's keys can be changed under them.
import { useI18n, type MessageKey } from "../i18n";
import { CHAPTERS, LEVELS, isOpen, numberOf, type Level } from "../game/levels";
import type { KeyMap } from "../game/lanes";
import type { Progress } from "../settings";
import { KeyEditor } from "./Keys";

interface Props {
  progress: Progress;
  keys: KeyMap;
  onKeysChange: (keys: KeyMap) => void;
  onPlay: (level: Level) => void;
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

function Lock() {
  return (
    <svg className="level-lock" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="currentColor" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" strokeWidth="2.4" />
    </svg>
  );
}

export function Levels({ progress, keys, onKeysChange, onPlay }: Props) {
  const { t } = useI18n();

  return (
    <div className="levels-screen">
      <h1 className="title" aria-label={t("app.name")}>
        {TITLE.map((c, i) => (
          <span key={i} className="title-key" data-color={c.color} aria-hidden="true">
            {c.letter}
          </span>
        ))}
      </h1>
      <p className="lead">{t("levels.lead")}</p>

      <div className="chapters">
        {CHAPTERS.map((chapter, c) => {
          const levels = LEVELS.filter((l) => l.chapter === chapter);
          return (
            <section key={chapter} className="chapter" data-chapter={chapter} aria-labelledby={`chapter-${chapter}`}>
              <h2 id={`chapter-${chapter}`}>
                <span className="chapter-n">{t("levels.chapter", { n: c + 1 })}</span>
                {t(`chapter.${chapter}` as MessageKey)}
              </h2>
              {levels.length === 0 ? (
                <p className="chapter-soon">{t("levels.soon")}</p>
              ) : (
                <ol className="level-list">
                  {levels.map((level) => {
                    const open = isOpen(progress, level);
                    const stars = progress[level.id]?.stars ?? 0;
                    return (
                      <li key={level.id}>
                        <button type="button" className="level" disabled={!open} onClick={() => onPlay(level)}>
                          <span className="level-n">{numberOf(level)}</span>
                          <span className="level-body">
                            <span className="level-title">
                              {t(level.title)}
                              {level.tutorial && <span className="level-tag">{t("levels.tutorial")}</span>}
                            </span>
                            <span className="level-text">{t(level.text)}</span>
                          </span>
                          {open ? (
                            <span className="level-stars" role="img" aria-label={t("results.stars", { n: stars })}>
                              {Array.from({ length: 5 }, (_, i) => (
                                <span key={i} data-on={i < stars || undefined}>
                                  ★
                                </span>
                              ))}
                            </span>
                          ) : (
                            <span className="level-locked">
                              <Lock />
                              <span className="visually-hidden">{t("levels.locked")}</span>
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          );
        })}
      </div>

      <KeyEditor keys={keys} onChange={onKeysChange} />
    </div>
  );
}
