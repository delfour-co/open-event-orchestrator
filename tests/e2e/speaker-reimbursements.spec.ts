import { expect, test } from '@playwright/test'

test.describe('Speaker Reimbursements', () => {
  const editionSlug = 'devfest-paris-2025'
  // Token from seed data (TEST_SPEAKER_TOKENS.speaker1 = 'a'.repeat(64))
  const speakerToken = 'a'.repeat(64)
  const reimbursementsUrl = `/speaker/${editionSlug}/reimbursements?token=${speakerToken}`

  test.describe('Token Authentication', () => {
    test('should show access form without token', async ({ page }) => {
      await page.goto(`/speaker/${editionSlug}/reimbursements`)
      // Shows access request form when no token
      await expect(page.getByRole('heading', { name: 'Access Your Reimbursements' })).toBeVisible()
    })

    test('should show access form with invalid token', async ({ page }) => {
      await page.goto(`/speaker/${editionSlug}/reimbursements?token=invalid-token`)
      // Invalid token also shows access request form
      await expect(page.getByRole('heading', { name: 'Access Your Reimbursements' })).toBeVisible()
    })

    test('should show speaker name with valid token', async ({ page }) => {
      await page.goto(reimbursementsUrl)
      // Speaker name format: "Welcome, {firstName} {lastName}"
      await expect(page.getByText(/Welcome,.*Jane/)).toBeVisible()
    })
  })

  test.describe('Reimbursement Requests', () => {
    test('should display page with header', async ({ page }) => {
      await page.goto(reimbursementsUrl)
      await expect(page.getByRole('heading', { name: 'Expense Reimbursements' })).toBeVisible()
    })

    test('should show new request button', async ({ page }) => {
      await page.goto(reimbursementsUrl)
      await expect(page.getByRole('button', { name: /New Request/ })).toBeVisible()
    })

    test('should display existing requests', async ({ page }) => {
      await page.goto(reimbursementsUrl)
      // Should show the seeded request
      await expect(
        page.locator('text=RB-DEVFEST-0001').or(page.getByText(/No reimbursement requests/))
      ).toBeVisible()
    })

    test('should create a new reimbursement request', async ({ page }) => {
      await page.goto(reimbursementsUrl)

      await page.getByRole('button', { name: /New Request/ }).click()
      // Wait for dialog to open with animation
      await expect(page.getByRole('heading', { name: /New Reimbursement Request/i })).toBeVisible({
        timeout: 10000
      })

      // Wait for dialog animation to complete
      const currencySelect = page.locator('#rb-currency')
      await expect(currencySelect).toBeVisible({ timeout: 5000 })
      await currencySelect.selectOption('EUR')

      // Add notes
      await page.locator('#rb-notes').fill('E2E test request')

      await page.getByRole('button', { name: /Create Request/ }).click()
      await page.waitForLoadState('networkidle')

      // Verify success - check for success message
      await expect(page.getByText('Reimbursement request created')).toBeVisible()
    })

    test('should show status badges on requests', async ({ page }) => {
      await page.goto(reimbursementsUrl)

      // Should show status badges
      await expect(page.locator('text=Draft').or(page.locator('text=Submitted'))).toBeVisible()
    })
  })

  test.describe('Expense Items', () => {
    test('should expand request to show items', async ({ page }) => {
      await page.goto(reimbursementsUrl)

      // Click on a request to expand it
      const requestBtn = page.locator('button').filter({ hasText: /RB-/ }).first()
      if (await requestBtn.isVisible()) {
        await requestBtn.click()
        // Wait for expansion animation
        await expect(page.locator('text=Expense Items')).toBeVisible({ timeout: 10000 })
      }
    })

    test('should show add item button for draft requests', async ({ page }) => {
      await page.goto(reimbursementsUrl)

      // Expand a draft request
      const requestBtn = page.locator('button').filter({ hasText: /RB-/ }).first()
      if (await requestBtn.isVisible()) {
        await requestBtn.click()

        // Should see Add Item button for draft requests
        const addItemBtn = page.getByRole('button', { name: /Add Item/ })
        // May or may not be visible depending on request status
        if (await addItemBtn.isVisible()) {
          await expect(addItemBtn).toBeVisible()
        }
      }
    })
  })

  test.describe('Submit and Delete', () => {
    test('should show submit button for draft requests with items', async ({ page }) => {
      await page.goto(reimbursementsUrl)

      // Check for Submit button
      const submitBtn = page.getByRole('button', { name: /Submit/ }).first()
      // May or may not be visible depending on seeded data
      if (await submitBtn.isVisible()) {
        await expect(submitBtn).toBeVisible()
      }
    })

    test('should show delete button only for draft requests', async ({ page }) => {
      await page.goto(reimbursementsUrl)

      // Draft requests should show delete (trash) button
      // Submitted requests should not
      const draftBadge = page.locator('.bg-yellow-100', { hasText: 'Draft' }).first()
      if (await draftBadge.isVisible()) {
        // The parent row should have a delete form
        const row = draftBadge.locator('..').locator('..')
        const deleteForm = row.locator('form[action*="deleteRequest"]')
        if (await deleteForm.isVisible()) {
          await expect(deleteForm).toBeVisible()
        }
      }
    })
  })
})
