import { env } from '$env/dynamic/public'
import type PocketBase from 'pocketbase'

/**
 * Resolves the application URL using a fallback chain:
 * 1. `app_settings.appUrl` from PocketBase (if configured)
 * 2. `PUBLIC_APP_URL` environment variable
 * 3. Fallback to `http://localhost:5173`
 */
export async function getAppUrl(pb: PocketBase): Promise<string> {
  try {
    const settings = await pb.collection('app_settings').getFirstListItem('')
    const appUrl = settings?.appUrl as string | undefined
    if (appUrl && appUrl.trim().length > 0) {
      return appUrl.replace(/\/+$/, '')
    }
  } catch {
    // app_settings not found or not accessible
  }

  if (env.PUBLIC_APP_URL && env.PUBLIC_APP_URL.trim().length > 0) {
    return env.PUBLIC_APP_URL.replace(/\/+$/, '')
  }

  return 'http://localhost:5173'
}
