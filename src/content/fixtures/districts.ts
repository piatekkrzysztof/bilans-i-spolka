import type { District } from '../types'

/** Landingi lokalne - każdy z treścią, której nie da się podmienić samą nazwą dzielnicy. */
export const districtsFixture: District[] = [
  {
    slug: 'krowodrza',
    name: 'Krowodrza',
    headline: 'Biuro rachunkowe Kraków Krowodrza',
    intro: 'Nasze biuro jest na Krowodrzy, kilka minut od Placu Inwalidów. Większość spraw załatwiamy zdalnie, ale jeśli wolisz przynieść dokumenty albo porozmawiać przy stole - jesteśmy na miejscu.',
    access: 'Tramwaje 4, 8, 13, 14, 24 do przystanku Plac Inwalidów, potem 5 minut pieszo. Parkowanie w strefie płatnej - dla klientów mamy jedno miejsce w podwórzu, wystarczy dać znać.',
    localNote: 'Na Krowodrzy obsługujemy głównie gabinety, pracownie projektowe i firmy usługowe z okolic Nowej Wsi i Czarnej Wsi.',
    advisorSlug: 'marta-zajac',
    neighbourhoods: ['Nowa Wieś', 'Czarna Wieś', 'Łobzów', 'Bronowice', 'Azory'],
    testimonial: {
      quote: 'Przychodzę raz w roku podpisać zeznanie, resztę robimy przez aplikację. Fajnie, że to jednak biuro za rogiem.',
      author: 'Agnieszka W.',
      business: 'Gabinet fizjoterapii, Łobzów',
      legalForm: 'JDG na ryczałcie',
      since: 'klientka od 2022',
    },
  },
  {
    slug: 'podgorze',
    name: 'Podgórze',
    headline: 'Biuro rachunkowe Kraków Podgórze',
    intro: 'Podgórze to dziś jedna z najszybciej rosnących dzielnic firm IT i kreatywnych w Krakowie - Zabłocie, Rynek Podgórski, okolice Kładki Bernatka. Spora część naszych klientów na ryczałcie pracuje właśnie tutaj.',
    access: 'Z Podgórza do naszego biura dojedziesz tramwajem 8 lub 13 w ok. 20 minut. Konsultacje dla klientów z Podgórza najczęściej robimy wideo, a dokumenty przyjmujemy wyłącznie elektronicznie.',
    localNote: 'Prowadzimy firmy programistów i grafików z coworków na Zabłociu, a także spółki z o.o. software house’ów na estońskim CIT.',
    advisorSlug: 'piotr-nowicki',
    neighbourhoods: ['Zabłocie', 'Stare Podgórze', 'Płaszów', 'Kabel', 'Rybitwy'],
    testimonial: {
      quote: 'Przeszliśmy z JDG do spółki z o.o. z estońskim CIT. Piotr policzył wszystko wcześniej, więc nie było niespodzianek.',
      author: 'Krzysztof D.',
      business: 'Software house, 6 osób, Zabłocie',
      legalForm: 'Spółka z o.o.',
      since: 'klient od 2023',
    },
  },
  {
    slug: 'nowa-huta',
    name: 'Nowa Huta',
    headline: 'Biuro rachunkowe Kraków Nowa Huta',
    intro: 'W Nowej Hucie obsługujemy przede wszystkim handel, rzemiosło i firmy budowlane - branże, w których jest dużo dokumentów, pracowników i umów zleceń.',
    access: 'Z Placu Centralnego jedziesz do nas tramwajem 4 lub 22 w ok. 30 minut. Dla firm z Nowej Huty, które mają papierowe dokumenty, raz w miesiącu odbieramy je osobiście - bez dopłaty.',
    localNote: 'Kadry i płace to tu połowa pracy: ekipy budowlane, sezonowi pracownicy, umowy zlecenia. Katarzyna Wróbel zna specyfikę branży budowlanej, w tym odwrotne obciążenie i delegacje.',
    advisorSlug: 'katarzyna-wrobel',
    neighbourhoods: ['Os. Centrum', 'Bieńczyce', 'Mistrzejowice', 'Czyżyny', 'Wzgórza Krzesławickie'],
  },
]
