/**
 * Schemat zgłoszenia - wspólny dla formularza (React Hook Form) i API (/api/lead).
 * Serwer nie ufa niczemu poza parametrami wyceny: cenę liczy od nowa z cennika.
 */
import { z } from 'zod'
import { DOC_BRACKETS, LEGAL_FORMS, MAX_PEOPLE, TAX_FORMS } from '@/domain/quote'
import { SITUATIONS, START_WHEN } from '@/domain/scoring'

export const quoteInputSchema = z.object({
  legalForm: z.enum(LEGAL_FORMS),
  taxForm: z.enum(TAX_FORMS),
  docs: z.enum(DOC_BRACKETS),
  vat: z.boolean(),
  foreign: z.boolean(),
  employees: z.number().int().min(0).max(MAX_PEOPLE),
  contracts: z.number().int().min(0).max(MAX_PEOPLE),
  addons: z.array(z.string().regex(/^[a-z0-9-]{1,40}$/)).max(10),
})

export const LEAD_INTENTS = ['pdf', 'consultation'] as const
export type LeadIntent = (typeof LEAD_INTENTS)[number]

const phonePattern = /^\+?[\d\s-]{9,16}$/

export const leadFormSchema = z.object({
  name: z.string().trim().min(2, 'Podaj imię (min. 2 znaki)').max(80, 'Maksymalnie 80 znaków'),
  email: z.email('Sprawdź adres e-mail').max(120),
  phone: z
    .string()
    .trim()
    .max(20)
    .refine(value => value === '' || phonePattern.test(value), 'Numer w formacie 600 000 000'),
  situation: z.enum(SITUATIONS, 'Wybierz jedną z opcji'),
  startWhen: z.enum(START_WHEN, 'Wybierz jedną z opcji'),
  message: z.string().trim().max(1000, 'Maksymalnie 1000 znaków'),
  consentContact: z.literal(true, 'Bez tej zgody nie możemy odpowiedzieć'),
  consentMarketing: z.boolean(),
})

export type LeadFormValues = z.input<typeof leadFormSchema>

export const leadRequestSchema = leadFormSchema.extend({
  intent: z.enum(LEAD_INTENTS),
  quote: quoteInputSchema,
  turnstileToken: z.string().max(2048),
})

export type LeadRequest = z.infer<typeof leadRequestSchema>

export interface LeadResponse {
  id: string
  demo: boolean
  temperature: 'hot' | 'cold'
  advisor: { slug: string; name: string; calLink: string | null } | null
  documentUrl: string
}
