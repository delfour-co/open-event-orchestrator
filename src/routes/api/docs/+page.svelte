<script lang="ts">
import { browser } from '$app/environment'
import { onMount } from 'svelte'

let isLoading = $state(true)
let error = $state<string | null>(null)

const loadScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(script)
  })
}

const loadStylesheet = (href: string): void => {
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
}

const addCustomStyles = (): void => {
  const style = document.createElement('style')
  style.textContent = '.swagger-ui .topbar { display: none !important; }'
  document.head.appendChild(style)
}

onMount(async () => {
  if (!browser) return

  try {
    // Load CSS and scripts from local static files (much faster than CDN)
    loadStylesheet('/swagger-ui/swagger-ui.css')
    addCustomStyles()

    // Load scripts sequentially
    await loadScript('/swagger-ui/swagger-ui-bundle.js')
    await loadScript('/swagger-ui/swagger-ui-standalone-preset.js')

    // Initialize Swagger UI
    // @ts-ignore - SwaggerUIBundle is loaded from CDN
    window.SwaggerUIBundle({
      dom_id: '#swagger-ui',
      url: '/api/v1/openapi.json',
      deepLinking: true,
      presets: [
        // @ts-ignore
        window.SwaggerUIBundle.presets.apis,
        // @ts-ignore
        window.SwaggerUIStandalonePreset
      ],
      plugins: [
        // @ts-ignore
        window.SwaggerUIBundle.plugins.DownloadUrl
      ],
      layout: 'StandaloneLayout',
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
      docExpansion: 'list',
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
      persistAuthorization: true
    })

    isLoading = false
  } catch (err) {
    console.error('Failed to initialize Swagger UI:', err)
    error = err instanceof Error ? err.message : 'Failed to load API documentation'
    isLoading = false
  }
})
</script>

<svelte:head>
  <title>API Documentation - Open Event Orchestrator</title>
</svelte:head>

<div style="min-height: 100vh; background: white;">
  {#if isLoading}
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; text-align: center; padding: 2rem;">
      <div style="width: 3rem; height: 3rem; border: 3px solid #e5e7eb; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 1rem;"></div>
      <p style="color: #6b7280;">Loading API documentation...</p>
    </div>
  {:else if error}
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; text-align: center; padding: 2rem;">
      <div style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;">!</div>
      <h2 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem;">Failed to load documentation</h2>
      <p style="color: #6b7280; margin-bottom: 0.5rem;">{error}</p>
      <p style="font-size: 0.875rem; color: #6b7280;">
        Make sure the OpenAPI spec is available at <code style="background: #f3f4f6; padding: 0.125rem 0.375rem; border-radius: 0.25rem;">/api/v1/openapi.json</code>
      </p>
    </div>
  {:else}
    <div id="swagger-ui"></div>
  {/if}
</div>
