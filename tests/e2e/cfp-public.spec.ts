import { expect, test } from '@playwright/test'

test.describe('CFP Public Pages', () => {
  const editionSlug = 'devfest-paris-2025'

  test('should display the CFP landing page for an edition', async ({ page }) => {
    await page.goto(`/cfp/${editionSlug}`)

    // Verify page title and hero section
    await expect(page.getByRole('heading', { name: 'DevFest Paris 2025' })).toBeVisible()
    await expect(page.getByText('Call for Papers')).toBeVisible()

    // Verify event details card
    await expect(page.getByRole('heading', { name: 'Event Details' })).toBeVisible()
    await expect(page.getByText('Palais des Congres, Paris, France')).toBeVisible()
  })

  test('should display categories on the CFP page', async ({ page }) => {
    await page.goto(`/cfp/${editionSlug}`)

    await expect(page.getByRole('heading', { name: 'Categories' })).toBeVisible()
    await expect(page.getByText('Web Development')).toBeVisible()
    await expect(page.getByText('Mobile')).toBeVisible()
    await expect(page.getByText('Cloud & DevOps')).toBeVisible()
    await expect(page.getByText('AI & Machine Learning')).toBeVisible()
    await expect(page.getByText('Security')).toBeVisible()
  })

  test('should display talk formats on the CFP page', async ({ page }) => {
    await page.goto(`/cfp/${editionSlug}`)

    await expect(page.getByRole('heading', { name: 'Talk Formats' })).toBeVisible()
    await expect(page.getByText('Lightning Talk')).toBeVisible()
    await expect(page.getByText('15 minutes')).toBeVisible()
    await expect(page.getByText('Conference Talk')).toBeVisible()
    await expect(page.getByText('45 minutes')).toBeVisible()
    await expect(page.getByText('Deep Dive')).toBeVisible()
    await expect(page.getByText('60 minutes')).toBeVisible()
    await expect(page.getByText('Workshop', { exact: true })).toBeVisible()
    await expect(page.getByText('120 minutes')).toBeVisible()
  })

  test('should have a submit talk button that links to submission form', async ({ page }) => {
    await page.goto(`/cfp/${editionSlug}`)

    const submitButton = page.getByRole('link', { name: 'Submit a Talk' })
    await expect(submitButton).toBeVisible()
    await expect(submitButton).toHaveAttribute('href', `/cfp/${editionSlug}/submit`)
  })

  test('should navigate to submission form when clicking submit button', async ({ page }) => {
    await page.goto(`/cfp/${editionSlug}`)

    await page.getByRole('link', { name: 'Submit a Talk' }).click()

    await expect(page).toHaveURL(`/cfp/${editionSlug}/submit`)
  })

  test('should return 404 for non-existent edition', async ({ page }) => {
    const response = await page.goto('/cfp/non-existent-edition')

    expect(response?.status()).toBe(404)
  })
})
