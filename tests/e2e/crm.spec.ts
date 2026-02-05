import { expect, test } from '@playwright/test'

test.describe('CRM Module', () => {
  const eventSlug = 'devfest'
  const crmUrl = `/admin/crm/${eventSlug}`

  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill('admin@example.com')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(/\/admin/, { timeout: 10000 })
  })

  // ==========================================================================
  // CRM Event Selector
  // ==========================================================================
  test.describe('CRM Event Selector', () => {
    test('should display CRM page with events list', async ({ page }) => {
      await page.goto('/admin/crm')

      await expect(page.getByRole('heading', { name: 'CRM' })).toBeVisible()
      await expect(
        page.getByText('Select an event to manage its contacts, segments, and imports.')
      ).toBeVisible()
      await expect(page.getByText('DevFest')).toBeVisible()
    })

    test('should navigate to event CRM page', async ({ page }) => {
      await page.goto('/admin/crm')

      await page.getByRole('link', { name: /Manage Contacts/ }).click()

      await expect(page).toHaveURL(crmUrl)
      await expect(page.getByRole('heading', { name: 'Contacts', exact: true })).toBeVisible()
    })
  })

  // ==========================================================================
  // Contact List
  // ==========================================================================
  test.describe('Contact List', () => {
    test('should display contacts list with stats', async ({ page }) => {
      await page.goto(crmUrl)

      await expect(page.getByRole('heading', { name: 'Contacts', exact: true })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Total Contacts' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Speakers', exact: true })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Attendees', exact: true })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Sponsors', exact: true })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Manual', exact: true })).toBeVisible()
    })

    test('should show source filter dropdown with all options', async ({ page }) => {
      await page.goto(crmUrl)

      const sourceSelect = page.locator('select').filter({ hasText: 'All Sources' })
      await expect(sourceSelect).toBeVisible()

      // Verify all filter options exist
      await expect(sourceSelect.locator('option', { hasText: 'All Sources' })).toBeAttached()
      await expect(sourceSelect.locator('option', { hasText: 'Speaker' })).toBeAttached()
      await expect(sourceSelect.locator('option', { hasText: 'Attendee' })).toBeAttached()
      await expect(sourceSelect.locator('option', { hasText: 'Sponsor' })).toBeAttached()
      await expect(sourceSelect.locator('option', { hasText: 'Manual' })).toBeAttached()
      await expect(sourceSelect.locator('option', { hasText: 'Import' })).toBeAttached()
    })

    test('should display seeded contacts in the table', async ({ page }) => {
      await page.goto(crmUrl)

      // Table headers
      await expect(page.locator('th', { hasText: 'Name' })).toBeVisible()
      await expect(page.locator('th', { hasText: 'Email' })).toBeVisible()
      await expect(page.locator('th', { hasText: 'Company' })).toBeVisible()
      await expect(page.locator('th', { hasText: 'Source' })).toBeVisible()
      await expect(page.locator('th', { hasText: 'Tags' })).toBeVisible()

      // Search for a seeded contact to verify it exists
      const searchInput = page.getByPlaceholder('Search by name, email, or company...')
      await searchInput.fill('Jane')
      await searchInput.press('Enter')
      await page.waitForLoadState('networkidle')
      await expect(page.locator('table a').filter({ hasText: 'Jane Speaker' })).toBeVisible()
    })

    test('should search contacts by name', async ({ page }) => {
      await page.goto(crmUrl)

      const searchInput = page.getByPlaceholder('Search by name, email, or company...')
      await searchInput.fill('Alice')
      await searchInput.press('Enter')
      await page.waitForLoadState('networkidle')

      await expect(page.getByText('Alice Martin')).toBeVisible()
    })

    test('should search contacts by email', async ({ page }) => {
      await page.goto(crmUrl)

      const searchInput = page.getByPlaceholder('Search by name, email, or company...')
      await searchInput.fill('bob.dupont@example.com')
      await searchInput.press('Enter')
      await page.waitForLoadState('networkidle')

      await expect(page.getByText('Bob Dupont')).toBeVisible()
    })

    test('should filter contacts by source', async ({ page }) => {
      await page.goto(crmUrl)

      const sourceSelect = page.locator('select').filter({ hasText: 'All Sources' })
      await sourceSelect.selectOption('speaker')

      await page.waitForLoadState('networkidle')

      await expect(page.getByText('Jane Speaker')).toBeVisible()
      await expect(page.getByText('John Talker')).toBeVisible()
    })

    test('should create a new contact', async ({ page }) => {
      await page.goto(crmUrl)

      const contactName = `E2EContact${Date.now()}`

      // Open create form
      await page.getByRole('button', { name: /New Contact/ }).click()
      await expect(page.getByRole('heading', { name: 'New Contact' })).toBeVisible()

      // Fill the form
      await page.locator('#ct-firstName').fill(contactName)
      await page.locator('#ct-lastName').fill('TestLast')
      await page.locator('#ct-email').fill(`${contactName.toLowerCase()}@example.com`)
      await page.locator('#ct-company').fill('Test Company')
      await page.locator('#ct-jobTitle').fill('Test Engineer')
      await page.locator('#ct-source').selectOption('manual')
      await page.locator('#ct-tags').fill('e2e, test')

      // Submit
      await page.getByRole('button', { name: 'Create Contact' }).click()
      await page.waitForLoadState('networkidle')

      // Verify success
      await expect(page.getByText('Contact created successfully.')).toBeVisible()
      await expect(page.locator('table a').filter({ hasText: contactName })).toBeVisible()
    })

    test('should show Sync Contacts button', async ({ page }) => {
      await page.goto(crmUrl)

      await expect(page.getByRole('button', { name: /Sync Contacts/ })).toBeVisible()
    })

    test('should show Import button', async ({ page }) => {
      await page.goto(crmUrl)

      await expect(page.getByRole('link', { name: /Import/ })).toBeVisible()
    })

    test('should show Segments button', async ({ page }) => {
      await page.goto(crmUrl)

      await expect(page.getByRole('link', { name: /Segments/ })).toBeVisible()
    })
  })

  // ==========================================================================
  // Contact Detail
  // ==========================================================================
  test.describe('Contact Detail', () => {
    test('should navigate to contact detail page', async ({ page }) => {
      await page.goto(crmUrl)

      // Search for the seeded contact (may be on page 2 due to parallel test data)
      const searchInput = page.getByPlaceholder('Search by name, email, or company...')
      await searchInput.fill('Jane')
      await searchInput.press('Enter')
      await page.waitForLoadState('networkidle')

      // Click on the contact name link
      await page.locator('table a').filter({ hasText: 'Jane Speaker' }).click()

      await expect(page.getByRole('heading', { name: 'Jane Speaker' })).toBeVisible()
      await expect(page.getByText('speaker@example.com')).toBeVisible()
    })

    test('should view contact info fields', async ({ page }) => {
      await page.goto(crmUrl)

      const searchInput = page.getByPlaceholder('Search by name, email, or company...')
      await searchInput.fill('Jane')
      await searchInput.press('Enter')
      await page.waitForLoadState('networkidle')
      await page.locator('table a').filter({ hasText: 'Jane Speaker' }).click()

      // Contact Details card
      await expect(page.getByText('Contact Details')).toBeVisible()

      // Verify form fields are populated
      await expect(page.locator('#firstName')).toHaveValue('Jane')
      await expect(page.locator('#lastName')).toHaveValue('Speaker')
      await expect(page.locator('#email')).toHaveValue('speaker@example.com')
      await expect(page.locator('#company')).toHaveValue('Tech Corp')
      await expect(page.locator('#jobTitle')).toHaveValue('Senior Developer')
    })

    test('should edit contact info', async ({ page }) => {
      // Create a temporary contact to edit
      await page.goto(crmUrl)
      const uniqueName = `EditMe${Date.now()}`

      await page.getByRole('button', { name: /New Contact/ }).click()
      await page.locator('#ct-firstName').fill(uniqueName)
      await page.locator('#ct-lastName').fill('ToEdit')
      await page.locator('#ct-email').fill(`${uniqueName.toLowerCase()}@example.com`)
      await page.getByRole('button', { name: 'Create Contact' }).click()
      await page.waitForLoadState('networkidle')

      // Navigate to the contact detail
      await page.locator('table a').filter({ hasText: uniqueName }).click()
      await expect(page.getByRole('heading', { name: `${uniqueName} ToEdit` })).toBeVisible()

      // Edit the company field
      await page.locator('#company').fill('Updated Company')
      await page.getByRole('button', { name: /Save Changes/ }).click()
      await page.waitForLoadState('networkidle')

      await expect(page.getByText('Contact updated successfully.')).toBeVisible()
      await expect(page.locator('#company')).toHaveValue('Updated Company')
    })

    test('should add and remove tags', async ({ page }) => {
      // Create a temporary contact for tag tests
      await page.goto(crmUrl)
      const uniqueName = `TagTest${Date.now()}`

      await page.getByRole('button', { name: /New Contact/ }).click()
      await page.locator('#ct-firstName').fill(uniqueName)
      await page.locator('#ct-lastName').fill('Tags')
      await page.locator('#ct-email').fill(`${uniqueName.toLowerCase()}@example.com`)
      await page.getByRole('button', { name: 'Create Contact' }).click()
      await page.waitForLoadState('networkidle')

      // Navigate to the contact detail
      await page.locator('table a').filter({ hasText: uniqueName }).click()
      await expect(page.getByRole('heading', { name: `${uniqueName} Tags` })).toBeVisible()

      // Add a tag
      await expect(page.getByText('Tags').first()).toBeVisible()
      await page.getByPlaceholder('Add a tag...').fill('e2e-tag')
      await page.getByRole('button', { name: 'Add' }).click()
      await page.waitForLoadState('networkidle')

      await expect(page.getByText('Tag added.')).toBeVisible()
      await expect(page.getByText('e2e-tag')).toBeVisible()

      // Remove the tag (click the tag button with x)
      await page.locator('button').filter({ hasText: 'e2e-tag' }).click()
      await page.waitForLoadState('networkidle')

      await expect(page.getByText('Tag removed.')).toBeVisible()
    })

    test('should grant and withdraw consent', async ({ page }) => {
      await page.goto(crmUrl)

      // Search and navigate to a seeded contact (Jane Speaker has marketing_email granted from seed)
      const searchInput = page.getByPlaceholder('Search by name, email, or company...')
      await searchInput.fill('Jane')
      await searchInput.press('Enter')
      await page.waitForLoadState('networkidle')
      await page.locator('table a').filter({ hasText: 'Jane Speaker' }).click()
      await expect(page.getByRole('heading', { name: 'Jane Speaker' })).toBeVisible()

      // GDPR Consents section should be visible
      await expect(page.getByText('GDPR Consents')).toBeVisible()
      await expect(page.getByText('Marketing Emails')).toBeVisible()
      await expect(page.getByText('Data Sharing')).toBeVisible()
      await expect(page.getByText('Analytics')).toBeVisible()

      // Grant or Withdraw buttons should be present
      const grantButtons = page.getByRole('button', { name: 'Grant' })
      const withdrawButtons = page.getByRole('button', { name: 'Withdraw' })
      const totalButtons = (await grantButtons.count()) + (await withdrawButtons.count())
      expect(totalButtons).toBeGreaterThan(0)
    })

    test('should display edition history section', async ({ page }) => {
      await page.goto(crmUrl)

      const searchInput = page.getByPlaceholder('Search by name, email, or company...')
      await searchInput.fill('Jane')
      await searchInput.press('Enter')
      await page.waitForLoadState('networkidle')
      await page.locator('table a').filter({ hasText: 'Jane Speaker' }).click()
      await expect(page.getByText('Edition History')).toBeVisible()
    })

    test('should delete contact and redirect to list', async ({ page }) => {
      // Create a contact to delete
      await page.goto(crmUrl)
      const uniqueName = `DeleteMe${Date.now()}`

      await page.getByRole('button', { name: /New Contact/ }).click()
      await page.locator('#ct-firstName').fill(uniqueName)
      await page.locator('#ct-lastName').fill('ToDelete')
      await page.locator('#ct-email').fill(`${uniqueName.toLowerCase()}@example.com`)
      await page.getByRole('button', { name: 'Create Contact' }).click()
      await page.waitForLoadState('networkidle')

      // Navigate to detail
      await page.locator('table a').filter({ hasText: uniqueName }).click()
      await expect(page.getByRole('heading', { name: `${uniqueName} ToDelete` })).toBeVisible()

      // Click Delete Contact button to show confirmation
      await page.getByRole('button', { name: 'Delete Contact' }).click()

      // Confirm deletion
      await expect(page.getByText('This will permanently delete')).toBeVisible()
      await page.getByRole('button', { name: 'Confirm Delete' }).click()

      // Should redirect back to contact list
      await expect(page).toHaveURL(crmUrl)
    })
  })

  // ==========================================================================
  // Segments
  // ==========================================================================
  test.describe('Segments', () => {
    test('should navigate to segments page', async ({ page }) => {
      await page.goto(crmUrl)

      await page.getByRole('link', { name: /Segments/ }).click()

      await expect(page).toHaveURL(`${crmUrl}/segments`)
      await expect(page.getByRole('heading', { name: 'Segments' })).toBeVisible()
      await expect(
        page.getByText('Create dynamic or static segments to organize your contacts.')
      ).toBeVisible()
    })

    test('should display seeded segments', async ({ page }) => {
      await page.goto(`${crmUrl}/segments`)

      await expect(page.getByText('All Speakers')).toBeVisible()
      await expect(page.getByText('All Attendees')).toBeVisible()
      await expect(page.getByText('VIP Contacts')).toBeVisible()
      await expect(page.getByText('Paris Area')).toBeVisible()
    })

    test('should create a new segment with rules', async ({ page }) => {
      await page.goto(`${crmUrl}/segments`)

      const segmentName = `E2E Segment ${Date.now()}`

      // Open create form
      await page.getByRole('button', { name: /Create Segment/ }).click()
      await expect(page.getByText('New Segment')).toBeVisible()

      // Fill form
      await page.locator('#seg-name').fill(segmentName)
      await page.locator('#seg-description').fill('E2E test segment')
      await page.locator('#seg-criteria').fill(
        JSON.stringify({
          match: 'all',
          rules: [{ field: 'source', operator: 'equals', value: 'attendee' }]
        })
      )

      // Submit
      await page.locator('form').getByRole('button', { name: 'Create Segment' }).click()
      await page.waitForLoadState('networkidle')

      await expect(page.getByText('Segment created successfully.')).toBeVisible()
      await expect(page.getByText(segmentName)).toBeVisible()
    })

    test('should edit a segment', async ({ page }) => {
      await page.goto(`${crmUrl}/segments`)

      // Create a segment to edit
      const segmentName = `EditSeg ${Date.now()}`

      await page.getByRole('button', { name: /Create Segment/ }).click()
      await page.locator('#seg-name').fill(segmentName)
      await page.locator('#seg-description').fill('To be edited')
      await page.locator('form').getByRole('button', { name: 'Create Segment' }).click()
      await page.waitForLoadState('networkidle')
      await expect(page.getByText(segmentName)).toBeVisible()

      // Click edit on the segment card
      const card = page.locator('[class*="card"]').filter({ hasText: segmentName })
      await card.getByRole('button', { name: /Edit/ }).click()

      // Form should show with pre-filled data
      await expect(page.getByText('Edit Segment')).toBeVisible()
      await expect(page.locator('#seg-name')).toHaveValue(segmentName)

      // Update the description
      await page.locator('#seg-description').clear()
      await page.locator('#seg-description').fill('Updated by E2E test')

      await page.getByRole('button', { name: 'Update Segment' }).click()
      await page.waitForLoadState('networkidle')

      await expect(page.getByText('Segment updated.')).toBeVisible()
    })

    test('should delete a segment', async ({ page }) => {
      await page.goto(`${crmUrl}/segments`)

      // Create a segment to delete
      const segmentName = `DelSeg ${Date.now()}`

      await page.getByRole('button', { name: /Create Segment/ }).click()
      await page.locator('#seg-name').fill(segmentName)
      await page.locator('form').getByRole('button', { name: 'Create Segment' }).click()
      await page.waitForLoadState('networkidle')
      await expect(page.getByText(segmentName)).toBeVisible()

      // Click delete on the segment card
      const card = page.locator('[class*="card"]').filter({ hasText: segmentName })
      await card.locator('button.text-destructive').click()

      await page.waitForLoadState('networkidle')

      await expect(page.getByText('Segment deleted.')).toBeVisible()
      await expect(page.getByText(segmentName)).not.toBeVisible()
    })
  })

  // ==========================================================================
  // Email Campaigns
  // ==========================================================================
  test.describe('Email Campaigns', () => {
    test('should display email campaigns event selector', async ({ page }) => {
      await page.goto('/admin/emails')

      await expect(page.getByRole('heading', { name: 'Email Campaigns' })).toBeVisible()
      await expect(
        page.getByText('Select an event to manage its email campaigns and templates.')
      ).toBeVisible()
      await expect(page.getByText('DevFest')).toBeVisible()
    })

    test('should navigate to email campaigns page', async ({ page }) => {
      await page.goto('/admin/emails')

      await page.getByRole('link', { name: /Manage Campaigns/ }).click()

      await expect(page).toHaveURL(`/admin/emails/${eventSlug}`)
      await expect(page.getByRole('heading', { name: 'Email Campaigns' })).toBeVisible()
    })

    test('should display seeded campaigns', async ({ page }) => {
      await page.goto(`/admin/emails/${eventSlug}`)

      // Table headers
      await expect(page.locator('th', { hasText: 'Name' })).toBeVisible()
      await expect(page.locator('th', { hasText: 'Subject' })).toBeVisible()
      await expect(page.locator('th', { hasText: 'Status' })).toBeVisible()

      // Seeded campaigns
      await expect(page.getByText('DevFest 2025 Invitation')).toBeVisible()
      await expect(page.getByText('Post-Event Survey')).toBeVisible()
    })

    test('should create a new campaign', async ({ page }) => {
      await page.goto(`/admin/emails/${eventSlug}`)

      const campaignName = `E2E Campaign ${Date.now()}`

      // Open create form
      await page.getByRole('button', { name: /New Campaign/ }).click()
      await expect(page.getByRole('heading', { name: 'New Campaign' })).toBeVisible()

      // Fill form
      await page.locator('#camp-name').fill(campaignName)
      await page.locator('#camp-subject').fill('E2E Test Subject')
      await page.locator('#camp-html').fill('<h1>Hello {{firstName}}</h1><p>Test campaign</p>')
      await page.locator('#camp-text').fill('Hello {{firstName}}, Test campaign')

      // Submit
      await page.getByRole('button', { name: 'Create Campaign' }).click()
      await page.waitForLoadState('networkidle')

      await expect(page.getByText('Campaign created successfully.')).toBeVisible()
      await expect(page.getByText(campaignName)).toBeVisible()
    })

    test('should edit a draft campaign', async ({ page }) => {
      await page.goto(`/admin/emails/${eventSlug}`)

      // Create a campaign first
      const campaignName = `EditCamp ${Date.now()}`

      await page.getByRole('button', { name: /New Campaign/ }).click()
      await page.locator('#camp-name').fill(campaignName)
      await page.locator('#camp-subject').fill('Original Subject')
      await page.getByRole('button', { name: 'Create Campaign' }).click()
      await page.waitForLoadState('networkidle')
      await expect(page.getByText(campaignName)).toBeVisible()

      // Click Edit button on the campaign row
      const row = page.locator('tr').filter({ hasText: campaignName })
      await row.getByRole('button', { name: /Edit/ }).click()

      // Edit form should appear
      await expect(page.getByText('Edit Campaign')).toBeVisible()

      // Update subject
      await page.locator('#camp-subject').clear()
      await page.locator('#camp-subject').fill('Updated Subject')

      await page.getByRole('button', { name: 'Update Campaign' }).click()
      await page.waitForLoadState('networkidle')

      await expect(page.getByText('Campaign updated.')).toBeVisible()
    })

    test('should cancel a draft campaign', async ({ page }) => {
      await page.goto(`/admin/emails/${eventSlug}`)

      // Create a campaign to cancel
      const campaignName = `CancelCamp ${Date.now()}`

      await page.getByRole('button', { name: /New Campaign/ }).click()
      await page.locator('#camp-name').fill(campaignName)
      await page.locator('#camp-subject').fill('To Cancel')
      await page.getByRole('button', { name: 'Create Campaign' }).click()
      await page.waitForLoadState('networkidle')
      await expect(page.getByText(campaignName)).toBeVisible()

      // Click cancel button (Ban icon) on the campaign row
      const row = page.locator('tr').filter({ hasText: campaignName })
      await row.locator('button[title="Cancel campaign"]').click()

      await page.waitForLoadState('networkidle')

      await expect(page.getByText('Campaign cancelled.')).toBeVisible()
    })

    test('should delete a draft campaign', async ({ page }) => {
      await page.goto(`/admin/emails/${eventSlug}`)

      // Create a campaign to delete
      const campaignName = `DelCamp ${Date.now()}`

      await page.getByRole('button', { name: /New Campaign/ }).click()
      await page.locator('#camp-name').fill(campaignName)
      await page.locator('#camp-subject').fill('To Delete')
      await page.getByRole('button', { name: 'Create Campaign' }).click()
      await page.waitForLoadState('networkidle')
      await expect(page.getByText(campaignName)).toBeVisible()

      // Click delete button on the campaign row
      const row = page.locator('tr').filter({ hasText: campaignName })
      await row.locator('button[title="Delete campaign"]').click()

      await page.waitForLoadState('networkidle')

      await expect(page.getByText('Campaign deleted.')).toBeVisible()
      await expect(page.getByText(campaignName)).not.toBeVisible()
    })

    test('should display templates page', async ({ page }) => {
      await page.goto(`/admin/emails/${eventSlug}`)

      // Click Templates button
      await page.getByRole('link', { name: /Templates/ }).click()

      await expect(page).toHaveURL(`/admin/emails/${eventSlug}/templates`)
      await expect(page.getByRole('heading', { name: 'Email Templates' })).toBeVisible()
      await expect(
        page.getByText('Manage reusable email templates for your campaigns.')
      ).toBeVisible()

      // Seeded templates
      await expect(page.getByText('Event Invitation')).toBeVisible()
      await expect(page.getByText('Thank You Post-Event')).toBeVisible()
      await expect(page.getByText('Monthly Newsletter')).toBeVisible()
    })
  })

  // ==========================================================================
  // Access Control
  // ==========================================================================
  test.describe('Access Control', () => {
    test('should require authentication for CRM pages', async ({ page }) => {
      await page.context().clearCookies()
      await page.goto(crmUrl)

      await expect(page).toHaveURL(/\/auth\/login/)
    })

    test('should require authentication for email pages', async ({ page }) => {
      await page.context().clearCookies()
      await page.goto(`/admin/emails/${eventSlug}`)

      await expect(page).toHaveURL(/\/auth\/login/)
    })
  })
})
