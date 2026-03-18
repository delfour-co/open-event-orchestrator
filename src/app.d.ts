// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

// Build-time constants injected by Vite
declare const __APP_VERSION__: string
declare const __APP_COMMIT__: string

declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      pb: import('pocketbase').default
      user: import('pocketbase').RecordModel | null
      apiKey?: import('$lib/features/api/domain').ApiKey
      apiKeyScope?: import('$lib/features/api/domain').ApiKeyScope
      rateLimit?: import('$lib/features/api/services').RateLimitResult
      locale?: import('$lib/paraglide/runtime.js').Locale
      sessionId?: string
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {}
