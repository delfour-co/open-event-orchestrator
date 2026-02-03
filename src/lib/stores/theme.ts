import { browser } from '$app/environment'
import { persisted } from 'svelte-persisted-store'

type Theme = 'light' | 'dark' | 'system'

export const theme = persisted<Theme>('theme', 'system')

export function applyTheme(value: Theme) {
  if (!browser) return

  const isDark =
    value === 'dark' ||
    (value === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  document.documentElement.classList.toggle('dark', isDark)
}

export function toggleTheme() {
  theme.update((current) => (current === 'dark' ? 'light' : 'dark'))
}
