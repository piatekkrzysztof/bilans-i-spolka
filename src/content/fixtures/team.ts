import type { TeamMember } from '../types'
import { p } from './pt'

/** Zespół jest fikcyjny - imiona, uprawnienia i staż to dane przykładowe projektu koncepcyjnego. */
export const teamFixture: TeamMember[] = [
  {
    slug: 'anna-bielecka',
    name: 'Anna Bielecka',
    role: 'Główna księgowa, współzałożycielka',
    specialization: 'Spółki z o.o., CIT i estoński CIT, sprawozdania finansowe',
    credentials: ['Certyfikat księgowy Ministra Finansów', 'Członkini SKwP'],
    responseTime: 'odpowiada zwykle w 2 h',
    legalForms: ['spolka-zoo', 'spolka-osobowa'],
    taxForms: ['cit', 'liniowy'],
    priority: 2,
    acceptsNewClients: true,
    yearsOfExperience: 17,
    bio: [
      p('Prowadzi księgi spółek z o.o. od 2009 roku, wcześniej przez sześć lat w dziale audytu. Zamyka rok tak, żeby zarząd wiedział o wyniku w styczniu, a nie w marcu.'),
      p('W Bilans & Spółka odpowiada za spółki i za to, żeby każde sprawozdanie przeszło przez dwie pary oczu. Jeśli w Twojej spółce coś wymaga decyzji podatkowej, to ona o tym powie - zanim minie termin.'),
    ],
  },
  {
    slug: 'marta-zajac',
    name: 'Marta Zając',
    role: 'Księgowa, opiekunka JDG',
    specialization: 'JDG na ryczałcie i skali, zakładanie firm, ZUS dla początkujących',
    credentials: ['Dyplom księgowego SKwP', 'Szkolenia z KSeF 2.0 (MF, 2026)'],
    responseTime: 'odpowiada zwykle w 1 h',
    legalForms: ['jdg', 'zakladam'],
    taxForms: ['ryczalt', 'skala'],
    priority: 1,
    acceptsNewClients: true,
    yearsOfExperience: 8,
    bio: [
      p('Opiekuje się jednoosobowymi firmami - od programistów na ryczałcie po pracownie architektoniczne. Najczęściej zaczyna współpracę jeszcze przed rejestracją firmy: od wyboru formy opodatkowania i ulgi na start.'),
      p('Pisze krótko i konkretnie. Jeśli brakuje dokumentu, dostajesz jedną wiadomość z listą, a nie pięć przypomnień.'),
    ],
  },
  {
    slug: 'piotr-nowicki',
    name: 'Piotr Nowicki',
    role: 'Doradca podatkowy',
    specialization: 'Podatek liniowy, spółki osobowe, wdrożenia KSeF',
    credentials: ['Doradca podatkowy (wpis na listę KIDP)', 'Prowadzi wdrożenia KSeF od 2024 r.'],
    responseTime: 'odpowiada zwykle w 3 h',
    legalForms: ['spolka-osobowa', 'jdg'],
    taxForms: ['liniowy', 'cit'],
    priority: 3,
    acceptsNewClients: true,
    yearsOfExperience: 12,
    bio: [
      p('Zajmuje się sprawami, w których jedna decyzja zmienia podatek o kilkanaście tysięcy złotych rocznie: zmianą formy opodatkowania, wejściem wspólnika, przekształceniem JDG w spółkę.'),
      p('W 2026 roku prowadzi wdrożenia KSeF dla klientów biura - od nadania uprawnień po procedurę na wypadek awarii systemu.'),
    ],
  },
  {
    slug: 'katarzyna-wrobel',
    name: 'Katarzyna Wróbel',
    role: 'Specjalistka ds. kadr i płac',
    specialization: 'Listy płac, umowy cywilnoprawne, PFRON i PPK',
    credentials: ['Certyfikat specjalisty ds. kadr i płac', '10 lat w kadrach firm produkcyjnych'],
    responseTime: 'odpowiada zwykle w 2 h',
    legalForms: [],
    taxForms: [],
    priority: 9,
    acceptsNewClients: true,
    yearsOfExperience: 10,
    bio: [
      p('Odpowiada za wszystko, co dotyczy ludzi w firmach naszych klientów: umowy, listy płac, urlopy, zwolnienia lekarskie i PPK.'),
      p('Listy płac są u niej gotowe do 8. dnia miesiąca, żeby wypłaty zdążyły przed 10.'),
    ],
  },
]
