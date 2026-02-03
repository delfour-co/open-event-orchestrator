import { expect, test } from '@playwright/test'

test.describe('Home Page', () => {
  test('should display the title and tagline', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Open Event Orchestrator' })).toBeVisible()
    await expect(page.getByText('The open-source control plane for events')).toBeVisible()
  })

  test('should have correct page title', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle('Open Event Orchestrator')
  })
})
