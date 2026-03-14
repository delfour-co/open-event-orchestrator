import {
  createTotpRepository,
  createTrustedDeviceRepository
} from '$lib/features/auth/infra/totp-repository'
import { generateDeviceHash } from '$lib/features/auth/services/totp-service'
import { processPendingInvitations } from '$lib/server/invitations'
import { fail, redirect } from '@sveltejs/kit'
import type { Cookies } from '@sveltejs/kit'
import type PocketBase from 'pocketbase'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  let socialProviders: string[] = []
  try {
    const authMethods = await locals.pb.collection('users').listAuthMethods()
    socialProviders = (authMethods.oauth2?.providers || [])
      .filter((p: { name: string }) => p.name === 'google' || p.name === 'github')
      .map((p: { name: string }) => p.name)
  } catch {
    /* ignore */
  }

  return { socialProviders }
}

async function check2faAndRedirect(
  pb: PocketBase,
  request: Request,
  cookies: Cookies,
  authData: { record: { id: string }; token: string }
): Promise<void> {
  const totpRepo = createTotpRepository(pb)
  const totp = await totpRepo.findByUserId(authData.record.id)

  if (!totp?.enabled) return

  const userAgent = request.headers.get('user-agent') || ''
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0'
  const deviceHash = generateDeviceHash(userAgent, ip)

  const trustedRepo = createTrustedDeviceRepository(pb)
  const isTrusted = await trustedRepo.isTrusted(authData.record.id, deviceHash)

  if (isTrusted) return

  cookies.set('oeo_2fa_pending', authData.record.id, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 300
  })
  // Save the full PB auth cookie so we can restore it after 2FA verification
  cookies.set('oeo_2fa_auth', pb.authStore.exportToCookie(), {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 300
  })

  pb.authStore.clear()
  throw redirect(303, '/auth/verify-2fa')
}

function resolveRedirectUrl(redirectTo: string | null, url: URL): string {
  if (redirectTo?.startsWith('/') && !redirectTo.startsWith('//')) {
    return redirectTo
  }
  const queryRedirect = url.searchParams.get('redirect')
  if (queryRedirect?.startsWith('/') && !queryRedirect.startsWith('//')) {
    return queryRedirect
  }
  return '/admin'
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

    try {
      await check2faAndRedirect(locals.pb, request, cookies, authData)
    } catch (e) {
      if (e && typeof e === 'object' && 'status' in e) throw e
      console.error('[2FA] Error checking 2FA status:', e)
    }

    throw redirect(303, resolveRedirectUrl(redirectTo, url))
  }
}
