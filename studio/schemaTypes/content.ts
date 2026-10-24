import { defineArrayMember, defineField, defineType } from 'sanity'
import { LEGAL_FORMS, TAX_FORMS } from './options'

/** Portable Text ograniczony do tego, co renderuje src/components/rich-text.tsx. */
export const richText = defineType({
  name: 'richText',
  title: 'Treść',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'Akapit', value: 'normal' },
        { title: 'Nagłówek', value: 'h2' },
        { title: 'Podnagłówek', value: 'h3' },
        { title: 'Cytat', value: 'blockquote' },
      ],
      lists: [{ title: 'Punkty', value: 'bullet' }, { title: 'Numerowana', value: 'number' }],
      marks: {
        decorators: [{ title: 'Pogrubienie', value: 'strong' }, { title: 'Kursywa', value: 'em' }],
        annotations: [{ name: 'link', type: 'object', title: 'Link', fields: [{ name: 'href', type: 'string', title: 'Adres (np. /wycena)' }] }],
      },
    }),
    defineArrayMember({
      type: 'object',
      name: 'callout',
      title: 'Ramka',
      fields: [
        defineField({ name: 'tone', type: 'string', options: { list: [{ title: 'Informacja', value: 'info' }, { title: 'Ostrzeżenie', value: 'warning' }] }, initialValue: 'info' }),
        defineField({ name: 'title', type: 'string', title: 'Tytuł' }),
        defineField({ name: 'text', type: 'text', title: 'Treść', rows: 3 }),
      ],
    }),
  ],
})

const faqFields = [
  defineField({ name: 'question', type: 'string', title: 'Pytanie', validation: rule => rule.required() }),
  defineField({ name: 'answer', type: 'text', title: 'Odpowiedź', rows: 4, validation: rule => rule.required() }),
]

export const faq = defineType({ name: 'faq', title: 'Pytanie i odpowiedź', type: 'object', fields: faqFields })

const slug = (source: string) => defineField({ name: 'slug', type: 'slug', title: 'Adres', options: { source }, validation: rule => rule.required() })

export const teamMember = defineType({
  name: 'teamMember',
  title: 'Osoba z zespołu',
  type: 'document',
  fields: [
    defineField({ name: 'name', type: 'string', title: 'Imię i nazwisko', validation: rule => rule.required() }),
    slug('name'),
    defineField({ name: 'role', type: 'string', title: 'Stanowisko', validation: rule => rule.required() }),
    defineField({ name: 'specialization', type: 'string', title: 'Specjalizacja (na kartę)', validation: rule => rule.required().max(90) }),
    defineField({ name: 'credentials', type: 'array', title: 'Uprawnienia', of: [{ type: 'string' }] }),
    defineField({ name: 'responseTime', type: 'string', title: 'Czas odpowiedzi', initialValue: 'odpowiada zwykle w 2 h' }),
    defineField({ name: 'yearsOfExperience', type: 'number', title: 'Lata doświadczenia' }),
    defineField({ name: 'legalForms', type: 'array', title: 'Prowadzi formy działalności', of: [{ type: 'string' }], options: { list: LEGAL_FORMS }, description: 'Na tej podstawie konfigurator i n8n przydzielają opiekunkę.' }),
    defineField({ name: 'taxForms', type: 'array', title: 'Specjalizuje się w podatku', of: [{ type: 'string' }], options: { list: TAX_FORMS } }),
    defineField({ name: 'orderRank', type: 'number', title: 'Kolejność na stronie' }),
    defineField({ name: 'priority', type: 'number', title: 'Przydział leadów przy remisie (mniej = wyżej)', initialValue: 5 }),
    defineField({ name: 'acceptsNewClients', type: 'boolean', title: 'Przyjmuje nowych klientów', initialValue: true }),
    defineField({ name: 'calLink', type: 'url', title: 'Link do kalendarza Cal.com' }),
    defineField({
      name: 'photo',
      type: 'image',
      title: 'Portret',
      description: 'Jeden styl dla wszystkich: to samo tło, naturalne światło. Bez zdjęć stockowych.',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', type: 'string', title: 'Opis alternatywny' })],
    }),
    defineField({ name: 'bio', type: 'richText', title: 'Biogram' }),
  ],
  preview: { select: { title: 'name', subtitle: 'role', media: 'photo' } },
})

