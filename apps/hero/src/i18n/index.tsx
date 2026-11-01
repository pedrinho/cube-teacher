// The game's texts: cube-kit's plus its own.
import type { ReactNode } from "react";
import { I18nProvider as KitI18nProvider, useI18n as useKitI18n, type I18n as KitI18n } from "cube-kit/i18n";
import { en, type MessageKey } from "./en";
import { pt } from "./pt";

export type { Lang } from "cube-kit/i18n";
export type { MessageKey } from "./en";

export type I18n = KitI18n<MessageKey>;

const dictionaries = { en, pt };

/** Same key as Cube Teacher: both apps share a site, so the language choice carries over. */
const LANG_KEY = "cube-teacher.lang";

export function I18nProvider({ children }: { children: ReactNode }) {
  return (
    <KitI18nProvider dictionaries={dictionaries} storageKey={LANG_KEY}>
      {children}
    </KitI18nProvider>
  );
}

export const useI18n = (): I18n => useKitI18n<MessageKey>();
