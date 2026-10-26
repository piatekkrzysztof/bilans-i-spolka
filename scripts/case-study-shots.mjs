/**
 * Zrzuty do case study z produkcji (Playwright, Chromium): desktop 1440×900 i telefon 390×844, DPR 2, WebP.
 * Statystyki (Umami) są blokowane, formularzy nikt nie wysyła. Do tego przykładowy PDF wyceny (media print, A4)
 * i podgląd maila z wyceną wyrenderowany z węzła n8n `automation/n8n/code/lead.js`.
 *
 *   node scripts/case-study-shots.mjs [adres strony] [adres dla dokumentu i PDF, domyślnie ten sam]
 */
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium, devices } = require('@playwright/test')
const pnpmDir = join(process.cwd(), 'node_modules/.pnpm')
const sharp = require(join(pnpmDir, readdirSync(pnpmDir).find(n => n.startsWith('sharp@')), 'node_modules/sharp'))

const BASE = (process.argv[2] ?? 'https://bilans-i-spolka.vercel.app').replace(/\/$/, '')
const DOC_BASE = (process.argv[3] ?? BASE).replace(/\/$/, '')
const OUT = 'docs/case-study'
const QUOTE = 'forma=jdg&podatek=skala&dok=21-40&vat=1'

const browser = await chromium.launch()
const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, locale: 'pl-PL' })
const phone = await browser.newContext({ ...devices['Pixel 7'], viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'pl-PL' })
for (const context of [desktop, phone]) await context.route(/umami|cloud\.umami/, route => route.abort())

async function save(buffer, name) {
  const info = await sharp(buffer).webp({ quality: 80 }).toFile(join(OUT, `${name}.webp`))
  console.log(`${name}.webp`, `${info.width}×${info.height}`, `${Math.round(info.size / 1024)} kB`)
}

async function open(context, path, base = BASE) {
  const page = await context.newPage()
  await page.goto(base + path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  return page
}

/** Wejścia sekcji (data-reveal) odsłaniają się przy przewijaniu - przewijamy całą stronę przed zrzutem elementu. */
async function revealAll(page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y < height; y += 500) {
    await page.evaluate(v => window.scrollTo(0, v), y)
    await page.waitForTimeout(120)
  }
  await page.waitForTimeout(900)
}

async function element(page, selector, name) {
  // Przyklejony nagłówek strony wchodziłby w kadr elementu.
  await page.addStyleTag({ content: 'body > header { position: static !important; }' })
  const el = page.locator(selector).first()
  await el.scrollIntoViewIfNeeded()
  await page.waitForTimeout(400)
  await save(await el.screenshot(), name)
}

// Strona główna
let page = await open(desktop, '/')
await save(await page.screenshot(), 'strona-glowna-desktop')
await revealAll(page)
await element(page, 'section[aria-labelledby="bilans"]', 'bilans-sie-zgadza-desktop')
await element(page, 'section[aria-labelledby="miesiac"]', 'miesiac-ksiegowy-desktop')
await element(page, 'section[aria-labelledby="krakow"]', 'krakow-desktop')
await page.close()

page = await open(phone, '/')
await save(await page.screenshot(), 'strona-glowna-telefon')
await page.close()

// Wycena
page = await open(desktop, `/wycena?${QUOTE}`)
await page.evaluate(() => window.scrollTo(0, 420))
await page.waitForTimeout(600)
await save(await page.screenshot(), 'wycena-desktop')
await page.close()

page = await open(phone, `/wycena?${QUOTE}`)
await revealAll(page)
await element(page, '#podsumowanie', 'wycena-podsumowanie-telefon')
await page.close()

// Porównywarka form opodatkowania
page = await open(desktop, '/porownywarka')
await page.evaluate(() => window.scrollTo(0, 380))
await page.waitForTimeout(600)
await save(await page.screenshot(), 'porownywarka-desktop')
await page.close()

// Test gotowości KSeF - te same odpowiedzi co w e2e: „prawie gotowe” z dwoma brakami.
page = await open(desktop, '/ksef')
const groups = page.locator('fieldset')
for (const [i, answer] of ['Tak', 'Tak', 'Nie wiem', 'Tak', 'Nie'].entries()) await groups.nth(i).getByText(answer, { exact: true }).click()
await page.getByRole('button', { name: 'Pokaż wynik' }).click()
await page.waitForTimeout(600)
await element(page, '[role="status"]', 'ksef-wynik-desktop')
await page.close()

// Dokument wyceny i jego PDF (tak samo jak PDF.co w n8n: URL → PDF, media print, A4)
page = await open(desktop, `/wycena/dokument?${QUOTE}`, DOC_BASE)
await element(page, 'article', 'dokument-wyceny-desktop')
await page.emulateMedia({ media: 'print' })
writeFileSync(join(OUT, 'wycena-przyklad.pdf'), await page.pdf({ format: 'A4', printBackground: true }))
console.log('wycena-przyklad.pdf')
await page.close()

// Mail z wyceną: HTML z węzła „Lead” dla tej samej wyceny, notka jak z prawdziwego przebiegu (26.10.2026).
// Wycena liczona tą samą funkcją co w API (calculateQuote + cennik z fixtures).
const quoteCode = [
  `import { calculateQuote } from './src/domain/pricing'`,
  `import { parseQuoteParams } from './src/domain/quote-params'`,
  `import { priceListFixture } from './src/content/fixtures/price-list'`,
  `process.stdout.write(JSON.stringify(calculateQuote(parseQuoteParams(new URLSearchParams('${QUOTE}')), priceListFixture)))`,
].join('; ')
const quote = JSON.parse(execFileSync('corepack', ['pnpm', '--silent', 'exec', 'tsx', '-e', `"${quoteCode}"`], { encoding: 'utf8', shell: true }))
if (quote) {
  const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor
  const run = new AsyncFunction('$json', '$vars', '$env', 'URL', 'URLSearchParams', readFileSync('automation/n8n/code/lead.js', 'utf8'))
  const lead = await run({
    lead: {
      type: 'lead.created', id: 'case-study', demo: true, intent: 'pdf', quote,
      documentUrl: `${BASE}/wycena/dokument?${QUOTE}`,
      score: { score: 70, temperature: 'hot', matched: [] },
      advisor: { slug: 'marta-zajac', name: 'Marta Zając', calLink: null },
      contact: { name: 'Anna Nowak', email: 'anna@example.com', phone: null },
      situation: 'switching', startWhen: 'next-month', message: null, consents: { contact: true, marketing: false },
    },
    config: { siteUrl: BASE, demo: true, testInbox: 'demo@example.com' },
  })
  const note = 'Przy zmianie biura warto zadbać o uporządkowanie dokumentów i bieżących rozliczeń VAT, aby przejście od przyszłego miesiąca przebiegło spokojnie. Ze względu na obowiązkowy KSeF od 1 stycznia 2027 r. dobrze będzie już teraz sprawdzić, jak obecnie wystawiane są faktury, i omówić ewentualne zmiany z nowym biurem.'
  const html = lead.json.emails.pdf.html.replace('%%NOTE%%', `<p style="margin:24px 0 0;padding:16px 18px;border-left:3px solid #e61919;background:#f3f2ee;">${note}</p>`)
  page = await desktop.newPage()
  await page.setViewportSize({ width: 680, height: 900 })
  await page.setContent(html, { waitUntil: 'networkidle' })
  await save(await page.screenshot({ fullPage: true }), 'mail-wycena')
  await page.close()
}
else {
  console.log('mail-wycena: brak /api/quote - pomijam')
}

await browser.close()
