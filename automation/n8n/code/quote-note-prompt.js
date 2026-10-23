// Węzeł Code w n8n: przygotowanie zapytania do Claude API o krótką notkę do wyceny PDF.
// Zasady z planu: kwoty pochodzą wyłącznie z cennika (są już w PDF), model nie podaje liczb ani porad podatkowych.
// Do modelu trafiają tylko parametry wyceny - bez imienia, e-maila i telefonu (RODO).
const { quote, situation } = $json

const LEGAL = { 'zakladam': 'osoba zakładająca firmę', 'jdg': 'jednoosobowa działalność', 'spolka-zoo': 'spółka z o.o.', 'spolka-osobowa': 'spółka osobowa' }
const facts = [
  `Forma: ${LEGAL[quote.input.legalForm]}, podatek: ${quote.input.taxForm}.`,
  `Dokumenty miesięcznie: ${quote.input.docs}. VAT: ${quote.input.vat ? 'tak' : 'nie'}. Transakcje zagraniczne: ${quote.input.foreign ? 'tak' : 'nie'}.`,
  `Pracownicy: ${quote.input.employees}, umowy cywilnoprawne: ${quote.input.contracts}.`,
  `Sytuacja: ${situation === 'switching' ? 'zmienia biuro rachunkowe' : situation === 'starting' ? 'zakłada firmę' : 'pierwsze biuro rachunkowe'}.`,
  'KSeF jest obowiązkowy dla wszystkich firm od 1 stycznia 2027 r.',
].join('\n')

return [{
  json: {
    model: 'claude-haiku-5-5',
    max_tokens: 220,
    system: [
      'Piszesz krótką notkę do wyceny biura rachunkowego Bilans & Spółka: 2-3 zdania po polsku, spokojnym tonem.',
      'Wskaż, na co ta konkretna firma powinna zwrócić uwagę w najbliższych miesiącach (np. KSeF, zmiana biura, kadry).',
      'Nie podawaj żadnych kwot, stawek ani terminów innych niż w faktach. Nie udzielaj porad podatkowych i nie rekomenduj formy opodatkowania.',
      'Jeśli nie masz nic konkretnego do dodania, napisz jedno zdanie zapraszające na bezpłatną konsultację.',
    ].join(' '),
    messages: [{ role: 'user', content: `Fakty o firmie:\n${facts}` }],
  },
}]
