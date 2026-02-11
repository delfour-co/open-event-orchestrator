import { parseTrackingId } from '$lib/features/crm/domain'
import { createEmailEventRepository } from '$lib/features/crm/infra'
import type { RequestHandler } from './$types'

// 1x1 transparent GIF
const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
)

export const GET: RequestHandler = async ({ params, locals, request }) => {
  const { trackingId } = params

  // Parse tracking ID to get campaign and contact IDs
  const parsed = parseTrackingId(trackingId)

  if (parsed) {
    try {
      const emailEventRepository = createEmailEventRepository(locals.pb)

      // Extract metadata from request
      const ipAddress =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        'unknown'
      const userAgent = request.headers.get('user-agent') || undefined

      // Record the open event
      await emailEventRepository.create({
        campaignId: parsed.campaignId,
        contactId: parsed.contactId,
        type: 'opened',
        ipAddress,
        userAgent,
        timestamp: new Date()
      })
    } catch (error) {
      // Log error but don't fail the request
      console.error('Failed to record email open event:', error)
    }
  }

  // Always return the transparent GIF, even if tracking fails
  return new Response(TRANSPARENT_GIF, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0'
    }
  })
}
