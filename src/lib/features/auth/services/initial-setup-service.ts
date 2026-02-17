import type PocketBase from 'pocketbase'
import { calculateTokenExpiration, generateSetupToken } from '../domain'
import { createSetupTokenRepository } from '../infra'

export type InitialSetupService = {
  isFirstRun: () => Promise<boolean>
  generateSetupLink: (baseUrl: string) => Promise<string | null>
  checkAndDisplaySetupLink: (baseUrl: string) => Promise<void>
  cleanupAfterSetup: () => Promise<void>
}

/**
 * Check if the application is running for the first time (no users exist)
 */
export async function checkIsFirstRun(pb: PocketBase): Promise<boolean> {
  try {
    const result = await pb.collection('users').getList(1, 1)
    return result.totalItems === 0
  } catch {
    // Collection might not exist yet, consider it first run
    return true
  }
}

/**
 * Create the initial setup service
 */
export const createInitialSetupService = (pb: PocketBase): InitialSetupService => {
  const tokenRepository = createSetupTokenRepository()

  return {
    async isFirstRun() {
      return checkIsFirstRun(pb)
    },

    async generateSetupLink(baseUrl: string) {
      // Check if already has a valid token
      const hasValidToken = await tokenRepository.hasValidToken()
      if (hasValidToken) {
        return null
      }

      // Clean up expired tokens
      await tokenRepository.deleteExpired()

      // Generate new token
      const token = generateSetupToken()
      const expiresAt = calculateTokenExpiration()

      await tokenRepository.create(token, expiresAt)

      const cleanBaseUrl = baseUrl.replace(/\/$/, '')
      return `${cleanBaseUrl}/setup/${token}`
    },

    async checkAndDisplaySetupLink(baseUrl: string) {
      const isFirstRun = await checkIsFirstRun(pb)

      if (!isFirstRun) {
        // Clean up any leftover setup tokens
        await tokenRepository.deleteAll()
        return
      }

      const setupLink = await this.generateSetupLink(baseUrl)

      if (setupLink) {
        displaySetupLink(setupLink)
      }
    },

    async cleanupAfterSetup() {
      await tokenRepository.deleteAll()
    }
  }
}

/**
 * Display the setup link in the console with visual formatting
 */
export function displaySetupLink(setupLink: string): void {
  const separator = '='.repeat(70)
  const message = [
    '',
    separator,
    '  INITIAL SETUP REQUIRED',
    separator,
    '',
    '  No admin user found. Please complete the initial setup.',
    '',
    '  Open this link in your browser to create the first admin account:',
    '',
    `  ${setupLink}`,
    '',
    '  This link will expire in 24 hours.',
    '',
    separator,
    ''
  ]

  for (const line of message) {
    console.log(line)
  }
}
