import { describe, expect, it } from 'vitest'
import { assignAdvisor, type AdvisorCandidate } from './advisor'
import { evaluateReadiness, READINESS_QUESTIONS } from './ksef-readiness'
import { formatPLN } from './money'
import { DEFAULT_QUOTE } from './quote'
import { HOT_THRESHOLD, scoreLead } from './scoring'

describe('scoreLead', () => {
  it('spółka zmieniająca biuro od przyszłego miesiąca to gorący lead', () => {
    const score = scoreLead({
      quote: { ...DEFAULT_QUOTE, legalForm: 'spolka-zoo', taxForm: 'cit' },
      situation: 'switching',
      startWhen: 'next-month',
      hasPhone: false,
    })
    expect(score.score).toBe(65)
    expect(score.temperature).toBe('hot')
  })

  it('zakładanie JDG „kiedyś” to zimny lead', () => {
    const score = scoreLead({ quote: DEFAULT_QUOTE, situation: 'starting', startWhen: 'someday', hasPhone: true })
    expect(score.score).toBeLessThan(HOT_THRESHOLD)
    expect(score.temperature).toBe('cold')
  })

  it('próg jest włączny', () => {
    const score = scoreLead({
      quote: { ...DEFAULT_QUOTE, docs: '21-40', employees: 1 },
      situation: 'first-office',
      startWhen: 'next-month',
      hasPhone: false,
    })
    expect(score.score).toBe(HOT_THRESHOLD)
    expect(score.temperature).toBe('hot')
  })
})

describe('assignAdvisor', () => {
  const team: AdvisorCandidate[] = [
    { slug: 'anna', legalForms: ['spolka-zoo', 'spolka-osobowa'], taxForms: ['cit', 'liniowy'], priority: 2, acceptsNewClients: true },
    { slug: 'marta', legalForms: ['jdg', 'zakladam'], taxForms: ['ryczalt', 'skala'], priority: 1, acceptsNewClients: true },
    { slug: 'ewa', legalForms: ['jdg'], taxForms: ['liniowy'], priority: 1, acceptsNewClients: false },
  ]

  it('dobiera osobę po formie działalności i podatku', () => {
    expect(assignAdvisor(team, 'spolka-zoo', 'cit')?.slug).toBe('anna')
    expect(assignAdvisor(team, 'jdg', 'ryczalt')?.slug).toBe('marta')
  })

  it('pomija osoby, które nie przyjmują nowych klientów', () => {
    expect(assignAdvisor(team, 'jdg', 'liniowy')?.slug).toBe('marta')
  })

  it('bez dopasowania zwraca osobę z najwyższym priorytetem', () => {
    expect(assignAdvisor(team.slice(0, 1), 'jdg', 'skala')?.slug).toBe('anna')
  })
})

describe('evaluateReadiness', () => {
  it('same „tak” to pełna gotowość bez braków', () => {
    const answers = Object.fromEntries(READINESS_QUESTIONS.map(q => [q.id, 'yes' as const]))
    expect(evaluateReadiness(answers)).toEqual({ level: 'ready', score: 100, gaps: [] })
  })

  it('brak odpowiedzi liczy się jak „nie wiem” i trafia na listę braków', () => {
    const result = evaluateReadiness({ access: 'yes', software: 'yes' })
    expect(result.level).toBe('almost')
    expect(result.gaps.map(g => g.id)).toEqual(['costs', 'offline', 'clients'])
  })

  it('bez uprawnień i programu firma nie jest gotowa', () => {
    expect(evaluateReadiness({ access: 'no', software: 'no', costs: 'yes', offline: 'yes', clients: 'yes' }).level).toBe('not-ready')
  })
})

describe('formatPLN', () => {
  it('grupuje tysiące twardą spacją, także dla liczb czterocyfrowych', () => {
    expect(formatPLN(129000)).toBe('1 290 zł')
    expect(formatPLN(1290000)).toBe('12 900 zł')
    expect(formatPLN(46900)).toBe('469 zł')
  })

  it('pokazuje grosze tylko, gdy są', () => {
    expect(formatPLN(9330)).toBe('93,30 zł')
    expect(formatPLN(66297)).toBe('662,97 zł')
  })
})
