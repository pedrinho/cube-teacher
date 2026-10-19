// Step name, with the Portuguese name from the videos shown alongside in English mode.
import { stepKey, useI18n } from "../i18n";
import { pt } from "../i18n/pt";

export function StepName({ step }: { step: number }) {
  const { t, lang } = useI18n();
  const key = stepKey(step, "name");
  return (
    <>
      {t(key)}
      {lang === "en" && step > 0 && (
        <span className="pt-name" lang="pt-BR">
          {pt[key]}
        </span>
      )}
    </>
  );
}
