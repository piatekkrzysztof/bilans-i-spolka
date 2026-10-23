import { cacheLife } from 'next/cache'
import { plural } from '@/lib/format'

/**
 * Liczba dni do obowiązkowego KSeF. Komponent buforowany na godzinę: liczba trafia do statycznej
 * powłoki strony (bez JS po stronie klienta), a odświeża się w tle - spokojnie, bez tykającego licznika.
 */
export async function KsefDays({ mandatoryFrom }: { mandatoryFrom: string }) {
  'use cache'
  cacheLife('hours')
  const days = daysUntil(mandatoryFrom, new Date())
  if (days <= 0) return <span className="num">KSeF obowiązuje</span>
  return (
    <>
      <span className="num">{days}</span> {plural(days, 'dzień', 'dni', 'dni')}
    </>
  )
}

export function daysUntil(isoDate: string, now: Date): number {
  // Północ w Polsce (CET) dnia startu - liczymy pełne dni kalendarzowe.
  const target = new Date(`${isoDate}T00:00:00+01:00`).getTime()
  return Math.ceil((target - now.getTime()) / 86_400_000)
}
