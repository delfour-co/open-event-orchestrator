<script lang="ts">
import '../../../app.css'
import { onMount } from 'svelte'

interface Props {
  children: import('svelte').Snippet
}

const { children }: Props = $props()

onMount(() => {
  // Register service worker
  registerServiceWorker()
})

async function registerServiceWorker(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw-app.js')
    } catch (err) {
      console.error('Service worker registration failed:', err)
    }
  }
}
</script>

<svelte:head>
  <link rel="manifest" href="/manifest-app.json" />
  <meta name="theme-color" content="#3b82f6" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Event Schedule" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
</svelte:head>

<div class="min-h-screen bg-background">
  {@render children()}
</div>
