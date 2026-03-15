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
      const theme = localStorage.getItem('theme')
      const parsed = theme ? JSON.parse(theme) : 'system'
      const isDark =
        parsed === 'dark' ||
        (parsed === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      if (isDark) document.documentElement.classList.add('dark')
    })()
  </script>
</svelte:head>

{@render children()}
