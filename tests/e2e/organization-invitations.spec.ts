import { expect, test } from '@playwright/test'

test.describe('Organization Invitations', () => {
  test.describe('Invitation Creation', () => {
    test.beforeEach(async ({ page }) => {
      // Login as admin
      await page.goto('/auth/login')
      await page.getByLabel('Email').fill('admin@example.com')
      await page.getByLabel('Password').fill('admin123')
      await page.getByRole('button', { name: 'Sign in' }).click()
      await page.waitForURL(/\/admin/, { timeout: 10000 })
    })

    test('should display organization settings page', async ({ page }) => {
      await page.goto('/admin/organizations')

      // Click on settings icon for Demo Conference Org
      await page.getByTitle('Organization Settings').first().click()

      await expect(page.getByRole('heading', { name: 'Demo Conference Org' })).toBeVisible()
      await expect(page.getByText('Organization settings')).toBeVisible()
    })

    test('should show add member form', async ({ page }) => {
      await page.goto('/admin/organizations/demo-conf/settings')

      await page.getByRole('button', { name: /Add Member/ }).click()

      await expect(page.getByLabel('Email Address')).toBeVisible()
      await expect(page.getByLabel('Role')).toBeVisible()
      await expect(page.getByText(/invitation will be sent/i)).toBeVisible()
    })

    test('should create pending invitation for non-existing user', async ({ page }) => {
      const testEmail = `test-invite-${Date.now()}@example.com`

      await page.goto('/admin/organizations/demo-conf/settings')

      // Click Add Member button
      await page.getByRole('button', { name: /Add Member/ }).click()
      await expect(page.getByLabel('Email Address')).toBeVisible()

      // Fill the form
      await page.getByLabel('Email Address').fill(testEmail)
      await page.getByLabel('Role').selectOption('organizer')

      // Submit
      await page
        .locator('form')
        .getByRole('button', { name: /Add Member/ })
        .click()

      // Wait for success message
      await expect(page.getByText(/Invitation sent/i)).toBeVisible({ timeout: 10000 })

      // Check pending invitation appears in the invitations section
      await expect(page.getByText('Pending Invitations')).toBeVisible()
      // Use exact match for the email in the invitation row
      await expect(page.locator('p.font-medium').filter({ hasText: testEmail })).toBeVisible()
    })

    test('should cancel pending invitation', async ({ page }) => {
      const testEmail = `cancel-test-${Date.now()}@example.com`

      await page.goto('/admin/organizations/demo-conf/settings')

      // Create invitation
      await page.getByRole('button', { name: /Add Member/ }).click()
      await expect(page.getByLabel('Email Address')).toBeVisible()
      await page.getByLabel('Email Address').fill(testEmail)
      await page.getByLabel('Role').selectOption('organizer')
      await page
        .locator('form')
        .getByRole('button', { name: /Add Member/ })
        .click()
      await expect(page.getByText(/Invitation sent/i)).toBeVisible({ timeout: 10000 })

      // Wait for email to appear in pending invitations (use specific selector)
      const emailInList = page.locator('p.font-medium').filter({ hasText: testEmail })
      await expect(emailInList).toBeVisible({ timeout: 5000 })

      // Find the invitation container that has this email and click its cancel button
      // The structure is: div > div > (div with email, div with button)
      const invitationContainer = page.locator('div.border-dashed').filter({ hasText: testEmail })
      await invitationContainer.getByTitle('Cancel invitation').click()

      // Invitation should disappear from the list
      await expect(emailInList).not.toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Team Member Management', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/auth/login')
      await page.getByLabel('Email').fill('admin@example.com')
      await page.getByLabel('Password').fill('admin123')
      await page.getByRole('button', { name: 'Sign in' }).click()
      await page.waitForURL(/\/admin/, { timeout: 10000 })
    })

    test('should display team members section', async ({ page }) => {
      await page.goto('/admin/organizations/demo-conf/settings')

      await expect(page.getByRole('heading', { name: 'Team Members' })).toBeVisible()
      await expect(page.getByText(/Manage who has access/)).toBeVisible()
    })

    test('should have add member button', async ({ page }) => {
      await page.goto('/admin/organizations/demo-conf/settings')

      await expect(page.getByRole('button', { name: /Add Member/ })).toBeVisible()
    })
  })
})
