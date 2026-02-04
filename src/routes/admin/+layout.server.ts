import { ADMIN_ROLES, type OrgRole, isReviewerOnly } from '$lib/server/permissions'
import { error, redirect } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(303, '/auth/login')
  }

  // Check if user has admin access
  const userRole = locals.user.role as string | undefined
  if (!userRole || !ADMIN_ROLES.includes(userRole as OrgRole)) {
    throw error(403, {
      message: 'Access denied. You need organizer or admin privileges to access this area.'
    })
  }

  return {
    user: {
      id: locals.user.id,
      email: locals.user.email,
      name: locals.user.name,
      role: locals.user.role,
      avatar: locals.user.avatar
    },
    isReviewerOnly: isReviewerOnly(userRole)
  }
}