export const service = defineType({
  name: 'service',
  title: 'Usługa',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', title: 'Nazwa', validation: rule => rule.required() }),
    slug('title'),
    defineField({ name: 'orderRank', type: 'number', title: 'Kolejność' }),
    defineField({ name: 'headline', type: 'string', title: 'Nagłówek H1 (pod frazę wyszukiwania)' }),
    defineField({ name: 'summary', type: 'text', title: 'Opis krótki', rows: 3 }),
    defineField({ name: 'priceFrom', type: 'number', title: 'Cena od (zł netto)' }),
    defineField({ name: 'quotePreset', type: 'string', title: 'Parametry wyceny', description: 'Np. forma=jdg&podatek=ryczalt&dok=1-10&vat=1' }),
    defineField({ name: 'forWho', type: 'array', title: 'Dla kogo', of: [{ type: 'string' }] }),
    defineField({ name: 'included', type: 'array', title: 'W cenie', of: [{ type: 'string' }] }),
    defineField({ name: 'notIncluded', type: 'array', title: 'Osobno', of: [{ type: 'string' }] }),
    defineField({ name: 'body', type: 'richText', title: 'Treść' }),
    defineField({ name: 'faq', type: 'array', title: 'FAQ', of: [{ type: 'faq' }] }),
  ],
})

export const article = defineType({
  name: 'article',
  title: 'Artykuł',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', title: 'Tytuł', validation: rule => rule.required() }),
    slug('title'),
    defineField({ name: 'description', type: 'text', title: 'Opis (meta description)', rows: 3, validation: rule => rule.max(170) }),
    defineField({
      name: 'topic',
      type: 'string',
      title: 'Temat',
      options: {
        list: [
          { title: 'Formy opodatkowania', value: 'formy-opodatkowania' },
          { title: 'KSeF', value: 'ksef' },
          { title: 'Zmiana biura', value: 'zmiana-biura' },
          { title: 'Terminy i ZUS', value: 'terminy' },
        ],
      },
    }),
    defineField({ name: 'author', type: 'reference', title: 'Autorka (E-E-A-T)', to: [{ type: 'teamMember' }], validation: rule => rule.required() }),
    defineField({ name: 'publishedAt', type: 'date', title: 'Publikacja' }),
    defineField({ name: 'updatedAt', type: 'date', title: 'Ostatnia aktualizacja', validation: rule => rule.required() }),
    defineField({ name: 'readingMinutes', type: 'number', title: 'Minuty czytania' }),
    defineField({ name: 'body', type: 'richText', title: 'Treść' }),
    defineField({
      name: 'cta',
      type: 'object',
      title: 'Wezwanie na końcu artykułu',
      description: 'Każdy artykuł kończy się linkiem do konfiguratora lub porównywarki.',
      fields: [defineField({ name: 'label', type: 'string' }), defineField({ name: 'href', type: 'string' })],
    }),
  ],
})

const testimonialFields = [
  defineField({ name: 'quote', type: 'text', title: 'Cytat', rows: 3, validation: rule => rule.required() }),
  defineField({ name: 'author', type: 'string', title: 'Autor (imię i inicjał)' }),
  defineField({ name: 'business', type: 'string', title: 'Branża' }),
  defineField({ name: 'legalForm', type: 'string', title: 'Forma działalności' }),
  defineField({ name: 'since', type: 'string', title: 'Klient od' }),
]

export const testimonial = defineType({ name: 'testimonial', title: 'Opinia', type: 'document', fields: testimonialFields })

