<script lang="ts">
import { page } from '$app/stores'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { AlertTriangle, Home } from 'lucide-svelte'
</script>

<svelte:head>
  <title>Error {$page.status}</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-muted/50 p-4">
  <Card.Root class="w-full max-w-md text-center">
    <Card.Header>
      <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle class="h-8 w-8 text-destructive" />
      </div>
      <Card.Title class="text-2xl">{$page.status}</Card.Title>
      <Card.Description>
        {#if $page.status === 404}
          The page you're looking for doesn't exist.
        {:else if $page.status === 403}
          You don't have permission to access this page.
        {:else if $page.status === 500}
          Something went wrong. Please try again later.
        {:else}
          {$page.error?.message || 'An unexpected error occurred.'}
        {/if}
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <a href="/">
        <Button variant="outline">
          <Home class="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </a>
    </Card.Content>
  </Card.Root>
</div>
