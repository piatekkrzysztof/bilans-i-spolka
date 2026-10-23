import type { Metadata, Viewport } from 'next'
import { Inter, Newsreader } from 'next/font/google'
import Script from 'next/script'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { siteUrl, umami } from '@/lib/site'
import './globals.css'

// Fonty to największy koszt pierwszego renderu na mobile (wersja zmienna z osią opsz i kursywą = ~590 kB preloadu).
// Dlatego statyczne wagi, których naprawdę używamy, a kursywa (tylko „&” i monogramy) bez preloadu.
// Fallback metrics (adjustFontFallback) trzyma CLS przy zamianie fontu.
const newsreader = Newsreader({
  variable: '--font-newsreader',
  subsets: ['latin', 'latin-ext'],
  weight: '500',
  display: 'swap',
})

const newsreaderItalic = Newsreader({
  variable: '--font-newsreader-italic',
  subsets: ['latin', 'latin-ext'],
  weight: '500',
  style: 'italic',
  display: 'swap',
  preload: false,
})

// `subsets` w next/font = co preloadować. Inter jest zmienny (130 kB z latin-ext), więc z góry tylko łacina;
// latin-ext z polskimi znakami dociąga się po unicode-range, nie blokując pierwszego renderu (swap).
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Biuro rachunkowe Kraków z ceną znaną z góry | Bilans & Spółka',
    template: '%s | Bilans & Spółka',
  },
  description:
    'Biuro rachunkowe dla JDG i spółek z o.o. w Krakowie i zdalnie w całej Polsce. Wycena online w minutę, imienna księgowa, odpowiedź w 2 godziny.',
  applicationName: 'Bilans & Spółka',
  openGraph: {
    type: 'website',
    locale: 'pl_PL',
    siteName: 'Bilans & Spółka',
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#faf8f3',
  colorScheme: 'light',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="pl" className={`${newsreader.variable} ${newsreaderItalic.variable} ${inter.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#tresc"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-ledger focus:px-4 focus:py-2 focus:text-paper"
        >
          Przejdź do treści
        </a>
        <SiteHeader />
        <main id="tresc" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        {umami.host && umami.websiteId && (
          // Umami bez cookies - nie wymaga banera zgód (ADR-008).
          <Script src={`${umami.host}/script.js`} data-website-id={umami.websiteId} strategy="lazyOnload" />
        )}
      </body>
    </html>
  )
}
