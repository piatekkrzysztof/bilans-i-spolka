import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { getPriceList } from '@/content/repository'
import { formatPLN } from '@/domain/money'

/**
 * Obrazek do udostępniania (LinkedIn, Messenger, wyniki wyszukiwania) w stylu strony: papier, zieleń księgi,
 * wiersz wyceny i podwójne podkreślenie sumy. Najniższa cena pochodzi z cennika, nie z tekstu na sztywno.
 */
export const alt = 'Bilans & Spółka - księgowość z ceną znaną z góry'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const fonts = join(process.cwd(), 'src/app/fonts/og')

export default async function Image() {
  const [serif, sans, priceList] = await Promise.all([
    readFile(join(fonts, 'newsreader-500.ttf')),
    readFile(join(fonts, 'inter-500.ttf')),
    getPriceList(),
  ])
  const from = Math.min(...Object.values(priceList.base).flatMap(ledger => Object.values(ledger)))

  const paper = '#faf8f3'
  const ink = '#1a1d1b'
  const muted = '#5f655f'
  const ledger = '#1f4d3f'
  const brass = '#b08a3e'

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: paper, padding: '64px 72px', fontFamily: 'Inter', color: ink }}>
        {/* Margines księgi: podwójna pionowa linia. */}
        <div style={{ position: 'absolute', left: 40, top: 0, bottom: 0, width: 6, borderLeft: `2px solid ${brass}`, borderRight: `2px solid ${brass}`, opacity: 0.55 }} />

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <svg width="48" height="48" viewBox="0 0 28 28">
              <path d="M4 7.5h20M14 7.5V21" stroke={ledger} strokeWidth="1.75" fill="none" />
              <path d="M5 24h18M5 26.5h18" stroke={brass} strokeWidth="1" fill="none" />
            </svg>
            <div style={{ fontFamily: 'Newsreader', fontSize: 40 }}>Bilans &amp; Spółka</div>
            <div style={{ marginLeft: 'auto', fontSize: 22, color: muted, letterSpacing: 2 }}>BIURO RACHUNKOWE · KRAKÓW</div>
          </div>

          <div style={{ display: 'flex', fontFamily: 'Newsreader', fontSize: 92, lineHeight: 1.02, maxWidth: 820 }}>
            Księgowość z ceną znaną z góry.
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', borderTop: `2px solid ${ink}`, paddingTop: 28 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 26, color: muted }}>
              <div style={{ display: 'flex' }}>Wycena online w minutę, bez podawania e-maila</div>
              <div style={{ display: 'flex' }}>Księgowa z imienia · odpowiedź zwykle w 2 h</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <div style={{ fontSize: 22, color: muted }}>miesięcznie netto</div>
              <div style={{ display: 'flex', fontFamily: 'Newsreader', fontSize: 72, color: ledger }}>od {formatPLN(from)}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, width: 300, marginTop: 6 }}>
                <div style={{ height: 2, background: brass }} />
                <div style={{ height: 2, background: brass }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Newsreader', data: serif, style: 'normal', weight: 500 },
        { name: 'Inter', data: sans, style: 'normal', weight: 500 },
      ],
    },
  )
}
