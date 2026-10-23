/**
 * Klient Sanity i zapytania GROQ. Projekcje zwracają dokładnie kształty z `types.ts`,
 * więc komponenty nie wiedzą, czy treść przyszła z Sanity, czy z lokalnych danych.
 */
import 'server-only'
import { createClient, type SanityClient } from '@sanity/client'

let client: SanityClient | null | undefined

function sanityClient(): SanityClient | null {
  if (client !== undefined) return client
  const projectId = process.env.SANITY_PROJECT_ID
  client = projectId
    ? createClient({
        projectId,
        dataset: process.env.SANITY_DATASET ?? 'production',
        apiVersion: process.env.SANITY_API_VERSION ?? '2026-10-01',
        // Bufor Next.js jest jedynym cache - CDN Sanity dokładałby drugie opóźnienie po publikacji.
        useCdn: false,
        perspective: 'published',
      })
    : null
  return client
}

/** `null` = Sanity nie jest skonfigurowane; wywołujący używa danych lokalnych. */
export async function sanityFetch<T>(query: string, params: Record<string, string> = {}): Promise<T | null> {
  const sanity = sanityClient()
  if (!sanity) return null
  const result = await sanity.fetch<T | null>(query, params)
  return result ?? null
}

const image = `{ "url": asset->url, alt, "width": asset->metadata.dimensions.width, "height": asset->metadata.dimensions.height }`
const slug = `"slug": slug.current`

// W Studio ceny są w złotych, a stawki w procentach - tak myśli księgowa. Domena liczy w groszach i ułamkach,
// więc przeliczenie dzieje się tutaj, w jednym miejscu (ADR-003).
const gr = (field: string) => `round(${field} * 100)`
const frac = (field: string) => `${field} / 100`
const brackets = (ledger: string) =>
  `{ "1-10": ${gr(`base.${ledger}.b1_10`)}, "11-20": ${gr(`base.${ledger}.b11_20`)}, "21-40": ${gr(`base.${ledger}.b21_40`)}, "41-100": ${gr(`base.${ledger}.b41_100`)} }`

export const QUERIES = {
  // Obowiązuje najnowszy cennik, którego data startu już minęła - nowy można wprowadzić z wyprzedzeniem.
  priceList: `*[_type == "priceList" && validFrom <= now()] | order(validFrom desc)[0]{
    version, validFrom,
    "vatRate": ${frac('vatRate')},
    "base": { "ewidencja": ${brackets('ewidencja')}, "kpir": ${brackets('kpir')}, "ksiegi": ${brackets('ksiegi')} },
    "partnershipMultiplier": 1 + ${frac('partnershipSurcharge')},
    "vatSurcharge": ${frac('vatSurcharge')},
    "foreignSurcharge": ${frac('foreignSurcharge')},
    "perEmployee": ${gr('perEmployee')},
    "perCivilContract": ${gr('perCivilContract')},
    "startupSetup": { "label": startupSetup.label, "price": ${gr('coalesce(startupSetup.price, 0)')} },
    "addons": coalesce(addons[]{ "id": id.current, label, description, "price": ${gr('price')}, billing, "appliesTo": coalesce(appliesTo, []) }, [])
  }`,
  taxYear: `*[_type == "taxYear" && validFrom <= now()] | order(validFrom desc)[0]{
    year, validFrom, verifiedAt,
    "minimumWage": ${gr('minimumWage')},
    "zus": {
      "fullBase": ${gr('zus.fullBase')}, "preferentialBase": ${gr('zus.preferentialBase')},
      "rates": { "pension": ${frac('zus.pension')}, "disability": ${frac('zus.disability')}, "sickness": ${frac('zus.sickness')}, "accident": ${frac('zus.accident')}, "labourFund": ${frac('zus.labourFund')} }
    },
    "health": {
      "scaleRate": ${frac('health.scaleRate')}, "linearRate": ${frac('health.linearRate')},
      "monthlyMinimum": ${gr('health.monthlyMinimum')},
      "linearAnnualDeductionLimit": ${gr('health.linearAnnualDeductionLimit')},
      "flatRateTiers": health.flatRateTiers[]{ "upTo": select(defined(upTo) => ${gr('upTo')}, null), "monthly": ${gr('monthly')} },
      "flatRateDeductibleShare": ${frac('health.flatRateDeductibleShare')}
    },
    "pit": {
      "scaleThreshold": ${gr('pit.scaleThreshold')}, "scaleLowRate": ${frac('pit.scaleLowRate')}, "scaleHighRate": ${frac('pit.scaleHighRate')},
      "taxReducingAmount": ${gr('pit.taxReducingAmount')}, "linearRate": ${frac('pit.linearRate')},
      "solidarityThreshold": ${gr('pit.solidarityThreshold')}, "solidarityRate": ${frac('pit.solidarityRate')}
    },
    "flatRates": flatRates[]{ "id": id.current, label, "rate": ${frac('rate')} }
  }`,
  siteSettings: `*[_type == "siteSettings"][0]`,
  team: `*[_type == "teamMember"] | order(priority asc){ ..., ${slug}, "photo": photo${image} }`,
  services: `*[_type == "service"] | order(orderRank asc){ ..., ${slug} }`,
  articles: `*[_type == "article"]{ ..., ${slug}, "authorSlug": author->slug.current }`,
  districts: `*[_type == "district"]{ ..., ${slug}, "advisorSlug": advisor->slug.current }`,
  testimonials: `*[_type == "testimonial"] | order(_createdAt asc)`,
  monthEvents: `*[_type == "monthEvent"] | order(day asc)`,
} as const
