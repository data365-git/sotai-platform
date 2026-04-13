'use client'

import { useLocale } from '@/hooks/useLocale'
import type { Locale } from '@/lib/i18n'

const LOCALES: { value: Locale; label: string; flag: string }[] = [
  { value: 'ru', label: 'RU', flag: '🇷🇺' },
  { value: 'uz', label: 'UZ', flag: '🇺🇿' },
  { value: 'en', label: 'EN', flag: '🇬🇧' },
]

export function LocaleSwitcher() {
  const { locale, setLocale } = useLocale()

  return (
    <div style={{
      display: 'flex', gap: 2, padding: '3px',
      background: 'rgba(0,0,0,0.05)', borderRadius: 8,
      border: '1px solid rgba(0,0,0,0.06)',
    }}>
      {LOCALES.map(({ value, label, flag }) => (
        <button
          key={value}
          onClick={() => setLocale(value)}
          title={label}
          style={{
            padding: '4px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600,
            border: 'none', cursor: 'pointer', transition: 'all 0.15s',
            background: locale === value ? '#6366f1' : 'transparent',
            color: locale === value ? 'white' : '#64748b',
            display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          <span>{flag}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  )
}
