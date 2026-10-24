import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { priceListFixture } from '@/content/fixtures/price-list'
import { teamFixture } from '@/content/fixtures/team'
import { type IntakeContext, intakeLead } from '@/server/lead-intake'
import { InMemoryLeadRepository, resolveLeadStore } from '@/server/lead-repository'
import { resetRateLimit } from '@/server/rate-limit'
import { signPayload, verifySignature } from '@/server/webhook'

const validBody = {
  intent: 'consultation',
  name: 'Anna',
  email: 'Anna@Example.com',
  phone: '',
  situation: 'switching',
  startWhen: 'next-month',
  message: '',
  consentContact: true,
  consentMarketing: false,
  turnstileToken: 'token',
  quote: { legalForm: 'spolka-zoo', taxForm: 'cit', docs: '21-40', vat: true, foreign: false, employees: 2, contracts: 0, addons: [] },
}

function context(overrides: Partial<IntakeContext> = {}): IntakeContext {
  return {
    ip: '203.0.113.7',
    priceList: priceListFixture,
    team: teamFixture,
    repository: new InMemoryLeadRepository(),
    siteUrl: 'https://bilans.example',
    demo: true,
    turnstile: { secret: undefined, required: false, verify: async () => true },
    webhook: { url: undefined, secret: undefined },
    log: { warn: () => undefined, error: () => undefined },
    ...overrides,
  }
}

beforeEach(() => resetRateLimit())
afterEach(() => vi.unstubAllGlobals())

describe('intakeLead', () => {
  it('przyjmuje zgłoszenie, liczy cenę na serwerze i przydziela opiekunkę', async () => {
    const result = await intakeLead(validBody, context())
    expect(result.status).toBe(201)
    expect(result.body).toMatchObject({ temperature: 'hot', advisor: { slug: 'anna-bielecka' }, demo: true })
    expect((result.body as { documentUrl: string }).documentUrl).toContain('/wycena/dokument?forma=spolka-zoo')
  })

  it('odrzuca niepełny formularz z listą błędów pól', async () => {
    const result = await intakeLead({ ...validBody, email: 'nie-email', consentContact: false }, context())
    expect(result.status).toBe(400)
    expect((result.body as { fieldErrors: Record<string, unknown> }).fieldErrors).toHaveProperty('email')
  })

  it('ten sam e-mail i ta sama wycena w ciągu doby to duplikat (409)', async () => {
    const ctx = context()
    await intakeLead(validBody, ctx)
    const second = await intakeLead({ ...validBody, email: 'anna@example.com' }, ctx)
    expect(second.status).toBe(409)
  })

  it('odrzuca, gdy Turnstile nie potwierdzi człowieka', async () => {
    const result = await intakeLead(validBody, context({ turnstile: { secret: 's', required: true, verify: async () => false } }))
    expect(result.status).toBe(403)
  })

  it('na produkcji bez sekretu Turnstile i bez bazy nie przyjmuje zgłoszeń (503)', async () => {
    expect((await intakeLead(validBody, context({ turnstile: { secret: undefined, required: true, verify: async () => true } }))).status).toBe(503)
    expect((await intakeLead(validBody, context({ repository: null }))).status).toBe(503)
  })

  it('szósta próba z jednego IP w 10 minut dostaje 429', async () => {
    const ctx = context()
    for (let i = 0; i < 5; i++) await intakeLead({ ...validBody, email: `a${i}@example.com` }, ctx)
    const result = await intakeLead(validBody, ctx)
    expect(result.status).toBe(429)
    expect(result.headers?.['retry-after']).toBeDefined()
  })

  it('wysyła podpisany webhook z ceną z cennika, a awaria n8n nie gubi leada', async () => {
    const calls: Array<{ headers: Record<string, string>; body: string }> = []
    vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
      calls.push({ headers: init.headers as Record<string, string>, body: init.body as string })
      return new Response(null, { status: 500 })
    })
    const repository = new InMemoryLeadRepository()
    // Przeglądarka mogłaby przysłać spreparowaną cenę - serwer jej nie czyta, liczy od nowa.
    const result = await intakeLead({ ...validBody, quote: { ...validBody.quote }, monthlyNet: 1 }, context({ repository, webhook: { url: 'https://n8n.example/hook', secret: 'sekret' } }))

    expect(result.status).toBe(201)
    const [call] = calls
    const payload = JSON.parse(call!.body)
    // 2090 zł (księgi, 21-40) + 314 zł VAT + 2 × 119 zł kadry = 2642 zł
    expect(payload.quote.monthlyNet).toBe(264_200)
    expect(call!.headers['idempotency-key']).toBe(payload.id)
    expect(verifySignature('sekret', call!.body, Number(call!.headers['x-bs-timestamp']), call!.headers['x-bs-signature']!)).toBe(true)
    expect([...repository.leads.values()][0]!.status).toBe('pending_delivery')
  })
})

describe('podpis webhooka', () => {
  it('odrzuca zmienioną treść i stary znacznik czasu', () => {
    const body = '{"id":"1"}'
    const ts = 1_800_000_000
    const sig = signPayload('k', body, ts)
    expect(verifySignature('k', body, ts, sig, { now: ts })).toBe(true)
    expect(verifySignature('k', '{"id":"2"}', ts, sig, { now: ts })).toBe(false)
    expect(verifySignature('k', body, ts, sig, { now: ts + 301 })).toBe(false)
  })
})

describe('resolveLeadStore', () => {
  it('produkcja bez Supabase nie udaje, że przyjmuje leady', () => {
    expect(resolveLeadStore({}, true)).toBe('unconfigured')
    expect(resolveLeadStore({}, false)).toBe('memory')
    expect(resolveLeadStore({ LEAD_STORE: 'memory' }, true)).toBe('memory')
    expect(resolveLeadStore({ SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'k' }, true)).toBe('supabase')
  })

  it('jawne LEAD_STORE=memory wygrywa z kluczami Supabase (e2e nie pisze do produkcyjnej bazy)', () => {
    expect(resolveLeadStore({ SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'k', LEAD_STORE: 'memory' }, true)).toBe('memory')
  })
})
