'use client'

import Link from 'next/link'
import { assignAdvisor } from '@/domain/advisor'
import type { TeamMember } from '@/content/types'
import { Portrait } from '@/components/team/portrait'
import { useQuote } from './quote-store'

export type AdvisorSummary = Pick<
  TeamMember,
  'slug' | 'name' | 'role' | 'specialization' | 'responseTime' | 'legalForms' | 'taxForms' | 'priority' | 'acceptsNewClients' | 'photo'
>

/** „Twoja księgowa”: osoba dobrana tą samą funkcją, której używa n8n przy przydziale leada. */
export function AdvisorCard({ team }: { team: AdvisorSummary[] }) {
  const legalForm = useQuote(s => s.input.legalForm)
  const taxForm = useQuote(s => s.input.taxForm)
  const advisor = assignAdvisor(team, legalForm, taxForm)
  if (!advisor) return null

  return (
    <div key={advisor.slug} className="flex animate-fade-up items-center gap-4 border-t border-rule pt-6">
      <Portrait name={advisor.name} photo={advisor.photo} size="sm" className="shrink-0 rounded-full" />
      <div className="text-sm">
        <p className="eyebrow">Twoja księgowa</p>
        <p className="mt-1 font-serif text-lg leading-tight text-ink">
          <Link href={`/zespol/${advisor.slug}`} className="link-underline">{advisor.name}</Link>
        </p>
        <p className="text-ink-muted">{advisor.specialization} · {advisor.responseTime}</p>
      </div>
    </div>
  )
}
