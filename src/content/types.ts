/**
 * Kształt dokumentów treści. Odpowiada 1:1 schematom Sanity w `studio/schemaTypes`,
 * więc lokalne dane (fixtures) i odpowiedzi GROQ są wymienne bez mapowania w komponentach.
 */
import type { LegalForm, TaxForm } from '@/domain/quote'

/** Minimalny podzbiór Portable Text, który renderujemy (src/components/rich-text.tsx). */
export interface PortableSpan {
  _type: 'span'
  text: string
  marks?: string[]
}

export interface PortableBlock {
  _type: 'block'
  _key: string
  style: 'normal' | 'h2' | 'h3' | 'blockquote'
  listItem?: 'bullet' | 'number'
  children: PortableSpan[]
  markDefs?: { _key: string; _type: 'link'; href: string }[]
}

export interface CalloutBlock {
  _type: 'callout'
  _key: string
  tone: 'info' | 'warning'
  title: string
  text: string
}

export type RichText = Array<PortableBlock | CalloutBlock>

export interface SanityImage {
  url: string
  alt: string
  width: number
  height: number
}

export interface TeamMember {
  slug: string
  name: string
  role: string
  /** Krótko, do karty: „JDG na ryczałcie i skali, zakładanie firm”. */
  specialization: string
  credentials: string[]
  responseTime: string
  legalForms: LegalForm[]
  taxForms: TaxForm[]
  priority: number
  acceptsNewClients: boolean
  calLink?: string
  bio: RichText
  photo?: SanityImage
  yearsOfExperience: number
}

export interface Service {
  slug: string
  title: string
  /** Fraza do nagłówka H1, pisana pod intencję wyszukiwania. */
  headline: string
  summary: string
  forWho: string[]
  included: string[]
  notIncluded: string[]
  /** Parametry konfiguratora, które otwiera CTA usługi. */
  quotePreset: string
  priceFrom: number
  body: RichText
  faq: Faq[]
}

export interface Faq {
  question: string
  answer: string
}

export interface Testimonial {
  quote: string
  author: string
  business: string
  legalForm: string
  since: string
}

export interface Article {
  slug: string
  title: string
  description: string
  topic: 'formy-opodatkowania' | 'ksef' | 'zmiana-biura' | 'terminy'
  authorSlug: string
  publishedAt: string
  updatedAt: string
  readingMinutes: number
  body: RichText
  cta: { label: string; href: string }
}

export interface District {
  slug: string
  name: string
  headline: string
  intro: string
  /** Unikalna treść lokalna: dojazd, osoba z zespołu, lokalne firmy. */
  access: string
  localNote: string
  advisorSlug: string
  neighbourhoods: string[]
  testimonial?: Testimonial
}

export interface MonthEvent {
  day: number
  title: string
  who: 'client' | 'office'
  detail: string
  /** Dotyczy tylko części klientów - pokazywane jako dopisek. */
  appliesTo?: string
}

export interface TrustStat {
  value: string
  label: string
}

export interface ComparisonRow {
  aspect: string
  us: string
  typical: string
}

export interface SiteSettings {
  name: string
  legalName: string
  tagline: string
  phone: string
  email: string
  address: { street: string; postalCode: string; city: string; district: string }
  geo: { lat: number; lng: number }
  openingHours: { days: string; hours: string }[]
  trust: TrustStat[]
  comparison: ComparisonRow[]
  homeFaq: Faq[]
  ksef: {
    mandatoryFrom: string
    smallBusinessLimit: string
    sourceLabel: string
    sourceUrl: string
  }
  /** Data weryfikacji cennika i dat KSeF - wymóg z checklisty przed publikacją. */
  contentVerifiedAt: string
}
