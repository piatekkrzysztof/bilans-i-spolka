import type { StructureResolver } from 'sanity/structure'

/** Kolejność w panelu odpowiada temu, co biuro zmienia najczęściej: cennik, potem stawki, potem treści. */
export const structure: StructureResolver = S =>
  S.list()
    .title('Treści')
    .items([
      S.documentTypeListItem('priceList').title('Cennik'),
      S.documentTypeListItem('taxYear').title('Stawki podatkowe i ZUS'),
      S.divider(),
      S.documentTypeListItem('teamMember').title('Zespół'),
      S.documentTypeListItem('service').title('Usługi'),
      S.documentTypeListItem('article').title('Baza wiedzy'),
      S.documentTypeListItem('district').title('Landingi lokalne'),
      S.documentTypeListItem('testimonial').title('Opinie'),
      S.documentTypeListItem('monthEvent').title('Kalendarz miesiąca'),
      S.divider(),
      S.listItem().title('Ustawienia strony').id('siteSettings').child(S.document().schemaType('siteSettings').documentId('siteSettings')),
    ])
