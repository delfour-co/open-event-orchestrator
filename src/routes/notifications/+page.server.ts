import type { NotificationType } from '$lib/features/notifications'
import { createNotificationRepository } from '$lib/features/notifications/infra'
import { fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

const PER_PAGE = 20

export const load: PageServerLoad = async ({ locals, url }) => {
  if (!locals.user) {
    throw redirect(303, '/auth/login')
  }

  const userId = locals.user.id
  const repository = createNotificationRepository(locals.pb)

  // Get query parameters for filtering
  const page = Number.parseInt(url.searchParams.get('page') || '1', 10)
  const typeFilter = url.searchParams.get('type') as NotificationType | 'all' | null
  const statusFilter = url.searchParams.get('status') as 'all' | 'unread' | 'read' | null

  // Build filter options
  const options: { page: number; perPage: number; type?: NotificationType; isRead?: boolean } = {
    page,
    perPage: PER_PAGE
  }

  if (typeFilter && typeFilter !== 'all') {
    options.type = typeFilter as NotificationType
  }

  if (statusFilter === 'unread') {
    options.isRead = false
  } else if (statusFilter === 'read') {
    options.isRead = true
  }

  // Fetch notifications
  const { items, totalItems, totalPages } = await repository.findByUser(userId, options)

  // Get counts for stats
  const counts = await repository.countByUser(userId)

  return {
    user: {
      id: locals.user.id,
      email: locals.user.email,
      name: locals.user.name
    },
    notifications: items,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      perPage: PER_PAGE,
      hasMore: page < totalPages
    },
    filters: {
      type: typeFilter || 'all',
      status: statusFilter || 'all'
    },
    stats: {
      total: counts.total,
      unread: counts.unread,
      byType: counts.byType
    }
  }
}

export const actions: Actions = {
  markAsRead: async ({ request, locals }) => {
    if (!locals.user) {
      throw redirect(303, '/auth/login')
    }

    const formData = await request.formData()
    const id = formData.get('id') as string

    if (!id) {
      return fail(400, { error: 'Notification ID is required' })
    }

    try {
      const repository = createNotificationRepository(locals.pb)
      await repository.markAsRead(id)
      return { success: true, action: 'markAsRead' }
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
      return fail(500, { error: 'Failed to mark notification as read' })
    }
  },

  markAllAsRead: async ({ locals }) => {
    if (!locals.user) {
      throw redirect(303, '/auth/login')
    }

    try {
      const repository = createNotificationRepository(locals.pb)
      const count = await repository.markAllAsRead(locals.user.id)
      return { success: true, action: 'markAllAsRead', count }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err)
      return fail(500, { error: 'Failed to mark all notifications as read' })
    }
  },

  delete: async ({ request, locals }) => {
    if (!locals.user) {
      throw redirect(303, '/auth/login')
    }

    const formData = await request.formData()
    const id = formData.get('id') as string

    if (!id) {
      return fail(400, { error: 'Notification ID is required' })
    }

    try {
      const repository = createNotificationRepository(locals.pb)
      await repository.softDelete(id)
      return { success: true, action: 'delete' }
    } catch (err) {
      console.error('Failed to delete notification:', err)
      return fail(500, { error: 'Failed to delete notification' })
    }
  }
}
