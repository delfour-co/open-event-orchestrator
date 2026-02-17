<script lang="ts">
import { page } from '$app/stores'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { AlertCircle, LogIn, RefreshCw } from 'lucide-svelte'
</script>

<svelte:head>
  <title>Setup Error - Open Event Orchestrator</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-destructive/5 via-background to-destructive/10 p-4">
  <div class="w-full max-w-lg space-y-6">
    <div class="text-center space-y-2">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
        <AlertCircle class="w-8 h-8 text-destructive" />
      </div>
      <h1 class="text-3xl font-bold tracking-tight">Setup Error</h1>
    </div>

    <Card.Root class="shadow-lg">
      <Card.Header class="space-y-1 pb-4">
        <Card.Title class="text-xl">
          {#if $page.status === 404}
            Link Not Found
          {:else if $page.status === 410}
            Link Expired or Used
          {:else}
            Error
          {/if}
        </Card.Title>
      </Card.Header>
      <Card.Content class="space-y-4">
        <p class="text-muted-foreground">
          {$page.error?.message || 'An error occurred while accessing the setup page.'}
        </p>

        <div class="flex flex-col sm:flex-row gap-3 pt-4">
          {#if $page.status === 410}
            <a href="/auth/login" class="flex-1">
              <Button class="w-full">
                <LogIn class="w-4 h-4 mr-2" />
                Go to Login
              </Button>
            </a>
          {:else}
            <Button variant="outline" onclick={() => window.location.reload()} class="flex-1">
              <RefreshCw class="w-4 h-4 mr-2" />
              Try Again
            </Button>
          {/if}
        </div>
      </Card.Content>
    </Card.Root>

    <p class="text-center text-sm text-muted-foreground">
      If you need a new setup link, restart the server and check the console output.
    </p>
  </div>
</div>
