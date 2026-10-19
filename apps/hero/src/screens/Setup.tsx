// Pick a song (the method), a speed and where the cube comes from, then play or watch.
import { useI18n, type MessageKey } from "../i18n";
import { KEYS, LANES, keyLabel } from "../game/lanes";
import { BPM, SPEEDS, loadBest, type CubeSource, type Setup as SetupChoice } from "../settings";
import type { Method } from "../game/chart";

interface Props {
  setup: SetupChoice;
  onChange: (setup: SetupChoice) => void;
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

/** The twelve keys and the space bar, as on the keyboard, each with the move it plays. */
function KeyMap() {
  const { t } = useI18n();
  const half = (lanes: readonly (typeof LANES)[number][]) => (
    <div className="keymap-half">
      <div className="keymap-row keymap-top">
        {lanes.map((lane) => (
          <span key={lane} className="keycap keycap-prime">
            <span className="keycap-key">{keyLabel(KEYS[lane].prime)}</span>
            <span className="keycap-move">
              {lane}
              <span className="prime">'</span>
            </span>
          </span>
        ))}
      </div>
      <div className="keymap-row">
        {lanes.map((lane) => (
          <span key={lane} className="keycap">
            <span className="keycap-key">{keyLabel(KEYS[lane].turn)}</span>
            <span className="keycap-move">{lane}</span>
          </span>
        ))}
      </div>
    </div>
  );
  return (
    <div className="keymap" aria-hidden="true">
      <div className="keymap-hands">
        {half(LANES.slice(0, 3))}
        {half(LANES.slice(3))}
      </div>
      <span className="keycap keycap-space">
        <span className="keycap-key">{t("key.space")}</span>
        <span className="keycap-move">x y z</span>
      </span>
    </div>
  );
}

export function Setup({ setup, onChange, onPlay }: Props) {
  const { t } = useI18n();
  const best = loadBest(setup.method, setup.speed);

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
        <Choice<CubeSource>
          label={t("setup.cube")}
          value={setup.cube}
          onChange={(cube) => onChange({ ...setup, cube })}
          options={[
            { value: "random", title: t("setup.random") },
            { value: "paint", title: t("setup.paint") },
          ]}
        />

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
        <KeyMap />
        <ul className="how">
          <li>{t("setup.how1")}</li>
          <li>{t("setup.how2")}</li>
          <li>{t("setup.how3")}</li>
          <li>{t("setup.how4")}</li>
        </ul>
      </aside>
    </div>
  );
}
