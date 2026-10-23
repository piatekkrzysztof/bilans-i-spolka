import type { Metadata } from 'next'
import { Suspense } from 'react'
import { FullConfigurator } from '@/components/configurator/full-configurator'
import { PageHeader } from '@/components/layout/page-header'
import { getPriceList, getTaxYear, getTeam } from '@/content/repository'
import { parseQuoteParams } from '@/domain/quote-params'
import { formatDate } from '@/lib/format'

export const metadata: Metadata = {
  title: 'Wycena księgowości online - cena w minutę, bez e-maila',
  description:
    'Policz miesięczny koszt księgowości dla JDG lub spółki z o.o.: ryczałt, KPiR, pełna księgowość, kadry i płace. Cena netto i brutto od razu, link do wyceny możesz wysłać wspólnikowi.',
  alternates: { canonical: '/wycena' },
}

/** Parametry z adresu czytamy w Suspense - reszta strony jest statyczną powłoką (Cache Components). */
async function ConfiguratorFromUrl({ searchParams }: { searchParams: PageProps<'/wycena'>['searchParams'] }) {
  const [params, priceList, taxYear, team] = await Promise.all([searchParams, getPriceList(), getTaxYear(), getTeam()])
  const initial = parseQuoteParams(params, priceList.addons.map(a => a.id))
  // Do przeglądarki tylko to, czego potrzebuje karta „Twoja księgowa” - bez bio i Portable Text.
  const advisors = team.map(({ slug, name, role, specialization, responseTime, legalForms, taxForms, priority, acceptsNewClients, photo }) => ({
    slug, name, role, specialization, responseTime, legalForms, taxForms, priority, acceptsNewClients, photo,
  }))
  return <FullConfigurator initial={initial} priceList={priceList} taxYear={taxYear} team={advisors} />
}

function ConfiguratorSkeleton() {
  return (
    <div className="grid gap-x-16 lg:grid-cols-[1fr_26rem]" aria-busy="true" aria-label="Wczytuję konfigurator">
      <div className="grid gap-px">
        {[0, 1, 2, 3, 4].map(i => <div key={i} className="h-44 border-t border-rule" />)}
      </div>
      <div className="mt-8 h-[34rem] rounded-[3px] border border-rule bg-surface" />
    </div>
  )
}

export default async function QuotePage({ searchParams }: PageProps<'/wycena'>) {
  const priceList = await getPriceList()
  return (
    <>
      <PageHeader
        crumbs={[{ name: 'Wycena', path: '/wycena' }]}
        eyebrow="Wycena online · 5 pytań"
        title="Ile kosztuje księgowość Twojej firmy?"
        lead={
          <p>
            Cena pokazuje się od razu i zmienia przy każdej odpowiedzi. E-mail podajesz dopiero wtedy, gdy chcesz wycenę
            w PDF albo konsultację. Cennik z {formatDate(priceList.validFrom)}.
          </p>
        }
      />
      <div className="container-page pb-24 lg:pb-32">
        <Suspense fallback={<ConfiguratorSkeleton />}>
          <ConfiguratorFromUrl searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  )
}
