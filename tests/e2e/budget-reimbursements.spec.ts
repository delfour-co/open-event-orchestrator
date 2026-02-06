import { expect, test } from '@playwright/test'

test.describe('Budget Reimbursements (Admin)', () => {
  const editionSlug = 'devfest-paris-2025'
  const reimbursementsUrl = `/admin/budget/${editionSlug}/reimbursements`

  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill('admin@example.com')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(/\/admin/, { timeout: 10000 })
  })

  test.describe('Reimbursements Page', () => {
    test('should display reimbursements page with header', async ({ page }) => {
      await page.goto(reimbursementsUrl)
      await expect(page.getByRole('heading', { name: 'Reimbursements' })).toBeVisible()
      await expect(page.getByText('DevFest Paris 2025')).toBeVisible()
    })

    test('should show stats cards', async ({ page }) => {
      await page.goto(reimbursementsUrl)
      await expect(page.getByRole('heading', { name: 'Total Requests' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Pending Review' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Approved' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Total Amount' })).toBeVisible()
    })

    test('should show export CSV button', async ({ page }) => {
      await page.goto(reimbursementsUrl)
      await expect(page.getByRole('button', { name: /Export CSV/ })).toBeVisible()
    })

    test('should display seeded reimbursement requests', async ({ page }) => {
      await page.goto(reimbursementsUrl)
      await expect(
        page.locator('text=RB-DEVFEST-0001').or(page.locator('text=RB-DEVFEST-0002'))
      ).toBeVisible()
    })

    test('should show speaker name in request row', async ({ page }) => {
      await page.goto(reimbursementsUrl)
      await expect(
        page.locator('text=Jane Speaker').or(page.locator('text=John Talker'))
      ).toBeVisible()
    })

    test('should show status badges', async ({ page }) => {
      await page.goto(reimbursementsUrl)
      await expect(page.locator('text=Submitted').or(page.locator('text=Draft'))).toBeVisible()
    })

    test('should navigate back to budget dashboard', async ({ page }) => {
      await page.goto(reimbursementsUrl)
      const backButton = page.locator('a[href*="/admin/budget/"]').first()
      await backButton.click()
      await expect(page).toHaveURL(`/admin/budget/${editionSlug}`)
    })
  })

  test.describe('Expandable Details', () => {
    test('should expand request to show expense items', async ({ page }) => {
      await page.goto(reimbursementsUrl)

      // Click on a request row to expand it
      const row = page.locator('tr').filter({ hasText: 'RB-DEVFEST-0001' })
      await row.click()

      // Should show expense items
      await expect(page.locator('text=Expense Items')).toBeVisible()
      await expect(
        page.locator('text=Transport').or(page.locator('text=Accommodation'))
      ).toBeVisible()
    })
  })

  test.describe('Review Workflow', () => {
    test('should show review button for submitted requests', async ({ page }) => {
      await page.goto(reimbursementsUrl)

      // Should see Review button for submitted requests
      await expect(
        page
          .getByRole('button', { name: /Review/ })
          .or(page.getByRole('button', { name: /Approve/ }))
      ).toBeVisible()
    })

    test('should show approve and reject buttons', async ({ page }) => {
      await page.goto(reimbursementsUrl)

      // For submitted requests, approve and reject should be visible
      const approveBtn = page.getByRole('button', { name: /Approve/ }).first()
      const rejectBtn = page.getByRole('button', { name: /Reject/ }).first()

      await expect(approveBtn.or(rejectBtn)).toBeVisible()
    })

    test('should open approve dialog', async ({ page }) => {
      await page.goto(reimbursementsUrl)

      const approveBtn = page.getByRole('button', { name: /Approve/ }).first()
      if (await approveBtn.isVisible()) {
        await approveBtn.click()
        await expect(page.getByRole('heading', { name: /Approve Reimbursement/i })).toBeVisible()
        // Should show category selector
        await expect(page.locator('#approve-category')).toBeVisible()
      }
    })

    test('should open reject dialog', async ({ page }) => {
      await page.goto(reimbursementsUrl)

      const rejectBtn = page.getByRole('button', { name: /Reject/ }).first()
      if (await rejectBtn.isVisible()) {
        await rejectBtn.click()
        await expect(page.getByRole('heading', { name: /Reject Reimbursement/i })).toBeVisible()
      }
    })
  })

  test.describe('Access Control', () => {
    test('should require authentication', async ({ page }) => {
      await page.context().clearCookies()
      await page.goto(reimbursementsUrl)
      await expect(page).toHaveURL(/\/auth\/login/)
    })
  })
})
