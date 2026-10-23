import { expect, type Page, test } from '@playwright/test'

const total = (page: Page) => page.locator('section[aria-label="Podsumowanie wyceny"] [aria-live="polite"]').first()

test.describe('konfigurator wyceny', () => {
  test('przykład z planu: JDG, 11-20 dokumentów, VAT = 539 zł netto', async ({ page }) => {
    await page.goto('/wycena?forma=jdg&dok=11-20&vat=1')
    await expect(total(page)).toHaveText('539 zł netto miesięcznie')
    await expect(page.getByRole('radio', { name: 'JDG' })).toHaveAttribute('aria-checked', 'true')
  })

  test('cały konfigurator działa z klawiatury, a stan trafia do adresu', async ({ page }) => {
    await page.goto('/wycena?forma=jdg&dok=11-20&vat=1')
    await page.getByRole('radio', { name: '11–20' }).focus()
    // Radix przenosi fokus w setTimeout i zaznacza tylko przy wciśniętej strzałce - jak u człowieka, trzymamy klawisz chwilę.
    await page.keyboard.down('ArrowRight')
    await page.waitForTimeout(50)
    await page.keyboard.up('ArrowRight')
    await expect(page.getByRole('radio', { name: '21–40' })).toHaveAttribute('aria-checked', 'true')
    // KPiR 21-40: 599 zł + 15% VAT (90 zł)
    await expect(total(page)).toHaveText('689 zł netto miesięcznie')
    await expect(page).toHaveURL(/dok=21-40/)

    await page.getByRole('button', { name: 'Pracownicy na etacie: więcej' }).click()
    await expect(total(page)).toHaveText('808 zł netto miesięcznie')
    await expect(page).toHaveURL(/prac=1/)
  })

  test('link do wyceny odtwarza ten sam stan (np. dla wspólnika)', async ({ page }) => {
    await page.goto('/wycena?forma=spolka-zoo&dok=41-100&vat=0&umowy=2&dodatki=raport')
    // 3590 + 2 × 69 + raport 149
    await expect(total(page)).toHaveText('3 877 zł netto miesięcznie')
    await expect(page.getByRole('radio', { name: 'CIT' })).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByRole('radio', { name: 'Ryczałt' })).toBeDisabled()
  })

  test('przełącznik brutto dopisuje VAT jako pozycję i zmienia sumę', async ({ page }) => {
    await page.goto('/wycena?forma=jdg&dok=11-20&vat=1')
    await page.getByRole('button', { name: 'brutto' }).first().click()
    await expect(total(page)).toHaveText('662,97 zł brutto miesięcznie')
    await expect(page.getByText('Podatek VAT 23%')).toBeVisible()
  })

  test('„Nie wiem” otwiera porównywarkę, a wybór wraca do wyceny', async ({ page }) => {
    await page.goto('/wycena?forma=jdg&podatek=skala&dok=1-10&vat=0')
    await page.getByRole('button', { name: 'Nie wiem - porównaj' }).click()
    const dialog = page.getByRole('dialog', { name: 'Skala, liniowy czy ryczałt?' })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Wybieram ryczałt' }).click()
    await expect(dialog).toBeHidden()
    await expect(page.getByRole('radio', { name: 'Ryczałt' })).toHaveAttribute('aria-checked', 'true')
    await expect(total(page)).toHaveText('279 zł netto miesięcznie')
  })

  test('hero na stronie głównej przenosi parametry do pełnej wyceny', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('radio', { name: 'Spółka z o.o.' }).click()
    await expect(total(page)).toHaveText('1 944 zł netto miesięcznie')
    await page.getByRole('link', { name: /Rozpisz pełną wycenę/ }).click()
    await expect(page).toHaveURL(/\/wycena\?forma=spolka-zoo&podatek=cit&dok=11-20&vat=1/)
    await expect(total(page)).toHaveText('1 944 zł netto miesięcznie')
  })
})

test.describe('zgłoszenie z wyceny', () => {
  test('walidacja, wysyłka i potwierdzenie z opiekunką', async ({ page }) => {
    await page.goto(`/wycena?forma=spolka-zoo&dok=21-40&vat=1&prac=${Date.now() % 40 + 1}`)
    await page.getByRole('button', { name: 'Pobierz wycenę PDF' }).click()
    const dialog = page.getByRole('dialog', { name: 'Wycena PDF na e-mail' })
    await expect(dialog.getByText('Tryb demo.')).toBeVisible()

    await dialog.getByRole('button', { name: 'Wyślij wycenę' }).click()
    await expect(dialog.getByText('Podaj imię (min. 2 znaki)')).toBeVisible()
    await expect(dialog.getByText('Bez tej zgody nie możemy odpowiedzieć')).toBeVisible()

    await dialog.getByLabel('Imię', { exact: true }).fill('Anna')
    await dialog.getByLabel('E-mail', { exact: true }).fill('anna@example.com')
    await dialog.getByText('Zmieniam biuro rachunkowe').click()
    await dialog.getByText('Od przyszłego miesiąca').click()
    await dialog.getByRole('checkbox', { name: /Zgadzam się na kontakt/ }).check()
    await expect(dialog.getByRole('checkbox', { name: /przypomnienia o zmianach/ })).not.toBeChecked()
    await dialog.getByRole('button', { name: 'Wyślij wycenę' }).click()

    await expect(dialog.getByText('Wycena jest w drodze.')).toBeVisible()
    await expect(dialog.getByText('Anna Bielecka')).toBeVisible()
    await expect(dialog.getByRole('link', { name: 'Podgląd dokumentu wyceny' })).toHaveAttribute('href', /\/wycena\/dokument\?forma=spolka-zoo/)
  })
})

test.describe('KSeF', () => {
  test('test gotowości pokazuje listę braków bez podawania e-maila', async ({ page }) => {
    await page.goto('/ksef')
    // Wagi 3-3-2-1-1: uprawnienia i program są, reszta nie - 7/10 pkt, czyli „prawie gotowe” z dwoma brakami.
    const answers = ['Tak', 'Tak', 'Nie wiem', 'Tak', 'Nie']
    const groups = page.locator('fieldset')
    for (const [i, answer] of answers.entries()) await groups.nth(i).getByText(answer, { exact: true }).click()
    await page.getByRole('button', { name: 'Pokaż wynik' }).click()
    await expect(page.getByText('Prawie gotowe.')).toBeVisible()
    await expect(page.getByRole('status').getByRole('listitem')).toHaveCount(2)
  })
})

test('dokument wyceny liczy z URL i nie jest indeksowany', async ({ page }) => {
  await page.goto('/wycena/dokument?forma=zakladam&podatek=ryczalt&dok=1-10&vat=0&dodatki=ksef')
  await expect(page.getByText('Rejestracja firmy i wybór formy opodatkowania')).toBeVisible()
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
})
