/**
 * Reset test data script
 *
 * Deletes all data from collections and runs seed to restore clean state.
 * Used before E2E tests to ensure consistent test environment.
 *
 * Usage: pnpm reset-test-data
 */

import PocketBase from 'pocketbase'

const POCKETBASE_URL = process.env.PUBLIC_POCKETBASE_URL || 'http://localhost:8090'
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || 'admin@pocketbase.local'
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || 'adminpassword123'

const pb = new PocketBase(POCKETBASE_URL)
pb.autoCancellation(false)

// Collections to clear (order matters for foreign key constraints)
const collectionsToReset = [
  // Billing
  'tickets',
  'order_items',
  'orders',
  'ticket_types',

  // Budget
  'financial_journal_entries',
  'reimbursement_expense_items',
  'reimbursement_requests',
  'budget_invoices',
  'budget_quotes',
  'budget_transactions',
  'budget_categories',
  'edition_budgets',

  // Sponsoring
  'sponsor_tokens',
  'edition_sponsors',
  'sponsor_packages',
  'sponsors',

  // Planning
  'room_assignments',
  'sessions',
  'slots',
  'tracks',
  'rooms',

  // CRM
  'consents',
  'contact_edition_links',
  'contacts',
  'segments',
  'email_campaigns',
  'email_templates',

  // CFP
  'reviews',
  'talks',
  'speaker_tokens',
  'speakers',
  'formats',
  'categories',

  // Team
  'team_members',

  // Auth
  'user_sessions',

  // Core
  'editions',
  'events',
  'organization_members',
  'organizations',

  // Users
  'users'
]

async function collectionExists(name: string): Promise<boolean> {
  try {
    await pb.collections.getOne(name)
    return true
  } catch {
    return false
  }
}

async function resetData() {
  console.log('🔑 Authenticating with PocketBase admin...')
  await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
  console.log('✅ Authenticated')

  console.log('\n🗑️  Clearing collections...')

  for (const collectionName of collectionsToReset) {
    try {
      if (!(await collectionExists(collectionName))) {
        console.log(`  ⏭️  ${collectionName}: collection doesn't exist, skipping`)
        continue
      }

      // Get all records from the collection
      const records = await pb.collection(collectionName).getFullList()

      if (records.length === 0) {
        console.log(`  ✅ ${collectionName}: already empty`)
        continue
      }

      // Delete all records
      let deleted = 0
      for (const record of records) {
        try {
          await pb.collection(collectionName).delete(record.id)
          deleted++
        } catch (err) {
          // Some records may fail due to constraints, continue
        }
      }
      console.log(`  🗑️  ${collectionName}: deleted ${deleted}/${records.length} records`)
    } catch (err) {
      console.log(`  ⚠️  ${collectionName}: error - ${err}`)
    }
  }

  console.log('\n✅ Data reset complete!')
}

resetData().catch((err) => {
  console.error('❌ Reset failed:', err)
  process.exit(1)
})
