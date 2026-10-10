'use client'

import { createContext, useContext, useState } from 'react'
import type { Locale, TranslationKey } from '@/lib/demo-data'
import { translations } from '@/lib/demo-data'

type LanguageContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children, initialLocale }: { children: React.ReactNode; initialLocale: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)
  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale)
    document.cookie = `smartstock-locale=${nextLocale}; path=/; max-age=31536000; samesite=lax`
    document.documentElement.lang = nextLocale
  }
  const t = (key: TranslationKey) => translations[locale][key]

  return <LanguageContext.Provider value={{ locale, setLocale, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within LanguageProvider')
  return context
}

export function LanguageToggle({ className = '' }: { className?: string }) {
  const { locale, setLocale } = useLanguage()
  return (
    <div aria-label="Language" className={`inline-flex items-center rounded-full border border-[#e2e8e2] bg-white p-1 ${className}`}>
      <button type="button" onClick={() => setLocale('th')} aria-pressed={locale === 'th'} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${locale === 'th' ? 'bg-[#173f32] text-white' : 'text-[#64716b] hover:text-[#173f32]'}`}>ไทย</button>
      <button type="button" onClick={() => setLocale('en')} aria-pressed={locale === 'en'} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${locale === 'en' ? 'bg-[#173f32] text-white' : 'text-[#64716b] hover:text-[#173f32]'}`}>EN</button>
    </div>
  )
}

export function useLocale() {
  return useLanguage().locale
}
