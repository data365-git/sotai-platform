'use client'

import { useState, useEffect, useCallback } from 'react'
import { ru, uz, en, type Locale } from '@/lib/i18n'

const STORAGE_KEY = 'sotai_locale'
const DEFAULT_LOCALE: Locale = 'ru'

const DICTS = { ru, uz, en } as const

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null
    if (stored && stored in DICTS) {
      setLocaleState(stored)
    }
  }, [])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    localStorage.setItem(STORAGE_KEY, l)
  }, [])

  return { locale, setLocale, t: DICTS[locale] }
}
