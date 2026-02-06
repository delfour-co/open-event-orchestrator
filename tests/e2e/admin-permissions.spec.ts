import { expect, test } from '@playwright/test'

/**
 * E2E tests for role-based permissions in admin area
 *
 * Roles:
 * - admin: Full access to everything
 * - organizer: Full access to everything
 * - reviewer: Limited access (view submissions, add reviews/comments only)
 */

test.describe('Admin Permissions - Reviewer Role', () => {
  test.beforeEach(async ({ page }) => {
    // Login as reviewer
    await page.goto('/auth/login')
    await page.fill('input[name="email"]', 'reviewer@example.com')
    await page.fill('input[name="password"]', 'reviewer123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/admin')
  })

  test('reviewer can access admin dashboard', async ({ page }) => {
    await page.goto('/admin')
    await expect(page.locator('h2')).toContainText('Dashboard')
  })

  test('reviewer can access CFP list page', async ({ page }) => {
    await page.goto('/admin/cfp')
    await expect(page.locator('h2')).toContainText('CFP Management')
  })

  test('reviewer cannot see settings cog on CFP cards', async ({ page }) => {
    await page.goto('/admin/cfp')
    // Settings button should not be visible for reviewers
    await expect(page.locator('a[title="CFP Settings"]')).toHaveCount(0)
  })

  test('reviewer cannot access CFP settings page', async ({ page }) => {
    const response = await page.goto('/admin/cfp/devfest-paris-2025/settings')
    // Should get 403 Forbidden
    expect(response?.status()).toBe(403)
  })

  test('reviewer can access submissions list', async ({ page }) => {
    await page.goto('/admin/cfp/devfest-paris-2025/submissions')
    await expect(page.locator('h2')).toContainText('CFP Submissions')
  })

  test('reviewer cannot see export button on submissions page', async ({ page }) => {
    await page.goto('/admin/cfp/devfest-paris-2025/submissions')
    await expect(page.locator('button:has-text("Export CSV")')).toHaveCount(0)
  })

  test('reviewer cannot see bulk action checkboxes on submissions page', async ({ page }) => {
    await page.goto('/admin/cfp/devfest-paris-2025/submissions')
    // Checkboxes in table header should not be visible
    await expect(page.locator('table thead input[type="checkbox"]')).toHaveCount(0)
  })

  test('reviewer can access talk detail page', async ({ page }) => {
    await page.goto('/admin/cfp/devfest-paris-2025/submissions')
    // Click on first talk link
    const talkLink = page.locator('a.font-medium.hover\\:underline').first()
    if (await talkLink.isVisible()) {
      await talkLink.click()
      await expect(page.locator('h1')).toBeVisible()
    }
  })

  test('reviewer cannot see delete button on talk detail page', async ({ page }) => {
    await page.goto('/admin/cfp/devfest-paris-2025/submissions')
    const talkLink = page.locator('a.font-medium.hover\\:underline').first()
    if (await talkLink.isVisible()) {
      await talkLink.click()
      await expect(page.locator('button:has-text("Delete")')).toHaveCount(0)
    }
  })

  test('reviewer cannot see status change buttons on talk detail page', async ({ page }) => {
    await page.goto('/admin/cfp/devfest-paris-2025/submissions')
    const talkLink = page.locator('a.font-medium.hover\\:underline').first()
    if (await talkLink.isVisible()) {
      await talkLink.click()
      // Status change form should not be visible
      await expect(page.locator('form[action="?/updateStatus"]')).toHaveCount(0)
    }
  })

  test('reviewer can submit a review', async ({ page }) => {
    await page.goto('/admin/cfp/devfest-paris-2025/submissions')
    const talkLink = page.locator('a.font-medium.hover\\:underline').first()
    if (await talkLink.isVisible()) {
      await talkLink.click()
      // Review form should be visible
      await expect(page.locator('text=Your Review')).toBeVisible()
    }
  })

  test('reviewer can add a comment', async ({ page }) => {
    await page.goto('/admin/cfp/devfest-paris-2025/submissions')
    const talkLink = page.locator('a.font-medium.hover\\:underline').first()
    if (await talkLink.isVisible()) {
      await talkLink.click()
      // Comment form should be visible
      await expect(page.locator('text=Internal Comments')).toBeVisible()
    }
  })

  test('reviewer cannot access organizations page', async ({ page }) => {
    const response = await page.goto('/admin/organizations')
    expect(response?.status()).toBe(403)
  })

  test('reviewer cannot access events page', async ({ page }) => {
    const response = await page.goto('/admin/events')
    expect(response?.status()).toBe(403)
  })

  test('reviewer cannot access edition settings page', async ({ page }) => {
    const response = await page.goto('/admin/editions/devfest-paris-2025/settings')
    expect(response?.status()).toBe(403)
  })

  test('reviewer sidebar does not show restricted links', async ({ page }) => {
    await page.goto('/admin')
    // Organizations link should not be visible
    await expect(page.locator('nav a[href="/admin/organizations"]')).toHaveCount(0)
    // Events link should not be visible
    await expect(page.locator('nav a[href="/admin/events"]')).toHaveCount(0)
    // Settings link should not be visible
    await expect(page.locator('nav a[href="/admin/settings"]')).toHaveCount(0)
    // CFP link should be visible
    await expect(page.locator('nav a[href="/admin/cfp"]')).toBeVisible()
  })
})

