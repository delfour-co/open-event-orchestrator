import { expect, test } from '@playwright/test'

test.describe('Home Page', () => {
  test('should display the hero section', async ({ page }) => {
    await page.goto('/')

    await expect(
      page.getByRole('heading', { name: /open-source control plane for events/i })
    ).toBeVisible()
    await expect(page.getByText('all-in-one platform for managing conferences')).toBeVisible()
  })

  test('should have correct page title', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/Open Event Orchestrator/)
  })

  test('should display navigation links', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Get started', exact: true })).toBeVisible()
  })

  test('should display feature cards', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Call for Papers' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Planning' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Ticketing' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'CRM' })).toBeVisible()
  })
})
