import { expect, test } from '@playwright/test'

test.describe('Events Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin/organizer
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill('admin@example.com')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(/\/admin/, { timeout: 10000 })
  })

  test('should display the events management page', async ({ page }) => {
    await page.goto('/admin/events')

    await expect(page.getByRole('heading', { name: 'Events Management' })).toBeVisible()
    await expect(page.getByText('Manage your organizations, events and editions.')).toBeVisible()
  })

  test('should have new organization and new event buttons', async ({ page }) => {
    await page.goto('/admin/events')

    await expect(page.getByRole('button', { name: /New Organization/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /New Event/ })).toBeVisible()
  })

  test('should display existing event from seed data', async ({ page }) => {
    await page.goto('/admin/events')

    // The seed data creates a DevFest event
    await expect(page.getByText('DevFest')).toBeVisible()
    await expect(page.getByText('Demo Conference Org')).toBeVisible()
  })

  test('should expand event to show editions', async ({ page }) => {
    await page.goto('/admin/events')

    // Click on the DevFest event to expand it
    await page.getByText('DevFest').click()

    // Should show the DevFest Paris 2025 edition
    await expect(page.getByText('DevFest Paris 2025')).toBeVisible()
  })

  test('should show create organization form when clicking button', async ({ page }) => {
    await page.goto('/admin/events')

    await page.getByRole('button', { name: /New Organization/ }).click()

    await expect(page.getByRole('heading', { name: 'Create Organization' })).toBeVisible()
    await expect(page.getByLabel('Name')).toBeVisible()
    await expect(page.getByLabel('Slug')).toBeVisible()
  })

  test('should show create event form when clicking button', async ({ page }) => {
    await page.goto('/admin/events')

    await page.getByRole('button', { name: /New Event/ }).click()

    await expect(page.getByRole('heading', { name: 'Create Event' })).toBeVisible()
    await expect(page.getByLabel('Organization')).toBeVisible()
    await expect(page.getByLabel('Event Name')).toBeVisible()
  })

  test('should show add edition form when clicking button', async ({ page }) => {
    await page.goto('/admin/events')

    // Click on Add Edition button for DevFest
    await page
      .getByRole('button', { name: /Add Edition/ })
      .first()
      .click()

    await expect(page.getByText('Create New Edition')).toBeVisible()
    await expect(page.getByLabel(/Start Date/)).toBeVisible()
    await expect(page.getByLabel(/End Date/)).toBeVisible()
  })

  test('should have link to manage CFP for editions', async ({ page }) => {
    await page.goto('/admin/events')

    // Expand the event
    await page.getByText('DevFest').click()

    // Should have Manage CFP button
    await expect(page.getByRole('link', { name: 'Manage CFP' })).toBeVisible()
  })

  test('should navigate to CFP page when clicking Manage CFP', async ({ page }) => {
    await page.goto('/admin/events')

    // Expand the event
    await page.getByText('DevFest').click()

    // Click Manage CFP
    await page.getByRole('link', { name: 'Manage CFP' }).click()

    // Should navigate to CFP submissions page
    await expect(page).toHaveURL(/\/admin\/cfp\/devfest-paris-2025\/submissions/)
  })

  test('should display edition status badge', async ({ page }) => {
    await page.goto('/admin/events')

    // Expand the event
    await page.getByText('DevFest').click()

    // Should show status badge (published, draft, or archived)
    await expect(page.locator('text=published').or(page.locator('text=draft'))).toBeVisible()
  })

  test('should be accessible from sidebar', async ({ page }) => {
    await page.goto('/admin')

    // Click on Events link in sidebar
    await page.getByRole('link', { name: 'Events' }).click()

    await expect(page).toHaveURL('/admin/events')
    await expect(page.getByRole('heading', { name: 'Events Management' })).toBeVisible()
  })
})
