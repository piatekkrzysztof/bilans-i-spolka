import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import Script from 'next/script'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { siteUrl, umami } from '@/lib/site'
import './globals.css'

// Własne podzbiory (scripts/build-fonts.py): statyczne wagi, łacina + polskie znaki w jednym pliku na krój.
// Wszystkie cztery pliki (87 kB) ładują się równolegle z CSS - bez drugiej rundy pobrań po latin-ext (ADR-010).
// Fallback metrics (adjustFontFallback) trzyma CLS przy zamianie fontu.
const newsreader = localFont({
  variable: '--font-newsreader',
  src: [{ path: './fonts/newsreader-500.woff2', weight: '500', style: 'normal' }],
  display: 'swap',
  adjustFontFallback: 'Times New Roman',
})

const newsreaderItalic = localFont({
  variable: '--font-newsreader-italic',
  src: [{ path: './fonts/newsreader-500-italic.woff2', weight: '500', style: 'italic' }],
  display: 'swap',
  adjustFontFallback: 'Times New Roman',
})

const inter = localFont({
  variable: '--font-inter',
  src: [
    { path: './fonts/inter-400.woff2', weight: '400', style: 'normal' },
    { path: './fonts/inter-500.woff2', weight: '500', style: 'normal' },
  ],
  display: 'swap',
  adjustFontFallback: 'Arial',
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
  twitter: { card: 'summary_large_image' },
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
