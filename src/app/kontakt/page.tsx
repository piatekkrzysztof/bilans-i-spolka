import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { LinkButton } from '@/components/ui/button'
import { ConceptNote } from '@/components/ui/concept-note'
import { getSiteSettings, getTeam } from '@/content/repository'
import { accountingService, JsonLd } from '@/lib/seo/json-ld'

export const metadata: Metadata = {
  title: 'Kontakt i bezpłatna konsultacja',
  description: 'Umów 20-minutową konsultację wideo albo odwiedź biuro na Krowodrzy. Telefon, e-mail i godziny otwarcia.',
  alternates: { canonical: '/kontakt' },
}

const calBase = process.env.NEXT_PUBLIC_CAL_BASE_URL ?? ''

export default async function ContactPage() {
  const [site, team] = await Promise.all([getSiteSettings(), getTeam()])
  const advisors = team.filter(m => m.acceptsNewClients && m.legalForms.length > 0)
  const mapUrl = `https://www.openstreetmap.org/?mlat=${site.geo.lat}&mlon=${site.geo.lng}#map=17/${site.geo.lat}/${site.geo.lng}`

  return (
    <>
      <JsonLd data={accountingService(site)} />
      <PageHeader
        crumbs={[{ name: 'Kontakt', path: '/kontakt' }]}
        eyebrow="Kontakt"
        title="Porozmawiajmy dwadzieścia minut."
        lead={<p>Konsultacja jest bezpłatna i bez zobowiązań. Wybierz księgową, która zna Twoją formę działalności - albo po prostu zadzwoń.</p>}
      />

      <div className="container-page grid gap-16 pb-24 lg:grid-cols-[1.3fr_1fr] lg:pb-32">
        <section id="konsultacja" aria-labelledby="konsultacja-tytul" className="scroll-mt-24">
          <h2 id="konsultacja-tytul" className="font-serif text-2xl">Kalendarz konsultacji</h2>
          <p className="mt-2 text-ink-muted">Każda księgowa ma własny kalendarz. Link do spotkania wideo dostaniesz w potwierdzeniu.</p>
          <ul className="mt-8 grid gap-px border-y border-rule bg-rule">
            {advisors.map(member => {
              const href = member.calLink ?? (calBase ? `${calBase}/${member.slug}/konsultacja` : `/wycena`)
              return (
                <li key={member.slug} className="flex flex-col justify-between gap-4 bg-paper py-6 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-serif text-xl">{member.name}</p>
                    <p className="text-sm text-ink-muted">{member.specialization}</p>
                  </div>
                  <LinkButton href={href} variant="secondary" className="shrink-0">
                    {member.calLink || calBase ? 'Wybierz termin' : 'Wycena + termin'}
                  </LinkButton>
                </li>
              )
            })}
          </ul>
          {!calBase && (
            <p className="mt-4 text-xs text-ink-muted">
              Tryb demo: kalendarze Cal.com podłącza się zmienną NEXT_PUBLIC_CAL_BASE_URL. Bez niej konsultację umawiasz przez formularz w wycenie.
            </p>
          )}
        </section>

        <aside className="grid content-start gap-10">
          <div>
            <h2 className="eyebrow">Biuro</h2>
            <address className="mt-3 font-serif text-xl not-italic leading-snug">
              {site.address.street}<br />{site.address.postalCode} {site.address.city}, {site.address.district}
            </address>
            <a href={mapUrl} className="link-underline mt-2 inline-block text-sm text-ledger" rel="noopener">Zobacz na mapie (OpenStreetMap)</a>
          </div>
          <div>
            <h2 className="eyebrow">Telefon i e-mail</h2>
            <p className="mt-3 grid gap-1">
              <a href={`tel:${site.phone.replace(/\s/g, '')}`} className="num font-serif text-xl link-underline">{site.phone}</a>
              <a href={`mailto:${site.email}`} className="link-underline text-ink-muted">{site.email}</a>
            </p>
          </div>
          <div>
            <h2 className="eyebrow">Godziny</h2>
            <dl className="mt-3 grid grid-cols-[1fr_auto] gap-y-1 text-sm">
              {site.openingHours.map(h => (
                <div key={h.days} className="contents">
                  <dt>{h.days}</dt>
                  <dd className="num text-right">{h.hours}</dd>
                </div>
              ))}
            </dl>
          </div>
          <ConceptNote>Adres i dane kontaktowe przykładowe - projekt koncepcyjny</ConceptNote>
        </aside>
      </div>
    </>
  )
}
