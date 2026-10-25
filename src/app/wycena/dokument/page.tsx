import type { Metadata } from 'next'
import { connection } from 'next/server'
import { Suspense } from 'react'
import { LogoMark } from '@/components/layout/logo'
import { PrintButton } from '@/components/configurator/print-button'
import { getPriceList, getSiteSettings } from '@/content/repository'
import { formatPLN } from '@/domain/money'
import { calculateQuote, type QuoteLine } from '@/domain/pricing'
import { LEGAL_FORM_LABELS, TAX_FORM_LABELS } from '@/domain/quote'
import { parseQuoteParams, quoteNumber, serializeQuoteParams } from '@/domain/quote-params'
import { formatDate } from '@/lib/format'

/**
 * Dokument wyceny - ta sama strona jest szablonem PDF: n8n wysyła jej adres do PDF.co
 * (URL → PDF, media print), więc PDF i podgląd w przeglądarce nie mogą się rozjechać.
 */
export const metadata: Metadata = {
  title: 'Dokument wyceny',
  robots: { index: false, follow: false },
}

function Rows({ lines }: { lines: QuoteLine[] }) {
  return (
    <>
      {lines.map(line => (
        <tr key={line.id} className="border-b border-rule">
          <td className="py-2.5 pr-4">
            {line.label}
            {line.quantity && line.unitPrice ? <span className="num ml-2 text-xs text-ink-muted">{line.quantity} × {formatPLN(line.unitPrice)}</span> : null}
            {line.detail && <span className="ml-2 text-xs text-ink-muted">{line.detail}</span>}
          </td>
          <td className="num py-2.5 text-right">{line.amount === 0 ? 'w cenie' : formatPLN(line.amount)}</td>
        </tr>
      ))}
    </>
  )
}

async function QuoteDocument({ searchParams }: { searchParams: PageProps<'/wycena/dokument'>['searchParams'] }) {
  await connection()
  const [raw, priceList, site] = await Promise.all([searchParams, getPriceList(), getSiteSettings()])
  const quote = calculateQuote(parseQuoteParams(raw, priceList.addons.map(a => a.id)), priceList)
  const canonical = serializeQuoteParams(quote.input)
  const note = typeof raw.notka === 'string' ? raw.notka.slice(0, 600) : null
  const today = new Date().toISOString().slice(0, 10)

  return (
    <article className="mx-auto my-10 w-full max-w-[210mm] bg-surface px-[18mm] py-[16mm] border-2 border-ink print:my-0 print:border-0">
      <header className="flex items-start justify-between gap-8 border-b border-ink pb-6">
        <div className="flex items-center gap-3">
          <LogoMark className="size-9" />
          <div>
            <p className="font-display text-2xl leading-none uppercase tracking-[-0.02em]">Bilans <span className="italic text-ledger">&amp;</span> Spółka</p>
            <p className="mt-1 text-xs text-ink-muted">{site.address.street}, {site.address.postalCode} {site.address.city}</p>
          </div>
        </div>
        <dl className="num text-right text-xs text-ink-muted">
          <dt className="sr-only">Numer</dt>
          <dd className="font-display text-lg text-ink uppercase tracking-[-0.02em]">Wycena <span className="num font-bold">{quoteNumber(canonical)}</span></dd>
          <dt className="sr-only">Data</dt>
          <dd>{formatDate(today)}</dd>
          <dd>cennik {quote.priceListVersion}</dd>
        </dl>
      </header>

      <section className="mt-8 grid grid-cols-2 gap-6 text-sm">
        <div>
          <p className="eyebrow">Forma działalności</p>
          <p className="mt-1">{LEGAL_FORM_LABELS[quote.input.legalForm]}, {TAX_FORM_LABELS[quote.input.taxForm].toLowerCase()}</p>
        </div>
        <div>
          <p className="eyebrow">VAT</p>
          <p className="mt-1">{quote.input.vat ? 'czynny podatnik VAT' : 'zwolniony z VAT'}{quote.input.foreign ? ', transakcje zagraniczne' : ''}</p>
        </div>
      </section>

      <table className="mt-8 w-full border-collapse text-sm">
        <caption className="sr-only">Pozycje wyceny</caption>
        <thead>
          <tr className="border-b border-ink/70 text-left">
            <th scope="col" className="pb-2 font-medium">Miesięcznie</th>
            <th scope="col" className="pb-2 text-right font-medium">Netto</th>
          </tr>
        </thead>
        <tbody>
          <Rows lines={quote.monthly} />
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" className="pt-4 text-left font-display text-lg font-medium uppercase tracking-[-0.02em]">{quote.isFromPrice ? 'Razem od' : 'Razem'} netto</th>
            <td className="num pt-4 text-right font-serif text-2xl">{formatPLN(quote.monthlyNet)}</td>
          </tr>
          <tr>
            <td />
            <td className="pt-1"><span className="double-rule ml-auto w-32" /></td>
          </tr>
          <tr>
            <th scope="row" className="pt-2 text-left text-xs font-normal text-ink-muted">Brutto (VAT {Math.round(priceList.vatRate * 100)}%)</th>
            <td className="num pt-2 text-right text-xs text-ink-muted">{formatPLN(quote.monthlyGross)}</td>
          </tr>
        </tfoot>
      </table>

      {quote.oneOff.length > 0 && (
        <table className="mt-10 w-full border-collapse text-sm">
          <caption className="sr-only">Usługi jednorazowe</caption>
          <thead>
            <tr className="border-b border-ink/70 text-left">
              <th scope="col" className="pb-2 font-medium">Jednorazowo</th>
              <th scope="col" className="pb-2 text-right font-medium">Netto</th>
            </tr>
          </thead>
          <tbody>
            <Rows lines={quote.oneOff} />
          </tbody>
        </table>
      )}

      {note && (
        <section className="mt-10 border-l-2 border-brass pl-5">
          <p className="eyebrow">Na co zwrócić uwagę</p>
          <p className="mt-2 text-sm">{note}</p>
          <p className="mt-2 text-xs text-ink-muted">Notka pomocnicza - nie jest poradą podatkową. Kwoty pochodzą wyłącznie z cennika.</p>
        </section>
      )}

      <footer className="mt-12 border-t border-rule pt-5 text-xs leading-relaxed text-ink-muted">
        <p>Cena ostateczna po bezpłatnej konsultacji, bez ukrytych opłat. Wycena ważna 30 dni.</p>
        <p className="mt-1">Projekt koncepcyjny SM-art - dokument przykładowy, nie stanowi oferty handlowej.</p>
      </footer>
      <PrintButton />
    </article>
  )
}

export default function QuoteDocumentPage({ searchParams }: PageProps<'/wycena/dokument'>) {
  return (
    <Suspense fallback={<div className="mx-auto my-10 h-[297mm] w-full max-w-[210mm] bg-surface" />}>
      <QuoteDocument searchParams={searchParams} />
    </Suspense>
  )
}
