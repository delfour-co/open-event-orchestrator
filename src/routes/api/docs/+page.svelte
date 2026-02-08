<script lang="ts">
import { browser } from '$app/environment'
import { onMount } from 'svelte'

let isLoading = $state(true)
let error = $state<string | null>(null)

onMount(async () => {
  if (!browser) return

  try {
    // Wait for Swagger UI to be loaded from CDN
    const checkSwaggerUI = () => {
      return new Promise<void>((resolve, reject) => {
        let attempts = 0
        const maxAttempts = 50 // 5 seconds max

        const check = () => {
          // @ts-ignore - SwaggerUIBundle is loaded from CDN
          if (typeof window.SwaggerUIBundle !== 'undefined') {
            resolve()
          } else if (attempts >= maxAttempts) {
            reject(new Error('Failed to load Swagger UI'))
          } else {
            attempts++
            setTimeout(check, 100)
          }
        }
        check()
      })
    }

    await checkSwaggerUI()

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
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"></script>
</svelte:head>

<div class="min-h-screen bg-white">
  {#if isLoading}
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p class="text-muted-foreground">Loading API documentation...</p>
      </div>
    </div>
  {:else if error}
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center max-w-md p-6">
        <div class="text-red-500 text-5xl mb-4">!</div>
        <h2 class="text-xl font-semibold mb-2">Failed to load documentation</h2>
        <p class="text-muted-foreground mb-4">{error}</p>
        <p class="text-sm text-muted-foreground">
          Make sure the OpenAPI spec is available at <code class="bg-muted px-1 rounded">/api/v1/openapi.json</code>
        </p>
      </div>
    </div>
  {:else}
    <div id="swagger-ui"></div>
  {/if}
</div>

<style>
  :global(.swagger-ui .topbar) {
    display: none;
  }

  :global(.swagger-ui .info) {
    margin: 20px 0;
  }

  :global(.swagger-ui .info .title) {
    font-size: 28px;
  }

  :global(.swagger-ui .scheme-container) {
    background: transparent;
    box-shadow: none;
    padding: 15px 0;
  }

  :global(.swagger-ui .opblock-tag) {
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }

  :global(.swagger-ui .opblock) {
    border-radius: 8px;
    margin-bottom: 10px;
  }

  :global(.swagger-ui .btn) {
    border-radius: 6px;
  }

  :global(.swagger-ui input[type="text"]),
  :global(.swagger-ui textarea) {
    border-radius: 6px;
  }

  :global(.swagger-ui select) {
    border-radius: 6px;
  }

  :global(body.dark .swagger-ui) {
    filter: invert(88%) hue-rotate(180deg);
  }

  :global(body.dark .swagger-ui img) {
    filter: invert(100%) hue-rotate(180deg);
  }
</style>
