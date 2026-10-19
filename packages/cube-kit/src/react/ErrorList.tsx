// What is wrong with a painted cube, from validate().
import { useI18n } from "../i18n";
import type { ValidationError } from "../cube/validate";

const IMPOSSIBLE = new Set(["flipped-edge", "twisted-corner", "swapped-pieces"]);

export function ErrorList({ errors }: { errors: ValidationError[] }) {
  const { t } = useI18n();
  return (
    <div className="notice notice-error" role="alert">
      <h3>{t("error.title")}</h3>
      <ul>
        {errors.map((e, k) => (
          <li key={k}>
            {e.kind === "count"
              ? t("error.count", { count: e.count, color: t(`color.${e.color}`) })
              : e.kind === "unpainted"
                ? t("error.unpainted", { count: e.count })
                : t(`error.${e.kind}`)}
          </li>
        ))}
      </ul>
      {errors.some((e) => IMPOSSIBLE.has(e.kind)) && <p>{t("error.impossibleHelp")}</p>}
    </div>
  );
}

/** Sticker indices that the errors point at, to mark them in the editor. */
export const markedStickers = (errors: ValidationError[]) =>
  new Set(errors.flatMap((e) => ("stickers" in e ? e.stickers : [])));
