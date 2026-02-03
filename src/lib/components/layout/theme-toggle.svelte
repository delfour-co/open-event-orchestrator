<script lang="ts">
import { browser } from '$app/environment'
import { Button } from '$lib/components/ui/button'
import { Moon, Sun } from 'lucide-svelte'

let currentTheme = $state<'light' | 'dark' | 'system'>('system')

// Initialize theme from localStorage
if (browser) {
  try {
    const stored = localStorage.getItem('theme')
    if (stored) {
      currentTheme = JSON.parse(stored) as 'light' | 'dark' | 'system'
    }
  } catch {
    // Ignore errors
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
  localStorage.setItem('theme', JSON.stringify(currentTheme))
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
  <span class="sr-only">Toggle theme</span>
</Button>
