import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { getArticles, getTeam } from '@/content/repository'
import type { Article } from '@/content/types'
import { formatDate } from '@/lib/format'

export const metadata: Metadata = {
  title: 'Baza wiedzy - formy opodatkowania, KSeF, ZUS i zmiana biura',
  description: 'Artykuły księgowych Bilans & Spółka: jak wybrać formę opodatkowania, przygotować się do KSeF, zmienić biuro rachunkowe i pilnować terminów.',
  alternates: { canonical: '/wiedza' },
}

const TOPICS: Record<Article['topic'], string> = {
  'formy-opodatkowania': 'Formy opodatkowania',
  'ksef': 'KSeF',
  'zmiana-biura': 'Zmiana biura',
  'terminy': 'Terminy i ZUS',
}

export default async function KnowledgePage() {
  const [articles, team] = await Promise.all([getArticles(), getTeam()])
  return (
    <>
      <PageHeader
        crumbs={[{ name: 'Wiedza', path: '/wiedza' }]}
        eyebrow="Baza wiedzy"
        title="Krótko i na stawkach z tego roku."
        lead={<p>Każdy artykuł podpisuje księgowa, która się tym zajmuje na co dzień, z datą ostatniej aktualizacji.</p>}
      />
      <div className="container-page pb-24 lg:pb-32">
        <ul className="border-t border-ink/70">
          {articles.map(article => {
            const author = team.find(m => m.slug === article.authorSlug)
            return (
              <li key={article.slug} className="border-b border-rule">
                <Link href={`/wiedza/${article.slug}`} className="group grid gap-4 py-10 md:grid-cols-[12rem_1fr_12rem]">
                  <p className="eyebrow md:pt-2">{TOPICS[article.topic]}</p>
                  <div>
                    <h2 className="font-serif text-[1.75rem] leading-tight text-ink group-hover:text-ledger">{article.title}</h2>
                    <p className="mt-3 max-w-2xl text-ink-muted">{article.description}</p>
                  </div>
                  <p className="text-sm text-ink-muted md:pt-2 md:text-right">
                    {author?.name}<br />
                    <span className="num">{formatDate(article.updatedAt)} · {article.readingMinutes} min</span>
                  </p>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </>
  )
}
