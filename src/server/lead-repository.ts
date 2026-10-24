import 'server-only'
import { createHash, randomUUID } from 'node:crypto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Quote } from '@/domain/pricing'
import type { QuoteInput } from '@/domain/quote'
import type { LeadScore } from '@/domain/scoring'
import type { LeadRequest } from '@/lib/schemas/lead'

export const RETENTION_MONTHS = 12
const DUPLICATE_WINDOW_HOURS = 24

export interface NewLead {
  request: LeadRequest
  quote: Quote
  score: LeadScore
  advisorSlug: string | null
  consentIp: string | null
}

export interface LeadRepository {
  /** Id istniejącego leada, jeśli ten sam e-mail wysłał tę samą wycenę w ostatnich 24 h. */
  findRecentDuplicate(email: string, quoteHash: string): Promise<string | null>
  /** Zapis leada i zdarzenia outbox w jednej transakcji (funkcja SQL `create_lead`). */
  create(lead: NewLead, quoteHash: string): Promise<string>
  markDelivery(id: string, delivered: boolean, detail: unknown): Promise<void>
}

/** Stabilny skrót parametrów wyceny i intencji - klucz deduplikacji niezależny od kolejności pól. */
export function hashQuote(input: QuoteInput, intent: string): string {
  const canonical = JSON.stringify([intent, ...Object.entries(input).sort(([a], [b]) => a.localeCompare(b))])
  return createHash('sha256').update(canonical).digest('hex').slice(0, 32)
}

export function purgeAfter(from = new Date()): string {
  const date = new Date(from)
  date.setMonth(date.getMonth() + RETENTION_MONTHS)
  return date.toISOString()
}

class SupabaseLeadRepository implements LeadRepository {
  constructor(private readonly db: SupabaseClient) {}

  async findRecentDuplicate(email: string, quoteHash: string) {
    const since = new Date(Date.now() - DUPLICATE_WINDOW_HOURS * 3_600_000).toISOString()
    const { data, error } = await this.db
      .from('leads')
      .select('id')
      .eq('email', email.toLowerCase())
      .eq('quote_hash', quoteHash)
      .gte('created_at', since)
      .limit(1)
      .maybeSingle()
    if (error) throw error
    return data?.id ?? null
  }

  async create({ request, quote, score, advisorSlug, consentIp }: NewLead, quoteHash: string) {
    const { data, error } = await this.db.rpc('create_lead', {
      p_intent: request.intent,
      p_quote_input: quote.input,
      p_quote_hash: quoteHash,
      p_quote: quote,
      p_price_list_version: quote.priceListVersion,
      p_monthly_net: quote.monthlyNet,
      p_score: score.score,
      p_temperature: score.temperature,
      p_advisor_slug: advisorSlug,
      p_situation: request.situation,
      p_start_when: request.startWhen,
      p_name: request.name,
      p_email: request.email,
      p_phone: request.phone || null,
      p_message: request.message || null,
      p_consent_contact: request.consentContact,
      p_consent_marketing: request.consentMarketing,
      p_consent_ip: consentIp,
      p_purge_after: purgeAfter(),
    })
    if (error) throw error
    return data as string
  }

  async markDelivery(id: string, delivered: boolean, detail: unknown) {
    const { error } = await this.db.rpc('mark_lead_delivery', { p_id: id, p_delivered: delivered, p_detail: detail })
    if (error) throw error
  }
}

/** Repozytorium w pamięci - tryb demo bez Supabase. Zachowuje się jak prawdziwe: deduplikacja, statusy. */
export class InMemoryLeadRepository implements LeadRepository {
  readonly leads = new Map<string, { email: string; hash: string; createdAt: number; status: string }>()

  async findRecentDuplicate(email: string, quoteHash: string) {
    const since = Date.now() - DUPLICATE_WINDOW_HOURS * 3_600_000
    for (const [id, lead] of this.leads) {
      if (lead.email === email.toLowerCase() && lead.hash === quoteHash && lead.createdAt >= since) return id
    }
    return null
  }

  async create({ request }: NewLead, quoteHash: string) {
    const id = randomUUID()
    this.leads.set(id, { email: request.email.toLowerCase(), hash: quoteHash, createdAt: Date.now(), status: 'new' })
    return id
  }

  async markDelivery(id: string, delivered: boolean) {
    const lead = this.leads.get(id)
    if (lead) lead.status = delivered ? 'delivered' : 'pending_delivery'
  }
}

export type LeadStore = 'supabase' | 'memory' | 'unconfigured'

/**
 * Pamięć tylko w `next dev` albo po jawnym `LEAD_STORE=memory`. Build produkcyjny bez Supabase
 * nie może po cichu „przyjmować” zgłoszeń, które znikną przy restarcie (ADR-005).
 * Jawne `LEAD_STORE=memory` wygrywa z kluczami Supabase: e2e na lokalnym buildzie czyta `.env.local`
 * i bez tego zapisywało testowe leady do produkcyjnej bazy.
 */
export function resolveLeadStore(env: { SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE_KEY?: string; LEAD_STORE?: string }, production: boolean): LeadStore {
  if (env.LEAD_STORE === 'memory') return 'memory'
  if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) return 'supabase'
  if (!production) return 'memory'
  return 'unconfigured'
}

let repository: LeadRepository | undefined

export function leadRepository(env: { SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE_KEY?: string; LEAD_STORE?: string }, production: boolean): LeadRepository | null {
  if (repository) return repository
  const store = resolveLeadStore(env, production)
  if (store === 'unconfigured') return null
  repository = store === 'supabase'
    ? new SupabaseLeadRepository(createClient(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } }))
    : new InMemoryLeadRepository()
  return repository
}

/** Tylko dla testów: podstawia repozytorium. */
export function setLeadRepository(repo: LeadRepository | undefined) {
  repository = repo
}
