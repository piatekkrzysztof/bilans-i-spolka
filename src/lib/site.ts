/** Konfiguracja publiczna - bezpieczna w przeglądarce (prefiks NEXT_PUBLIC_). */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')

/** Tryb demo: formularz kieruje leady do skrzynki testowej i mówi o tym użytkownikowi. */
export const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE !== 'false'

export const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''

export const umami = {
  host: process.env.NEXT_PUBLIC_UMAMI_HOST ?? '',
  websiteId: process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ?? '',
}

export const absoluteUrl = (path = '/') => `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`

export const NAV = [
  { href: '/uslugi', label: 'Usługi', match: '/uslugi' },
  { href: '/wycena', label: 'Wycena', match: '/wycena' },
  { href: '/porownywarka', label: 'Formy opodatkowania', match: '/porownywarka' },
  { href: '/ksef', label: 'KSeF', match: '/ksef' },
  { href: '/zespol', label: 'Zespół', match: '/zespol' },
  { href: '/wiedza', label: 'Wiedza', match: '/wiedza' },
] as const
