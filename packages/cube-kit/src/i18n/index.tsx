// English and Portuguese texts. Each app passes its dictionaries (cube-kit's spread into its own);
// cube-kit's components and solvers only use cube-kit's keys.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { KitMessageKey } from "./en";

export type Lang = "en" | "pt";

type Params = Record<string, string | number>;

export interface I18n<K extends string = KitMessageKey> {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Translated text with {name} placeholders filled in. */
  t: (key: K, params?: Params) => string;
  /** Like t, but placeholders can be React elements (e.g. links). */
  tr: (key: K, params: Record<string, ReactNode>) => ReactNode[];
}

const I18nContext = createContext<I18n<string> | null>(null);

function initialLang(storageKey: string): Lang {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === "en" || saved === "pt") return saved;
  } catch {
    // Storage can be blocked; fall back to the default.
  }
  return "en";
}

interface ProviderProps {
  dictionaries: Record<Lang, Record<string, string>>;
  /** Where the chosen language is remembered. */
  storageKey: string;
  children: ReactNode;
}

export function I18nProvider({ dictionaries, storageKey, children }: ProviderProps) {
  const [lang, setLangState] = useState<Lang>(() => initialLang(storageKey));

  useEffect(() => {
    document.documentElement.lang = lang === "pt" ? "pt-BR" : "en";
  }, [lang]);

  const setLang = useCallback(
    (next: Lang) => {
      setLangState(next);
      try {
        localStorage.setItem(storageKey, next);
      } catch {
        // Not remembered across visits, but still switched.
      }
    },
    [storageKey],
  );

  const value = useMemo<I18n<string>>(() => {
    const dict = dictionaries[lang];
    return {
      lang,
      setLang,
      t: (key, params) =>
        dict[key].replace(/\{(\w+)\}/g, (_, name: string) => String(params?.[name] ?? `{${name}}`)),
      tr: (key, params) =>
        dict[key].split(/(\{\w+\})/g).map((part) => {
          const name = /^\{(\w+)\}$/.exec(part)?.[1];
          return name && name in params ? params[name] : part;
        }),
    };
  }, [dictionaries, lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** The texts, typed with the app's keys (cube-kit's own by default). */
export function useI18n<K extends string = KitMessageKey>(): I18n<K> {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

/** Text for a solver instruction: {piece} becomes the piece's colors ("white-blue"). */
export function explainText(
  t: (key: KitMessageKey, params?: Params) => string,
  explain: { key: KitMessageKey; piece?: string[]; colors?: Record<string, string>; values?: Record<string, string | number> },
): string {
  const params: Record<string, string | number> = { ...explain.values };
  if (explain.piece) params.piece = explain.piece.map((c) => t(`color.${c}` as KitMessageKey)).join("-");
  for (const [name, color] of Object.entries(explain.colors ?? {})) params[name] = t(`color.${color}` as KitMessageKey);
  return t(explain.key, params);
}
