/**
 * Dane strukturalne schema.org. Typowane przez schema-dts, żeby literówka w nazwie pola
 * nie przeszła po cichu do Rich Results Test.
 */
import type { AccountingService, Article as SchemaArticle, BreadcrumbList, FAQPage, Person, WithContext } from 'schema-dts'
import type { Article, District, Faq, SiteSettings, TeamMember } from '@/content/types'
import { absoluteUrl } from '@/lib/site'

export function JsonLd<T extends WithContext<AccountingService | FAQPage | Person | SchemaArticle | BreadcrumbList>>({ data }: { data: T }) {
  // Zamiana `<` blokuje zamknięcie tagu skryptu przez treść z CMS (XSS).
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
}

const ORG_ID = absoluteUrl('/#biuro')

export function accountingService(site: SiteSettings, district?: District): WithContext<AccountingService> {
  return {
    '@context': 'https://schema.org',
    '@type': 'AccountingService',
    '@id': ORG_ID,
    'name': site.name,
    'description': site.tagline,
    'url': absoluteUrl('/'),
    'telephone': site.phone,
    'email': site.email,
    'priceRange': '279-3590 PLN',
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': site.address.street,
      'postalCode': site.address.postalCode,
      'addressLocality': site.address.city,
      'addressCountry': 'PL',
    },
    'geo': { '@type': 'GeoCoordinates', 'latitude': site.geo.lat, 'longitude': site.geo.lng },
    'areaServed': district
      ? [{ '@type': 'Place', 'name': `${district.name}, Kraków` }, ...district.neighbourhoods.map(n => ({ '@type': 'Place' as const, 'name': `${n}, Kraków` }))]
      : [{ '@type': 'City', 'name': 'Kraków' }, { '@type': 'Country', 'name': 'Polska' }],
    'openingHoursSpecification': [
      { '@type': 'OpeningHoursSpecification', 'dayOfWeek': ['Monday', 'Tuesday', 'Wednesday', 'Thursday'], 'opens': '08:00', 'closes': '17:00' },
      { '@type': 'OpeningHoursSpecification', 'dayOfWeek': 'Friday', 'opens': '08:00', 'closes': '15:00' },
    ],
  }
}

export function faqPage(items: Faq[]): WithContext<FAQPage> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': items.map(item => ({
      '@type': 'Question',
      'name': item.question,
      'acceptedAnswer': { '@type': 'Answer', 'text': item.answer },
    })),
  }
}

export function person(member: TeamMember): WithContext<Person> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': absoluteUrl(`/zespol/${member.slug}#osoba`),
    'name': member.name,
    'jobTitle': member.role,
    'description': member.specialization,
    'hasCredential': member.credentials.map(name => ({ '@type': 'EducationalOccupationalCredential', 'name': name })),
    'worksFor': { '@id': ORG_ID },
    'url': absoluteUrl(`/zespol/${member.slug}`),
  }
}

export function article(item: Article, author: TeamMember): WithContext<SchemaArticle> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': item.title,
    'description': item.description,
    'datePublished': item.publishedAt,
    'dateModified': item.updatedAt,
    'inLanguage': 'pl-PL',
    'author': { '@type': 'Person', '@id': absoluteUrl(`/zespol/${author.slug}#osoba`), 'name': author.name, 'jobTitle': author.role },
    'publisher': { '@id': ORG_ID },
    'mainEntityOfPage': absoluteUrl(`/wiedza/${item.slug}`),
  }
}

export function breadcrumbs(items: { name: string; path: string }[]): WithContext<BreadcrumbList> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': absoluteUrl(item.path),
    })),
  }
}
