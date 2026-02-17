import { createNotificationRepository } from '$lib/features/notifications/infra'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const id = formData.get('id') as string

  if (!id) {
    return json({ error: 'Notification ID is required' }, { status: 400 })
  }

  try {
    const repository = createNotificationRepository(locals.pb)
    const notification = await repository.findById(id)

    // Check that the notification belongs to the user
    if (!notification || notification.userId !== locals.user.id) {
      return json({ error: 'Notification not found' }, { status: 404 })
    }

    await repository.markAsRead(id)
    return json({ success: true })
  } catch (err) {
    console.error('Failed to mark notification as read:', err)
    return json({ error: 'Failed to mark notification as read' }, { status: 500 })
  }
}
