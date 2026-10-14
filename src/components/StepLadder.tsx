// The seven steps as a staircase of cubes, each one more solved than the last.
import type { CSSProperties } from "react";
import { stepKey, useI18n } from "../i18n";
import { Link } from "../router";
import { layersMethod } from "../methods/layers";
import { stepPicture } from "../methods/layers/pictures";
import { CubeSvg } from "./CubeSvg";

export function StepLadder() {
  const { t } = useI18n();
  const steps = layersMethod.steps.filter((s) => s.id > 0);
  const layers = [1, 2, 3] as const;
  return (
    <div className="ladder">
      {layers.map((layer) => (
        <div key={layer} className="ladder-layer">
          <ol className="ladder-steps">
            {steps
              .filter((s) => s.layer === layer)
              .map((s) => {
                const pic = stepPicture(s.id);
                return (
                  <li key={s.id} style={{ "--rise": s.id - 1 } as CSSProperties}>
                    <Link to={`/learn/${s.id}`} className="ladder-step">
                      <CubeSvg state={pic.state} visible={pic.visible} />
                      <span className="ladder-num">{s.id}</span>
                      <span className="ladder-name">{t(stepKey(s.id, "name"))}</span>
                    </Link>
                  </li>
                );
              })}
          </ol>
          <p className="ladder-band">{t(`layer.${layer}`)}</p>
        </div>
      ))}
    </div>
  );
}
