import { evaluate, parse } from 'groq-js'
import { describe, expect, it } from 'vitest'
import { articlesFixture } from '@/content/fixtures/articles'
import { districtsFixture } from '@/content/fixtures/districts'
import { priceListFixture } from '@/content/fixtures/price-list'
import { servicesFixture } from '@/content/fixtures/services'
import { monthFixture, siteFixture, testimonialsFixture } from '@/content/fixtures/site'
import { taxYear2026 } from '@/content/fixtures/tax-year'
import { teamFixture } from '@/content/fixtures/team'
import { QUERIES } from '@/content/sanity'
import { buildSeed, toPct } from '@/content/seed'

const dataset = buildSeed({
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

/** Te same zapytania co aplikacja, wykonane silnikiem GROQ w pamięci na dokumentach z seeda. */
async function query<T>(groq: string): Promise<T> {
  const result = await evaluate(parse(groq), { dataset, timestamp: new Date('2026-10-24T12:00:00Z') })
  return (await result.get()) as T
}

describe('seed Sanity - powrót przez zapytania GROQ daje te same dane', () => {
  it('cennik: grosze i mnożniki co do wartości', async () => {
    expect(await query(QUERIES.priceList)).toEqual(priceListFixture)
  })

  it('stawki 2026: ZUS, zdrowotna, PIT i ryczałt', async () => {
    const taxYear = await query<typeof taxYear2026>(QUERIES.taxYear)
    // Dzielenie przez 100 w GROQ daje ułamki zmiennoprzecinkowe - porównujemy z dokładnością do 1e-12.
    expect(taxYear.zus.rates.pension).toBeCloseTo(taxYear2026.zus.rates.pension, 12)
    expect(JSON.parse(JSON.stringify(taxYear, (_k, v) => (typeof v === 'number' ? Number(v.toFixed(10)) : v)))).toEqual(taxYear2026)
  })

  it('zespół, artykuły z autorką i landingi z opiekunką', async () => {
    const team = await query<Array<{ slug: string; name: string }>>(QUERIES.team)
    expect(team.map(m => m.slug)).toEqual(teamFixture.map(m => m.slug))

    const articles = await query<Array<{ slug: string; authorSlug: string }>>(QUERIES.articles)
    expect(articles.map(a => [a.slug, a.authorSlug])).toEqual(articlesFixture.map(a => [a.slug, a.authorSlug]))

    const districts = await query<Array<{ slug: string; advisorSlug: string }>>(QUERIES.districts)
    expect(districts.map(d => [d.slug, d.advisorSlug])).toEqual(districtsFixture.map(d => [d.slug, d.advisorSlug]))
  })

  it('usługi w kolejności z fixtures, z FAQ', async () => {
    const services = await query<Array<{ slug: string; faq: unknown[] }>>(QUERIES.services)
    expect(services.map(s => s.slug)).toEqual(servicesFixture.map(s => s.slug))
    expect(services.every(s => s.faq.length > 0)).toBe(true)
  })

  it('każdy element tablicy obiektów ma _key (wymóg Sanity)', () => {
    const keys: string[] = []
    JSON.stringify(dataset, (key, value) => {
      // Pomijamy główną tablicę dokumentów - tylko tablice wewnątrz dokumentów potrzebują `_key`.
      if (key !== '' && Array.isArray(value)) {
        const objects = value.filter(v => v && typeof v === 'object')
        if (objects.length) {
          expect(objects.every(v => typeof v._key === 'string')).toBe(true)
          keys.push(...objects.map(v => v._key))
        }
      }
      return value
    })
    expect(keys.length).toBeGreaterThan(0)
  })

  it('procenty bez szumu zmiennoprzecinkowego', () => {
    expect(toPct(0.1952)).toBe(19.52)
    expect(toPct(0.0245)).toBe(2.45)
    expect(toPct(0.085)).toBe(8.5)
  })
})
