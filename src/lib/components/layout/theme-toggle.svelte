<script lang="ts">
import { browser } from '$app/environment'
import { Button } from '$lib/components/ui/button'
import * as m from '$lib/paraglide/messages.js'
import { Moon, Sun } from 'lucide-svelte'

let currentTheme = $state<'light' | 'dark' | 'system'>('system')

// Initialize theme from localStorage
if (browser) {
  const stored = localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    currentTheme = stored
  } else if (stored) {
    // Handle JSON-encoded strings from older versions
    try {
      const parsed = JSON.parse(stored)
      if (parsed === 'light' || parsed === 'dark' || parsed === 'system') {
        currentTheme = parsed
        localStorage.setItem('theme', parsed) // Migrate to plain string
      }
    } catch {
      // Ignore invalid values
    }
  }
}

function applyTheme(value: 'light' | 'dark' | 'system') {
  if (!browser) return

  const isDark =
    value === 'dark' ||
    (value === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  document.documentElement.classList.toggle('dark', isDark)
}

function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark'
  localStorage.setItem('theme', currentTheme)
  applyTheme(currentTheme)
}

// Apply theme on mount
$effect(() => {
  applyTheme(currentTheme)
})
</script>

<Button onclick={toggleTheme} variant="ghost" size="icon">
  {#if currentTheme === 'dark'}
    <Sun class="h-5 w-5" />
  {:else}
    <Moon class="h-5 w-5" />
  {/if}
  <span class="sr-only">{m.header_toggle_theme()}</span>
</Button>
