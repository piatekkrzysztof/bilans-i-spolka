import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { RichText } from '@/components/rich-text'
import { LinkButton } from '@/components/ui/button'
import { FaqList } from '@/components/ui/faq'
import { getService, getServices } from '@/content/repository'
import { faqPage, JsonLd } from '@/lib/seo/json-ld'

export async function generateStaticParams() {
  return (await getServices()).map(service => ({ slug: service.slug }))
}

export async function generateMetadata({ params }: PageProps<'/uslugi/[slug]'>): Promise<Metadata> {
  const service = await getService((await params).slug)
  if (!service) return {}
  return {
    title: `${service.headline} - Kraków i zdalnie`,
    description: service.summary,
    alternates: { canonical: `/uslugi/${service.slug}` },
  }
}

export default async function ServicePage({ params }: PageProps<'/uslugi/[slug]'>) {
  const { slug } = await params
  const [service, services] = await Promise.all([getService(slug), getServices()])
  if (!service) notFound()

  return (
    <>
      <JsonLd data={faqPage(service.faq)} />
      <PageHeader
        crumbs={[{ name: 'Usługi', path: '/uslugi' }, { name: service.title, path: `/uslugi/${service.slug}` }]}
        eyebrow="Usługa"
        title={service.headline}
        lead={<p>{service.summary}</p>}
      />

      <div className="container-page grid gap-16 pb-24 lg:grid-cols-[1fr_22rem] lg:pb-32">
        <div className="max-w-prose">
          <RichText value={service.body} />

          <div className="mt-14 grid gap-10 border-t border-ink/70 pt-10 sm:grid-cols-2">
            <div>
              <h2 className="font-serif text-xl">W cenie</h2>
              <ul className="mt-4 grid gap-2.5 text-sm">
                {service.included.map(item => (
                  <li key={item} className="grid grid-cols-[1.25rem_1fr] gap-2"><span aria-hidden="true" className="text-ledger">✓</span>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="font-serif text-xl">Osobno</h2>
              <ul className="mt-4 grid gap-2.5 text-sm text-ink-muted">
                {service.notIncluded.map(item => (
                  <li key={item} className="grid grid-cols-[1.25rem_1fr] gap-2"><span aria-hidden="true">-</span>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <section className="mt-16" aria-labelledby="faq-uslugi">
            <h2 id="faq-uslugi" className="mb-6 font-serif text-2xl">Pytania o {service.title.toLowerCase()}</h2>
            <FaqList items={service.faq} />
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="ledger-margin rounded-[3px] border border-rule bg-surface py-7 pl-12 pr-7">
            <p className="eyebrow">Cena</p>
            <p className="num mt-3 font-serif text-[2.5rem] leading-none text-ink">
              {service.priceFrom === 0 ? '0 zł' : `od ${service.priceFrom} zł`}
            </p>
            <span className="double-rule mt-2 w-40" />
            <p className="mt-3 text-sm text-ink-muted">
              {service.priceFrom === 0 ? 'przy umowie na księgowość' : service.slug === 'kadry-i-place' ? 'netto za pracownika miesięcznie' : 'netto miesięcznie'}
            </p>
            <LinkButton href={`/wycena?${service.quotePreset}`} className="mt-6 w-full" arrow>Policz dokładnie</LinkButton>
            <h2 className="mt-8 text-sm font-medium text-ink">Dla kogo</h2>
            <ul className="mt-2 grid gap-1.5 text-sm text-ink-muted">
              {service.forWho.map(item => <li key={item}>{item}</li>)}
            </ul>
          </div>
          <nav aria-label="Inne usługi" className="mt-8">
            <p className="eyebrow">Inne usługi</p>
            <ul className="mt-3 grid text-sm">
              {services.filter(s => s.slug !== service.slug).map(s => (
                <li key={s.slug} className="border-b border-rule">
                  <Link href={`/uslugi/${s.slug}`} className="flex justify-between py-3 hover:text-ledger">{s.title}<span aria-hidden="true">→</span></Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>
    </>
  )
}
