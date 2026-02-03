<script lang="ts">
import { Button } from '$lib/components/ui/button'
import { applyTheme, theme, toggleTheme } from '$lib/stores/theme'
import { Moon, Sun } from 'lucide-svelte'
import { onMount } from 'svelte'

onMount(() => {
  // Apply theme on mount
  applyTheme($theme)

  // Subscribe to theme changes
  const unsubscribe = theme.subscribe(applyTheme)
  return unsubscribe
})
</script>

<Button onclick={toggleTheme} variant="ghost" size="icon">
  {#if $theme === 'dark'}
    <Sun class="h-5 w-5" />
  {:else}
    <Moon class="h-5 w-5" />
  {/if}
  <span class="sr-only">Toggle theme</span>
</Button>
