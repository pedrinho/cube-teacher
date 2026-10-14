// A method's stages as a row of numbered pills: done, current, or still to come.
import { useI18n } from "../i18n";
import type { MethodInfo } from "../methods/registry";

interface Props {
  stages: MethodInfo["stages"];
  current: number;
  doneUpTo: number;
}

export function StepRail({ stages, current, doneUpTo }: Props) {
  const { t } = useI18n();
  return (
    <ol className="rail" aria-label={t("guide.progress")}>
      {stages.map((s) => {
        const state = s.id <= doneUpTo ? "done" : s.id === current ? "current" : "todo";
        return (
          <li key={s.id} data-state={state} aria-current={state === "current" ? "step" : undefined}>
            <span className="rail-num">{s.id}</span>
            <span className="rail-name">{t(s.name)}</span>
          </li>
        );
      })}
    </ol>
  );
}
