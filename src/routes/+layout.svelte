<script lang="ts">
import '../app.css'
import * as m from '$lib/paraglide/messages'
import type { Snippet } from 'svelte'

type Props = {
  children: Snippet
}

const { children }: Props = $props()
</script>

<svelte:head>
  <title>{m.common_app_title()}</title>
  <script>
    // Prevent flash of wrong theme
    (function () {
      var raw = localStorage.getItem('theme') || 'system'
      // Handle both plain strings and JSON-encoded strings from older versions
      var theme = raw
      try { theme = JSON.parse(raw) } catch (e) { /* plain string, use as-is */ }
      var isDark =
        theme === 'dark' ||
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      if (isDark) document.documentElement.classList.add('dark')
    })()
  </script>
</svelte:head>

{@render children()}
