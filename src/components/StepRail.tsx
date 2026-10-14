// The seven steps as a row of numbered pills: done, current, or still to come.
import { stepKey, useI18n } from "../i18n";
import { layersMethod } from "../methods/layers";

export function StepRail({ current, doneUpTo }: { current: number; doneUpTo: number }) {
  const { t } = useI18n();
  return (
    <ol className="rail" aria-label={t("guide.progress")}>
      {layersMethod.steps
        .filter((s) => s.id > 0)
        .map((s) => {
          const state = s.id <= doneUpTo ? "done" : s.id === current ? "current" : s.ready ? "todo" : "soon";
          return (
            <li key={s.id} data-state={state} aria-current={state === "current" ? "step" : undefined}>
              <span className="rail-num">{s.id}</span>
              <span className="rail-name">{t(stepKey(s.id, "name"))}</span>
            </li>
          );
        })}
    </ol>
  );
}
