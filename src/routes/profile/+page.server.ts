import { env } from '$env/dynamic/public'
import { changePasswordSchema, updateProfileSchema } from '$lib/features/auth/domain'
import { validateImageFile } from '$lib/server/file-validation'
import { error, fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(303, '/auth/login')
  }

  const user = locals.user
  const pbUrl = env.PUBLIC_POCKETBASE_URL || 'http://localhost:8090'

  // Build avatar URL if user has an avatar
  let avatarUrl: string | null = null
  if (user.avatar) {
    avatarUrl = `${pbUrl}/api/files/users/${user.id}/${user.avatar}`
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
    }
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
  }
}
