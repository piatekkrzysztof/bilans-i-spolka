import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { RichText } from '@/components/rich-text'
import { Portrait } from '@/components/team/portrait'
import { LinkButton } from '@/components/ui/button'
import { ConceptNote } from '@/components/ui/concept-note'
import { getArticles, getTeam, getTeamMember } from '@/content/repository'
import { formatDate } from '@/lib/format'
import { JsonLd, person } from '@/lib/seo/json-ld'

export async function generateStaticParams() {
  return (await getTeam()).map(member => ({ slug: member.slug }))
}

export async function generateMetadata({ params }: PageProps<'/zespol/[slug]'>): Promise<Metadata> {
  const member = await getTeamMember((await params).slug)
  if (!member) return {}
  return {
    title: `${member.name} - ${member.role}`,
    description: `${member.name}: ${member.specialization}. ${member.credentials.join(', ')}.`,
    alternates: { canonical: `/zespol/${member.slug}` },
  }
}

export default async function TeamMemberPage({ params }: PageProps<'/zespol/[slug]'>) {
  const { slug } = await params
  const [member, articles] = await Promise.all([getTeamMember(slug), getArticles()])
  if (!member) notFound()
  const authored = articles.filter(a => a.authorSlug === member.slug)

  return (
    <>
      <JsonLd data={person(member)} />
      <PageHeader crumbs={[{ name: 'Zespół', path: '/zespol' }, { name: member.name, path: `/zespol/${member.slug}` }]} eyebrow={member.role} title={member.name} />
      <div className="container-page grid gap-14 pb-24 md:grid-cols-[18rem_1fr] lg:gap-24 lg:pb-32">
        <div>
          <Portrait name={member.name} photo={member.photo} size="lg" priority />
          <ConceptNote className="mt-3">Portret przykładowy</ConceptNote>
        </div>
        <div className="max-w-prose">
          <p className="font-serif text-2xl leading-snug text-ink">{member.specialization}</p>
          <RichText value={member.bio} />
          <dl className="mt-10 grid gap-6 border-t border-ink/70 pt-8 sm:grid-cols-2">
            <div>
              <dt className="eyebrow">Uprawnienia</dt>
              <dd className="mt-2 grid gap-1 text-sm">{member.credentials.map(c => <span key={c}>{c}</span>)}</dd>
            </div>
            <div>
              <dt className="eyebrow">Kontakt</dt>
              <dd className="mt-2 text-sm">{member.responseTime}, w dni robocze</dd>
            </div>
          </dl>
          {member.acceptsNewClients && (
            <LinkButton href="/kontakt#konsultacja" className="mt-10" arrow>Umów konsultację</LinkButton>
          )}
          {authored.length > 0 && (
            <section className="mt-16" aria-labelledby="artykuly">
              <h2 id="artykuly" className="font-serif text-xl">Artykuły w bazie wiedzy</h2>
              <ul className="mt-4 border-t border-rule">
                {authored.map(a => (
                  <li key={a.slug} className="border-b border-rule">
                    <Link href={`/wiedza/${a.slug}`} className="block py-4 hover:text-ledger">
                      <span className="font-serif text-lg">{a.title}</span>
                      <span className="mt-1 block text-xs text-ink-muted">Aktualizacja: {formatDate(a.updatedAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </>
  )
}
