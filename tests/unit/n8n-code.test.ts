/**
 * Kod węzłów Code z automation/n8n/code uruchomiony tak jak w n8n Cloud: top-level `return`, $json i $input,
 * bez $vars i $env (plan bez Variables) oraz bez URL i URLSearchParams (sandbox ich nie ma). Pilnuje zgodności z domeną: numer wyceny i adres dokumentu
 * w mailu muszą być te same co na stronie, a podpis - ten sam co w src/server/webhook.ts.
 */
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { priceListFixture } from '@/content/fixtures/price-list'
import { calculateQuote } from '@/domain/pricing'
import { quoteNumber, serializeQuoteParams } from '@/domain/quote-params'
import { signPayload } from '@/server/webhook'

const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor
const source = (name: string) => readFileSync(`automation/n8n/code/${name}.js`, 'utf8')
const config = { testInbox: 'demo@sm-art.example', siteUrl: 'https://bilans-i-spolka.vercel.app' }
const secret = 'sekret-testowy'

interface LeadJson {
  number: string
  source: 'webhook' | 'redelivery'
  documentUrl: string
  recipient: string
  noteFacts: string
  notifyOffice: boolean
  sendSequence: boolean
  emails: { pdf: { subject: string; html: string } }
}
interface VerifyJson { valid: boolean; reason?: string; lead?: { id: string } }

function runLead(json: unknown) {
  const run = new AsyncFunction('$json', '$vars', '$env', 'URL', 'URLSearchParams', source('lead'))
  return run({ ...(json as object), config }, undefined, undefined, undefined, undefined) as Promise<{ json: LeadJson }>
}

function runVerify(rawBody: string, headers: Record<string, string>) {
  const run = new AsyncFunction('require', '$vars', '$env', '$input', source('verify-signature'))
  const item = { json: { headers }, binary: { data: {} } }
  const helpers = { getBinaryDataBuffer: async () => Buffer.from(rawBody) }
  return run.call({ helpers }, createRequire(import.meta.url), undefined, undefined, { first: () => item }) as Promise<Array<{ json: VerifyJson }>>
}

const quote = calculateQuote({ legalForm: 'jdg', taxForm: 'skala', docs: '11-20', vat: true, foreign: false, employees: 2, contracts: 0, addons: ['ksef'] }, priceListFixture)
const query = serializeQuoteParams(quote.input).toString()
const payload = {
  type: 'lead.created',
  id: '0b9e3c1a-7d42-4c55-9f0e-2a6d1e8b4f10',
  demo: true,
  intent: 'pdf',
  quote,
  documentUrl: `https://bilans-i-spolka.vercel.app/wycena/dokument?${query}`,
  score: { score: 7, temperature: 'hot', matched: [] },
  advisor: { slug: 'marta-zajac', name: 'Marta Zając', calLink: null },
  contact: { name: '<b>Anna</b> Nowak', email: 'anna@example.com', phone: null },
  situation: 'switching',
  startWhen: 'next-month',
  message: null,
  consents: { contact: true, marketing: true },
}

describe('n8n: węzeł Lead', () => {
  it('numer wyceny i adres dokumentu zgadzają się z domeną, także przy ponownej wysyłce z bazy', async () => {
    const fromWebhook = (await runLead({ valid: true, lead: payload })).json
    expect(fromWebhook.number).toBe(quoteNumber(query))
    expect(fromWebhook.source).toBe('webhook')

    const row = {
      id: payload.id, created_at: '2026-10-25T14:00:00Z', intent: 'pdf', quote_input: quote.input, quote,
      score: 7, temperature: 'hot', advisor_slug: 'marta-zajac', situation: 'switching', start_when: 'next-month',
      name: 'Anna Nowak', email: 'anna@example.com', phone: null, message: null, consent_contact: true, consent_marketing: false,
    }
    const fromRow = (await runLead(row)).json
    expect(fromRow.source).toBe('redelivery')
    expect(fromRow.documentUrl).toBe(payload.documentUrl)
    expect(fromRow.number).toBe(fromWebhook.number)
  })

  it('w trybie demo wysyła tylko na skrzynkę testową i nie przekazuje modelowi danych osobowych', async () => {
    const lead = (await runLead({ lead: payload })).json
    expect(lead.recipient).toBe(config.testInbox)
    expect(lead.noteFacts).not.toMatch(/Anna|Nowak|example\.com/)
    expect(lead.emails.pdf.html).toContain('%%NOTE%%')
    expect(lead.emails.pdf.html).toContain('&lt;b&gt;Anna&lt;/b&gt;, oto Twoja wycena')
    expect(lead.notifyOffice).toBe(true)
    expect(lead.sendSequence).toBe(false)
  })

  it('zimny lead ze zgodą marketingową dostaje sekwencję, bez zgody - nie', async () => {
    const cold = { ...payload, score: { score: 2, temperature: 'cold', matched: [] } }
    expect((await runLead({ lead: cold })).json.sendSequence).toBe(true)
    expect((await runLead({ lead: { ...cold, consents: { contact: true, marketing: false } } })).json.sendSequence).toBe(false)
  })
})

describe('n8n: weryfikacja podpisu', () => {
  const raw = JSON.stringify(payload)
  const now = Math.floor(Date.now() / 1000)
  const signed = (body = raw, timestamp = now) => ({
    'x-bs-timestamp': String(timestamp),
    'x-bs-signature': signPayload(secret, body, timestamp),
    'idempotency-key': payload.id,
    'x-bs-webhook-key': secret,
  })

  it('przyjmuje podpis z API', async () => {
    const [result] = await runVerify(raw, signed())
    expect(result!.json).toMatchObject({ valid: true, lead: { id: payload.id } })
  })

  it('odrzuca zmienioną treść, stary znacznik czasu i cudzy klucz idempotencji', async () => {
    expect((await runVerify(raw.replace('pdf', 'consultation'), signed()))[0]!.json).toMatchObject({ valid: false, reason: 'invalid signature' })
    expect((await runVerify(raw, signed(raw, now - 600)))[0]!.json).toMatchObject({ valid: false, reason: 'stale or missing timestamp' })
    expect((await runVerify(raw, { ...signed(), 'idempotency-key': 'inny' }))[0]!.json).toMatchObject({ valid: false, reason: 'idempotency key mismatch' })
    expect((await runVerify(raw, { ...signed(), 'x-bs-webhook-key': 'inny-klucz' }))[0]!.json).toMatchObject({ valid: false, reason: 'invalid signature' })
  })
})
