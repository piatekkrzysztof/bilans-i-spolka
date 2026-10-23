import Link from 'next/link'
import type { ReactNode } from 'react'
import { breadcrumbs, JsonLd } from '@/lib/seo/json-ld'

export interface Crumb {
  name: string
  path: string
}

/** Nagłówek podstrony: okruszki (z BreadcrumbList w schema.org), tytuł i lead. */
export function PageHeader({
  crumbs,
  eyebrow,
  title,
  lead,
  children,
}: {
  crumbs: Crumb[]
  eyebrow?: string
  title: ReactNode
  lead?: ReactNode
  children?: ReactNode
}) {
  const all = [{ name: 'Strona główna', path: '/' }, ...crumbs]
  return (
    <header className="container-page pb-12 pt-10 md:pb-16 md:pt-14">
      <JsonLd data={breadcrumbs(all)} />
      <nav aria-label="Okruszki">
        <ol className="flex flex-wrap items-center gap-x-2 text-xs text-ink-muted">
          {all.map((crumb, index) => (
            <li key={crumb.path} className="flex items-center gap-2">
              {index > 0 && <span aria-hidden="true">/</span>}
              {index === all.length - 1
                ? <span aria-current="page" className="text-ink">{crumb.name}</span>
                : <Link href={crumb.path} className="hover:text-ledger">{crumb.name}</Link>}
            </li>
          ))}
        </ol>
      </nav>
      <div className="mt-10 max-w-4xl">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-4 text-[2.5rem] leading-[1.05] text-ink md:text-[3.5rem]">{title}</h1>
        {lead && <div className="mt-6 max-w-2xl text-lg text-ink-muted">{lead}</div>}
        {children}
      </div>
    </header>
  )
}
