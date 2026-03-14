import type PocketBase from 'pocketbase'

export type SocialProvider = 'google' | 'github'

export type SocialAuthResult = {
  success: boolean
  error?: string
  isNewUser?: boolean
}

export type LinkedAccount = {
  id: string
  provider: string
  providerId: string
}

const SUPPORTED_PROVIDERS: readonly SocialProvider[] = ['google', 'github'] as const

export async function getAvailableProviders(pb: PocketBase): Promise<SocialProvider[]> {
  try {
    // Read OAuth2 config from app_settings
    const records = await pb.collection('app_settings').getList(1, 1)
    if (records.items.length === 0) return []

    const record = records.items[0]
    if (!record.oauth2Enabled) return []

    const available: SocialProvider[] = []
    if (record.googleOAuthClientId) available.push('google')
    if (record.githubOAuthClientId) available.push('github')

    return available
  } catch {
    return []
  }
}

export async function getLinkedAccounts(pb: PocketBase, userId: string): Promise<LinkedAccount[]> {
  try {
    const accounts = await pb.collection('users').listExternalAuths(userId)
    return accounts.map((a) => ({
      id: a.id,
      provider: a.provider,
      providerId: a.providerId
    }))
  } catch {
    return []
  }
}

export async function unlinkAccount(
  pb: PocketBase,
  userId: string,
  provider: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await pb.collection('users').unlinkExternalAuth(userId, provider)
    return { success: true }
  } catch (err) {
    console.error('Failed to unlink account:', err)
    return { success: false, error: 'Failed to unlink account' }
  }
}

const PROVIDER_LABELS: Record<string, string> = {
  google: 'Google',
  github: 'GitHub'
}

export function getProviderLabel(provider: string): string {
  return PROVIDER_LABELS[provider] || provider
}
