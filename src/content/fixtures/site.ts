import type { MonthEvent, SiteSettings, Testimonial } from '../types'

export const siteFixture: SiteSettings = {
  name: 'Bilans & Spółka',
  legalName: 'Bilans & Spółka - biuro rachunkowe (projekt koncepcyjny)',
  tagline: 'Cena znana z góry, księgowa znana z imienia.',
  phone: '+48 12 000 00 00',
  email: 'kontakt@bilans-i-spolka.example',
  address: { street: 'ul. Przykładowa 12/4', postalCode: '30-000', city: 'Kraków', district: 'Krowodrza' },
  geo: { lat: 50.0731, lng: 19.9265 },
  openingHours: [
    { days: 'poniedziałek - czwartek', hours: '8:00 - 17:00' },
    { days: 'piątek', hours: '8:00 - 15:00' },
  ],
  trust: [
    { value: '15 lat', label: 'na rynku, od 2011 roku' },
    { value: '214', label: 'firm pod stałą opieką' },
    { value: '1 mln zł', label: 'ubezpieczenia OC biura' },
    { value: '2 h', label: 'średni czas odpowiedzi' },
  ],
  comparison: [
    { aspect: 'Opiekun', us: 'Jedna księgowa z imienia, z bezpośrednim numerem', typical: 'Dział księgowości i ogólny adres e-mail' },
    { aspect: 'Czas odpowiedzi', us: 'Do 2 godzin roboczych, zapisane w umowie', typical: 'Od jednego do kilku dni' },
    { aspect: 'Dokumenty', us: 'Zdjęcie w aplikacji, faktury z KSeF pobieramy sami', typical: 'Segregator albo paczka maili raz w miesiącu' },
    { aspect: 'Cena', us: 'Na stronie, rozpisana na pozycje', typical: 'Po rozmowie telefonicznej' },
    { aspect: 'Zmiana biura', us: 'Przejmujemy dokumenty od poprzedniego biura', typical: 'Przekazanie dokumentów po stronie klienta' },
    { aspect: 'Błąd biura', us: 'Odsetki i kary z naszej winy pokrywamy my', typical: 'Zależy od zapisów w umowie' },
  ],
  homeFaq: [
    {
      question: 'Co jeśli zapłacę karę przez błąd biura?',
      answer: 'Pokrywamy ją. Jeśli odsetki, kara albo mandat wynikają z naszego błędu lub spóźnienia, płacimy je my - tak stanowi umowa, a za nami stoi polisa OC na 1 mln zł. Wyjątek to sytuacje, w których dokumenty dotarły do nas po terminie.',
    },
    {
      question: 'Czy cena z konfiguratora jest ostateczna?',
      answer: 'W zdecydowanej większości przypadków tak. Na bezpłatnej konsultacji sprawdzamy tylko, czy liczba dokumentów i forma opodatkowania się zgadzają. Jeśli cena ma się zmienić, mówimy o tym przed podpisaniem umowy, nigdy po fakcie.',
    },
    {
      question: 'Jak przekazuję dokumenty?',
      answer: 'Faktury sprzedażowe i kosztowe z KSeF pobieramy sami. Resztę - paragony, umowy, wyciągi - wrzucasz do aplikacji zdjęciem albo plikiem do 5. dnia miesiąca. Zajmuje to zwykle kilka minut.',
    },
    {
      question: 'Czy mogę zmienić biuro w trakcie roku?',
      answer: 'Tak, od dowolnego miesiąca. Okres wypowiedzenia w poprzednim biurze zwykle wynosi miesiąc - w tym czasie przygotowujemy przejęcie. Cały proces opisujemy krok po kroku na stronie o zmianie księgowej.',
    },
    {
      question: 'Czy obsługujecie firmy spoza Krakowa?',
      answer: 'Tak. Biuro jest w Krakowie, ale współpraca jest w pełni zdalna: dokumenty w aplikacji, konsultacje wideo, umowa podpisywana online. Około jednej trzeciej naszych klientów jest spoza Małopolski.',
    },
    {
      question: 'Co muszę zrobić w sprawie KSeF?',
      answer: 'Od 1 stycznia 2027 roku KSeF jest obowiązkowy dla wszystkich firm. Potrzebujesz uprawnień i programu do faktur połączonego z systemem. Możemy to zrobić za Ciebie w ramach jednorazowego wdrożenia.',
    },
    {
      question: 'Jak długo trwa umowa i jak ją wypowiedzieć?',
      answer: 'Umowa jest na czas nieokreślony z miesięcznym okresem wypowiedzenia. Nie ma opłat za rozwiązanie ani za wydanie dokumentów nowemu biuru.',
    },
  ],
  ksef: {
    mandatoryFrom: '2027-01-01',
    smallBusinessLimit: '10 000 zł brutto',
    sourceLabel: 'Ministerstwo Finansów, ksef.podatki.gov.pl',
    sourceUrl: 'https://ksef.podatki.gov.pl/',
  },
  contentVerifiedAt: '2026-10-22',
}

