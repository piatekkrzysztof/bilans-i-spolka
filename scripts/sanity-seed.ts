/**
 * Zapisuje treści startowe jako NDJSON do importu w Sanity:
 *   pnpm sanity:seed
 *   cd studio && pnpm exec sanity dataset import seed/production.ndjson production --replace
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { articlesFixture } from '../src/content/fixtures/articles'
import { districtsFixture } from '../src/content/fixtures/districts'
import { priceListFixture } from '../src/content/fixtures/price-list'
import { servicesFixture } from '../src/content/fixtures/services'
import { monthFixture, siteFixture, testimonialsFixture } from '../src/content/fixtures/site'
import { taxYear2026 } from '../src/content/fixtures/tax-year'
import { teamFixture } from '../src/content/fixtures/team'
import { buildSeed } from '../src/content/seed'

const documents = buildSeed({
  priceList: priceListFixture,
  taxYear: taxYear2026,
  site: siteFixture,
  team: teamFixture,
  services: servicesFixture,
  articles: articlesFixture,
  districts: districtsFixture,
  testimonials: testimonialsFixture,
  monthEvents: monthFixture,
})

const out = resolve(dirname(fileURLToPath(import.meta.url)), '../studio/seed/production.ndjson')
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, `${documents.map(doc => JSON.stringify(doc)).join('\n')}\n`)

const counts = documents.reduce<Record<string, number>>((acc, doc) => ({ ...acc, [doc._type]: (acc[doc._type] ?? 0) + 1 }), {})
console.log(`Zapisano ${documents.length} dokumentów do ${out}`)
console.log(Object.entries(counts).map(([type, n]) => `  ${type}: ${n}`).join('\n'))
