// Slow / Normal / Fast for the 3D cube's animations, remembered between visits.
import { useI18n } from "../i18n";
import { useSettings, type Speed } from "../settings";

const SPEEDS: Speed[] = ["slow", "normal", "fast"];

export function SpeedControl() {
  const { t } = useI18n();
  const { speed, setSpeed } = useSettings();
  return (
    <div className="speed" role="group" aria-label={t("speed.label")}>
      <span className="speed-label">{t("speed.label")}</span>
      <div className="segmented">
        {SPEEDS.map((s) => (
          <button key={s} type="button" aria-pressed={speed === s} onClick={() => setSpeed(s)}>
            {t(`speed.${s}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
