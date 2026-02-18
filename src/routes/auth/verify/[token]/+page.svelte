<script lang="ts">
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import * as m from '$lib/paraglide/messages'
import { CheckCircle2, XCircle } from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()
</script>

<svelte:head>
  <title>{m.verify_email_title()}</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
  <div class="w-full max-w-md">
    <Card.Root class="shadow-lg">
      <Card.Content class="pt-8 pb-6 text-center">
        {#if data.success}
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
            <CheckCircle2 class="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 class="text-2xl font-bold tracking-tight mb-2">
            {m.verify_email_success_heading()}
          </h1>
          <p class="text-muted-foreground mb-6">
            {m.verify_email_success_message()}
          </p>
          <div class="flex flex-col gap-2">
            <a href="/admin" class="w-full">
              <Button class="w-full">
                {m.verify_email_dashboard()}
              </Button>
            </a>
          </div>
        {:else}
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
            <XCircle class="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 class="text-2xl font-bold tracking-tight mb-2">
            {m.verify_email_error_heading()}
          </h1>
          <p class="text-muted-foreground mb-2">
            {m.verify_email_error_message()}
          </p>
          {#if data.error}
            <p class="text-sm text-destructive mb-6">
              {data.error}
            </p>
          {/if}
          <div class="flex flex-col gap-2">
            <a href="/auth/login" class="w-full">
              <Button class="w-full">
                {m.verify_email_login()}
              </Button>
            </a>
          </div>
        {/if}
      </Card.Content>
    </Card.Root>
  </div>
</div>
