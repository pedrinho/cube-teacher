// How to hold the cube right now: which color is on top and which faces you.
import { centers, type CubeState } from "../cube/model";
import { useI18n } from "../i18n";

export function HoldBadge({ state }: { state: CubeState }) {
  const { t } = useI18n();
  const c = centers(state);
  return (
    <div className="hold">
      {(["U", "F"] as const).map((face) => (
        <span key={face} className="hold-item">
          <span className="hold-label">{t(face === "U" ? "guide.top" : "guide.front")}</span>
          <span className="hold-chip" data-color={c[face]} />
          <span className="hold-color">{t(`color.${c[face]}`)}</span>
        </span>
      ))}
    </div>
  );
}
