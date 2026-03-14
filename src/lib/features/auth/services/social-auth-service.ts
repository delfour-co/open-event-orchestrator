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
    const authMethods = await pb.collection('users').listAuthMethods()
    const available: SocialProvider[] = []

    for (const provider of authMethods.oauth2?.providers || []) {
      if (SUPPORTED_PROVIDERS.includes(provider.name as SocialProvider)) {
        available.push(provider.name as SocialProvider)
      }
    }

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
