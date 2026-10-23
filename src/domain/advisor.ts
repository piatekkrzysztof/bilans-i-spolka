/**
 * Przydział opiekunki: księgowa wybierana według formy działalności i podatku.
 *
 * Ta sama funkcja zasila „Twoją księgową” w konfiguratorze i pole `advisor` w webhooku do n8n,
 * więc klient widzi na stronie dokładnie tę osobę, która potem do niego napisze.
 */
import type { LegalForm, TaxForm } from './quote'

export interface AdvisorCandidate {
  slug: string
  legalForms: LegalForm[]
  taxForms: TaxForm[]
  /** Mniej = wyżej w kolejce przy remisie (np. kierowniczka zespołu na końcu). */
  priority: number
  acceptsNewClients: boolean
}

export function assignAdvisor<T extends AdvisorCandidate>(team: readonly T[], legalForm: LegalForm, taxForm: TaxForm): T | undefined {
  const open = team.filter(member => member.acceptsNewClients)
  const ranked = open
    .map(member => ({
      member,
      fit: (member.legalForms.includes(legalForm) ? 2 : 0) + (member.taxForms.includes(taxForm) ? 1 : 0),
    }))
    .filter(({ fit }) => fit >= 2)
    .sort((a, b) => b.fit - a.fit || a.member.priority - b.member.priority || a.member.slug.localeCompare(b.member.slug))
  return ranked[0]?.member ?? open.sort((a, b) => a.priority - b.priority)[0]
}
