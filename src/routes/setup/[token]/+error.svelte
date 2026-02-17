<script lang="ts">
import { page } from '$app/stores'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import * as m from '$lib/paraglide/messages'
import { AlertCircle, LogIn, RefreshCw } from 'lucide-svelte'
</script>

<svelte:head>
  <title>{m.setup_error_page_title()}</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-destructive/5 via-background to-destructive/10 p-4">
  <div class="w-full max-w-lg space-y-6">
    <div class="text-center space-y-2">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
        <AlertCircle class="w-8 h-8 text-destructive" />
      </div>
      <h1 class="text-3xl font-bold tracking-tight">{m.setup_error_title()}</h1>
    </div>

    <Card.Root class="shadow-lg">
      <Card.Header class="space-y-1 pb-4">
        <Card.Title class="text-xl">
          {#if $page.status === 404}
            {m.setup_error_not_found()}
          {:else if $page.status === 410}
            {m.setup_error_expired()}
          {:else}
            {m.setup_error_generic()}
          {/if}
        </Card.Title>
      </Card.Header>
      <Card.Content class="space-y-4">
        <p class="text-muted-foreground">
          {$page.error?.message || m.setup_error_default_message()}
        </p>

        <div class="flex flex-col sm:flex-row gap-3 pt-4">
          {#if $page.status === 410}
            <a href="/auth/login" class="flex-1">
              <Button class="w-full">
                <LogIn class="w-4 h-4 mr-2" />
                {m.setup_go_to_login()}
              </Button>
            </a>
          {:else}
            <Button variant="outline" onclick={() => window.location.reload()} class="flex-1">
              <RefreshCw class="w-4 h-4 mr-2" />
              {m.setup_try_again()}
            </Button>
          {/if}
        </div>
      </Card.Content>
    </Card.Root>

    <p class="text-center text-sm text-muted-foreground">
      {m.setup_new_link_hint()}
    </p>
  </div>
</div>
