import type { Metadata } from 'next'
import { TaxComparator } from '@/components/comparator/tax-comparator'
import { PageHeader } from '@/components/layout/page-header'
import { LinkButton } from '@/components/ui/button'
import { getTaxYear } from '@/content/repository'

export const metadata: Metadata = {
  title: 'Skala, liniowy czy ryczałt? Porównywarka form opodatkowania 2026',
  description: 'Wpisz przychód i koszty - zobacz obok siebie podatek, składkę zdrowotną i ZUS na skali, liniowym i ryczałcie. Stawki 2026, wynik w widełkach.',
  alternates: { canonical: '/porownywarka' },
}

export default async function ComparatorPage() {
  const taxYear = await getTaxYear()
  return (
    <>
      <PageHeader
        crumbs={[{ name: 'Porównywarka form opodatkowania', path: '/porownywarka' }]}
        eyebrow={`Stawki ${taxYear.year}`}
        title="Skala, liniowy czy ryczałt?"
        lead={<p>Wpisz przewidywany przychód i koszty. Zobaczysz obok siebie podatek, składkę zdrowotną i ZUS - i ile zostaje na rękę.</p>}
      />
      <div className="container-page pb-20">
        <TaxComparator taxYear={taxYear} />
      </div>
      <section className="border-t border-rule bg-surface">
        <div className="container-page flex flex-col items-start justify-between gap-6 py-14 md:flex-row md:items-center">
          <p className="max-w-xl font-serif text-2xl leading-snug">Masz wynik? Teraz sprawdź, ile kosztuje księgowość dla tej formy.</p>
          <LinkButton href="/wycena" arrow>Przejdź do wyceny</LinkButton>
        </div>
      </section>
    </>
  )
}
