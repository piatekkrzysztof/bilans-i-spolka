/**
 * Zamiana lokalnych danych (fixtures) na dokumenty Sanity - start projektu w Studio z tą samą treścią,
 * którą strona ma dziś. Odwrotność projekcji GROQ z `sanity.ts`: grosze → złote, ułamki → procenty,
 * slugi → `slug.current`, autorki i opiekunki → referencje. Uruchomienie: `pnpm sanity:seed`.
 */
import type { PriceList } from '@/domain/pricing'
import type { TaxYear } from '@/domain/tax-comparison'
import type { Article, District, Faq, MonthEvent, RichText, Service, SiteSettings, TeamMember, Testimonial } from './types'

export type SanityDocument = { _id: string; _type: string } & Record<string, unknown>

export interface SeedInput {
  priceList: PriceList
  taxYear: TaxYear
  site: SiteSettings
  team: TeamMember[]
  services: Service[]
  articles: Article[]
  districts: District[]
  testimonials: Testimonial[]
  monthEvents: MonthEvent[]
}

/** Grosze → złote. */
export const toZl = (grosze: number) => grosze / 100
/** Ułamek → procent, bez szumu zmiennoprzecinkowego (0.1952 → 19.52, a nie 19.520000000000003). */
export const toPct = (fraction: number) => Math.round(fraction * 1_000_000) / 10_000

const slug = (current: string) => ({ _type: 'slug', current })
const ref = (type: string, slugValue: string) => ({ _type: 'reference', _ref: `${type}.${slugValue}` })

/** Każdy element tablicy obiektów w Sanity potrzebuje stabilnego `_key`. */
function keyed<T extends object>(items: readonly T[], prefix: string, type?: string) {
  return items.map((item, index) => ({ ...(type ? { _type: type } : {}), ...item, _key: `${prefix}${index}` }))
}

function richText(value: RichText) {
  return value.map(block =>
    block._type === 'block'
      ? { ...block, markDefs: block.markDefs ?? [], children: block.children.map((span, i) => ({ ...span, marks: span.marks ?? [], _key: `${block._key}s${i}` })) }
      : block,
  )
}

const faqs = (items: Faq[], prefix: string) => keyed(items, prefix, 'faq')

function brackets(prices: PriceList['base']['kpir']) {
  return { b1_10: toZl(prices['1-10']), b11_20: toZl(prices['11-20']), b21_40: toZl(prices['21-40']), b41_100: toZl(prices['41-100']) }
}

export function priceListDocument(p: PriceList): SanityDocument {
  return {
    _id: `priceList.${p.version}`,
    _type: 'priceList',
    version: p.version,
    validFrom: p.validFrom,
    vatRate: toPct(p.vatRate),
    base: { ewidencja: brackets(p.base.ewidencja), kpir: brackets(p.base.kpir), ksiegi: brackets(p.base.ksiegi) },
    partnershipSurcharge: toPct(p.partnershipMultiplier - 1),
    vatSurcharge: toPct(p.vatSurcharge),
    foreignSurcharge: toPct(p.foreignSurcharge),
    perEmployee: toZl(p.perEmployee),
    perCivilContract: toZl(p.perCivilContract),
    startupSetup: { label: p.startupSetup.label, price: toZl(p.startupSetup.price) },
    addons: keyed(
      p.addons.map(a => ({ id: slug(a.id), label: a.label, description: a.description, price: toZl(a.price), billing: a.billing, appliesTo: a.appliesTo })),
      'addon',
      'addon',
    ),
  }
}

export function taxYearDocument(t: TaxYear): SanityDocument {
  return {
    _id: `taxYear.${t.year}`,
    _type: 'taxYear',
    year: t.year,
    validFrom: t.validFrom,
    verifiedAt: t.verifiedAt,
    minimumWage: toZl(t.minimumWage),
    zus: {
      fullBase: toZl(t.zus.fullBase),
      preferentialBase: toZl(t.zus.preferentialBase),
      pension: toPct(t.zus.rates.pension),
      disability: toPct(t.zus.rates.disability),
      sickness: toPct(t.zus.rates.sickness),
      accident: toPct(t.zus.rates.accident),
      labourFund: toPct(t.zus.rates.labourFund),
    },
    health: {
      scaleRate: toPct(t.health.scaleRate),
      linearRate: toPct(t.health.linearRate),
      monthlyMinimum: toZl(t.health.monthlyMinimum),
      linearAnnualDeductionLimit: toZl(t.health.linearAnnualDeductionLimit),
      // Ostatni próg bez limitu - w Studio puste pole „Przychód do”.
      flatRateTiers: keyed(t.health.flatRateTiers.map(tier => ({ ...(tier.upTo === null ? {} : { upTo: toZl(tier.upTo) }), monthly: toZl(tier.monthly) })), 'tier', 'tier'),
      flatRateDeductibleShare: toPct(t.health.flatRateDeductibleShare),
    },
    pit: {
      scaleThreshold: toZl(t.pit.scaleThreshold),
      scaleLowRate: toPct(t.pit.scaleLowRate),
      scaleHighRate: toPct(t.pit.scaleHighRate),
      taxReducingAmount: toZl(t.pit.taxReducingAmount),
      linearRate: toPct(t.pit.linearRate),
      solidarityThreshold: toZl(t.pit.solidarityThreshold),
      solidarityRate: toPct(t.pit.solidarityRate),
    },
    flatRates: keyed(t.flatRates.map(r => ({ id: slug(r.id), label: r.label, rate: toPct(r.rate) })), 'rate', 'flatRate'),
  }
}

export function buildSeed(input: SeedInput): SanityDocument[] {
  const { site } = input
  return [
    priceListDocument(input.priceList),
    taxYearDocument(input.taxYear),
    {
      _id: 'siteSettings',
      _type: 'siteSettings',
      ...site,
      openingHours: keyed(site.openingHours, 'hours', 'hours'),
      trust: keyed(site.trust, 'stat', 'stat'),
      comparison: keyed(site.comparison, 'row', 'row'),
      homeFaq: faqs(site.homeFaq, 'faq'),
    },
    ...input.team.map(({ slug: s, bio, photo: _photo, ...member }, index) => ({
      _id: `teamMember.${s}`,
      _type: 'teamMember',
      ...member,
      slug: slug(s),
      orderRank: index + 1,
      bio: richText(bio),
    })),
    ...input.services.map(({ slug: s, body, faq, ...service }, index) => ({
      _id: `service.${s}`,
      _type: 'service',
      ...service,
      slug: slug(s),
      orderRank: index + 1,
      body: richText(body),
      faq: faqs(faq, `${s}-faq`),
    })),
    ...input.articles.map(({ slug: s, body, authorSlug, ...article }) => ({
      _id: `article.${s}`,
      _type: 'article',
      ...article,
      slug: slug(s),
      author: ref('teamMember', authorSlug),
      body: richText(body),
    })),
    ...input.districts.map(({ slug: s, advisorSlug, ...district }) => ({
      _id: `district.${s}`,
      _type: 'district',
      ...district,
      slug: slug(s),
      advisor: ref('teamMember', advisorSlug),
    })),
    ...input.testimonials.map((testimonial, index) => ({ _id: `testimonial.${index + 1}`, _type: 'testimonial', ...testimonial })),
    ...input.monthEvents.map(event => ({ _id: `monthEvent.${event.day}`, _type: 'monthEvent', ...event })),
  ]
}
