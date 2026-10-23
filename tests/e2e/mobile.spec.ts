import { expect, test } from '@playwright/test'

for (const path of ['/', '/wycena', '/ksef', '/porownywarka', '/zmiana-ksiegowej']) {
  test(`brak poziomego przewijania na telefonie: ${path}`, async ({ page }) => {
    await page.goto(path)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })
}

test('menu mobilne otwiera się bez JavaScriptu', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  await page.goto('/')
  await page.getByText('Menu', { exact: true }).click()
  await expect(page.getByRole('navigation', { name: 'Główna (mobilna)' }).getByRole('link', { name: 'Wycena' })).toBeVisible()
  await context.close()
})

test('pasek z ceną znika, gdy podsumowanie jest widoczne', async ({ page }) => {
  await page.goto('/wycena?forma=jdg&dok=11-20&vat=1')
  const bar = page.locator('a[href="#podsumowanie"]').locator('..')
  await expect(bar).toHaveAttribute('aria-hidden', 'false')
  await page.locator('#podsumowanie').scrollIntoViewIfNeeded()
  await expect(bar).toHaveAttribute('aria-hidden', 'true')
})
