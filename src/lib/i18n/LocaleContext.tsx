'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { ru, uz, en, type Locale } from '@/lib/i18n'

const STORAGE_KEY = 'sotai_locale'
const DEFAULT_LOCALE: Locale = 'ru'
const DICTS = { ru, uz, en } as const

interface LocaleContextType {
  locale: Locale
  setLocale: (l: Locale) => void
  t: typeof ru
}

const LocaleContext = createContext<LocaleContextType>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: ru,
})

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null
    if (stored && stored in DICTS) setLocaleState(stored)
  }, [])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    localStorage.setItem(STORAGE_KEY, l)
  }, [])

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t: DICTS[locale] }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  return useContext(LocaleContext)
}
