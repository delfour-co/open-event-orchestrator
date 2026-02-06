import { execSync } from 'node:child_process'

async function globalSetup() {
  console.log('🔄 Resetting and seeding database for E2E tests...')

  try {
    // Run the reset-test-data script which clears all data and runs seed
    execSync('pnpm reset-test-data', {
      stdio: 'inherit',
      cwd: process.cwd()
    })
    console.log('✅ Database reset and seeded successfully')
  } catch (error) {
    console.error('❌ Failed to reset database:', error)
    throw error
  }
}

export default globalSetup
