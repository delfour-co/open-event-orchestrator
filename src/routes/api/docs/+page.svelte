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

onMount(async () => {
  if (!browser) return

  try {
    // Load CSS
    loadStylesheet('https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css')

    // Load scripts sequentially
    await loadScript('https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js')
    await loadScript('https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js')

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

<div class="swagger-wrapper">
  {#if isLoading}
    <div class="loading-container">
      <div class="spinner"></div>
      <p>Loading API documentation...</p>
    </div>
  {:else if error}
    <div class="error-container">
      <div class="error-icon">!</div>
      <h2>Failed to load documentation</h2>
      <p>{error}</p>
      <p class="hint">
        Make sure the OpenAPI spec is available at <code>/api/v1/openapi.json</code>
      </p>
    </div>
  {:else}
    <div id="swagger-ui"></div>
  {/if}
</div>

<style>
  .swagger-wrapper {
    min-height: 100vh;
    background: white;
  }

  .loading-container,
  .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    text-align: center;
    padding: 2rem;
  }

  .spinner {
    width: 3rem;
    height: 3rem;
    border: 3px solid #e5e7eb;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .error-icon {
    font-size: 3rem;
    color: #ef4444;
    margin-bottom: 1rem;
  }

  .error-container h2 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .error-container p {
    color: #6b7280;
    margin-bottom: 0.5rem;
  }

  .hint {
    font-size: 0.875rem;
  }

  .hint code {
    background: #f3f4f6;
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
  }

  :global(.swagger-ui .topbar) {
    display: none !important;
  }
</style>
