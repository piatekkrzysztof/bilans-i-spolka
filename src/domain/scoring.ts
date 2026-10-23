/**
 * Scoring leada - proste reguły punktowe z planu projektu.
 *
 * Liczony w API i wysyłany w webhooku, więc n8n tylko rozgałęzia przepływ po `temperature`.
 * Reguły są w repo (wersjonowane, testowane), a nie w węźle Code w n8n, gdzie nikt ich nie przejrzy.
 */
import type { QuoteInput } from './quote'

export const HOT_THRESHOLD = 50

export const SITUATIONS = ['switching', 'starting', 'first-office'] as const
export type Situation = (typeof SITUATIONS)[number]

export const START_WHEN = ['next-month', 'quarter', 'someday'] as const
export type StartWhen = (typeof START_WHEN)[number]

export const SITUATION_LABELS: Record<Situation, string> = {
  'switching': 'Zmieniam biuro rachunkowe',
  'starting': 'Zakładam firmę',
  'first-office': 'Prowadzę firmę, szukam pierwszego biura',
}

export const START_WHEN_LABELS: Record<StartWhen, string> = {
  'next-month': 'Od przyszłego miesiąca',
  'quarter': 'W ciągu 3 miesięcy',
  'someday': 'Jeszcze nie wiem',
}

export interface ScoreInput {
  quote: QuoteInput
  situation: Situation
  startWhen: StartWhen
  hasPhone: boolean
}

export interface ScoreRule {
  id: string
  points: number
  label: string
}

export interface LeadScore {
  score: number
  temperature: 'hot' | 'cold'
  matched: ScoreRule[]
}

const RULES: Array<ScoreRule & { test: (input: ScoreInput) => boolean }> = [
  {
    id: 'company',
    points: 25,
    label: 'Spółka z o.o. - pełna księgowość',
    test: ({ quote }) => quote.legalForm === 'spolka-zoo',
  },
  {
    id: 'volume',
    points: 20,
    label: 'Więcej niż 20 dokumentów miesięcznie',
    test: ({ quote }) => ['21-40', '41-100', '100+'].includes(quote.docs),
  },
  {
    id: 'payroll',
    points: 15,
    label: 'Zatrudnia pracowników',
    test: ({ quote }) => quote.employees > 0,
  },
  {
    id: 'switching',
    points: 25,
    label: 'Zmienia biuro - działająca firma z dokumentami',
    test: ({ situation }) => situation === 'switching',
  },
  {
    id: 'soon',
    points: 15,
    label: 'Chce zacząć od przyszłego miesiąca',
    test: ({ startWhen }) => startWhen === 'next-month',
  },
  {
    id: 'phone',
    points: 10,
    label: 'Podany telefon',
    test: ({ hasPhone }) => hasPhone,
  },
]

export function scoreLead(input: ScoreInput): LeadScore {
  const matched = RULES.filter(rule => rule.test(input)).map(({ id, points, label }) => ({ id, points, label }))
  const score = matched.reduce((sum, rule) => sum + rule.points, 0)
  return { score, temperature: score >= HOT_THRESHOLD ? 'hot' : 'cold', matched }
}
