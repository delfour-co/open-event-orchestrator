import { browser } from '$app/environment'
import { writable } from 'svelte/store'

export const isOnline = writable(browser ? navigator.onLine : true)

if (browser) {
  window.addEventListener('online', () => isOnline.set(true))
  window.addEventListener('offline', () => isOnline.set(false))
}
