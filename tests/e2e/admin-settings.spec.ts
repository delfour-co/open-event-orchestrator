import { expect, test } from '@playwright/test'

test.describe('Admin Settings Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill('admin@example.com')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(/\/admin/, { timeout: 10000 })
  })

  test.describe('Settings Page', () => {
    test('should display settings page with SMTP configuration', async ({ page }) => {
      await page.goto('/admin/settings')

      await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
      await expect(page.getByText('Global application configuration')).toBeVisible()
      await expect(page.getByText('Email (SMTP)')).toBeVisible()
    })

    test('should have link to integrations dashboard', async ({ page }) => {
      await page.goto('/admin/settings')

      const integrationsLink = page.locator('a[href="/admin/settings/integrations"]')
      await expect(integrationsLink).toBeVisible()
      await expect(page.getByText('View Integrations')).toBeVisible()
    })

    test('should display SMTP configuration form', async ({ page }) => {
      await page.goto('/admin/settings')

      await expect(page.getByLabel('SMTP Host')).toBeVisible()
      await expect(page.getByLabel('Port')).toBeVisible()
      await expect(page.getByLabel('Username')).toBeVisible()
      await expect(page.getByLabel('Password')).toBeVisible()
      await expect(page.getByLabel('From Address')).toBeVisible()
    })

    test('should display enable SMTP toggle', async ({ page }) => {
      await page.goto('/admin/settings')

      await expect(page.getByText('Enable SMTP')).toBeVisible()
      await expect(
        page.getByText('When disabled, emails will be logged to the console')
      ).toBeVisible()
    })

    test('should display test email section', async ({ page }) => {
      await page.goto('/admin/settings')

      await expect(page.getByText('Send Test Email')).toBeVisible()
      await expect(page.getByLabel('Recipient Email')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Send Test' })).toBeVisible()
    })
  })

  test.describe('Integrations Dashboard', () => {
    test('should display integrations dashboard', async ({ page }) => {
      await page.goto('/admin/settings/integrations')

      await expect(page.getByRole('heading', { name: 'Integrations' })).toBeVisible()
      await expect(page.getByText('Connect and manage third-party services')).toBeVisible()
    })

    test('should have back link to settings', async ({ page }) => {
      await page.goto('/admin/settings/integrations')

      const backLink = page.locator('a[href="/admin/settings"]')
      await expect(backLink).toBeVisible()
      await expect(page.getByText('Back to Settings')).toBeVisible()
    })

    test('should display summary statistics', async ({ page }) => {
      await page.goto('/admin/settings/integrations')

      await expect(page.getByText('Connected')).toBeVisible()
      await expect(page.getByText('Not configured')).toBeVisible()
      await expect(page.getByText('Errors')).toBeVisible()
    })

    test('should display all integration cards', async ({ page }) => {
      await page.goto('/admin/settings/integrations')

      // Check for all integrations
      await expect(page.getByText('Email (SMTP)')).toBeVisible()
      await expect(page.getByText('Stripe')).toBeVisible()
      await expect(page.getByText('Slack')).toBeVisible()
      await expect(page.getByText('Discord')).toBeVisible()
      await expect(page.getByText('Webhooks')).toBeVisible()
    })

    test('should display integration status badges', async ({ page }) => {
      await page.goto('/admin/settings/integrations')

      // Should have at least one status badge
      const connected = page.locator('text=Connected')
      const notConfigured = page.locator('text=Not configured')

      await expect(connected.or(notConfigured).first()).toBeVisible()
    })

    test('should have configure buttons for available integrations', async ({ page }) => {
      await page.goto('/admin/settings/integrations')

      // SMTP should have a configure button
      const smtpCard = page.locator('[class*="card"]').filter({ hasText: 'Email (SMTP)' })
      await expect(smtpCard.getByRole('button', { name: 'Configure' })).toBeVisible()

      // Stripe should have a configure button
      const stripeCard = page.locator('[class*="card"]').filter({ hasText: 'Stripe' })
      await expect(stripeCard.getByRole('button', { name: 'Configure' })).toBeVisible()
    })

    test('should show coming soon for Discord', async ({ page }) => {
      await page.goto('/admin/settings/integrations')

      const discordCard = page.locator('[class*="card"]').filter({ hasText: 'Discord' })
      await expect(discordCard.getByText('Coming soon')).toBeVisible()
    })

    test('should navigate to SMTP settings when clicking configure', async ({ page }) => {
      await page.goto('/admin/settings/integrations')

      const smtpCard = page.locator('[class*="card"]').filter({ hasText: 'Email (SMTP)' })
      await smtpCard.getByRole('button', { name: 'Configure' }).click()

      await expect(page).toHaveURL('/admin/settings')
    })

    test('should navigate to Stripe settings when clicking configure', async ({ page }) => {
      await page.goto('/admin/settings/integrations')

      const stripeCard = page.locator('[class*="card"]').filter({ hasText: 'Stripe' })
      await stripeCard.getByRole('button', { name: 'Configure' }).click()

      await expect(page).toHaveURL('/admin/settings/stripe')
    })
  })

  test.describe('Stripe Settings', () => {
    test('should display Stripe settings page', async ({ page }) => {
      await page.goto('/admin/settings/stripe')

      await expect(page.getByRole('heading', { name: 'Stripe Configuration' })).toBeVisible()
      await expect(page.getByText('Configure Stripe for payment processing')).toBeVisible()
    })

    test('should have back link to integrations', async ({ page }) => {
      await page.goto('/admin/settings/stripe')

      const backLink = page.locator('a[href="/admin/settings/integrations"]')
      await expect(backLink).toBeVisible()
      await expect(page.getByText('Back to Integrations')).toBeVisible()
    })

    test('should display configuration status', async ({ page }) => {
      await page.goto('/admin/settings/stripe')

      // Should show either Configured or Not configured badge
      const configured = page.getByText('Configured')
      const notConfigured = page.getByText('Not configured')
      await expect(configured.or(notConfigured).first()).toBeVisible()
    })

    test('should display mode badge', async ({ page }) => {
      await page.goto('/admin/settings/stripe')

      // Should show TEST or LIVE mode
      const testMode = page.getByText('TEST mode')
      const liveMode = page.getByText('LIVE mode')
      await expect(testMode.or(liveMode).first()).toBeVisible()
    })

    test('should display API keys form', async ({ page }) => {
      await page.goto('/admin/settings/stripe')

      await expect(page.getByText('API Keys')).toBeVisible()
      await expect(page.getByLabel('Secret Key')).toBeVisible()
      await expect(page.getByLabel('Publishable Key')).toBeVisible()
      await expect(page.getByLabel('Webhook Secret')).toBeVisible()
    })

    test('should display enable Stripe toggle', async ({ page }) => {
      await page.goto('/admin/settings/stripe')

      await expect(page.getByText('Enable Stripe')).toBeVisible()
      await expect(
        page.getByText('When disabled, ticket purchases and payment processing will be unavailable')
      ).toBeVisible()
    })

    test('should have save settings button', async ({ page }) => {
      await page.goto('/admin/settings/stripe')

      await expect(page.getByRole('button', { name: 'Save Settings' })).toBeVisible()
    })

    test('should display test connection section', async ({ page }) => {
      await page.goto('/admin/settings/stripe')

      await expect(page.getByText('Test Connection')).toBeVisible()
      await expect(page.getByText('Verify your Stripe API credentials')).toBeVisible()
    })

    test('should display webhook endpoint info', async ({ page }) => {
      await page.goto('/admin/settings/stripe')

      await expect(page.getByText('Webhook Endpoint')).toBeVisible()
      await expect(page.getByText(/\/api\/billing\/webhook/)).toBeVisible()
      await expect(page.getByText('checkout.session.completed')).toBeVisible()
    })

    test('should show key format hints', async ({ page }) => {
      await page.goto('/admin/settings/stripe')

      await expect(page.getByText('sk_test_').or(page.getByText('sk_live_')).first()).toBeVisible()
      await expect(page.getByText('pk_test_').or(page.getByText('pk_live_')).first()).toBeVisible()
      await expect(page.getByText('whsec_')).toBeVisible()
    })

    test('should have password visibility toggles', async ({ page }) => {
      await page.goto('/admin/settings/stripe')

      // Should have at least 3 toggle buttons (one for each key field)
      const toggleButtons = page.locator('[type="button"]').filter({
        has: page.locator('svg')
      })

      // Wait for the page to load and check for toggle functionality
      await page.waitForLoadState('networkidle')
      expect(await toggleButtons.count()).toBeGreaterThanOrEqual(3)
    })

    test('should validate secret key format on save', async ({ page }) => {
      await page.goto('/admin/settings/stripe')

      // Enter invalid key
      await page.getByLabel('Secret Key').fill('invalid_key')
      await page.getByRole('button', { name: 'Save Settings' }).click()

      // Should show error
      await expect(page.getByText(/Invalid secret key format/)).toBeVisible()
    })

    test('should validate publishable key format on save', async ({ page }) => {
      await page.goto('/admin/settings/stripe')

      // Enter valid secret key but invalid publishable key
      await page.getByLabel('Secret Key').fill('sk_test_valid123')
      await page.getByLabel('Publishable Key').fill('invalid_pk')
      await page.getByRole('button', { name: 'Save Settings' }).click()

      // Should show error
      await expect(page.getByText(/Invalid publishable key format/)).toBeVisible()
    })

    test('should validate webhook secret format on save', async ({ page }) => {
      await page.goto('/admin/settings/stripe')

      // Enter valid keys but invalid webhook secret
      await page.getByLabel('Secret Key').fill('sk_test_valid123')
      await page.getByLabel('Publishable Key').fill('pk_test_valid123')
      await page.getByLabel('Webhook Secret').fill('invalid_whsec')
      await page.getByRole('button', { name: 'Save Settings' }).click()

      // Should show error
      await expect(page.getByText(/Invalid webhook secret format/)).toBeVisible()
    })

    test('should detect mode mismatch between keys', async ({ page }) => {
      await page.goto('/admin/settings/stripe')

      // Enter test secret key with live publishable key
      await page.getByLabel('Secret Key').fill('sk_test_valid123')
      await page.getByLabel('Publishable Key').fill('pk_live_valid123')
      await page.getByLabel('Webhook Secret').fill('whsec_valid123')
      await page.getByRole('button', { name: 'Save Settings' }).click()

      // Should show mode mismatch error
      await expect(page.getByText(/Mode mismatch/)).toBeVisible()
    })
  })

  test.describe('Access Control', () => {
    test('should require authentication for settings', async ({ page }) => {
      await page.context().clearCookies()
      await page.goto('/admin/settings')

      await expect(page).toHaveURL(/\/auth\/login/)
    })

    test('should require authentication for integrations', async ({ page }) => {
      await page.context().clearCookies()
      await page.goto('/admin/settings/integrations')

      await expect(page).toHaveURL(/\/auth\/login/)
    })

    test('should require authentication for Stripe settings', async ({ page }) => {
      await page.context().clearCookies()
      await page.goto('/admin/settings/stripe')

      await expect(page).toHaveURL(/\/auth\/login/)
    })
  })
})
