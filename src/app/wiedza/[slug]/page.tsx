import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { RichText } from '@/components/rich-text'
import { Portrait } from '@/components/team/portrait'
import { LinkButton } from '@/components/ui/button'
import { getArticle, getArticles, getTeamMember } from '@/content/repository'
import { formatDate } from '@/lib/format'
import { article as articleSchema, JsonLd } from '@/lib/seo/json-ld'

export async function generateStaticParams() {
  return (await getArticles()).map(a => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: PageProps<'/wiedza/[slug]'>): Promise<Metadata> {
  const article = await getArticle((await params).slug)
  if (!article) return {}
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: `/wiedza/${article.slug}` },
    openGraph: { type: 'article', publishedTime: article.publishedAt, modifiedTime: article.updatedAt },
  }
}

export default async function ArticlePage({ params }: PageProps<'/wiedza/[slug]'>) {
  const { slug } = await params
  const article = await getArticle(slug)
  if (!article) notFound()
  const author = await getTeamMember(article.authorSlug)

  return (
    <>
      {author && <JsonLd data={articleSchema(article, author)} />}
      <PageHeader
        crumbs={[{ name: 'Wiedza', path: '/wiedza' }, { name: article.title, path: `/wiedza/${article.slug}` }]}
        title={article.title}
        lead={<p>{article.description}</p>}
      >
        {/* E-E-A-T: autorka z uprawnieniami i data aktualizacji - w branży finansowej Google patrzy na to szczególnie. */}
        {author && (
          <div className="mt-8 flex items-center gap-4 border-t border-rule pt-6 text-sm">
            <Portrait name={author.name} photo={author.photo} size="sm" className="rounded-full" />
            <p>
              <Link href={`/zespol/${author.slug}`} className="font-medium text-ink link-underline">{author.name}</Link>
              <span className="text-ink-muted"> · {author.credentials[0]}</span>
              <br />
              <span className="num text-ink-muted">
                Aktualizacja: <time dateTime={article.updatedAt}>{formatDate(article.updatedAt)}</time> · {article.readingMinutes} min czytania
              </span>
            </p>
          </div>
        )}
      </PageHeader>
      <div className="container-page pb-24 lg:pb-32">
        <article className="max-w-prose md:ml-[7rem]">
          <RichText value={article.body} />
          <div className="mt-14 border-t border-ink/70 pt-8">
            <LinkButton href={article.cta.href} arrow>{article.cta.label}</LinkButton>
          </div>
        </article>
      </div>
    </>
  )
}