test.describe('Admin Permissions - Organizer Role', () => {
  test.beforeEach(async ({ page }) => {
    // Login as organizer (using admin account which has organizer role)
    await page.goto('/auth/login')
    await page.fill('input[name="email"]', 'admin@example.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/admin')
  })

  test('organizer can access admin dashboard', async ({ page }) => {
    await page.goto('/admin')
    await expect(page.locator('h2')).toContainText('Dashboard')
  })

  test('organizer can access CFP settings page', async ({ page }) => {
    await page.goto('/admin/cfp/devfest-paris-2025/settings')
    await expect(page.locator('h2')).toContainText('CFP Settings')
  })

  test('organizer can see settings cog on CFP cards', async ({ page }) => {
    await page.goto('/admin/cfp')
    await expect(page.locator('a[title="CFP Settings"]').first()).toBeVisible()
  })

  test('organizer can see export button on submissions page', async ({ page }) => {
    await page.goto('/admin/cfp/devfest-paris-2025/submissions')
    await expect(page.locator('button:has-text("Export CSV")')).toBeVisible()
  })

  test('organizer can see bulk action checkboxes', async ({ page }) => {
    await page.goto('/admin/cfp/devfest-paris-2025/submissions')
    // Checkboxes in table should be visible
    await expect(page.getByRole('checkbox').first()).toBeVisible()
  })

  test('organizer can see delete button on talk detail page', async ({ page }) => {
    await page.goto('/admin/cfp/devfest-paris-2025/submissions')
    const talkLink = page.locator('a.font-medium.hover\\:underline').first()
    if (await talkLink.isVisible()) {
      await talkLink.click()
      await expect(page.locator('button:has-text("Delete")')).toBeVisible()
    }
  })

  test('organizer can see status change buttons on talk detail page', async ({ page }) => {
    await page.goto('/admin/cfp/devfest-paris-2025/submissions')
    const talkLink = page.locator('a.font-medium.hover\\:underline').first()
    if (await talkLink.isVisible()) {
      await talkLink.click()
      await expect(page.locator('form[action="?/updateStatus"]')).toBeVisible()
    }
  })

  test('organizer can access organizations page', async ({ page }) => {
    await page.goto('/admin/organizations')
    await expect(page.locator('h2')).toContainText('Organizations')
  })

  test('organizer can access events page', async ({ page }) => {
    await page.goto('/admin/events')
    await expect(page.locator('h2')).toContainText('Events')
  })

  test('organizer sidebar shows all links', async ({ page }) => {
    await page.goto('/admin')
    // All links should be visible
    await expect(page.locator('nav a[href="/admin/organizations"]')).toBeVisible()
    await expect(page.locator('nav a[href="/admin/events"]')).toBeVisible()
    await expect(page.locator('nav a[href="/admin/cfp"]')).toBeVisible()
  })
})

test.describe('Admin Permissions - Admin Role', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/auth/login')
    await page.fill('input[name="email"]', 'admin@example.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/admin')
  })

  test('admin has same access as organizer', async ({ page }) => {
    // Admin should have full access like organizer
    await page.goto('/admin/organizations')
    await expect(page.locator('h2')).toContainText('Organizations')

    await page.goto('/admin/events')
    await expect(page.locator('h2')).toContainText('Events')

    await page.goto('/admin/cfp/devfest-paris-2025/settings')
    await expect(page.locator('h2')).toContainText('CFP Settings')
  })

  test('admin can see all controls on submissions page', async ({ page }) => {
    await page.goto('/admin/cfp/devfest-paris-2025/submissions')
    await expect(page.locator('button:has-text("Export CSV")')).toBeVisible()
    await expect(page.getByRole('checkbox').first()).toBeVisible()
  })
})

test.describe('Admin Permissions - Unauthenticated', () => {
  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/.*\/auth\/login/)
  })

  test('unauthenticated user cannot access any admin page', async ({ page }) => {
    await page.goto('/admin/cfp')
    await expect(page).toHaveURL(/.*\/auth\/login/)

    await page.goto('/admin/organizations')
    await expect(page).toHaveURL(/.*\/auth\/login/)
  })
})
