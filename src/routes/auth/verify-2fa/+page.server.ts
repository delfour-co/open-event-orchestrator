import { TRUSTED_DEVICE_DAYS } from '$lib/features/auth/domain/totp'
import {
  createTotpRepository,
  createTrustedDeviceRepository
} from '$lib/features/auth/infra/totp-repository'
import {
  generateDeviceHash,
  verifyBackupCode,
  verifyTotpCode
} from '$lib/features/auth/services/totp-service'
import { fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ cookies, locals }) => {
  const pending2faUserId = cookies.get('oeo_2fa_required')
  if (!pending2faUserId) {
    throw redirect(303, locals.user ? '/admin' : '/auth/login')
  }

  return {
    userId: pending2faUserId
  }
}

export const actions: Actions = {
  default: async ({ request, locals, cookies }) => {
    const pending2faUserId = cookies.get('oeo_2fa_required')
    if (!pending2faUserId) {
      throw redirect(303, '/auth/login')
    }

    const formData = await request.formData()
    const code = formData.get('code') as string
    const rememberDevice = formData.get('rememberDevice') === 'on'

    if (!code) {
      return fail(400, { error: 'Verification code is required' })
    }

    const totpRepo = createTotpRepository(locals.pb)
    const totp = await totpRepo.findByUserId(pending2faUserId)

    if (!totp || !totp.enabled) {
      cookies.delete('oeo_2fa_required', { path: '/' })
      throw redirect(303, '/admin')
    }

    // Try TOTP code first
    let valid = verifyTotpCode(totp.secret, code)

    // If TOTP fails, try backup code
    if (!valid) {
      const cleanCode = code.replace(/\s/g, '').toUpperCase()
      const result = verifyBackupCode(cleanCode, totp.backupCodes)
      if (result.valid) {
        valid = true
        // Remove used backup code
        const updatedCodes = [...totp.backupCodes]
        updatedCodes.splice(result.index, 1)
        await totpRepo.updateBackupCodes(totp.id, updatedCodes)
      }
    }

    if (!valid) {
      return fail(400, { error: 'Invalid verification code' })
    }

    // Trust device if requested
    if (rememberDevice) {
      const userAgent = request.headers.get('user-agent') || ''
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0'
      const deviceHash = generateDeviceHash(userAgent, ip)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + TRUSTED_DEVICE_DAYS)

      const trustedRepo = createTrustedDeviceRepository(locals.pb)
      await trustedRepo.trust(pending2faUserId, deviceHash, expiresAt)
    }

    // Clear 2FA required flag — verification complete
    cookies.delete('oeo_2fa_required', { path: '/' })

    throw redirect(303, '/admin')
  }
}
