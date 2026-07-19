// i18n.tsx — minimal bilingual (Swahili-first / English) context for KODI360.
// Citizen-facing product serving informal traders as much as officers, so
// Swahili is the default; a header toggle switches to English for TRA staff
// or reviewers who prefer it.

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type Lang = 'sw' | 'en';

const STORAGE_KEY = 'kodi360.lang';

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
}

const LangContext = createContext<LangContextValue | undefined>(undefined);

function readInitialLang(): Lang {
  if (typeof window === 'undefined') return 'sw';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === 'en' ? 'en' : 'sw';
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readInitialLang);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, l);
  };

  const value = useMemo<LangContextValue>(
    () => ({ lang, setLang, toggle: () => setLang(lang === 'sw' ? 'en' : 'sw') }),
    [lang],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return ctx;
}

/** Pick the string for the active language from a { sw, en } pair. */
export function t(lang: Lang, pair: { sw: string; en: string }): string {
  return lang === 'sw' ? pair.sw : pair.en;
}
