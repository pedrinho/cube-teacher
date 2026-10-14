import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { en, type MessageKey, type Messages } from "./en";
import { pt } from "./pt";

export type Lang = "en" | "pt";
const dictionaries: Record<Lang, Messages> = { en, pt };
const STORAGE_KEY = "cube-teacher.lang";

type Params = Record<string, string | number>;

interface I18n {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Translated text with {name} placeholders filled in. */
  t: (key: MessageKey, params?: Params) => string;
  /** Like t, but placeholders can be React elements (e.g. links). */
  tr: (key: MessageKey, params: Record<string, ReactNode>) => ReactNode[];
}

const I18nContext = createContext<I18n | null>(null);

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "pt") return saved;
  } catch {
    // Storage can be blocked; fall back to the default.
  }
  return "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang === "pt" ? "pt-BR" : "en";
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not remembered across visits, but still switched.
    }
  }, []);

  const value = useMemo<I18n>(() => {
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
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

/** Message key for a step's name or goal (steps 0–7). */
export const stepKey = (id: number, field: "name" | "goal") => `step.${id}.${field}` as MessageKey;

/** Text for a solver instruction: {piece} becomes the piece's colors ("white-blue"). */
export function explainText(
  t: I18n["t"],
  explain: { key: MessageKey; piece?: string[]; colors?: Record<string, string> },
): string {
  const params: Record<string, string> = {};
  if (explain.piece) params.piece = explain.piece.map((c) => t(`color.${c}` as MessageKey)).join("-");
  for (const [name, color] of Object.entries(explain.colors ?? {})) params[name] = t(`color.${color}` as MessageKey);
  return t(explain.key, params);
}
