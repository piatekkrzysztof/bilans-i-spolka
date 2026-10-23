import { createHmac, timingSafeEqual } from 'node:crypto'
import { revalidateTag } from 'next/cache'
import { NextResponse, type NextRequest } from 'next/server'
import { CONTENT_TAGS, type ContentTag } from '@/content/repository'
import { serverEnv } from '@/server/env'

/**
 * Webhook Sanity → unieważnienie tylko zmienionego typu treści (ADR-003).
 * Podpis `sanity-webhook-signature: t=<ms>,v1=<base64url HMAC-SHA256 z "t.body">`.
 * Edycja stawki w Studio zmienia cenę w konfiguratorze bez deployu - to argument sprzedażowy projektu.
 */
function verifySanitySignature(header: string | null, body: string, secret: string): boolean {
  if (!header) return false
  const parts = Object.fromEntries(header.split(',').map(part => part.split('=') as [string, string]))
  const timestamp = Number(parts.t)
  if (!parts.v1 || !Number.isFinite(timestamp) || Math.abs(Date.now() - timestamp) > 5 * 60_000) return false
  const expected = Buffer.from(createHmac('sha256', secret).update(`${parts.t}.${body}`).digest('base64url'))
  const received = Buffer.from(parts.v1)
  return expected.length === received.length && timingSafeEqual(expected, received)
}

export async function POST(request: NextRequest) {
  const secret = serverEnv().SANITY_REVALIDATE_SECRET
  if (!secret) return NextResponse.json({ error: 'Revalidation not configured' }, { status: 503 })

  const body = await request.text()
  if (!verifySanitySignature(request.headers.get('sanity-webhook-signature'), body, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const { _type: type } = JSON.parse(body) as { _type?: string }
  if (!type || !CONTENT_TAGS.includes(type as ContentTag)) {
    return NextResponse.json({ revalidated: false, reason: `Unknown type: ${type}` }, { status: 400 })
  }

  revalidateTag(type, 'max')
  return NextResponse.json({ revalidated: true, tag: type })
}
