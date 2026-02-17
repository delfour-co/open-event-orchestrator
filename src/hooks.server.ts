import { env } from '$env/dynamic/public'
import { createApiKeyService, rateLimiter } from '$lib/features/api/services'
import { createInitialSetupService } from '$lib/features/auth/services'
import { type Handle, json } from '@sveltejs/kit'
import PocketBase from 'pocketbase'

// Initial setup check - runs once on server startup
let initialSetupCheckDone = false

async function runInitialSetupCheck(baseUrl: string): Promise<void> {
  if (initialSetupCheckDone) return
  initialSetupCheckDone = true

  const pb = new PocketBase(env.PUBLIC_POCKETBASE_URL || 'http://localhost:8090')
  const setupService = createInitialSetupService(pb)

  try {
    await setupService.checkAndDisplaySetupLink(baseUrl)
  } catch (err) {
    // Silently fail - PocketBase might not be ready yet
    console.error('[Setup] Could not check initial setup status:', err)
  }
}

export const handle: Handle = async ({ event, resolve }) => {
  const pb = new PocketBase(env.PUBLIC_POCKETBASE_URL || 'http://localhost:8090')

  // Run initial setup check on first request
  const baseUrl = `${event.url.protocol}//${event.url.host}`
  runInitialSetupCheck(baseUrl)

  // Load auth from cookie
  const cookie = event.request.headers.get('cookie') || ''
  pb.authStore.loadFromCookie(cookie)

  try {
    // Refresh auth if valid
    if (pb.authStore.isValid) {
      await pb.collection('users').authRefresh()
    }
  } catch {
    pb.authStore.clear()
  }

  event.locals.pb = pb
  event.locals.user = pb.authStore.model

  // API key authentication and rate limiting for /api/v1/* routes
  if (event.url.pathname.startsWith('/api/v1/')) {
    const authHeader = event.request.headers.get('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const keyString = authHeader.slice(7)
      const apiKeyService = createApiKeyService(pb)
      const result = await apiKeyService.validate(keyString)

      if (result.valid && result.apiKey) {
        event.locals.apiKey = result.apiKey
        event.locals.apiKeyScope = result.scope

        // Apply rate limiting
        const rateLimitResult = rateLimiter.check(result.apiKey)

        if (!rateLimitResult.allowed) {
          return json(
            {
              error: 'Too Many Requests',
              message: 'Rate limit exceeded. Please try again later.',
              retryAfter: Math.ceil((rateLimitResult.resetAt.getTime() - Date.now()) / 1000)
            },
            {
              status: 429,
              headers: {
                'X-RateLimit-Limit': String(rateLimitResult.limit),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': String(Math.floor(rateLimitResult.resetAt.getTime() / 1000)),
                'Retry-After': String(
                  Math.ceil((rateLimitResult.resetAt.getTime() - Date.now()) / 1000)
                )
              }
            }
          )
        }

        // Store rate limit info for response headers
        event.locals.rateLimit = rateLimitResult
      }
    }
  }

  const response = await resolve(event)

  // Add rate limit headers to API responses
  if (event.url.pathname.startsWith('/api/v1/') && event.locals.rateLimit) {
    const rl = event.locals.rateLimit
    response.headers.set('X-RateLimit-Limit', String(rl.limit))
    response.headers.set('X-RateLimit-Remaining', String(rl.remaining))
    response.headers.set('X-RateLimit-Reset', String(Math.floor(rl.resetAt.getTime() / 1000)))
  }

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  // Allow /app routes to be embedded in iframes from same origin (for admin preview)
  if (event.url.pathname.startsWith('/app/')) {
    response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  } else {
    response.headers.set('X-Frame-Options', 'DENY')
  }
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Allow camera on scanner and checkin pages, block on others
  const needsCamera =
    event.url.pathname.startsWith('/scan') || event.url.pathname.includes('/checkin')
  if (needsCamera) {
    response.headers.set('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()')
  } else {
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  }

  // Only add HSTS in production (when not localhost)
  if (!event.url.hostname.includes('localhost')) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  // Set auth cookie (skip for API routes to avoid unnecessary headers)
  if (!event.url.pathname.startsWith('/api/v1/')) {
    response.headers.append(
      'set-cookie',
      pb.authStore.exportToCookie({ httpOnly: true, secure: true, sameSite: 'lax' })
    )
  }

  return response
}
