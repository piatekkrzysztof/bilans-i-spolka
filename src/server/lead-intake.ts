/**
 * Potok przyjęcia zgłoszenia z konfiguratora (/api/lead).
 *
 * Kolejność ma znaczenie: rate limit → walidacja → antyspam → przeliczenie wyceny → deduplikacja → zapis → webhook.
 * Lead trafia do bazy PRZED webhookiem, więc awaria n8n nigdy nie gubi zgłoszenia (outbox, ADR-005).
 * Funkcja nie zna Next.js - zależności wchodzą parametrem, dzięki czemu cały potok ma testy jednostkowe.
 */
import { z } from 'zod'
import { assignAdvisor } from '@/domain/advisor'
import { calculateQuote, type PriceList } from '@/domain/pricing'
import { serializeQuoteParams } from '@/domain/quote-params'
import { scoreLead } from '@/domain/scoring'
import type { TeamMember } from '@/content/types'
import { type LeadResponse, leadRequestSchema } from '@/lib/schemas/lead'
import { hashQuote, type LeadRepository } from './lead-repository'
import { hitRateLimit } from './rate-limit'
import { deliverWebhook } from './webhook'

export interface IntakeContext {
  ip: string | null
  priceList: PriceList
  team: TeamMember[]
  repository: LeadRepository | null
  siteUrl: string
  demo: boolean
  /** Brak sekretu poza produkcją = pomijamy Turnstile (lokalnie, e2e). Na produkcji brak sekretu to błąd 503. */
  turnstile: { secret: string | undefined; required: boolean; verify: (token: string, secret: string, ip?: string) => Promise<boolean> }
  webhook: { url: string | undefined; secret: string | undefined }
  log?: Pick<Console, 'warn' | 'error'>
}

export interface IntakeResult {
  status: number
  body: unknown
  headers?: Record<string, string>
}

const error = (status: number, message: string, extra: Record<string, unknown> = {}, headers?: Record<string, string>): IntakeResult =>
  ({ status, body: { error: message, ...extra }, headers })

export async function intakeLead(rawBody: unknown, ctx: IntakeContext): Promise<IntakeResult> {
  const log = ctx.log ?? console

  const rate = hitRateLimit(`lead:${ctx.ip ?? 'unknown'}`)
  if (rate.limited) return error(429, 'Too many requests', {}, { 'retry-after': String(rate.retryAfterSec) })

  const parsed = leadRequestSchema.safeParse(rawBody)
  if (!parsed.success) return error(400, 'Invalid lead request', { fieldErrors: z.flattenError(parsed.error).fieldErrors })
  const request = parsed.data

  if (ctx.turnstile.secret) {
    const human = await ctx.turnstile.verify(request.turnstileToken, ctx.turnstile.secret, ctx.ip ?? undefined).catch(() => false)
    if (!human) return error(403, 'Anti-spam verification failed')
  }
  else if (ctx.turnstile.required) {
    log.error('[lead] brak TURNSTILE_SECRET_KEY na produkcji - zgłoszenie odrzucone')
    return error(503, 'Anti-spam not configured')
  }

  if (!ctx.repository) {
    log.error('[lead] brak SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY - zgłoszenie odrzucone')
    return error(503, 'Lead storage not configured')
  }

  // Nie ufamy cenie z przeglądarki - liczymy ją od nowa z aktualnego cennika (ADR-002).
  const quote = calculateQuote(request.quote, ctx.priceList)
  const score = scoreLead({ quote: quote.input, situation: request.situation, startWhen: request.startWhen, hasPhone: Boolean(request.phone) })
  const advisor = assignAdvisor(ctx.team, quote.input.legalForm, quote.input.taxForm) ?? null
  const quoteHash = hashQuote(quote.input, request.intent)

  const duplicateId = await ctx.repository.findRecentDuplicate(request.email, quoteHash)
  if (duplicateId) return error(409, 'Duplicate lead', { id: duplicateId })

  const id = await ctx.repository.create({ request, quote, score, advisorSlug: advisor?.slug ?? null, consentIp: ctx.ip }, quoteHash)
  const documentUrl = `${ctx.siteUrl}/wycena/dokument?${serializeQuoteParams(quote.input).toString()}`

  if (ctx.webhook.url && ctx.webhook.secret) {
    const delivery = await deliverWebhook(ctx.webhook.url, ctx.webhook.secret, id, {
      type: 'lead.created',
      id,
      createdAt: new Date().toISOString(),
      demo: ctx.demo,
      intent: request.intent,
      quote,
      documentUrl,
      score,
      advisor: advisor ? { slug: advisor.slug, name: advisor.name, calLink: advisor.calLink ?? null } : null,
      contact: { name: request.name, email: request.email, phone: request.phone || null },
      situation: request.situation,
      startWhen: request.startWhen,
      message: request.message || null,
      consents: { contact: request.consentContact, marketing: request.consentMarketing },
    })
    // Niepowodzenie zostawia lead jako `pending_delivery` - cron w n8n dociągnie go z bazy.
    await ctx.repository.markDelivery(id, delivery.ok, delivery).catch(e => log.error('[lead] markDelivery failed', e))
    if (!delivery.ok) log.warn('[lead] webhook delivery failed', { id, ...delivery })
  }

  const response: LeadResponse = {
    id,
    demo: ctx.demo,
    temperature: score.temperature,
    advisor: advisor ? { slug: advisor.slug, name: advisor.name, calLink: advisor.calLink ?? null } : null,
    documentUrl,
  }
  return { status: 201, body: response }
}
