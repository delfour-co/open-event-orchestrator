import { type UserPreferences, themePreferenceSchema } from '$lib/features/auth/domain'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const preferences = (locals.user.preferences as UserPreferences) || {}
    return json({ preferences })
  } catch (err) {
    console.error('Failed to get user preferences:', err)
    return json({ error: 'Failed to get preferences' }, { status: 500 })
  }
}

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const currentPreferences = (locals.user.preferences as UserPreferences) || {}

    // Validate theme if provided
    if (body.theme !== undefined) {
      const themeResult = themePreferenceSchema.safeParse(body.theme)
      if (!themeResult.success) {
        return json({ error: 'Invalid theme value' }, { status: 400 })
      }
    }

    // Merge new preferences with existing ones
    const updatedPreferences: UserPreferences = {
      ...currentPreferences,
      ...(body.theme !== undefined && { theme: body.theme })
    }

    await locals.pb.collection('users').update(locals.user.id, {
      preferences: updatedPreferences
    })

    // Refresh auth to get updated user data
    await locals.pb.collection('users').authRefresh()

    return json({ success: true, preferences: updatedPreferences })
  } catch (err) {
    console.error('Failed to update user preferences:', err)
    return json({ error: 'Failed to update preferences' }, { status: 500 })
  }
}
