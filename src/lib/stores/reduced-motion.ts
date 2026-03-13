import { browser } from '$app/environment'
import { persisted } from 'svelte-persisted-store'

export type ReducedMotionPreference = 'system' | 'on' | 'off'

export const reducedMotion = persisted<ReducedMotionPreference>('reduced-motion', 'system')

let mediaQuery: MediaQueryList | null = null
let mediaQueryHandler: ((e: MediaQueryListEvent) => void) | null = null

function resolveReducedMotion(value: ReducedMotionPreference): boolean {
  if (value === 'on') return true
  if (value === 'off') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function applyReducedMotion(value: ReducedMotionPreference): void {
  if (!browser) return

  // Clean up previous listener
  if (mediaQuery && mediaQueryHandler) {
    mediaQuery.removeEventListener('change', mediaQueryHandler)
    mediaQueryHandler = null
  }

  const shouldReduce = resolveReducedMotion(value)
  document.documentElement.classList.toggle('reduce-motion', shouldReduce)

  // Listen for system preference changes when in system mode
  if (value === 'system') {
    mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    mediaQueryHandler = (e: MediaQueryListEvent): void => {
      document.documentElement.classList.toggle('reduce-motion', e.matches)
    }
    mediaQuery.addEventListener('change', mediaQueryHandler)
  }
}

export function isMotionReduced(value: ReducedMotionPreference): boolean {
  if (!browser) return false
  return resolveReducedMotion(value)
}

export function toggleReducedMotion(): void {
  reducedMotion.update((current) => {
    if (current === 'system') return 'on'
    if (current === 'on') return 'off'
    return 'system'
  })
}
