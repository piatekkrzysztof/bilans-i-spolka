import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { Portrait } from '@/components/team/portrait'
import { LinkButton } from '@/components/ui/button'
import { ConceptNote } from '@/components/ui/concept-note'
import { getDistrict, getDistricts, getServices, getSiteSettings, getTeamMember } from '@/content/repository'
import { accountingService, JsonLd } from '@/lib/seo/json-ld'

/** Publiczny adres: /biuro-rachunkowe-[dzielnica] (rewrite w next.config.ts, ADR-006). */
const publicPath = (slug: string) => `/biuro-rachunkowe-${slug}`

export async function generateStaticParams() {
  return (await getDistricts()).map(d => ({ dzielnica: d.slug }))
}

export async function generateMetadata({ params }: PageProps<'/lokalnie/[dzielnica]'>): Promise<Metadata> {
  const district = await getDistrict((await params).dzielnica)
  if (!district) return {}
  return {
    title: `${district.headline} - cena znana z góry`,
    description: `${district.intro.slice(0, 150)}…`,
    alternates: { canonical: publicPath(district.slug) },
  }
}

export default async function DistrictPage({ params }: PageProps<'/lokalnie/[dzielnica]'>) {
  const { dzielnica } = await params
  const [district, site, services, districts] = await Promise.all([getDistrict(dzielnica), getSiteSettings(), getServices(), getDistricts()])
  if (!district) notFound()
  const advisor = await getTeamMember(district.advisorSlug)

  return (
    <>
      <JsonLd data={accountingService(site, district)} />
      <PageHeader
        crumbs={[{ name: `Biuro rachunkowe ${district.name}`, path: publicPath(district.slug) }]}
        eyebrow={`Kraków · ${district.name}`}
        title={district.headline}
        lead={<p>{district.intro}</p>}
      >
        <div className="mt-8 flex flex-wrap gap-x-7 gap-y-4">
          <LinkButton href="/wycena" arrow>Sprawdź cenę</LinkButton>
          <LinkButton href="/kontakt#konsultacja" variant="text">Umów konsultację</LinkButton>
        </div>
      </PageHeader>

      <div className="container-page grid gap-16 pb-24 lg:grid-cols-[1fr_22rem] lg:pb-32">
        <div className="grid max-w-prose gap-12">
          <section aria-labelledby="dojazd">
            <h2 id="dojazd" className="font-serif text-2xl">Dojazd i dokumenty</h2>
            <p className="mt-3 text-ink-muted">{district.access}</p>
          </section>
          <section aria-labelledby="lokalnie">
            <h2 id="lokalnie" className="font-serif text-2xl">Kogo obsługujemy w dzielnicy {district.name}</h2>
            <p className="mt-3 text-ink-muted">{district.localNote}</p>
            <p className="mt-4 text-sm text-ink-muted">Osiedla i okolice: {district.neighbourhoods.join(', ')}.</p>
          </section>
          {district.testimonial && (
            <figure className="border-l-2 border-brass pl-6">
              <blockquote className="font-serif text-xl leading-snug">„{district.testimonial.quote}”</blockquote>
              <figcaption className="mt-4 text-sm text-ink-muted">
                {district.testimonial.author} · {district.testimonial.business} · {district.testimonial.legalForm}
              </figcaption>
              <ConceptNote className="mt-3">Opinia przykładowa</ConceptNote>
            </figure>
          )}
          <section aria-labelledby="uslugi-lokalnie">
            <h2 id="uslugi-lokalnie" className="font-serif text-2xl">Usługi</h2>
            <ul className="mt-4 border-t border-rule">
              {services.map(s => (
                <li key={s.slug} className="border-b border-rule">
                  <Link href={`/uslugi/${s.slug}`} className="flex justify-between gap-4 py-3.5 hover:text-ledger">
                    {s.title}
                    <span className="num text-ink-muted">{s.priceFrom === 0 ? 'w cenie umowy' : `od ${s.priceFrom} zł`}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="grid content-start gap-8">
          {advisor && (
            <div className="rounded-[3px] border border-rule bg-surface p-6">
              <p className="eyebrow">Opiekunka dzielnicy</p>
              <div className="mt-4 flex items-center gap-4">
                <Portrait name={advisor.name} photo={advisor.photo} size="sm" className="rounded-full" />
                <div>
                  <Link href={`/zespol/${advisor.slug}`} className="font-serif text-lg link-underline">{advisor.name}</Link>
                  <p className="text-sm text-ink-muted">{advisor.responseTime}</p>
                </div>
              </div>
            </div>
          )}
          <nav aria-label="Inne dzielnice">
            <p className="eyebrow">Inne dzielnice</p>
            <ul className="mt-3 grid text-sm">
              {districts.filter(d => d.slug !== district.slug).map(d => (
                <li key={d.slug} className="border-b border-rule">
                  <Link href={publicPath(d.slug)} className="block py-3 hover:text-ledger">Biuro rachunkowe {d.name}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>
    </>
  )
}
