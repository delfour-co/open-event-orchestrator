import {
  createTotpRepository,
  createTrustedDeviceRepository
} from '$lib/features/auth/infra/totp-repository'
import { getAvailableProviders } from '$lib/features/auth/services/social-auth-service'
import { generateDeviceHash } from '$lib/features/auth/services/totp-service'
import { processPendingInvitations } from '$lib/server/invitations'
import { fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  const socialProviders = await getAvailableProviders(locals.pb)
  return { socialProviders }
}

export const actions: Actions = {
  default: async ({ request, locals, url, cookies }) => {
    const formData = await request.formData()
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const redirectTo = formData.get('redirect') as string | null

    if (!email || !password) {
      return fail(400, { error: 'Email and password are required' })
    }

    let authData: { record: { id: string }; token: string }

    try {
      authData = await locals.pb.collection('users').authWithPassword(email, password)

      const accepted = await processPendingInvitations(locals.pb, authData.record.id, email)
      if (accepted > 0) {
        await locals.pb.collection('users').authRefresh()
      }
    } catch {
      return fail(401, { error: 'Invalid email or password' })
    }

    // Check if 2FA is required
    try {
      const totpRepo = createTotpRepository(locals.pb)
      const totp = await totpRepo.findByUserId(authData.record.id)

      if (totp?.enabled) {
        const userAgent = request.headers.get('user-agent') || ''
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0'
        const deviceHash = generateDeviceHash(userAgent, ip)

        const trustedRepo = createTrustedDeviceRepository(locals.pb)
        const isTrusted = await trustedRepo.isTrusted(authData.record.id, deviceHash)

        if (!isTrusted) {
          // Keep auth valid but set a flag requiring 2FA verification
          cookies.set('oeo_2fa_required', authData.record.id, {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 300
          })
          throw redirect(303, '/auth/verify-2fa')
        }
      }
    } catch (e) {
      if (e && typeof e === 'object' && 'status' in e) throw e
      console.error('[2FA] Error checking 2FA status:', e)
    }

    // Resolve redirect URL
    let targetUrl = '/admin'
    if (redirectTo?.startsWith('/') && !redirectTo.startsWith('//')) {
      targetUrl = redirectTo
    } else {
      const queryRedirect = url.searchParams.get('redirect')
      if (queryRedirect?.startsWith('/') && !queryRedirect.startsWith('//')) {
        targetUrl = queryRedirect
      }
    }

    throw redirect(303, targetUrl)
  }
}
