/**
 * Jedyne wejście do treści dla komponentów serwerowych.
 *
 * Z Sanity, gdy skonfigurowano `SANITY_PROJECT_ID`, w przeciwnym razie z lokalnych danych
 * (podglądy, testy, praca offline). Każda funkcja jest buforowana przez `'use cache'` z tagiem,
 * a webhook Sanity (/api/revalidate) unieważnia tylko zmieniony typ dokumentu (ADR-003).
 */
import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import type { PriceList } from '@/domain/pricing'
import type { TaxYear } from '@/domain/tax-comparison'
import { articlesFixture } from './fixtures/articles'
import { districtsFixture } from './fixtures/districts'
import { priceListFixture } from './fixtures/price-list'
import { servicesFixture } from './fixtures/services'
import { monthFixture, siteFixture, testimonialsFixture } from './fixtures/site'
import { taxYear2026 } from './fixtures/tax-year'
import { teamFixture } from './fixtures/team'
import { QUERIES, sanityFetch } from './sanity'
import type { Article, District, MonthEvent, Service, SiteSettings, TeamMember, Testimonial } from './types'

/** Tag = typ dokumentu w Sanity. Webhook przesyła `_type`, więc mapowanie jest 1:1. */
export const CONTENT_TAGS = ['priceList', 'taxYear', 'teamMember', 'service', 'article', 'district', 'siteSettings', 'testimonial', 'monthEvent'] as const
export type ContentTag = (typeof CONTENT_TAGS)[number]

async function load<T>(query: string, fallback: T, params: Record<string, string> = {}): Promise<T> {
  const fromSanity = await sanityFetch<T>(query, params)
  // Pusta lista z Sanity to prawie zawsze brak dostępu (prywatny dataset bez tokena), a nie celowo pusta treść -
  // strona bez zespołu i artykułów byłaby gorsza niż dane zapasowe. Głośno w logach, cicho dla odwiedzającego.
  if (Array.isArray(fromSanity) && fromSanity.length === 0 && Array.isArray(fallback) && fallback.length > 0) {
    console.warn('[content] Sanity zwróciło pustą listę - używam danych lokalnych. Sprawdź SANITY_API_READ_TOKEN.', query.slice(0, 40))
    return fallback
  }
  return fromSanity ?? fallback
}

export async function getPriceList(): Promise<PriceList> {
  'use cache'
  cacheTag('priceList')
  cacheLife('days')
  return load(QUERIES.priceList, priceListFixture)
}

export async function getTaxYear(): Promise<TaxYear> {
  'use cache'
  cacheTag('taxYear')
  cacheLife('days')
  return load(QUERIES.taxYear, taxYear2026)
}

export async function getSiteSettings(): Promise<SiteSettings> {
  'use cache'
  cacheTag('siteSettings')
  cacheLife('days')
  return load(QUERIES.siteSettings, siteFixture)
}

export async function getTeam(): Promise<TeamMember[]> {
  'use cache'
  cacheTag('teamMember')
  cacheLife('days')
  return load(QUERIES.team, teamFixture)
}

export async function getTeamMember(slug: string): Promise<TeamMember | undefined> {
  return (await getTeam()).find(member => member.slug === slug)
}

export async function getServices(): Promise<Service[]> {
  'use cache'
  cacheTag('service')
  cacheLife('days')
  return load(QUERIES.services, servicesFixture)
}

export async function getService(slug: string): Promise<Service | undefined> {
  return (await getServices()).find(service => service.slug === slug)
}

export async function getArticles(): Promise<Article[]> {
  'use cache'
  cacheTag('article')
  cacheLife('days')
  const articles = await load(QUERIES.articles, articlesFixture)
  return [...articles].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function getArticle(slug: string): Promise<Article | undefined> {
  return (await getArticles()).find(article => article.slug === slug)
}

export async function getDistricts(): Promise<District[]> {
  'use cache'
  cacheTag('district')
  cacheLife('days')
  return load(QUERIES.districts, districtsFixture)
}

export async function getDistrict(slug: string): Promise<District | undefined> {
  return (await getDistricts()).find(district => district.slug === slug)
}

export async function getTestimonials(): Promise<Testimonial[]> {
  'use cache'
  cacheTag('testimonial')
  cacheLife('days')
  return load(QUERIES.testimonials, testimonialsFixture)
}

export async function getMonthEvents(): Promise<MonthEvent[]> {
  'use cache'
  cacheTag('monthEvent')
  cacheLife('days')
  const events = await load(QUERIES.monthEvents, monthFixture)
  return [...events].sort((a, b) => a.day - b.day)
}
