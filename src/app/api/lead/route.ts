import { NextResponse, type NextRequest } from 'next/server'
import { getPriceList, getTeam } from '@/content/repository'
import { isProduction, serverEnv } from '@/server/env'
import { intakeLead } from '@/server/lead-intake'
import { leadRepository } from '@/server/lead-repository'
import { verifyTurnstile } from '@/server/turnstile'
import { demoMode, siteUrl } from '@/lib/site'

const MAX_BODY_BYTES = 16_384

/** POST /api/lead - wycena PDF albo konsultacja z konfiguratora. Potok: src/server/lead-intake.ts. */
export async function POST(request: NextRequest) {
  const length = Number(request.headers.get('content-length') ?? 0)
  if (length > MAX_BODY_BYTES) return NextResponse.json({ error: 'Payload too large' }, { status: 413 })

  let body: unknown
  try {
    body = await request.json()
  }
  catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const env = serverEnv()
  const production = isProduction()
  const [priceList, team] = await Promise.all([getPriceList(), getTeam()])
  // Vercel ustawia x-forwarded-for; pierwszy adres to klient.
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null

  const result = await intakeLead(body, {
    ip,
    priceList,
    team,
    repository: leadRepository(env, production),
    siteUrl,
    demo: demoMode,
    turnstile: { secret: env.TURNSTILE_SECRET_KEY || undefined, required: production, verify: verifyTurnstile },
    webhook: { url: env.N8N_WEBHOOK_URL || undefined, secret: env.N8N_WEBHOOK_SECRET || undefined },
  })

  return NextResponse.json(result.body, { status: result.status, headers: result.headers })
}
