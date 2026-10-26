/**
 * Ryciny archiwalne (domena publiczna) w jednej obróbce: skala szarości, podbity kontrast, kadr, WebP.
 * Na stronie leżą na papierze z mix-blend-multiply, więc biel skanu przejmuje kolor papieru.
 * Źródła i licencje: src/content/archive.ts. Oryginały pobiera skrypt tasteskill do assets/ (poza repo).
 *
 *   node scripts/build-archive-images.mjs
 */
import { createRequire } from 'node:module'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'

const require = createRequire(import.meta.url)
const pnpmDir = join(process.cwd(), 'node_modules/.pnpm')
const sharpDir = readdirSync(pnpmDir).find(name => name.startsWith('sharp@'))
const sharp = require(join(pnpmDir, sharpDir, 'node_modules/sharp'))

const OUT = 'public/archiwum'
const JOBS = [
  // Bilans kasowy z 13 lutego 1898 - górna część karty, do wiersza „Balance”.
  { src: 'modern-banking-methods-and-practical-bank-bookkeeping-2.jpg', out: 'bilans-kasowy-1898.webp', crop: { left: 0, top: 0, width: 1920, height: 1900 }, width: 1400 },
  // Dzienna księga czeków i wpłat, 2-5 stycznia 1899.
  { src: 'modern-banking-methods-and-practical-bank-bookkeeping.jpg', out: 'ksiega-dzienna-1899.webp', crop: { left: 0, top: 0, width: 1920, height: 1315 }, width: 1400 },
  { src: '14-garncarska-street-krakow-01.jpg', out: 'garncarska-14.webp', crop: { left: 0, top: 120, width: 1920, height: 2160 }, width: 1000 },
  // Plan Krakowa 1836 - bez marginesów arkusza.
  { src: 'plan-miasta-krakowa-w-obrebie-okopow-plan.jpg', out: 'plan-krakowa-1836.webp', crop: { left: 60, top: 60, width: 1800, height: 1400 }, width: 1600 },
]

for (const job of JOBS) {
  const info = await sharp(join('assets', job.src))
    .extract(job.crop)
    .grayscale()
    .normalise({ lower: 2, upper: 98 })
    .linear(1.15, -18)
    .resize({ width: job.width })
    .webp({ quality: 72 })
    .toFile(join(OUT, job.out))
  console.log(job.out, `${info.width}×${info.height}`, `${Math.round(info.size / 1024)} kB`)
}
