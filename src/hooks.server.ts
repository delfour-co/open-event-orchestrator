import { env } from '$env/dynamic/public'
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

  const response = await resolve(event)

  // Set auth cookie
  response.headers.append(
    'set-cookie',
    pb.authStore.exportToCookie({ httpOnly: true, secure: true, sameSite: 'lax' })
  )

  return response
}
