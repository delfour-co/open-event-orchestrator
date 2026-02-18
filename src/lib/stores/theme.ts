import { browser } from '$app/environment'
import { persisted } from 'svelte-persisted-store'

export type Theme = 'light' | 'dark' | 'system'

export const theme = persisted<Theme>('theme', 'system')

export function applyTheme(value: Theme): void {
  if (!browser) return

  const isDark =
    value === 'dark' ||
    (value === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  document.documentElement.classList.toggle('dark', isDark)
}

export function toggleTheme(): void {
  theme.update((current) => (current === 'dark' ? 'light' : 'dark'))
}

/**
 * Sync theme preference to server for logged-in users
 * @param newTheme - The theme value to save
 * @returns Promise resolving to true if sync successful, false otherwise
 */
export async function syncThemeToServer(newTheme: Theme): Promise<boolean> {
  if (!browser) return false

  try {
    const response = await fetch('/api/user/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ theme: newTheme })
    })

    return response.ok
  } catch (err) {
    console.error('Failed to sync theme to server:', err)
    return false
  }
}

/**
 * Load theme preference from server and apply it
 * Called after login to sync server preferences to client
 * @returns Promise resolving to the theme if found, null otherwise
 */
export async function loadThemeFromServer(): Promise<Theme | null> {
  if (!browser) return null

  try {
    const response = await fetch('/api/user/preferences')
    if (!response.ok) return null

    const data = await response.json()
    const serverTheme = data.preferences?.theme as Theme | undefined

    if (serverTheme) {
      // Update local storage and store
      theme.set(serverTheme)
      applyTheme(serverTheme)
      return serverTheme
    }

    return null
  } catch (err) {
    console.error('Failed to load theme from server:', err)
    return null
  }
}

/**
 * Set theme value, apply it, and optionally sync to server
 * @param newTheme - The theme value to set
 * @param syncToServer - Whether to sync to server (for logged-in users)
 */
export function setTheme(newTheme: Theme, syncToServer = false): void {
  theme.set(newTheme)
  applyTheme(newTheme)

  if (syncToServer) {
    // Fire and forget - we don't block on server sync
    syncThemeToServer(newTheme)
  }
}
