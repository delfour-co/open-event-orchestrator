import { changePasswordSchema, updateProfileSchema } from '$lib/features/auth/domain'
import type { UserSession } from '$lib/features/auth/domain/user-session'
import { createUserSessionRepository } from '$lib/features/auth/infra'
import { createTotpRepository } from '$lib/features/auth/infra/totp-repository'
import { writeAuditLog } from '$lib/server/audit-log-service'
import { buildFileUrl } from '$lib/server/file-url'
import { validateImageFile } from '$lib/server/file-validation'
import { error, fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

const SESSION_COOKIE_NAME = 'oeo_session_id'

export const load: PageServerLoad = async ({ locals, cookies }) => {
  if (!locals.user) {
    throw redirect(303, '/auth/login')
  }

  const user = locals.user

  // Build avatar URL if user has an avatar
  let avatarUrl: string | null = null
  if (user.avatar) {
    avatarUrl = buildFileUrl('users', user.id, user.avatar as string)
  }

  // Get user sessions
  let sessions: UserSession[] = []
  let currentSessionId: string | null = null

  try {
    const sessionRepo = createUserSessionRepository(locals.pb)
    sessions = await sessionRepo.getSessionsForUser(user.id)

    // Get current session from session ID cookie
    const sessionIdFromCookie = cookies.get(SESSION_COOKIE_NAME)
    if (sessionIdFromCookie) {
      // Find the session with matching tokenHash (which stores the sessionId)
      const currentSession = sessions.find((s) => s.tokenHash === sessionIdFromCookie)
      currentSessionId = currentSession?.id || null
    }
  } catch (err) {
    console.error('Failed to load sessions:', err)
  }

  // Load notification preferences
  const rawPrefs = user.notificationPreferences as Record<string, boolean> | null | undefined
  const notificationPreferences = {
    eventUpdates: rawPrefs?.eventUpdates ?? true,
    teamActivity: rawPrefs?.teamActivity ?? true,
    marketing: rawPrefs?.marketing ?? false
  }

  // Check 2FA status
  let twoFactorEnabled = false
  let backupCodesRemaining = 0
  try {
    const totpRepo = createTotpRepository(locals.pb)
    const totp = await totpRepo.findByUserId(user.id as string)
    if (totp?.enabled) {
      twoFactorEnabled = true
      backupCodesRemaining = totp.backupCodes.length
    }
  } catch {
    // Collection might not exist yet
  }

  // Get linked accounts
  let linkedAccounts: Array<{ id: string; provider: string; providerId: string }> = []
  try {
    const accounts = await locals.pb.collection('users').listExternalAuths(user.id as string)
    linkedAccounts = accounts.map((a: { id: string; provider: string; providerId: string }) => ({
      id: a.id,
      provider: a.provider,
      providerId: a.providerId
    }))
  } catch {
    /* ignore */
  }

  return {
    user: {
      id: user.id as string,
      email: user.email as string,
      name: user.name as string,
      avatar: user.avatar as string | null,
      avatarUrl,
      role: user.role as string,
      created: user.created as string
    },
    sessions,
    currentSessionId,
    notificationPreferences,
    twoFactorEnabled,
    backupCodesRemaining,
    linkedAccounts
  }
}

export const actions: Actions = {
  updateProfile: async ({ request, locals }) => {
    if (!locals.user) {
      throw error(401, 'Not authenticated')
    }

    const formData = await request.formData()
    const data = {
      name: formData.get('name') as string
    }

    const result = updateProfileSchema.safeParse(data)
    if (!result.success) {
      const errors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        errors[issue.path[0] as string] = issue.message
      }
      return fail(400, { errors, action: 'updateProfile' })
    }

    try {
      await locals.pb.collection('users').update(locals.user.id, {
        name: data.name
      })

      // Refresh auth to get updated user data
      await locals.pb.collection('users').authRefresh()

      return { success: true, action: 'updateProfile' }
    } catch (err) {
      console.error('Profile update error:', err)
      return fail(500, { error: 'Failed to update profile', action: 'updateProfile' })
    }
  },

  uploadAvatar: async ({ request, locals }) => {
    if (!locals.user) {
      throw error(401, 'Not authenticated')
    }

    const formData = await request.formData()
    const avatar = formData.get('avatar') as File

    if (!avatar || avatar.size === 0) {
      return fail(400, { error: 'Avatar file is required', action: 'uploadAvatar' })
    }

    // Validate file type and size
    const validation = validateImageFile(avatar, { maxSizeMB: 2 })
    if (!validation.valid) {
      return fail(400, { error: validation.error, action: 'uploadAvatar' })
    }

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('avatar', avatar)

      await locals.pb.collection('users').update(locals.user.id, uploadFormData)

      // Refresh auth to get updated user data
      await locals.pb.collection('users').authRefresh()

      return { success: true, action: 'uploadAvatar' }
    } catch (err) {
      console.error('Avatar upload error:', err)
      return fail(500, { error: 'Failed to upload avatar', action: 'uploadAvatar' })
    }
  },

  removeAvatar: async ({ locals }) => {
    if (!locals.user) {
      throw error(401, 'Not authenticated')
    }

    try {
      await locals.pb.collection('users').update(locals.user.id, {
        avatar: null
      })

      // Refresh auth to get updated user data
      await locals.pb.collection('users').authRefresh()

      return { success: true, action: 'removeAvatar' }
    } catch (err) {
      console.error('Avatar removal error:', err)
      return fail(500, { error: 'Failed to remove avatar', action: 'removeAvatar' })
    }
  },

  changePassword: async ({ request, locals }) => {
    if (!locals.user) {
      throw error(401, 'Not authenticated')
    }

    const formData = await request.formData()
    const data = {
      oldPassword: formData.get('oldPassword') as string,
      password: formData.get('password') as string,
      passwordConfirm: formData.get('passwordConfirm') as string
    }

    const result = changePasswordSchema.safeParse(data)
    if (!result.success) {
      const errors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        errors[issue.path[0] as string] = issue.message
      }
      return fail(400, { errors, action: 'changePassword' })
    }

    try {
      await locals.pb.collection('users').update(locals.user.id, {
        oldPassword: data.oldPassword,
        password: data.password,
        passwordConfirm: data.passwordConfirm
      })

      // Re-authenticate with new password
      await locals.pb
        .collection('users')
        .authWithPassword(locals.user.email as string, data.password)

      // Log password change to all user's organizations
      try {
        const memberRecords = await locals.pb.collection('organization_members').getFullList({
          filter: `userId="${locals.user.id}"`
        })
        for (const member of memberRecords) {
          writeAuditLog(locals.pb, {
            organizationId: member.organizationId as string,
            userId: locals.user.id,
            userName: locals.user.name as string,
            action: 'password_change',
            entityType: 'user',
            entityId: locals.user.id,
            entityName: locals.user.name as string,
            ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
            userAgent: request.headers.get('user-agent') || ''
          })
        }
      } catch {
        /* ignore */
      }

      return { success: true, action: 'changePassword' }
    } catch (err) {
      console.error('Password change error:', err)
      const pbError = err as { response?: { data?: Record<string, { message: string }> } }
      if (pbError.response?.data?.oldPassword) {
        return fail(400, {
          errors: { oldPassword: 'Current password is incorrect' },
          action: 'changePassword'
        })
      }
      return fail(500, { error: 'Failed to change password', action: 'changePassword' })
    }
  },

  revokeSession: async ({ request, locals }) => {
    if (!locals.user) {
      throw error(401, 'Not authenticated')
    }

    const formData = await request.formData()
    const sessionId = formData.get('sessionId') as string

    if (!sessionId) {
      return fail(400, { error: 'Session ID is required', action: 'revokeSession' })
    }

    try {
      const sessionRepo = createUserSessionRepository(locals.pb)
      await sessionRepo.deleteSession(sessionId)

      return { success: true, action: 'revokeSession' }
    } catch (err) {
      console.error('Session revoke error:', err)
      return fail(500, { error: 'Failed to revoke session', action: 'revokeSession' })
    }
  },

  revokeAllSessions: async ({ locals, cookies }) => {
    if (!locals.user) {
      throw error(401, 'Not authenticated')
    }

    try {
      const sessionRepo = createUserSessionRepository(locals.pb)

      // Get current session ID from cookie
      const currentSessionId = cookies.get(SESSION_COOKIE_NAME) || ''

      const count = await sessionRepo.deleteOtherSessions(locals.user.id, currentSessionId)

      return { success: true, action: 'revokeAllSessions', revokedCount: count }
    } catch (err) {
      console.error('Revoke all sessions error:', err)
      return fail(500, { error: 'Failed to revoke sessions', action: 'revokeAllSessions' })
    }
  },

  updateNotifications: async ({ request, locals }) => {
    if (!locals.user) {
      throw error(401, 'Not authenticated')
    }

    const formData = await request.formData()
    const notificationPreferences = {
      eventUpdates: formData.get('eventUpdates') === 'on',
      teamActivity: formData.get('teamActivity') === 'on',
      marketing: formData.get('marketing') === 'on'
    }

    try {
      await locals.pb.collection('users').update(locals.user.id, { notificationPreferences })
      return { success: true, action: 'updateNotifications' }
    } catch (err) {
      console.error('Notification preferences update error:', err)
      return fail(500, {
        error: 'Failed to update notification preferences',
        action: 'updateNotifications'
      })
    }
  },

  requestAccountDeletion: async ({ request, locals, cookies }) => {
    if (!locals.user) {
      throw error(401, 'Not authenticated')
    }

    const formData = await request.formData()
    const password = formData.get('password') as string

    if (!password) {
      return fail(400, { error: 'Password is required', action: 'requestAccountDeletion' })
    }

    try {
      // Verify password by attempting auth
      await locals.pb.collection('users').authWithPassword(locals.user.email as string, password)

      // Delete the user account
      await locals.pb.collection('users').delete(locals.user.id)

      // Clear auth
      locals.pb.authStore.clear()
      cookies.delete('pb_auth', { path: '/' })
    } catch (err) {
      console.error('Account deletion error:', err)
      return fail(400, { error: 'Invalid password', action: 'requestAccountDeletion' })
    }

    throw redirect(303, '/auth/login')
  },

  setup2fa: async ({ locals }) => {
    if (!locals.user) {
      throw error(401, 'Not authenticated')
    }

    const { generateTotpSecret, generateBackupCodes, hashBackupCode } = await import(
      '$lib/features/auth/services/totp-service'
    )

    const totpRepo = createTotpRepository(locals.pb)

    const existing = await totpRepo.findByUserId(locals.user.id)
    if (existing?.enabled) {
      return fail(400, { error: '2FA is already enabled', action: 'setup2fa' })
    }

    const { secret, uri } = generateTotpSecret(locals.user.email as string)
    const backupCodes = generateBackupCodes()
    const hashedCodes = backupCodes.map(hashBackupCode)

    if (existing) {
      await totpRepo.delete(existing.id)
    }
    await totpRepo.create({
      userId: locals.user.id,
      secret,
      enabled: false,
      backupCodes: hashedCodes
    })

    return {
      success: true,
      action: 'setup2fa',
      totpUri: uri,
      totpSecret: secret,
      backupCodes
    }
  },

  enable2fa: async ({ request, locals }) => {
    if (!locals.user) {
      throw error(401, 'Not authenticated')
    }

    const formData = await request.formData()
    const code = formData.get('code') as string

    if (!code) {
      return fail(400, { error: 'Code is required', action: 'enable2fa' })
    }

    const { verifyTotpCode } = await import('$lib/features/auth/services/totp-service')

    const totpRepo = createTotpRepository(locals.pb)
    const totp = await totpRepo.findByUserId(locals.user.id)

    if (!totp) {
      return fail(400, { error: '2FA setup not found', action: 'enable2fa' })
    }

    if (!verifyTotpCode(totp.secret, code)) {
      return fail(400, { error: 'Invalid code. Try again.', action: 'enable2fa' })
    }

    await totpRepo.enable(totp.id, totp.backupCodes)

    // Log 2FA enable to all user's organizations
    try {
      const memberRecords = await locals.pb.collection('organization_members').getFullList({
        filter: `userId="${locals.user.id}"`
      })
      for (const member of memberRecords) {
        writeAuditLog(locals.pb, {
          organizationId: member.organizationId as string,
          userId: locals.user.id,
          userName: locals.user.name as string,
          action: '2fa_enable',
          entityType: 'user',
          entityId: locals.user.id,
          entityName: locals.user.name as string,
          ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
          userAgent: request.headers.get('user-agent') || ''
        })
      }
    } catch {
      /* ignore */
    }

    return { success: true, action: 'enable2fa' }
  },

  disable2fa: async ({ request, locals }) => {
    if (!locals.user) {
      throw error(401, 'Not authenticated')
    }

    const formData = await request.formData()
    const password = formData.get('password') as string

    if (!password) {
      return fail(400, { error: 'Password required', action: 'disable2fa' })
    }

    try {
      await locals.pb.collection('users').authWithPassword(locals.user.email as string, password)
    } catch {
      return fail(400, { error: 'Invalid password', action: 'disable2fa' })
    }

    const totpRepo = createTotpRepository(locals.pb)
    const totp = await totpRepo.findByUserId(locals.user.id)

    if (totp) {
      await totpRepo.disable(totp.id)
    }

    // Log 2FA disable to all user's organizations
    try {
      const memberRecords = await locals.pb.collection('organization_members').getFullList({
        filter: `userId="${locals.user.id}"`
      })
      for (const member of memberRecords) {
        writeAuditLog(locals.pb, {
          organizationId: member.organizationId as string,
          userId: locals.user.id,
          userName: locals.user.name as string,
          action: '2fa_disable',
          entityType: 'user',
          entityId: locals.user.id,
          entityName: locals.user.name as string,
          ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
          userAgent: request.headers.get('user-agent') || ''
        })
      }
    } catch {
      /* ignore */
    }

    return { success: true, action: 'disable2fa' }
  },

  unlinkAccount: async ({ request, locals }) => {
    if (!locals.user) {
      throw error(401, 'Not authenticated')
    }

    const formData = await request.formData()
    const provider = formData.get('provider') as string

    if (!provider) {
      return fail(400, { error: 'Provider is required', action: 'unlinkAccount' })
    }

    try {
      await locals.pb.collection('users').unlinkExternalAuth(locals.user.id, provider)
      return { success: true, action: 'unlinkAccount' }
    } catch (err) {
      console.error('Failed to unlink account:', err)
      return fail(500, { error: 'Failed to unlink account', action: 'unlinkAccount' })
    }
  }
}
