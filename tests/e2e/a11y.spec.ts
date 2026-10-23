import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const PAGES = ['/', '/wycena', '/ksef', '/porownywarka', '/uslugi/kpir', '/zespol/marta-zajac', '/wiedza/jaka-forma-opodatkowania-2026', '/biuro-rachunkowe-podgorze', '/kontakt']

for (const path of PAGES) {
  test(`WCAG 2.2 AA bez poważnych naruszeń: ${path}`, async ({ page }) => {
    await page.goto(path)
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
    const serious = results.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')
    expect(serious.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`)).toEqual([])
  })
}

test('dane strukturalne: AccountingService i FAQPage na stronie głównej', async ({ page }) => {
  await page.goto('/')
  const types = await page.locator('script[type="application/ld+json"]').evaluateAll(nodes => nodes.map(n => JSON.parse(n.textContent ?? '{}')['@type']))
  expect(types).toEqual(expect.arrayContaining(['AccountingService', 'FAQPage']))
})
