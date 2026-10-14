// The title of a Fridrich case, as shown in lessons and in the trainer.
import type { I18n } from "../../i18n";
import type { FrCase } from "../../content/fridrich/lessons";

export function caseTitle(t: I18n["t"], c: FrCase): string {
  if (c.titleKey) return t(c.titleKey);
  if (c.id.startsWith("pll")) return t("fr.case.pll", { name: c.name ?? "" });
  const base = t(c.id.startsWith("oll") ? "fr.case.oll" : "fr.case.f2l", { n: c.number ?? 0 });
  return c.name ? `${base}: ${c.name}` : base;
}
