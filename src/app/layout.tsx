import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import Script from 'next/script'
import { RevealObserver } from '@/components/layout/reveal-observer'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { siteUrl, umami } from '@/lib/site'
import './globals.css'

// Własne podzbiory (scripts/build-fonts.py): łacina + polskie znaki, jeden plik na krój, wszystkie preloadowane
// równolegle z CSS (ADR-010). Tekst: Inter 400-500, nagłówki: Inter 900 w wariancie display, dane: JetBrains Mono.
// Mono też zostaje w preloadzie: próba bez niego (Lighthouse, mediana z 5) podniosła TBT o ~220 ms przy tym samym LCP.
// Fallback metrics (adjustFontFallback) trzyma CLS przy zamianie fontu.
const interText = localFont({
  variable: '--font-inter-text',
  src: [{ path: './fonts/inter-text.woff2', weight: '400 500', style: 'normal' }],
  display: 'swap',
  adjustFontFallback: 'Arial',
})

const interDisplay = localFont({
  variable: '--font-inter-display',
  src: [{ path: './fonts/inter-display.woff2', weight: '900', style: 'normal' }],
  display: 'swap',
  adjustFontFallback: 'Arial',
})

const mono = localFont({
  variable: '--font-jetbrains-mono',
  src: [{ path: './fonts/jetbrains-mono.woff2', weight: '400 700', style: 'normal' }],
  display: 'swap',
  adjustFontFallback: false,
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
  themeColor: '#f3f2ee',
  colorScheme: 'light',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="pl" className={`${interText.variable} ${interDisplay.variable} ${mono.variable}`}>
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
        <RevealObserver />
        {umami.host && umami.websiteId && (
          // Umami bez cookies - nie wymaga banera zgód (ADR-008).
          <Script src={`${umami.host}/script.js`} data-website-id={umami.websiteId} strategy="lazyOnload" />
        )}
      </body>
    </html>
  )
}
