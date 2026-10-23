import { article, district, faq, monthEvent, richText, service, siteSettings, teamMember, testimonial } from './content'
import { priceList } from './priceList'
import { taxYear } from './taxYear'

export const schemaTypes = [priceList, taxYear, teamMember, service, article, district, testimonial, monthEvent, siteSettings, richText, faq]

export const singletons = ['siteSettings']
