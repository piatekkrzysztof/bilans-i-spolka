import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { Portrait } from '@/components/team/portrait'
import { ConceptNote } from '@/components/ui/concept-note'
import { getTeam } from '@/content/repository'
import { LEGAL_FORM_LABELS } from '@/domain/quote'

export const metadata: Metadata = {
  title: 'Zespół - księgowe z imienia i nazwiska',
  description: 'Poznaj księgowe i doradcę podatkowego Bilans & Spółka: specjalizacje, uprawnienia i czas odpowiedzi.',
  alternates: { canonical: '/zespol' },
}

export default async function TeamPage() {
  const team = await getTeam()
  return (
    <>
      <PageHeader
        crumbs={[{ name: 'Zespół', path: '/zespol' }]}
        eyebrow="Zespół"
        title="Cztery osoby, które znają Twoją firmę."
        lead={<p>Każdy klient ma jedną opiekunkę. Przy spółkach i trudniejszych decyzjach podatkowych dołącza druga osoba - nigdy anonimowy dział.</p>}
      >
        <ConceptNote className="mt-6">Zespół fikcyjny, portrety przykładowe - projekt koncepcyjny</ConceptNote>
      </PageHeader>
      <div className="container-page pb-24 lg:pb-32">
        <ul className="grid gap-px border-y border-rule bg-rule">
          {team.map(member => (
            <li key={member.slug} className="bg-paper">
              <Link href={`/zespol/${member.slug}`} className="group grid items-center gap-8 py-10 md:grid-cols-[12rem_1fr_16rem]">
                <Portrait name={member.name} photo={member.photo} className="max-w-48" />
                <div>
                  <h2 className="font-serif text-[2rem] leading-tight text-ink group-hover:text-ledger">{member.name}</h2>
                  <p className="text-ink-muted">{member.role}</p>
                  <p className="mt-4 max-w-xl text-ink">{member.specialization}</p>
                </div>
                <dl className="grid gap-3 text-sm">
                  <div>
                    <dt className="eyebrow">Prowadzi</dt>
                    <dd className="mt-1">{member.legalForms.length ? member.legalForms.map(f => LEGAL_FORM_LABELS[f]).join(', ') : 'Kadry i płace wszystkich klientów'}</dd>
                  </div>
                  <div>
                    <dt className="eyebrow">Doświadczenie</dt>
                    <dd className="num mt-1">{member.yearsOfExperience} lat</dd>
                  </div>
                  <div>
                    <dt className="sr-only">Czas odpowiedzi</dt>
                    <dd className="text-ledger">{member.responseTime}</dd>
                  </div>
                </dl>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
