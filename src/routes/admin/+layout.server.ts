import type { Notification } from '$lib/features/notifications'
import { createNotificationRepository } from '$lib/features/notifications/infra'
import { buildFileUrl } from '$lib/server/file-url'
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

  // Build avatar URL if user has an avatar
  let avatarUrl: string | null = null
  if (locals.user.avatar) {
    avatarUrl = buildFileUrl('users', locals.user.id, locals.user.avatar as string)
  }

  // Fetch notification data for header
  let notificationCount = 0
  let notifications: Notification[] = []

  try {
    const notificationRepository = createNotificationRepository(locals.pb)
    const [unreadCount, recentNotifications] = await Promise.all([
      notificationRepository.getUnreadCount(locals.user.id),
      notificationRepository.findRecentByUser(locals.user.id, 10)
    ])
    notificationCount = unreadCount
    notifications = recentNotifications
  } catch (err) {
    // Silently fail if notifications collection doesn't exist yet
    console.warn('Failed to load notifications:', err)
  }

  return {
    user: {
      id: locals.user.id,
      email: locals.user.email,
      name: locals.user.name,
      role: locals.user.role,
      avatar: locals.user.avatar,
      avatarUrl
    },
    isReviewerOnly: isReviewerOnly(userRole),
    notificationCount,
    notifications
  }
}
