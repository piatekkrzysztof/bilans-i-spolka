import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { getServices } from '@/content/repository'

export const metadata: Metadata = {
  title: 'Usługi księgowe dla JDG i spółek z o.o.',
  description: 'Ryczałt, KPiR, pełna księgowość, kadry i płace, zakładanie firmy. Ceny na stronie, rozpisane na pozycje.',
  alternates: { canonical: '/uslugi' },
}

export default async function ServicesPage() {
  const services = await getServices()
  return (
    <>
      <PageHeader
        crumbs={[{ name: 'Usługi', path: '/uslugi' }]}
        eyebrow="Usługi"
        title="Pięć usług, jeden cennik."
        lead={<p>Każda cena jest na stronie. Dokładną kwotę dla swojej firmy policzysz w wycenie online.</p>}
      />
      <div className="container-page pb-24 lg:pb-32">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">Usługi i ceny</caption>
          <thead>
            <tr className="border-b border-ink/70 text-sm text-ink-muted">
              <th scope="col" className="pb-3 font-normal">Usługa</th>
              <th scope="col" className="hidden pb-3 font-normal md:table-cell">Zakres</th>
              <th scope="col" className="pb-3 text-right font-normal">Netto miesięcznie</th>
            </tr>
          </thead>
          <tbody>
            {services.map(service => (
              <tr key={service.slug} className="group border-b border-rule align-top">
                <th scope="row" className="py-7 pr-6 font-normal">
                  <Link href={`/uslugi/${service.slug}`} className="font-serif text-2xl text-ink group-hover:text-ledger">{service.title}</Link>
                </th>
                <td className="hidden max-w-xl py-7 pr-6 text-ink-muted md:table-cell">{service.summary}</td>
                <td className="num py-7 text-right font-serif text-xl text-ink">
                  {service.priceFrom === 0 ? 'w cenie umowy' : `od ${service.priceFrom} zł`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
