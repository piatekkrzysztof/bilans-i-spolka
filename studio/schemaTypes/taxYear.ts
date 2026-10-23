import { defineArrayMember, defineField, defineType } from 'sanity'

const zl = (name: string, title: string, description?: string) =>
  defineField({ name, title, type: 'number', description, validation: rule => rule.min(0) })
const pct = (name: string, title: string) =>
  defineField({ name, title: `${title} (%)`, type: 'number', validation: rule => rule.required().min(0).max(100) })

/** Stawki do porównywarki form opodatkowania - aktualizacja na nowy rok bez programisty. */
export const taxYear = defineType({
  name: 'taxYear',
  title: 'Stawki podatkowe i ZUS',
  type: 'document',
  fields: [
    defineField({ name: 'year', title: 'Rok', type: 'number', validation: rule => rule.required().integer() }),
    defineField({ name: 'validFrom', title: 'Obowiązuje od', type: 'date', validation: rule => rule.required() }),
    defineField({ name: 'verifiedAt', title: 'Zweryfikowano w źródłach', type: 'date', description: 'Pokazywane pod wynikiem porównywarki.', validation: rule => rule.required() }),
    zl('minimumWage', 'Płaca minimalna (zł)'),
    defineField({
      name: 'zus',
      title: 'ZUS',
      type: 'object',
      fields: [
        zl('fullBase', 'Podstawa - pełny ZUS (zł)', '60% prognozowanego przeciętnego wynagrodzenia'),
        zl('preferentialBase', 'Podstawa - preferencyjny ZUS (zł)', '30% płacy minimalnej'),
        pct('pension', 'Emerytalna'),
        pct('disability', 'Rentowa'),
        pct('sickness', 'Chorobowa'),
        pct('accident', 'Wypadkowa'),
        pct('labourFund', 'Fundusz Pracy'),
      ],
    }),
    defineField({
      name: 'health',
      title: 'Składka zdrowotna',
      type: 'object',
      fields: [
        pct('scaleRate', 'Skala'),
        pct('linearRate', 'Liniowy'),
        zl('monthlyMinimum', 'Minimalna miesięczna (zł)'),
        zl('linearAnnualDeductionLimit', 'Limit odliczenia na liniowym (zł / rok)'),
        defineField({
          name: 'flatRateTiers',
          title: 'Ryczałt - progi przychodu',
          type: 'array',
          of: [defineArrayMember({ type: 'object', name: 'tier', fields: [zl('upTo', 'Przychód do (zł, puste = bez limitu)'), zl('monthly', 'Składka miesięczna (zł)')] })],
        }),
        pct('flatRateDeductibleShare', 'Ryczałt - część składki do odliczenia'),
      ],
    }),
    defineField({
      name: 'pit',
      title: 'PIT',
      type: 'object',
      fields: [
        zl('scaleThreshold', 'Próg skali (zł)'),
        pct('scaleLowRate', 'Skala - pierwszy próg'),
        pct('scaleHighRate', 'Skala - drugi próg'),
        zl('taxReducingAmount', 'Kwota zmniejszająca podatek (zł)'),
        pct('linearRate', 'Liniowy'),
        zl('solidarityThreshold', 'Próg daniny solidarnościowej (zł)'),
        pct('solidarityRate', 'Danina solidarnościowa'),
      ],
    }),
    defineField({
      name: 'flatRates',
      title: 'Stawki ryczałtu wg branży',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'flatRate',
          fields: [defineField({ name: 'id', type: 'slug', title: 'Identyfikator' }), defineField({ name: 'label', type: 'string', title: 'Branża' }), pct('rate', 'Stawka')],
        }),
      ],
    }),
  ],
  preview: {
    select: { title: 'year', subtitle: 'verifiedAt' },
    prepare: ({ title, subtitle }) => ({ title: `Stawki ${title}`, subtitle: `zweryfikowane ${subtitle}` }),
  },
})