export const district = defineType({
  name: 'district',
  title: 'Landing lokalny',
  type: 'document',
  description: 'Każdy landing musi mieć treść, której nie da się podmienić samą nazwą dzielnicy.',
  fields: [
    defineField({ name: 'name', type: 'string', title: 'Dzielnica', validation: rule => rule.required() }),
    slug('name'),
    defineField({ name: 'headline', type: 'string', title: 'Nagłówek H1' }),
    defineField({ name: 'intro', type: 'text', title: 'Wstęp', rows: 4 }),
    defineField({ name: 'access', type: 'text', title: 'Dojazd i dokumenty', rows: 3 }),
    defineField({ name: 'localNote', type: 'text', title: 'Kogo obsługujemy lokalnie', rows: 3 }),
    defineField({ name: 'advisor', type: 'reference', title: 'Opiekunka dzielnicy', to: [{ type: 'teamMember' }] }),
    defineField({ name: 'neighbourhoods', type: 'array', title: 'Osiedla', of: [{ type: 'string' }] }),
    defineField({ name: 'testimonial', type: 'object', title: 'Lokalna opinia', fields: testimonialFields }),
  ],
})

export const monthEvent = defineType({
  name: 'monthEvent',
  title: 'Termin w miesiącu',
  type: 'document',
  fields: [
    defineField({ name: 'day', type: 'number', title: 'Dzień miesiąca', validation: rule => rule.required().min(1).max(31) }),
    defineField({ name: 'who', type: 'string', title: 'Kto', options: { list: [{ title: 'Klient', value: 'client' }, { title: 'Biuro', value: 'office' }], layout: 'radio' } }),
    defineField({ name: 'title', type: 'string', title: 'Tytuł' }),
    defineField({ name: 'detail', type: 'text', title: 'Opis', rows: 2 }),
    defineField({ name: 'appliesTo', type: 'string', title: 'Dotyczy tylko (opcjonalnie)' }),
  ],
  preview: { select: { day: 'day', title: 'title' }, prepare: ({ day, title }) => ({ title: `${day}. ${title}` }) },
})

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Ustawienia strony',
  type: 'document',
  fields: [
    defineField({ name: 'name', type: 'string', title: 'Nazwa' }),
    defineField({ name: 'legalName', type: 'string', title: 'Pełna nazwa' }),
    defineField({ name: 'tagline', type: 'string', title: 'Hasło' }),
    defineField({ name: 'phone', type: 'string', title: 'Telefon' }),
    defineField({ name: 'email', type: 'string', title: 'E-mail' }),
    defineField({ name: 'address', type: 'object', title: 'Adres', fields: ['street', 'postalCode', 'city', 'district'].map(name => defineField({ name, type: 'string' })) }),
    defineField({ name: 'geo', type: 'object', title: 'Współrzędne', fields: [defineField({ name: 'lat', type: 'number' }), defineField({ name: 'lng', type: 'number' })] }),
    defineField({ name: 'openingHours', type: 'array', title: 'Godziny', of: [defineArrayMember({ type: 'object', name: 'hours', fields: [defineField({ name: 'days', type: 'string' }), defineField({ name: 'hours', type: 'string' })] })] }),
    defineField({ name: 'trust', type: 'array', title: 'Pasek zaufania', of: [defineArrayMember({ type: 'object', name: 'stat', fields: [defineField({ name: 'value', type: 'string' }), defineField({ name: 'label', type: 'string' })] })] }),
    defineField({
      name: 'comparison',
      type: 'array',
      title: 'Porównanie z typowym biurem',
      of: [defineArrayMember({ type: 'object', name: 'row', fields: ['aspect', 'us', 'typical'].map(name => defineField({ name, type: 'string' })) })],
    }),
    defineField({ name: 'homeFaq', type: 'array', title: 'FAQ na stronie głównej', of: [{ type: 'faq' }], validation: rule => rule.min(6).max(8) }),
    defineField({
      name: 'ksef',
      type: 'object',
      title: 'KSeF',
      fields: [
        defineField({ name: 'mandatoryFrom', type: 'date', title: 'Obowiązkowy od' }),
        defineField({ name: 'smallBusinessLimit', type: 'string', title: 'Limit dla najmniejszych firm' }),
        defineField({ name: 'sourceLabel', type: 'string', title: 'Źródło - nazwa' }),
        defineField({ name: 'sourceUrl', type: 'url', title: 'Źródło - adres' }),
      ],
    }),
    defineField({ name: 'contentVerifiedAt', type: 'date', title: 'Treści i cennik zweryfikowane', description: 'Wymóg z checklisty przed publikacją - pokazywane w stopce.' }),
  ],
})
