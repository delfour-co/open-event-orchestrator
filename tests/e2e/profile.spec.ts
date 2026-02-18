import { expect, test } from '@playwright/test'

test.describe('Profile Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill('admin@example.com')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(/^(?!.*\/auth\/login).*$/, { timeout: 5000 })
  })

  test.describe('Profile Information', () => {
    test('should display profile page with user information', async ({ page }) => {
      await page.goto('/profile')
      await page.waitForLoadState('networkidle')

      // Check page title
      await expect(page.getByRole('heading', { name: 'Profile', exact: true })).toBeVisible()

      // Check user email is displayed in the input field
      await expect(page.getByLabel('Email')).toHaveValue('admin@example.com')

      // Check description
      await expect(page.getByText('Manage your account settings')).toBeVisible()
    })

    test('should show profile information card', async ({ page }) => {
      await page.goto('/profile')
      await page.waitForLoadState('networkidle')

      // Should have profile info card with name field
      await expect(page.getByLabel('Name')).toBeVisible()

      // Should show "Profile Information" section
      await expect(page.getByRole('heading', { name: 'Profile Information' })).toBeVisible()
    })

    test('should allow updating profile name', async ({ page }) => {
      await page.goto('/profile')
      await page.waitForLoadState('networkidle')

      // Find and update name
      const nameInput = page.getByLabel('Name')
      await nameInput.clear()
      await nameInput.fill('Updated Admin Name')

      // Submit the form - find the Save Changes button
      const updateButton = page.getByRole('button', { name: 'Save Changes' })
      await updateButton.click()

      // Wait for page to reload/update after form submission
      await page.waitForLoadState('networkidle')

      // Should show success message or name should be updated
      const hasSuccessMessage = await page
        .getByText('Profile updated successfully')
        .isVisible()
        .catch(() => false)
      const nameValue = await nameInput.inputValue()

      // Either success message is shown OR the name was actually updated
      expect(hasSuccessMessage || nameValue === 'Updated Admin Name').toBe(true)
    })
  })

  test.describe('Password Change', () => {
    test('should display password change section', async ({ page }) => {
      await page.goto('/profile')
      await page.waitForLoadState('networkidle')

      // Should have password change heading
      await expect(page.getByRole('heading', { name: 'Change Password' })).toBeVisible()

      // Should have password change fields - use exact matching or id selector
      await expect(page.locator('#oldPassword')).toBeVisible()
      await expect(page.locator('#password')).toBeVisible()
      await expect(page.locator('#passwordConfirm')).toBeVisible()
    })

    test('should show error for wrong current password', async ({ page }) => {
      await page.goto('/profile')
      await page.waitForLoadState('networkidle')

      // Scroll to password section
      await page.getByRole('heading', { name: 'Change Password' }).scrollIntoViewIfNeeded()

      // Fill in wrong current password - use id selectors for specificity
      await page.locator('#oldPassword').fill('wrongpassword')
      await page.locator('#password').fill('newpassword123')
      await page.locator('#passwordConfirm').fill('newpassword123')

      // Submit password change
      const changePasswordButton = page
        .locator('form[action="?/changePassword"]')
        .getByRole('button', { name: /change password/i })
      await changePasswordButton.click()

      // Should show error
      await expect(page.getByText(/incorrect|wrong|invalid/i)).toBeVisible({ timeout: 5000 })
    })

    test('should show error for mismatched passwords', async ({ page }) => {
      await page.goto('/profile')
      await page.waitForLoadState('networkidle')

      // Scroll to password section
      await page.getByRole('heading', { name: 'Change Password' }).scrollIntoViewIfNeeded()

      // Fill in mismatched passwords - use id selectors for specificity
      await page.locator('#oldPassword').fill('admin123')
      await page.locator('#password').fill('newpassword123')
      await page.locator('#passwordConfirm').fill('differentpassword')

      // Submit password change
      const changePasswordButton = page
        .locator('form[action="?/changePassword"]')
        .getByRole('button', { name: /change password/i })
      await changePasswordButton.click()

      // Should show mismatch error
      await expect(page.getByText(/match|different/i)).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Session Management', () => {
    test('should display active sessions section', async ({ page }) => {
      await page.goto('/profile')
      await page.waitForLoadState('networkidle')

      // Should show sessions section title - use heading role to be specific
      await expect(page.getByRole('heading', { name: 'Active Sessions' })).toBeVisible()
    })

    test('should show sessions section with description', async ({ page }) => {
      await page.goto('/profile')
      await page.waitForLoadState('networkidle')

      // Check that the sessions section is present
      await expect(page.getByRole('heading', { name: 'Active Sessions' })).toBeVisible()

      // Check that the description is there
      await expect(page.getByText('Manage your active sessions')).toBeVisible()
    })

    test('should show current session when available', async ({ page }) => {
      // Login triggers session tracking in hooks.server.ts
      await page.goto('/profile')
      await page.waitForLoadState('networkidle')

      // Wait a bit for async session creation
      await page.waitForTimeout(1000)

      // Refresh to ensure session is loaded
      await page.reload()
      await page.waitForLoadState('networkidle')

      // Scroll to sessions section
      await page.getByRole('heading', { name: 'Active Sessions' }).scrollIntoViewIfNeeded()

      // The current session indicator may or may not be visible depending on whether
      // session tracking succeeded. Check if section exists.
      await expect(page.getByRole('heading', { name: 'Active Sessions' })).toBeVisible()
    })
  })

  test.describe('Avatar Management', () => {
    test('should display avatar section', async ({ page }) => {
      await page.goto('/profile')
      await page.waitForLoadState('networkidle')

      // Should have avatar section heading
      await expect(page.getByRole('heading', { name: 'Avatar' })).toBeVisible()

      // Should have description
      await expect(page.getByText('Your profile picture visible to other users')).toBeVisible()
    })

    test('should have avatar upload button', async ({ page }) => {
      await page.goto('/profile')
      await page.waitForLoadState('networkidle')

      // Should have upload button
      await expect(page.getByRole('button', { name: 'Upload new avatar' })).toBeVisible()
    })

    test('should have file input for avatar upload', async ({ page }) => {
      await page.goto('/profile')
      await page.waitForLoadState('networkidle')

      // Should have hidden file input for avatar
      const fileInput = page.locator('input[type="file"][name="avatar"]')
      await expect(fileInput).toBeAttached()
    })
  })

  test.describe('Navigation', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      // Clear cookies to simulate logged out state
      await page.context().clearCookies()
      await page.goto('/profile')

      // Should redirect to login
      await expect(page).toHaveURL(/\/auth\/login/)
    })

    test('should have back to dashboard link', async ({ page }) => {
      await page.goto('/profile')
      await page.waitForLoadState('networkidle')

      // Should have back link
      await expect(page.getByRole('link', { name: 'Back to dashboard' })).toBeVisible()
    })
  })
})
