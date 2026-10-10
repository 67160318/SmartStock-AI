import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { cookies } from 'next/headers'
import { LanguageProvider } from '@/components/language-provider'
import type { Locale } from '@/lib/demo-data'
import './globals.css'

export const metadata: Metadata = {
  title: 'SmartStock AI | Restaurant inventory, made clearer',
  description: 'Plan restaurant inventory, connect sales to ingredients, and make more confident purchasing decisions.',
  applicationName: 'SmartStock AI',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f7f8f4',
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies()
  const savedLocale = cookieStore.get('smartstock-locale')?.value
  const locale: Locale = savedLocale === 'en' ? 'en' : 'th'

  return (
    <html lang={locale}>
      <body className="antialiased">
        <LanguageProvider initialLocale={locale}>{children}</LanguageProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
