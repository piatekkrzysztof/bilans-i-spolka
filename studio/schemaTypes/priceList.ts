import { defineArrayMember, defineField, defineType } from 'sanity'
import { LEGAL_FORMS } from './options'

/** Cztery przedziały dokumentów. Ceny w złotych netto - aplikacja przelicza je na grosze w zapytaniu GROQ. */
const brackets = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: 'object',
    options: { columns: 4 },
    validation: rule => rule.required(),
    fields: [
      defineField({ name: 'b1_10', title: '1-10 dok.', type: 'number', validation: rule => rule.required().min(0) }),
      defineField({ name: 'b11_20', title: '11-20 dok.', type: 'number', validation: rule => rule.required().min(0) }),
      defineField({ name: 'b21_40', title: '21-40 dok.', type: 'number', validation: rule => rule.required().min(0) }),
      defineField({ name: 'b41_100', title: '41-100 dok.', type: 'number', validation: rule => rule.required().min(0) }),
    ],
  })

export const priceList = defineType({
  name: 'priceList',
  title: 'Cennik',
  type: 'document',
  description: 'Obowiązuje najnowszy cennik z datą startu z przeszłości - nowy można przygotować z wyprzedzeniem.',
  fields: [
    defineField({ name: 'version', title: 'Wersja', type: 'string', description: 'Np. 2027-01. Zapisywana przy każdej wycenie.', validation: rule => rule.required() }),
    defineField({ name: 'validFrom', title: 'Obowiązuje od', type: 'date', validation: rule => rule.required() }),
    defineField({ name: 'vatRate', title: 'Stawka VAT (%)', type: 'number', initialValue: 23, validation: rule => rule.required().min(0).max(100) }),
    defineField({
      name: 'base',
      title: 'Ceny bazowe (zł netto / mies.)',
      type: 'object',
      validation: rule => rule.required(),
      fields: [
        brackets('ewidencja', 'Ryczałt - ewidencja przychodów'),
        brackets('kpir', 'Skala i liniowy - KPiR'),
        brackets('ksiegi', 'Pełna księgowość'),
      ],
    }),
    defineField({ name: 'partnershipSurcharge', title: 'Dopłata za spółkę osobową (%)', type: 'number', initialValue: 20, validation: rule => rule.required().min(0) }),
    defineField({ name: 'vatSurcharge', title: 'Dopłata za VAT (%)', type: 'number', initialValue: 15, validation: rule => rule.required().min(0) }),
    defineField({ name: 'foreignSurcharge', title: 'Dopłata za transakcje zagraniczne (%)', type: 'number', initialValue: 15, validation: rule => rule.required().min(0) }),
    defineField({ name: 'perEmployee', title: 'Pracownik na etacie (zł)', type: 'number', validation: rule => rule.required().min(0) }),
    defineField({ name: 'perCivilContract', title: 'Umowa cywilnoprawna (zł)', type: 'number', validation: rule => rule.required().min(0) }),
    defineField({
      name: 'startupSetup',
      title: 'Rejestracja firmy (dla opcji „Zakładam firmę”)',
      type: 'object',
      fields: [
        defineField({ name: 'label', title: 'Nazwa pozycji', type: 'string', validation: rule => rule.required() }),
        defineField({ name: 'price', title: 'Cena (zł)', type: 'number', initialValue: 0, validation: rule => rule.required().min(0) }),
      ],
    }),
    defineField({
      name: 'addons',
      title: 'Dodatki',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'addon',
          fields: [
            defineField({ name: 'id', title: 'Identyfikator (w adresie URL)', type: 'slug', validation: rule => rule.required() }),
            defineField({ name: 'label', title: 'Nazwa', type: 'string', validation: rule => rule.required() }),
            defineField({ name: 'description', title: 'Opis', type: 'text', rows: 2 }),
            defineField({ name: 'price', title: 'Cena (zł netto)', type: 'number', validation: rule => rule.required().min(0) }),
            defineField({
              name: 'billing',
              title: 'Rozliczenie',
              type: 'string',
              options: { list: [{ title: 'Miesięcznie', value: 'monthly' }, { title: 'Jednorazowo', value: 'one-off' }], layout: 'radio' },
              validation: rule => rule.required(),
            }),
            defineField({ name: 'appliesTo', title: 'Dla form działalności (puste = dla wszystkich)', type: 'array', of: [{ type: 'string' }], options: { list: LEGAL_FORMS } }),
          ],
          preview: {
            select: { title: 'label', price: 'price', billing: 'billing' },
            prepare: ({ title, price, billing }) => ({ title, subtitle: `${price} zł ${billing === 'monthly' ? '/ mies.' : 'jednorazowo'}` }),
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: 'version', subtitle: 'validFrom' },
    prepare: ({ title, subtitle }) => ({ title: `Cennik ${title}`, subtitle: `od ${subtitle}` }),
  },
})
