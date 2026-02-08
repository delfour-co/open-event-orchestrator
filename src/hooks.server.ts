import { env } from '$env/dynamic/public'
import { createApiKeyService } from '$lib/features/api/services'
import type { Handle } from '@sveltejs/kit'
import PocketBase from 'pocketbase'

export const handle: Handle = async ({ event, resolve }) => {
  const pb = new PocketBase(env.PUBLIC_POCKETBASE_URL || 'http://localhost:8090')

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

  // API key authentication for /api/v1/* routes
  if (event.url.pathname.startsWith('/api/v1/')) {
    const authHeader = event.request.headers.get('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const keyString = authHeader.slice(7)
      const apiKeyService = createApiKeyService(pb)
      const result = await apiKeyService.validate(keyString)

      if (result.valid && result.apiKey) {
        event.locals.apiKey = result.apiKey
        event.locals.apiKeyScope = result.scope
      }
    }
  }

  const response = await resolve(event)

  // Set auth cookie (skip for API routes to avoid unnecessary headers)
  if (!event.url.pathname.startsWith('/api/v1/')) {
    response.headers.append(
      'set-cookie',
      pb.authStore.exportToCookie({ httpOnly: true, secure: true, sameSite: 'lax' })
    )
  }

  return response
}