export const testimonialsFixture: Testimonial[] = [
  {
    quote: 'Poprzednie biuro odpisywało po tygodniu. Teraz piszę do Marty rano i przed obiadem mam odpowiedź, zwykle z gotowym wyliczeniem.',
    author: 'Michał K.',
    business: 'Programista, B2B',
    legalForm: 'JDG na ryczałcie 12%',
    since: 'klient od 2023',
  },
  {
    quote: 'Przy zmianie biura bałam się, że coś zginie. Bilans sam odebrał dokumenty z poprzedniego biura, a ja tylko podpisałam pełnomocnictwo.',
    author: 'Joanna S.',
    business: 'Pracownia architektoniczna',
    legalForm: 'JDG na skali',
    since: 'klientka od 2024',
  },
  {
    quote: 'Raport na jednej stronie do 10. każdego miesiąca. Pierwszy raz wiemy, ile spółka zarabia, zanim zamkniemy kwartał.',
    author: 'Tomasz i Paweł R.',
    business: 'Hurtownia elektryczna, 9 pracowników',
    legalForm: 'Spółka z o.o.',
    since: 'klienci od 2021',
  },
]

/** Miesiąc księgowy: co robi klient, a co biuro. Terminy ustawowe według stanu na 2026 r. */
export const monthFixture: MonthEvent[] = [
  { day: 5, who: 'client', title: 'Wrzucasz dokumenty', detail: 'Paragony, umowy i wyciąg - zdjęciem w aplikacji. Faktury z KSeF pobieramy sami. Około 5 minut.' },
  { day: 8, who: 'office', title: 'Księgujemy miesiąc', detail: 'Sprawdzamy kompletność i księgujemy. O braki pytamy jedną wiadomością.' },
  { day: 10, who: 'office', title: 'Wypłaty gotowe', detail: 'Listy płac i przelewy wynagrodzeń czekają na zatwierdzenie.', appliesTo: 'firmy z pracownikami' },
  { day: 15, who: 'office', title: 'ZUS spółki', detail: 'Deklaracja rozliczeniowa i składki za pracowników spółki.', appliesTo: 'spółki z o.o.' },
  { day: 17, who: 'client', title: 'Zatwierdzasz przelewy', detail: 'Jedna wiadomość: kwoty ZUS, PIT i VAT z numerami rachunków. Płacisz jednym kliknięciem.' },
  { day: 20, who: 'office', title: 'ZUS, PIT i zaliczki', detail: 'Składki właściciela, zaliczka na podatek dochodowy, PIT-4R za pracowników.' },
  { day: 25, who: 'office', title: 'VAT i JPK', detail: 'JPK_V7 wysłany, VAT rozliczony, potwierdzenie UPO w Twojej teczce.' },
]
