/**
 * Ryciny archiwalne na stronie: prawdziwe dokumenty i widoki z domeny publicznej, nie zdjęcia biura.
 * Podpis zawsze mówi, czym rycina jest - firma, zespół i biuro są fikcyjne, a te obrazy nie udają ich.
 * Obróbka (skala szarości, kadr, WebP): scripts/build-archive-images.mjs.
 */
export interface ArchiveImage {
  src: string
  width: number
  height: number
  alt: string
  caption: string
  source: string
  sourceUrl: string
}

export const ARCHIVE = {
  balance: {
    src: '/archiwum/bilans-kasowy-1898.webp',
    width: 1400,
    height: 1385,
    alt: 'Ręcznie prowadzona karta kasowa z 13 lutego 1898 roku: rubryki Dr i Cr, kwoty wpisane piórem, na dole wiersz Balance.',
    caption: 'Bilans kasowy, 13 lutego 1898',
    source: 'A. R. Barrett, Modern Banking Methods, 1903 · domena publiczna',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Modern_banking_methods_and_practical_bank_bookkeeping;_illustrated_with_over_two_hundred_forms_of_bank_books,_records_and_blanks_(1903)_(14597542300).jpg',
  },
  daybook: {
    src: '/archiwum/ksiega-dzienna-1899.webp',
    width: 1400,
    height: 959,
    alt: 'Księga dzienna ze stycznia 1899 roku: kolumny czeków i wpłat dla 2, 3, 4 i 5 stycznia, wypełniona tylko pierwsza.',
    caption: 'Księga dzienna, 2-5 stycznia 1899',
    source: 'A. R. Barrett, Modern Banking Methods, 1903 · domena publiczna',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Modern_banking_methods_and_practical_bank_bookkeeping;_illustrated_with_over_two_hundred_forms_of_bank_books,_records_and_blanks_(1903)_(14597619308).jpg',
  },
  cityPlan: {
    src: '/archiwum/plan-krakowa-1836.webp',
    width: 1600,
    height: 1244,
    alt: 'Plan miasta Krakowa w obrębie okopów z 1836 roku: Stare Miasto, Kleparz, Piasek, Kazimierz i zakole Wisły.',
    caption: 'Plan miasta Krakowa w obrębie okopów, 1836',
    source: 'Teofil Żebrawski, nakładem D. E. Friedleina · domena publiczna',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Plan_miasta_Krakowa_w_obr%C4%99bie_okop%C3%B3w_%3D_Plan_de_la_ville_de_Cracovie.jpg',
  },
  tenement: {
    src: '/archiwum/garncarska-14.webp',
    width: 1000,
    height: 1125,
    alt: 'Fasada kamienicy przy ulicy Garncarskiej 14 w Krakowie, fotografia sprzed 1900 roku.',
    caption: 'Kamienica przy Garncarskiej 14, przed 1900',
    source: 'Autor nieznany · domena publiczna',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:14_Garncarska_Street,_Krak%C3%B3w_(01).jpg',
  },
} satisfies Record<string, ArchiveImage>
