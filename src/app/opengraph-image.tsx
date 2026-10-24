import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { getPriceList } from '@/content/repository'
import { formatPLN } from '@/domain/money'

/**
 * Obrazek do udostępniania (LinkedIn, Messenger, wyniki wyszukiwania) w stylu strony: druk techniczny,
 * czarny tusz, ciężki grotesk i czerwone podwójne podkreślenie sumy. Najniższa cena pochodzi z cennika, nie z tekstu na sztywno.
 */
export const alt = 'Bilans & Spółka - księgowość z ceną znaną z góry'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const fonts = join(process.cwd(), 'src/app/fonts/og')

export default async function Image() {
  const [display, mono, priceList] = await Promise.all([
    readFile(join(fonts, 'inter-display.ttf')),
    readFile(join(fonts, 'jetbrains-mono.ttf')),
    getPriceList(),
  ])
  const from = Math.min(...Object.values(priceList.base).flatMap(ledger => Object.values(ledger)))

  const paper = '#f3f2ee'
  const ink = '#0d0d0d'
  const signal = '#e61919'
  const meta = { display: 'flex', fontFamily: 'JetBrains Mono', fontSize: 20, letterSpacing: 2, textTransform: 'uppercase' } as const

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: paper, color: ink, border: `12px solid ${ink}` }}>
        {/* Pasek metadanych jak nagłówek arkusza technicznego. */}
        <div style={{ ...meta, alignItems: 'center', gap: 32, padding: '14px 40px', background: ink, color: paper }}>
          <div style={{ display: 'flex', fontWeight: 700 }}>[ BIURO RACHUNKOWE ]</div>
          <div style={{ display: 'flex' }}>KRAKÓW / CAŁA POLSKA</div>
          <div style={{ display: 'flex', marginLeft: 'auto' }}>REV {priceList.version}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, padding: '40px 40px 36px' }}>
          {/* Satori układa dzieci flexa jako osobne bloki - kropka musi siedzieć w ostatnim słowie, inaczej odpływa w prawo. */}
          <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: 30, fontFamily: 'Inter Display', fontSize: 104, lineHeight: 1, letterSpacing: -4, textTransform: 'uppercase', maxWidth: 1000 }}>
            {['Księgowość', 'z', 'ceną', 'znaną', 'z'].map((word, i) => <span key={i}>{word}</span>)}
            <span style={{ display: 'flex' }}>góry<span style={{ color: signal }}>.</span></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', borderTop: `4px solid ${ink}`, paddingTop: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <svg width="56" height="56" viewBox="0 0 28 28">
                <path d="M3 7h22M14 7v14" stroke={ink} strokeWidth="3" fill="none" />
                <path d="M4 23.5h20M4 26.5h20" stroke={signal} strokeWidth="1.5" fill="none" />
              </svg>
              <div style={{ display: 'flex', fontFamily: 'Inter Display', fontSize: 40, letterSpacing: -1.5, textTransform: 'uppercase' }}>Bilans &amp; Spółka®</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <div style={{ ...meta, fontSize: 18 }}>Miesięcznie netto</div>
              <div style={{ display: 'flex', fontFamily: 'JetBrains Mono', fontSize: 64, letterSpacing: -2 }}>od {formatPLN(from)}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 340, marginTop: 4 }}>
                <div style={{ height: 4, background: signal }} />
                <div style={{ height: 4, background: signal }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Inter Display', data: display, style: 'normal', weight: 900 },
        { name: 'JetBrains Mono', data: mono, style: 'normal', weight: 500 },
      ],
    },
  )
}
