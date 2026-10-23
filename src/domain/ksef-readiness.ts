/**
 * Test „Czy Twoja firma jest gotowa na KSeF?” - 5 pytań, wynik z listą braków.
 *
 * Treść pytań i zaleceń jest tu, bo jest częścią logiki wyniku (waga, kolejność braków).
 * Daty i progi KSeF są w treściach (Sanity), żeby po zmianie przepisów nie zmieniać kodu.
 */
export type Answer = 'yes' | 'no' | 'unsure'

export interface ReadinessQuestion {
  id: string
  question: string
  hint: string
  /** Co zrobić, gdy odpowiedź to „nie” albo „nie wiem”. */
  gap: string
  weight: number
}

export const READINESS_QUESTIONS: ReadinessQuestion[] = [
  {
    id: 'access',
    question: 'Czy masz nadane uprawnienia do KSeF dla siebie lub osoby, która wystawia faktury?',
    hint: 'Właściciel JDG loguje się profilem zaufanym lub e-dowodem. W spółce uprawnienia nadaje się przez ZAW-FA.',
    gap: 'Nadać uprawnienia w KSeF - sobie, księgowej i osobie wystawiającej faktury.',
    weight: 3,
  },
  {
    id: 'software',
    question: 'Czy Twój program do faktur wysyła je bezpośrednio do KSeF?',
    hint: 'Ręczne przepisywanie faktur do aplikacji podatnika działa, ale przy kilkunastu fakturach miesięcznie to strata czasu.',
    gap: 'Wybrać i połączyć program do faktur z KSeF (token lub certyfikat).',
    weight: 3,
  },
  {
    id: 'costs',
    question: 'Czy wiesz, skąd biuro będzie pobierać Twoje faktury kosztowe?',
    hint: 'Od 2027 r. faktury od firm są praktycznie wyłącznie w KSeF - PDF z maila przestaje być oryginałem.',
    gap: 'Ustalić z biurem pobieranie faktur kosztowych z KSeF i wygasić stary obieg PDF.',
    weight: 2,
  },
  {
    id: 'offline',
    question: 'Czy wiesz, co robić, gdy KSeF albo internet w firmie nie działa?',
    hint: 'Przepisy przewidują tryb offline24 i tryb awaryjny - faktura musi potem trafić do systemu.',
    gap: 'Spisać krótką procedurę na awarię: tryb offline24, kto dosyła faktury i w jakim terminie.',
    weight: 1,
  },
  {
    id: 'clients',
    question: 'Czy Twoi klienci wiedzą, jak dostaną od Ciebie fakturę po zmianie?',
    hint: 'Klientom spoza KSeF (konsumentom, firmom zagranicznym) faktura dalej trafia innym kanałem, z kodem QR.',
    gap: 'Uprzedzić stałych klientów o zmianie i dodać kod QR do faktur wysyłanych poza KSeF.',
    weight: 1,
  },
]

export type ReadinessLevel = 'ready' | 'almost' | 'not-ready'

export interface ReadinessResult {
  level: ReadinessLevel
  /** 0-100, ważone. */
  score: number
  gaps: { id: string; gap: string; answer: Answer }[]
}

export function evaluateReadiness(answers: Partial<Record<string, Answer>>): ReadinessResult {
  const total = READINESS_QUESTIONS.reduce((sum, q) => sum + q.weight, 0)
  let earned = 0
  const gaps: ReadinessResult['gaps'] = []
  for (const q of READINESS_QUESTIONS) {
    const answer = answers[q.id] ?? 'unsure'
    if (answer === 'yes') earned += q.weight
    else gaps.push({ id: q.id, gap: q.gap, answer })
  }
  const score = Math.round((earned / total) * 100)
  const level: ReadinessLevel = score === 100 ? 'ready' : score >= 60 ? 'almost' : 'not-ready'
  return { level, score, gaps }
}
